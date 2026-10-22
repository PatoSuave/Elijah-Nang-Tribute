import { readFile } from "node:fs/promises";
import { reconcileMemorialTables, validateSnapshot } from "./lib/memorial-snapshot.mjs";

const [sourcePath, targetPath] = process.argv.slice(2);
if (!sourcePath || !targetPath) throw new Error("Usage: node scripts/verify-memorial-snapshot.mjs PRIVATE_SOURCE.json PRIVATE_D1_TABLES.json");
const readPrivateJson = async (path) => {
  try { return JSON.parse(await readFile(path, "utf8")); }
  catch { throw new Error("Cannot read private snapshot JSON. Contents are not logged."); }
};
const source = validateSnapshot(await readPrivateJson(sourcePath));
// Target JSON is {memorial_messages: [...], memorial_submission_rate_limits: [...]}.
const target = await readPrivateJson(targetPath);
console.log(JSON.stringify({ result: "exact-match", manifest: reconcileMemorialTables(source.tables, target) }));
