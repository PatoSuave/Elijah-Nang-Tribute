import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { createMemorialStore, databaseTimestamp } from "../src/lib/memorial-store.ts";
import { columns, memorialManifest, reconcileMemorialTables, snapshotStatements, validateSnapshot } from "./lib/memorial-snapshot.mjs";

// In-memory workerd/D1 only. No provider credentials, external DB URLs,
// Wrangler environments, or persistent production bindings are consulted.
const runtime = new Miniflare(convertV4MiniflareOptions({ modules: true, script: "export default { fetch() { return new Response('isolated D1 test'); } };", compatibilityDate: "2026-10-22", compatibilityFlags: ["nodejs_compat"], d1Databases: ["MEMORIAL_DB"] }));
const db = await runtime.getD1Database("MEMORIAL_DB");
const store = createMemorialStore(db);
const fp = () => randomBytes(32).toString("hex");
const input = (message = "A memorial message.", location = null) => ({ displayName: "Synthetic test", location, message });
const query = (sql, ...args) => db.prepare(sql).bind(...args);
const count = async (table, fingerprint) => (await query(`SELECT count(*) AS count FROM ${table} WHERE ${table === "memorial_messages" ? "submission_fingerprint" : "fingerprint"} = ?`, fingerprint).first()).count;
const quota = async (fingerprint) => (await query("SELECT sum(submission_count) AS count FROM memorial_submission_rate_limits WHERE fingerprint = ?", fingerprint).first()).count || 0;
let checks = 0;
const passed = (label) => { checks++; console.log(`PASS ${label}`); };

