import "server-only";

import { env } from "cloudflare:workers";
import { createMemorialStore } from "./memorial-store.ts";

// Resolve bindings within the request; no connection pool or mutable request
// state is shared between Worker requests.
function store() {
  if (!env.MEMORIAL_DB) throw new Error("Memorial storage is not configured.");
  return createMemorialStore(env.MEMORIAL_DB);
}

export const approvedMessages = (offset = 0, limit = 12) => store().approvedMessages(offset, limit);
export const adminMessages = (offset = 0, limit = 25) => store().adminMessages(offset, limit);
export const submitPendingMessage = (...args: Parameters<ReturnType<typeof createMemorialStore>["submitPendingMessage"]>) => store().submitPendingMessage(...args);
export const moderateMessage = (...args: Parameters<ReturnType<typeof createMemorialStore>["moderateMessage"]>) => store().moderateMessage(...args);
export const databaseHealthy = () => store().databaseHealthy();
export { isMemorialMessageId, publicPaging } from "./memorial-store.ts";
export type { MemorialMessage } from "./memorial-store.ts";
