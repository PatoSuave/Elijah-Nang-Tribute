import "server-only";
import { env } from "cloudflare:workers";

// Only local Wrangler emulation opts into development behavior. A missing or
// unexpected environment value keeps origin/IP/cookie checks in production mode.
export function memorialConfig() {
  return {
    environment: env.MEMORIAL_ENVIRONMENT === "local" ? "development" : "production",
    publicOrigin: env.MEMORIAL_PUBLIC_ORIGIN || "",
    publicTurnstileSiteKey: env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
    turnstileSecret: env.TURNSTILE_SECRET_KEY || "",
    adminPassword: env.MEMORIAL_ADMIN_PASSWORD || "",
    adminSessionSecret: env.MEMORIAL_ADMIN_SESSION_SECRET || "",
    rateLimitSalt: env.MEMORIAL_RATE_LIMIT_SALT || "",
  };
}
