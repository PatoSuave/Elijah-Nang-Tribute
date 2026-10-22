import { spawnSync } from "node:child_process";
const target = process.argv[2] || "local";
if (!["local", "staging", "production"].includes(target)) throw new Error("Choose local, staging, or production.");
const environment = { ...process.env };
if (target === "local") delete environment.CLOUDFLARE_ENV;
else environment.CLOUDFLARE_ENV = target;
const result = spawnSync(process.execPath, ["node_modules/vite/bin/vite.js", "build", "--logLevel", "warn"], { env: environment, stdio: "inherit" });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
