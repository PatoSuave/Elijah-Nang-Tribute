import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { Client } from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set before running migrations.");
}

const migrationDirectory = join(process.cwd(), "migrations");
const migrations = (await readdir(migrationDirectory))
  .filter((file) => file.endsWith(".sql"))
  .sort();
const client = new Client({ connectionString: databaseUrl });

await client.connect();
try {
  await client.query("select pg_advisory_lock(hashtext($1))", ["nangsoul-migrations"]);
  await client.query(`create table if not exists schema_migrations (
    id text primary key,
    applied_at timestamptz not null default current_timestamp
  )`);

  for (const id of migrations) {
    const applied = await client.query("select 1 from schema_migrations where id = $1", [id]);
    if (applied.rowCount) continue;

    const sql = await readFile(join(migrationDirectory, id), "utf8");
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query("insert into schema_migrations (id) values ($1)", [id]);
      await client.query("commit");
      console.log(`Applied ${id}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }
} finally {
  await client.query("select pg_advisory_unlock(hashtext($1))", ["nangsoul-migrations"]).catch(() => undefined);
  await client.end();
}
