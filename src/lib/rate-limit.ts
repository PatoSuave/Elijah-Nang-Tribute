import { createHmac } from "crypto";

export const RATE_LIMIT_MAX = 3;
export const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

export function trustedClientIp(request: Request, environment = process.env.NODE_ENV) {
  // Railway's public HTTP proxy sets X-Real-IP to the connecting client IP.
  // In production, accept only this provider-controlled header and fail closed.
  const railwayIp = request.headers.get("x-real-ip")?.trim();
  if (environment === "production") return railwayIp || null;
  // Local development is not behind Railway. Do not enable this fallback in production.
  return railwayIp || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

export function fingerprintForIp(ip: string | null, salt = process.env.MEMORIAL_RATE_LIMIT_SALT) {
  if (!ip || !salt) return null;
  return createHmac("sha256", salt).update(ip).digest("hex");
}
