import { adminPaging, type MemorialSubmission } from "./memorial.ts";

export type MemorialMessage = {
  id: string;
  display_name: string;
  location: string | null;
  message: string;
  status: "pending" | "approved" | "rejected" | "archived";
  created_at: string;
  approved_at: string | null;
};

type PublicMessage = Pick<MemorialMessage, "display_name" | "location" | "message" | "approved_at">;
type SubmissionResult = { allowed: boolean; duplicate: boolean; retry_after_seconds: number };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HOUR = 3_600_000;

// Fixed-width UTC text keeps PostgreSQL microseconds intact on import and
// preserves chronological ordering, including ties resolved by the UUID.
export const databaseTimestamp = (milliseconds: number) => new Date(milliseconds).toISOString().replace(/Z$/, "000Z");

export function publicPaging(offset: number, limit: number) {
  return {
    offset: Number.isInteger(offset) && offset >= 0 ? Math.min(offset, 10_000) : 0,
    limit: Number.isInteger(limit) && limit >= 1 ? Math.min(limit, 12) : 12,
  };
}

export const isMemorialMessageId = (id: string) => UUID.test(id);

export function createMemorialStore(db: D1Database) {
  return {
    async approvedMessages(offset = 0, limit = 12) {
      const paging = publicPaging(offset, limit);
      const { results } = await db.prepare(
        `SELECT display_name, location, message, approved_at
           FROM memorial_messages WHERE status = 'approved'
          ORDER BY approved_at DESC NULLS FIRST, id DESC LIMIT ? OFFSET ?`,
      ).bind(paging.limit + 1, paging.offset).all<PublicMessage>();
      return { messages: results.slice(0, paging.limit), hasMore: results.length > paging.limit };
    },

    async adminMessages(offset = 0, limit = 25) {
      const paging = adminPaging(offset, limit);
      const { results } = await db.prepare(
        `SELECT id, display_name, location, message, status, created_at, approved_at
           FROM memorial_messages WHERE status = 'pending'
          ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
      ).bind(paging.limit + 1, paging.offset).all<MemorialMessage>();
      return { messages: results.slice(0, paging.limit), hasMore: results.length > paging.limit };
    },

    async submitPendingMessage(input: MemorialSubmission, fingerprint: string): Promise<SubmissionResult> {
      const id = crypto.randomUUID();
      const now = Date.now();
      const window = Math.floor(now / HOUR) * HOUR;
      const windowStart = databaseTimestamp(window);
      const duplicateSince = databaseTimestamp(now - 600_000);
      const duplicate = `EXISTS (
        SELECT 1 FROM memorial_messages
         WHERE submission_fingerprint = ? AND display_name = ?
           AND location IS ? AND message = ? AND created_at >= ?
      )`;
      const duplicateArgs = [fingerprint, input.displayName, input.location, input.message, duplicateSince];

      // D1 batch is a serial SQL transaction. The decision, insert, and quota
      // update cannot interleave with another batch. Updating quota only for
      // this newly generated ID avoids charging duplicates or limited requests.
      // Any constraint/storage failure rolls the entire batch back.
      const [decision, inserted] = await db.batch<{ duplicate: number }>([
        db.prepare(`SELECT ${duplicate} AS duplicate`).bind(...duplicateArgs),
        db.prepare(
          `INSERT INTO memorial_messages
            (id, display_name, location, message, status, submission_fingerprint, created_at)
           SELECT ?, ?, ?, ?, 'pending', ?, ?
            WHERE NOT ${duplicate}
              AND COALESCE((SELECT submission_count FROM memorial_submission_rate_limits
                WHERE fingerprint = ? AND window_start = ?), 0) < 3`,
        ).bind(id, input.displayName, input.location, input.message, fingerprint, databaseTimestamp(now), ...duplicateArgs, fingerprint, windowStart),
        db.prepare(
          `INSERT INTO memorial_submission_rate_limits (fingerprint, window_start, submission_count)
           SELECT ?, ?, 1 WHERE EXISTS (SELECT 1 FROM memorial_messages WHERE id = ?)
           ON CONFLICT (fingerprint, window_start) DO UPDATE
             SET submission_count = memorial_submission_rate_limits.submission_count + 1`,
        ).bind(fingerprint, windowStart, id),
      ]);
      if (decision.results[0]?.duplicate) return { allowed: false, duplicate: true, retry_after_seconds: 0 };
      if (inserted.meta.changes === 1) return { allowed: true, duplicate: false, retry_after_seconds: 0 };
      return { allowed: false, duplicate: false, retry_after_seconds: Math.max(1, Math.ceil((window + HOUR - now) / 1000)) };
    },

    async moderateMessage(id: string, status: "approved" | "rejected") {
      if (!isMemorialMessageId(id)) throw new Error("Invalid memorial message identifier.");
      if (status !== "approved" && status !== "rejected") throw new Error("Invalid moderation action.");
      return db.prepare(
        `UPDATE memorial_messages SET status = ?, approved_at = ?
          WHERE id = ? AND status = 'pending'
          RETURNING id, display_name, location, message, status, created_at, approved_at`,
      ).bind(status, status === "approved" ? databaseTimestamp(Date.now()) : null, id).first<MemorialMessage>();
    },

    async databaseHealthy() {
      // Check required tables, not merely connectivity to an empty D1 database.
      await db.batch([
        db.prepare("SELECT id FROM memorial_messages LIMIT 1"),
        db.prepare("SELECT fingerprint FROM memorial_submission_rate_limits LIMIT 1"),
      ]);
    },
  };
}
