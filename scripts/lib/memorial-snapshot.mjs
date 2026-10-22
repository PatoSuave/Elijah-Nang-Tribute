import { createHash } from "node:crypto";

export const columns = {
  memorial_messages: ["id", "display_name", "location", "message", "status", "created_at", "approved_at", "moderation_notes", "submission_fingerprint"],
  memorial_submission_rate_limits: ["fingerprint", "window_start", "submission_count"],
};
const fail = (reason) => { throw new Error(`Snapshot validation failed: ${reason}`); };
const record = (value) => value && typeof value === "object" && !Array.isArray(value);
const exactKeys = (value, keys) => record(value) && Object.keys(value).sort().join("|") === [...keys].sort().join("|");
const timestamp = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(Date.parse(value)).toISOString().slice(0, 19) === value.slice(0, 19);
const fingerprint = (value) => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const text = (value, maximum = Infinity) => typeof value === "string" && !value.includes("\0") && [...value].length <= maximum;

export function validateMemorialTables(tables) {
  if (!record(tables)) fail("missing tables");
  for (const [table, fields] of Object.entries(columns)) {
    if (!Array.isArray(tables[table])) fail(`missing ${table}`);
    const keys = new Set();
    for (const [index, row] of tables[table].entries()) {
      const at = `${table} row ${index + 1}`; // Never include private row contents.
      if (!exactKeys(row, fields)) fail(`${at} has unexpected or missing columns`);
      if (table === "memorial_messages") {
        if (typeof row.id !== "string" || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(row.id)) fail(`${at} invalid UUID`);
        if (!text(row.display_name, 60) || row.display_name.length === 0) fail(`${at} invalid display_name`);
        if (row.location !== null && !text(row.location, 80)) fail(`${at} invalid location`);
        if (!text(row.message, 1000) || row.message.length === 0) fail(`${at} invalid message`);
        if (!["pending", "approved", "rejected", "archived"].includes(row.status)) fail(`${at} invalid status`);
        if (!timestamp(row.created_at) || (row.approved_at !== null && !timestamp(row.approved_at))) fail(`${at} invalid UTC timestamp`);
        if (row.moderation_notes !== null && !text(row.moderation_notes)) fail(`${at} invalid moderation_notes`);
        if (!fingerprint(row.submission_fingerprint)) fail(`${at} invalid fingerprint`);
      } else {
        if (!fingerprint(row.fingerprint)) fail(`${at} invalid fingerprint`);
        if (!timestamp(row.window_start) || !/:00:00\.000000Z$/.test(row.window_start)) fail(`${at} invalid hour boundary`);
        if (!Number.isInteger(row.submission_count) || row.submission_count < 0 || row.submission_count > 3) fail(`${at} invalid count`);
      }
      const key = table === "memorial_messages" ? row.id : `${row.fingerprint}|${row.window_start}`;
      if (keys.has(key)) fail(`${at} duplicate primary key`);
      keys.add(key);
    }
  }
  return tables;
}

export function validateSnapshot(snapshot) {
  if (!exactKeys(snapshot, ["format", "exported_at", "source", "tables", "counts"])) fail("unexpected envelope");
  if (snapshot.format !== "nangsoul-postgres-snapshot-v1") fail("unknown format");
  if (!exactKeys(snapshot.source, ["schema"]) || snapshot.source.schema !== "public") fail("unexpected source schema");
  if (typeof snapshot.exported_at !== "string" || !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(snapshot.exported_at) || !Number.isFinite(Date.parse(snapshot.exported_at))) fail("invalid export time");
  const tables = [...Object.keys(columns), "schema_migrations"];
  if (!exactKeys(snapshot.tables, tables) || !exactKeys(snapshot.counts, tables)) fail("unexpected table inventory");
  for (const name of tables) {
    if (!Array.isArray(snapshot.tables[name]) || snapshot.counts[name] !== snapshot.tables[name].length) fail(`${name} count mismatch`);
  }
  validateMemorialTables(snapshot.tables);
  return snapshot;
}

export function memorialManifest(tables) {
  validateMemorialTables(tables);
  const manifest = {};
  for (const [table, fields] of Object.entries(columns)) {
    const rows = tables[table].map((row) => fields.map((field) => row[field]));
    rows.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b), "en"));
    manifest[table] = { count: rows.length, sha256: createHash("sha256").update(JSON.stringify(rows)).digest("hex") };
  }
  manifest.statuses = Object.fromEntries(["pending", "approved", "rejected", "archived"].map((status) => [status, tables.memorial_messages.filter((row) => row.status === status).length]));
  return manifest;
}

const sqlValue = (value) => value === null ? "NULL" : typeof value === "number" ? String(value) : `'${value.replaceAll("'", "''")}'`;
export function snapshotStatements(snapshot) {
  validateSnapshot(snapshot);
  // Plain INSERT fails on conflicts. Never silently overwrite a message in an
  // active target; import into a verified empty target before accepting writes.
  return Object.entries(columns).flatMap(([table, fields]) => snapshot.tables[table].map((row) =>
    `INSERT INTO ${table} (${fields.join(", ")}) VALUES (${fields.map((field) => sqlValue(row[field])).join(", ")})`,
  ));
}

export function reconcileMemorialTables(source, target) {
  const expected = memorialManifest(source);
  const actual = memorialManifest(target);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error("Snapshot reconciliation failed: counts, statuses, or exact row hashes differ. Do not cut over.");
  return actual;
}
