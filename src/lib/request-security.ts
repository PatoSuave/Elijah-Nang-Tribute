let cachedPublicOriginValue: string | undefined;
let cachedPublicOrigin: string | null | undefined;

function canonicalOrigin(value: string | null, requireHttps: boolean) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (
      (requireHttps && parsed.protocol !== "https:") ||
      (!requireHttps && parsed.protocol !== "https:" && parsed.protocol !== "http:") ||
      parsed.username ||
      parsed.password ||
      (parsed.pathname !== "/" && parsed.pathname !== "") ||
      parsed.search ||
      parsed.hash
    ) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function configuredPublicOrigin() {
  const value = process.env.MEMORIAL_PUBLIC_ORIGIN;
  if (value !== cachedPublicOriginValue || cachedPublicOrigin === undefined) {
    cachedPublicOriginValue = value;
    cachedPublicOrigin = canonicalOrigin(value ?? null, true);
  }
  return cachedPublicOrigin;
}

export function isSameOrigin(request: Request, environment = process.env.NODE_ENV) {
  const origin = canonicalOrigin(request.headers.get("origin"), false);
  if (!origin) return false;

  // Railway forwards requests to the internal service address. Trusting that
  // request URL in production would reject the browser's public Origin, while
  // trusting forwarded-host headers would let a client choose the comparison.
  const expectedOrigin = environment === "production"
    ? configuredPublicOrigin()
    : canonicalOrigin(new URL(request.url).origin, false);
  return Boolean(expectedOrigin && origin === expectedOrigin);
}

export async function verifyTurnstile(token: unknown, remoteip?: string) {
  if (typeof token !== "string" || !token) return false;
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return false;
  try {
    const form = new URLSearchParams({ secret, response: token });
    if (remoteip) form.set("remoteip", remoteip);
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form, signal: AbortSignal.timeout(5000) });
    return response.ok && Boolean((await response.json()).success);
  } catch { return false; }
}
