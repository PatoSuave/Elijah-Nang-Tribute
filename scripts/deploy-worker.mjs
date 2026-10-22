import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const target = process.argv[2];
if (!["staging", "production"].includes(target)) throw new Error("Choose staging or production explicitly.");
const built = JSON.parse(await readFile("dist/server/wrangler.json", "utf8"));
const source = JSON.parse(await readFile("wrangler.jsonc", "utf8"));
const expected = source.env[target];
if (built.name !== expected.name || built.vars?.MEMORIAL_ENVIRONMENT !== target || built.account_id !== source.account_id || built.d1_databases?.[0]?.database_id !== expected.d1_databases[0].database_id) {
  throw new Error(`Build target mismatch. Run npm run build:${target} before deploying.`);
}
if (!built.vars.MEMORIAL_PUBLIC_ORIGIN?.startsWith("https://") || !built.vars.NEXT_PUBLIC_TURNSTILE_SITE_KEY) throw new Error("Configure the HTTPS origin and public Turnstile key before deployment.");
const result = spawnSync(process.execPath, ["node_modules/wrangler/bin/wrangler.js", "deploy", "--config", "dist/server/wrangler.json"], { stdio: "inherit" });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
