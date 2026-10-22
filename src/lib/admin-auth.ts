import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { memorialConfig } from "./runtime-config";

const COOKIE = "nangsoul_memorial_admin";
const maxAge = 60 * 60 * 8;
const secret = () => memorialConfig().adminSessionSecret;
const sign = (value: string) => createHmac("sha256", secret()).update(value).digest("base64url");
const equal = (a: string, b: string) => { const x = Buffer.from(a); const y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };

export function adminAuthConfigured() { return Boolean(memorialConfig().adminPassword && secret()); }
export function createAdminSession() { const payload = `${Date.now() + maxAge * 1000}.${randomBytes(18).toString("base64url")}`; return `${payload}.${sign(payload)}`; }
export function validAdminSession(value?: string) {
  if (!value || !adminAuthConfigured()) return false;
  const [expires, nonce, signature, extra] = value.split(".");
  return Boolean(!extra && value.split(".").length === 3 && expires && nonce && signature && Number.isFinite(Number(expires)) && Number(expires) > Date.now() && equal(sign(`${expires}.${nonce}`), signature));
}
export async function isAdmin() { return validAdminSession((await cookies()).get(COOKIE)?.value); }
export function csrfToken(session: string) { return sign(`csrf.${session}`); }
export function validCsrf(session: string | undefined, token: string | null) { return Boolean(session && token && equal(csrfToken(session), token)); }
export { COOKIE, maxAge };
