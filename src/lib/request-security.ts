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

function requestHostOrigin(request: Request) {
  const host = request.headers.get("host");
  if (host === null) return null;
  try {
    const protocol = new URL(request.url).protocol;
    return canonicalOrigin(`${protocol}//${host}`, false);
  } catch {
    return null;
  }
}

export function isSameOrigin(request: Request, environment = process.env.NODE_ENV) {
  const origin = canonicalOrigin(request.headers.get("origin"), false);
  if (!origin) return false;

  // Railway forwards requests to an internal service address. Production must
  // use the configured public origin and must not trust forwarded or Host
  // headers. Local development may use the direct Host header because Next's
  // request URL can be canonicalized to localhost despite a 127.0.0.1 bind.
  const expectedOrigin = environment === "production"
    ? configuredPublicOrigin()
    : request.headers.has("host")
      ? requestHostOrigin(request)
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
