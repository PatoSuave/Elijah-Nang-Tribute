import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { memorialManifest } from "./lib/memorial-snapshot.mjs";

const run = promisify(execFile);
const converter = fileURLToPath(new URL("./convert-memorial-snapshot.mjs", import.meta.url));
const snapshot = {
  format: "nangsoul-postgres-snapshot-v1",
  exported_at: "2026-10-22T13:00:00.000Z",
  source: { schema: "public" },
  tables: {
    memorial_messages: [{
      id: "00000000-0000-4000-8000-000000000001", display_name: "Synthetic", location: null,
      message: "Private fixture must stay out of logs", status: "pending",
      created_at: "2026-10-22T12:00:00.123456Z", approved_at: null, moderation_notes: null,
      submission_fingerprint: "a".repeat(64),
    }],
    memorial_submission_rate_limits: [],
    schema_migrations: [{ version: "202609190001" }],
  },
  counts: { memorial_messages: 1, memorial_submission_rate_limits: 0, schema_migrations: 1 },
};

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), "nangsoul-converter-"));
  t.after(async () => {
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    assert.equal(basename(directory).startsWith("nangsoul-converter-"), true);
    await rm(directory, { recursive: true });
  });
  const source = join(directory, "source.json");
  const output = join(directory, "import.sql");
  const manifest = `${output}.manifest.json`;
  await writeFile(source, JSON.stringify(snapshot));
  return { directory, source, output, manifest, convert: () => run(process.execPath, [converter, source, output]) };
}

async function verifyPair({ output, manifest }) {
  assert.match(await readFile(output, "utf8"), /INSERT INTO memorial_messages/);
  assert.deepEqual(JSON.parse(await readFile(manifest, "utf8")), memorialManifest(snapshot.tables));
}

test("successful conversion creates the complete pair without logging private content", async (t) => {
  const files = await fixture(t);
  const result = await files.convert();
  assert.equal(JSON.parse(result.stdout).result, "converted");
  assert.equal(result.stdout.includes(snapshot.tables.memorial_messages[0].message), false);
  assert.equal(result.stderr, "");
  await verifyPair(files);
});

test("an existing manifest is preserved, partial SQL is removed, and retry succeeds", async (t) => {
  const files = await fixture(t);
  await writeFile(files.manifest, "existing manifest sentinel");
  await assert.rejects(files.convert());
  await assert.rejects(readFile(files.output), { code: "ENOENT" });
  assert.equal(await readFile(files.manifest, "utf8"), "existing manifest sentinel");
  await unlink(files.manifest);
  await files.convert();
  await verifyPair(files);
});

test("an existing SQL file is preserved without creating a manifest", async (t) => {
  const files = await fixture(t);
  await writeFile(files.output, "existing SQL sentinel");
  await assert.rejects(files.convert());
  assert.equal(await readFile(files.output, "utf8"), "existing SQL sentinel");
  await assert.rejects(readFile(files.manifest), { code: "ENOENT" });
  await unlink(files.output);
  await files.convert();
  await verifyPair(files);
});

test("competing conversions produce one complete pair and cannot remove each other's files", async (t) => {
  const files = await fixture(t);
  const results = await Promise.allSettled([files.convert(), files.convert()]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(results.filter((result) => result.status === "rejected").length, 1);
  await verifyPair(files);
});

test("a failure while writing the second file removes both newly created outputs", async (t) => {
  const files = await fixture(t);
  const preload = join(files.directory, "fail-manifest-write.mjs");
  await writeFile(preload, `
import { promises as fs } from "node:fs";
import { syncBuiltinESMExports } from "node:module";
const originalOpen = fs.open;
fs.open = async (...args) => {
  const handle = await originalOpen(...args);
  if (String(args[0]).endsWith(".manifest.json")) {
    handle.writeFile = async () => { throw new Error("Synthetic manifest write failure"); };
  }
  return handle;
};
syncBuiltinESMExports();
`);
  await assert.rejects(run(process.execPath, ["--import", pathToFileURL(preload).href, converter, files.source, files.output]), (error) => {
    assert.match(error.stderr, /Synthetic manifest write failure/);
    return true;
  });
  await assert.rejects(readFile(files.output), { code: "ENOENT" });
  await assert.rejects(readFile(files.manifest), { code: "ENOENT" });
  await files.convert();
  await verifyPair(files);
});

test("invalid input creates neither output and does not log private content", async (t) => {
  const files = await fixture(t);
  await writeFile(files.source, `invalid ${snapshot.tables.memorial_messages[0].message}`);
  await assert.rejects(files.convert(), (error) => {
    assert.equal(error.stderr.includes(snapshot.tables.memorial_messages[0].message), false);
    return true;
  });
  await assert.rejects(readFile(files.output), { code: "ENOENT" });
  await assert.rejects(readFile(files.manifest), { code: "ENOENT" });
});
