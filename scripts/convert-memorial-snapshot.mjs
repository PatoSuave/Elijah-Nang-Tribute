import { open, readFile, unlink } from "node:fs/promises";
import { memorialManifest, snapshotStatements, validateSnapshot } from "./lib/memorial-snapshot.mjs";

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error("Usage: node scripts/convert-memorial-snapshot.mjs PRIVATE_SNAPSHOT.json PRIVATE_IMPORT.sql");
let parsed;
try { parsed = JSON.parse(await readFile(input, "utf8")); }
catch { throw new Error("Cannot read snapshot JSON. Check the private source file; contents are not logged."); }
const snapshot = validateSnapshot(parsed);
const statements = snapshotStatements(snapshot);
const manifest = memorialManifest(snapshot.tables);
const outputs = [
  { path: output, contents: `-- NangSoul lossless PostgreSQL to D1 import. Private data: never commit.\n${statements.map((sql) => `${sql};`).join("\n")}\n` },
  { path: `${output}.manifest.json`, contents: `${JSON.stringify(manifest, null, 2)}\n` },
];
const created = [];
try {
  // Reserve both names exclusively before writing private data. A competing
  // invocation cannot overwrite either file or clean up files it did not create.
  for (const file of outputs) {
    const handle = await open(file.path, "wx", 0o600);
    created.push({ ...file, handle });
  }
  for (const file of created) await file.handle.writeFile(file.contents, "utf8");
  for (const file of created) {
    await file.handle.close();
    file.handle = null;
  }
} catch (error) {
  const closed = await Promise.allSettled(created.map((file) => file.handle?.close()));
  const removed = await Promise.allSettled(created.map((file) => unlink(file.path)));
  const cleanupErrors = [...closed, ...removed].filter((result) => result.status === "rejected").map((result) => result.reason);
  if (cleanupErrors.length) throw new AggregateError([error, ...cleanupErrors], "Conversion failed and cleanup was incomplete. Check the private output paths before retrying.");
  throw error;
}
console.log(JSON.stringify({ result: "converted", manifest }));