try {
  const schema = await readFile(new URL("../migrations/d1/0001_memorial.sql", import.meta.url), "utf8");
  await db.batch(schema.split(";").map((sql) => sql.trim()).filter(Boolean).map((sql) => db.prepare(sql)));
  await store.databaseHealthy();

  const duplicateFp = fp();
  const duplicates = await Promise.all(Array.from({ length: 16 }, () => store.submitPendingMessage(input(), duplicateFp)));
  assert.equal(duplicates.filter((result) => result.allowed).length, 1);
  assert.equal(duplicates.filter((result) => result.duplicate).length, 15);
  assert.equal(await count("memorial_messages", duplicateFp), 1);
  assert.equal(await quota(duplicateFp), 1);
  passed("concurrent identical submissions save exactly one message and consume one slot");

  const rateFp = fp();
  const rateResults = await Promise.all(Array.from({ length: 20 }, (_, index) => store.submitPendingMessage(input(`Unique ${index}`), rateFp)));
  assert.equal(rateResults.filter((result) => result.allowed).length, 3);
  assert.equal(await count("memorial_messages", rateFp), 3);
  assert.equal(await quota(rateFp), 3);
  assert.ok(rateResults.filter((result) => !result.allowed).every((result) => !result.duplicate && result.retry_after_seconds >= 1 && result.retry_after_seconds <= 3600));
  passed("concurrent distinct submissions enforce the durable 3/hour quota");

  const failedFp = fp();
  await assert.rejects(store.submitPendingMessage(input("x".repeat(1001)), failedFp));
  assert.equal(await count("memorial_messages", failedFp), 0);
  assert.equal(await quota(failedFp), 0);
  await db.prepare("CREATE TRIGGER synthetic_quota_failure BEFORE INSERT ON memorial_submission_rate_limits BEGIN SELECT RAISE(ABORT, 'synthetic failure'); END").run();
  await assert.rejects(store.submitPendingMessage(input("Valid but quota write fails"), failedFp));
  await db.prepare("DROP TRIGGER synthetic_quota_failure").run();
  assert.equal(await count("memorial_messages", failedFp), 0);
  assert.equal(await quota(failedFp), 0);
  assert.equal((await store.submitPendingMessage(input(), failedFp)).allowed, true);
  passed("message and quota failures roll back the complete transaction");

  const pending = await query("SELECT id FROM memorial_messages WHERE submission_fingerprint = ?", duplicateFp).first();
  assert.equal((await store.approvedMessages()).messages.length, 0);
  const decisions = await Promise.all([store.moderateMessage(pending.id, "approved"), store.moderateMessage(pending.id, "rejected")]);
  assert.equal(decisions.filter(Boolean).length, 1);
  assert.equal(await store.moderateMessage(pending.id, "approved"), null);
  assert.equal((await store.submitPendingMessage(input(), duplicateFp)).duplicate, true, "duplicate suppression spans reviewed statuses");
  const publicRows = (await store.approvedMessages()).messages;
  publicRows.forEach((row) => assert.deepEqual(Object.keys(row).sort(), ["approved_at", "display_name", "location", "message"]));
  assert.equal((await store.adminMessages()).messages.some((row) => row.id === pending.id), false);
  await assert.rejects(store.moderateMessage(pending.id, "archived"));
  passed("pending-only concurrent moderation, duplicate checks after review, and public field privacy");

  const expiredFp = fp();
  await store.submitPendingMessage(input(), expiredFp);
  await query("UPDATE memorial_messages SET created_at = ? WHERE submission_fingerprint = ?", databaseTimestamp(Date.now() - 601_000), expiredFp).run();
  assert.equal((await store.submitPendingMessage(input(), expiredFp)).allowed, true);
  assert.equal((await store.submitPendingMessage(input("A memorial message.", "Different location"), expiredFp)).allowed, true);
  passed("10-minute duplicate expiry and NULL/location comparison");

  const rolloverFp = fp();
  const previousHour = databaseTimestamp(Math.floor(Date.now() / 3_600_000) * 3_600_000 - 3_600_000);
  await query("INSERT INTO memorial_submission_rate_limits VALUES (?, ?, 3)", rolloverFp, previousHour).run();
  assert.equal((await store.submitPendingMessage(input(), rolloverFp)).allowed, true);
  assert.equal(await quota(rolloverFp), 4);
  passed("UTC hour rollover starts a new quota without deleting history");

  await db.batch([db.prepare("DELETE FROM memorial_messages"), db.prepare("DELETE FROM memorial_submission_rate_limits")]);
  const fixtureFp = fp();
  const snapshots = Array.from({ length: 30 }, (_, index) => ({
    id: randomUUID(), display_name: `Fixture ${index}`, location: index % 2 ? "東京" : null,
    message: `Unicode 🌸 & <script>not markup</script> 'quoted'\nSecond line ${index}`,
    status: ["pending", "approved", "rejected", "archived"][index % 4],
    created_at: `2026-10-22T12:00:00.${String(index).padStart(6, "0")}Z`,
    approved_at: index % 4 === 1 ? `2026-10-22T12:30:00.${String(index).padStart(6, "0")}Z` : null,
    moderation_notes: index % 2 ? "Private note with 'quote'; DROP TABLE is plain text." : null,
    submission_fingerprint: fixtureFp,
  }));
  // All four statuses, optional NULLs, and six-digit timestamps survive import.
  const snapshot = {
    format: "nangsoul-postgres-snapshot-v1", exported_at: new Date().toISOString(), source: { schema: "public" },
    tables: { memorial_messages: snapshots, memorial_submission_rate_limits: [{ fingerprint: fixtureFp, window_start: "2026-10-22T12:00:00.000000Z", submission_count: 3 }], schema_migrations: [{ version: "202609190001" }] },
    counts: { memorial_messages: snapshots.length, memorial_submission_rate_limits: 1, schema_migrations: 1 },
  };
  const sql = snapshotStatements(snapshot);
  await db.batch(sql.map((statement) => db.prepare(statement)));
  const target = Object.fromEntries(await Promise.all(Object.entries(columns).map(async ([table, fields]) => [table, (await db.prepare(`SELECT ${fields.join(", ")} FROM ${table}`).all()).results])));
  assert.deepEqual(reconcileMemorialTables(snapshot.tables, target), memorialManifest(snapshot.tables));
  assert.equal((await store.approvedMessages()).messages.length, snapshots.filter((row) => row.status === "approved").length);
  assert.equal((await store.adminMessages()).messages.length, snapshots.filter((row) => row.status === "pending").length);
  const changed = structuredClone(target);
  changed.memorial_messages[0].moderation_notes = "changed";
  assert.throws(() => reconcileMemorialTables(snapshot.tables, changed));
  const drifted = structuredClone(snapshot);
  drifted.tables.memorial_messages[0].extra_column = "must not be discarded";
  assert.throws(() => validateSnapshot(drifted));
  await assert.rejects(db.batch(sql.map((statement) => db.prepare(statement))), "import never overwrites existing IDs");
  passed("lossless import/reconciliation preserves every column, status, NULL, Unicode and microsecond; drift/conflicts fail closed");

  await db.prepare("DELETE FROM memorial_messages").run();
  const tieTime = "2026-10-22T12:00:00.123456Z";
  const ids = Array.from({ length: 27 }, () => randomUUID()).sort().reverse();
  await db.batch(ids.map((id) => query("INSERT INTO memorial_messages (id, display_name, message, submission_fingerprint, created_at) VALUES (?, ?, ?, ?, ?)", id, `Name ${id.slice(0, 8)}`, "Pagination", fixtureFp, tieTime)));
  assert.deepEqual((await store.adminMessages(0, 25)).messages.map((row) => row.id), ids.slice(0, 25));
  assert.equal((await store.adminMessages(0, 25)).hasMore, true);
  assert.deepEqual((await store.adminMessages(25, 25)).messages.map((row) => row.id), ids.slice(25));
  await store.moderateMessage(ids[0], "approved");
  assert.equal((await store.adminMessages()).messages[24].id, ids[25]);
  await db.prepare("UPDATE memorial_messages SET status = 'approved', approved_at = created_at").run();
  const first = await store.approvedMessages(0);
  const second = await store.approvedMessages(12);
  assert.equal(first.messages.length, 12);
  assert.equal(second.messages.length, 12);
  assert.equal(new Set([...first.messages, ...second.messages].map((row) => row.display_name)).size, 24);
  passed("deterministic UUID-tiebroken admin/public pagination and queue refresh after moderation");

  console.log(`Memorial D1 integration checks passed (${checks} groups).`);
} finally {
  await runtime.dispose();
}
