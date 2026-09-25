import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Client } from "pg";

const databaseUrl = process.env.MEMORIAL_INTEGRATION_DATABASE_URL;
if (!databaseUrl) throw new Error("MEMORIAL_INTEGRATION_DATABASE_URL must be set for the isolated integration database.");

const parsedUrl = new URL(databaseUrl);
if (!["127.0.0.1", "localhost", "::1"].includes(parsedUrl.hostname)) {
  throw new Error("Memorial integration tests only run against an explicit loopback database host.");
}

process.env.DATABASE_URL = databaseUrl;
const client = new Client({ connectionString: databaseUrl });
const runId = randomBytes(12).toString("hex");
const duplicateFingerprint = randomBytes(32).toString("hex");
const rateFingerprint = randomBytes(32).toString("hex");
const paginationFingerprint = randomBytes(32).toString("hex");
const fixtureFingerprints = [duplicateFingerprint, rateFingerprint, paginationFingerprint];
await client.connect();

try {
  await client.query(await readFile(new URL("../migrations/202609190001_memorial_messages.sql", import.meta.url), "utf8"));

  const { adminMessages, approvedMessages, moderateMessage, submitPendingMessage } = await import("../src/lib/database.ts");
  const duplicateInput = { displayName: `__integration__${runId} duplicate`, location: "Test Lab", message: "A pending memorial message." };
  const accepted = await submitPendingMessage(duplicateInput, duplicateFingerprint);
  assert.deepEqual(accepted, { allowed: true, duplicate: false, retry_after_seconds: 0 });
  const duplicate = await submitPendingMessage(duplicateInput, duplicateFingerprint);
  assert.deepEqual(duplicate, { allowed: false, duplicate: true, retry_after_seconds: 0 });

  for (let index = 1; index <= 3; index += 1) {
    const result = await submitPendingMessage({ displayName: `__integration__${runId} rate ${index}`, location: null, message: `Unique rate-limit message ${index}` }, rateFingerprint);
    assert.equal(result.allowed, true);
  }
  const limited = await submitPendingMessage({ displayName: `__integration__${runId} rate 4`, location: null, message: "Unique rate-limit message 4" }, rateFingerprint);
  assert.equal(limited.allowed, false);
  assert.equal(limited.duplicate, false);
  assert.ok(limited.retry_after_seconds > 0);

  const { rows: pendingFixtures } = await client.query(
    `select id, display_name
       from memorial_messages
      where submission_fingerprint = any($1::text[]) and status = 'pending'`,
    [[duplicateFingerprint, rateFingerprint]],
  );
  const pending = pendingFixtures.find((entry) => entry.display_name === duplicateInput.displayName);
  assert.ok(pending, "pending submissions must appear in the moderation queue");
  assert.equal((await approvedMessages()).messages.some((entry) => entry.display_name === duplicateInput.displayName), false, "pending submissions must not be public");

  const approved = await moderateMessage(pending.id, "approved");
  assert.equal(approved?.status, "approved");
  const publicMessages = await approvedMessages();
  const publicMessage = publicMessages.messages.find((entry) => entry.display_name === duplicateInput.displayName);
  assert.ok(publicMessage, "approved submissions must appear publicly");
  assert.deepEqual(Object.keys(publicMessage).sort(), ["approved_at", "display_name", "location", "message"]);
  assert.equal((await adminMessages()).messages.some((entry) => entry.id === pending.id), false, "approved submissions must leave the pending queue");
  assert.equal(await moderateMessage(pending.id, "rejected"), null, "reviewed messages cannot be moderated again");

  const rejected = pendingFixtures.find((entry) => entry.display_name === `__integration__${runId} rate 1`);
  assert.ok(rejected, "rate-limit fixture should be awaiting review");
  assert.equal((await moderateMessage(rejected.id, "rejected"))?.status, "rejected");
  assert.equal((await approvedMessages()).messages.some((entry) => entry.display_name === rejected.display_name), false, "rejected submissions must not be public");

  const paginationEntries = Array.from({ length: 26 }, (_, index) => ({
    id: randomUUID(),
    displayName: `__integration__${runId} pagination ${index}`,
  }));
  for (const [index, entry] of paginationEntries.entries()) {
    await client.query(
      `insert into memorial_messages (id, display_name, location, message, status, submission_fingerprint, created_at)
       values ($1, $2, null, $3, 'pending', $4, timestamptz '2099-01-01 00:00:00+00' - $5 * interval '1 second')`,
      [entry.id, entry.displayName, `Pagination fixture ${index}`, paginationFingerprint, index],
    );
  }

  const firstPageBeforeModeration = await adminMessages(0, 25);
  assert.equal(firstPageBeforeModeration.messages.length, 25);
  assert.deepEqual(firstPageBeforeModeration.messages.map((entry) => entry.id), paginationEntries.slice(0, 25).map((entry) => entry.id));
  assert.equal((await moderateMessage(paginationEntries[0].id, "approved"))?.status, "approved");
  const refreshedFirstPage = await adminMessages(0, 25);
  assert.ok(refreshedFirstPage.messages.some((entry) => entry.id === paginationEntries[25].id), "the item shifted from the next offset page must appear after reconciling the first page");

  console.log("Memorial PostgreSQL integration checks passed.");
} finally {
  await client.query("delete from memorial_messages where submission_fingerprint = any($1::text[])", [fixtureFingerprints]).catch(() => undefined);
  await client.query("delete from memorial_submission_rate_limits where fingerprint = any($1::text[])", [fixtureFingerprints]).catch(() => undefined);
  await client.end();
  await globalThis.nangSoulMemorialPool?.end().catch(() => undefined);
  globalThis.nangSoulMemorialPool = undefined;
}
