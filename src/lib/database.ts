import "server-only";

import { randomUUID } from "crypto";
import { Pool, type PoolClient, type PoolConfig } from "pg";
import { adminPaging } from "./memorial.ts";

type MemorialMessage = {
  id: string;
  display_name: string;
  location: string | null;
  message: string;
  status: "pending" | "approved" | "rejected" | "archived";
  created_at: string;
  approved_at: string | null;
};

type SubmissionInput = {
  displayName: string;
  location: string | null;
  message: string;
};

type QuotaResult = { allowed: boolean; retry_after_seconds: number };
type SubmissionResult = QuotaResult & { duplicate: boolean };

const PUBLIC_PAGE_SIZE = 12;
const ADMIN_PAGE_SIZE = 25;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

declare global {
  var nangSoulMemorialPool: Pool | undefined;
}

function poolConfig(): PoolConfig {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Memorial storage is not configured.");

  return {
    connectionString,
    // Railway services are long-lived Node processes. Keep a small, reusable pool
    // so a burst of requests cannot exhaust the database's connection limit.
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    maxUses: 7_500,
  };
}

function pool() {
  if (!globalThis.nangSoulMemorialPool) {
    globalThis.nangSoulMemorialPool = new Pool(poolConfig());
  }
  return globalThis.nangSoulMemorialPool;
}

async function withTransaction<T>(operation: (client: PoolClient) => Promise<T>) {
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function approvedMessages(offset = 0, limit = PUBLIC_PAGE_SIZE) {
  const paging = publicPaging(offset, limit);
  const { rows } = await pool().query<MemorialMessage>(
    `select display_name, location, message, approved_at
       from memorial_messages
      where status = 'approved'
      order by approved_at desc, id desc
      limit $1 offset $2`,
    [paging.limit + 1, paging.offset],
  );
  return { messages: rows.slice(0, paging.limit), hasMore: rows.length > paging.limit };
}

export async function adminMessages(offset = 0, limit = ADMIN_PAGE_SIZE) {
  const paging = adminPaging(offset, limit);
  const { rows } = await pool().query<MemorialMessage>(
    `select id, display_name, location, message, status, created_at, approved_at
       from memorial_messages
      where status = 'pending'
      order by created_at desc, id desc
      limit $1 offset $2`,
    [paging.limit + 1, paging.offset],
  );
  return { messages: rows.slice(0, paging.limit), hasMore: rows.length > paging.limit };
}

export function publicPaging(offset: number, limit: number) {
  return {
    offset: Number.isInteger(offset) && offset >= 0 ? Math.min(offset, 10_000) : 0,
    limit: Number.isInteger(limit) && limit >= 1 ? Math.min(limit, PUBLIC_PAGE_SIZE) : PUBLIC_PAGE_SIZE,
  };
}

async function consumeQuota(client: PoolClient, fingerprint: string): Promise<QuotaResult> {
  const { rows } = await client.query<QuotaResult>(
    `with attempt as (
       insert into memorial_submission_rate_limits (fingerprint, window_start, submission_count)
       values ($1, date_trunc('hour', current_timestamp), 1)
       on conflict (fingerprint, window_start) do update
         set submission_count = memorial_submission_rate_limits.submission_count + 1
       where memorial_submission_rate_limits.submission_count < 3
       returning submission_count
     )
     select true as allowed, 0::integer as retry_after_seconds from attempt
     union all
     select false as allowed,
       greatest(1, extract(epoch from (
         date_trunc('hour', current_timestamp) + interval '1 hour' - current_timestamp
       ))::integer) as retry_after_seconds
     where not exists (select 1 from attempt)`,
    [fingerprint],
  );
  if (!rows[0]) throw new Error("Memorial rate limit request failed.");
  return rows[0];
}

// The fingerprint-scoped transaction lock keeps a double-click or transport
// retry from creating duplicate pending messages while preserving the quota.
// The quota update and message insert share one transaction, so a failed
// insert does not consume a visitor's durable submission allowance.
export async function submitPendingMessage(input: SubmissionInput, fingerprint: string) {
  return withTransaction<SubmissionResult>(async (client) => {
    await client.query("select pg_advisory_xact_lock(hashtext($1))", [fingerprint]);
    const duplicate = await client.query(
      `select 1
         from memorial_messages
        where submission_fingerprint = $1
          and display_name = $2
          and location is not distinct from $3
          and message = $4
          and created_at >= current_timestamp - interval '10 minutes'
        limit 1`,
      [fingerprint, input.displayName, input.location, input.message],
    );
    if (duplicate.rowCount) return { allowed: false, duplicate: true, retry_after_seconds: 0 };

    const quota = await consumeQuota(client, fingerprint);
    if (!quota.allowed) return { ...quota, duplicate: false };

    await client.query<MemorialMessage>(
      `insert into memorial_messages (
         id, display_name, location, message, status, submission_fingerprint
       ) values ($1, $2, $3, $4, 'pending', $5)`,
      [randomUUID(), input.displayName, input.location, input.message, fingerprint],
    );
    return { ...quota, duplicate: false };
  });
}

export function isMemorialMessageId(id: string) {
  return UUID.test(id);
}

export async function moderateMessage(id: string, status: "approved" | "rejected") {
  if (!isMemorialMessageId(id)) throw new Error("Invalid memorial message identifier.");
  const moderationUpdate = status === "approved"
    ? "set status = 'approved', approved_at = current_timestamp"
    : "set status = 'rejected', approved_at = null";
  const { rows } = await pool().query<MemorialMessage>(
    `update memorial_messages
        ${moderationUpdate}
      where id = $1 and status = 'pending'
      returning id, display_name, location, message, status, created_at, approved_at`,
    [id],
  );
  return rows[0] || null;
}

export async function databaseHealthy() {
  await pool().query("select 1");
}

export type { MemorialMessage };
