import { createHmac } from "crypto";
import { isIP } from "node:net";

export const RATE_LIMIT_MAX = 3;
export const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

export function trustedClientIp(request: Request, environment = "production") {
  // The app runs directly on Workers. Cloudflare overwrites CF-Connecting-IP
  // at its public edge. Never trust visitor-supplied forwarded or x-real-ip.
  const ip = request.headers.get("cf-connecting-ip")?.trim();
  if (ip && isIP(ip)) return ip;
  if (environment !== "development") return null;
  const host = new URL(request.url).hostname;
  return ["localhost", "127.0.0.1", "[::1]"].includes(host) ? "127.0.0.1" : null;
}

export function fingerprintForIp(ip: string | null, salt?: string) {
  if (!ip || !salt) return null;
  return createHmac("sha256", salt).update(ip).digest("hex");
}
