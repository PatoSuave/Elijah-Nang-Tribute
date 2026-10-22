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

export function isSameOrigin(request: Request, environment = "production", publicOrigin?: string) {
  const origin = canonicalOrigin(request.headers.get("origin"), false);
  if (!origin) return false;

  // Production must use the configured public origin, never forwarded or Host
  // headers. Local development may use the direct Host header because Next's
  // request URL can be canonicalized to localhost despite a 127.0.0.1 bind.
  const expectedOrigin = environment !== "development"
    ? canonicalOrigin(publicOrigin ?? null, true)
    : request.headers.has("host")
      ? requestHostOrigin(request)
      : canonicalOrigin(new URL(request.url).origin, false);
  return Boolean(expectedOrigin && origin === expectedOrigin);
}

export async function verifyTurnstile(token: unknown, secret: string, remoteip?: string) {
  if (typeof token !== "string" || !token || token.length > 2048) return false;
  if (!secret) return false;
  try {
    const form = new URLSearchParams({ secret, response: token });
    if (remoteip) form.set("remoteip", remoteip);
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form, signal: AbortSignal.timeout(5000) });
    const result: unknown = await response.json();
    return response.ok && Boolean(result && typeof result === "object" && "success" in result && result.success === true);
  } catch { return false; }
}
