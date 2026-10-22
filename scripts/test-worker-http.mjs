import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";

// Execute the exact built production bundle with synthetic secrets, isolated
// in-memory D1, and a mocked outbound Turnstile service. No network or production
// binding is used; the application contains no test/bypass route or flag.
const origin = "https://nangsoul.test";
const secrets = {
  MEMORIAL_ENVIRONMENT: "production", MEMORIAL_PUBLIC_ORIGIN: origin,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "synthetic-public-key",
  TURNSTILE_SECRET_KEY: "synthetic-turnstile-secret",
  MEMORIAL_ADMIN_PASSWORD: "synthetic-admin-password",
  MEMORIAL_ADMIN_SESSION_SECRET: "synthetic-session-secret-for-local-tests-only",
  MEMORIAL_RATE_LIMIT_SALT: "synthetic-rate-salt-for-local-tests-only",
};
const options = {
  name: "nangsoul-http-test",
  modules: ["index.js", ...(await readdir("dist/server", { recursive: true })).filter((file) => file !== "index.js" && /\.(?:m?js)$/.test(file))].map((file) => ({ type: "ESModule", path: resolve("dist/server", file) })),
  modulesRoot: resolve("dist/server"),
  compatibilityDate: "2026-10-22", compatibilityFlags: ["nodejs_compat"],
  bindings: secrets, d1Databases: ["MEMORIAL_DB"],
  assets: { directory: resolve("dist/client"), binding: "ASSETS", run_worker_first: ["/*", "!/_next/static/*", "!/*/_next/static/*"], routerConfig: { has_user_worker: true } },
  outboundService: async (request) => {
    assert.equal(request.url, "https://challenges.cloudflare.com/turnstile/v0/siteverify");
    const form = await request.formData();
    assert.equal(form.get("secret"), secrets.TURNSTILE_SECRET_KEY);
    return Response.json({ success: form.get("response") === "synthetic-valid-token" });
  },
};
const runtime = new Miniflare(convertV4MiniflareOptions(options));
const db = await runtime.getD1Database("MEMORIAL_DB");
const fetch = (path, options) => runtime.dispatchFetch(`${origin}${path}`, options);
const submission = (message, ip = "203.0.113.5", overrides = {}) => ({
  method: "POST", headers: { origin, "content-type": "application/json", "cf-connecting-ip": ip },
  body: JSON.stringify({ displayName: "Synthetic visitor", location: "Test Lab", message, consent: true, website: "", turnstileToken: "synthetic-valid-token", ...overrides }),
});
let groups = 0;
const pass = (name) => { groups++; console.log(`PASS ${name}`); };
try {
  const emptyHealth = await fetch("/api/health");
  assert.equal(emptyHealth.status, 503, await emptyHealth.text());
  const schema = await readFile("migrations/d1/0001_memorial.sql", "utf8");
  await db.batch(schema.split(";").map((sql) => sql.trim()).filter(Boolean).map((sql) => db.prepare(sql)));
  assert.equal((await fetch("/api/health")).status, 200);
  const home = await fetch("/");
  assert.equal(home.status, 200);
  const html = await home.text();
  assert.match(html, /Nang Soul Archive/);
  assert.match(html, /synthetic-public-key/);
  for (const secret of [secrets.MEMORIAL_ADMIN_PASSWORD, secrets.MEMORIAL_ADMIN_SESSION_SECRET, secrets.MEMORIAL_RATE_LIMIT_SALT, secrets.TURNSTILE_SECRET_KEY]) assert.equal(html.includes(secret), false);
  assert.match(home.headers.get("content-security-policy"), /frame-ancestors 'none'/);
  assert.match(home.headers.get("content-security-policy"), /w\.soundcloud\.com/);
  assert.equal(home.headers.get("x-content-type-options"), "nosniff");
  assert.equal(home.headers.get("x-frame-options"), "DENY");
  assert.ok(home.headers.get("strict-transport-security"));
  assert.equal(home.headers.get("x-powered-by"), null);
  assert.equal((await fetch("/images/sakura-canopy.webp")).status, 200);
  assert.equal((await fetch("/images/sakura-petal.png")).status, 200);
  const cssFiles = await readdir("dist/client/_next/static/css");
  const css = await (await fetch(`/_next/static/css/${cssFiles[0]}`)).text();
  assert.match(css, /brightness\(1\.05\)/);
  pass("built Worker health, homepage, runtime public key, security headers, artwork and 5% brightness");

  for (const [path, finalStatus] of [
    ["/", 200],
    ["/admin/memorial?page=2&note=Elijah%20Nang&tag=one&tag=two&empty=", 200],
    ["/api/health?source=apex", 200],
    ["/images/sakura-canopy.webp?source=apex", 200],
    ["/unlisted/Elijah%20Nang?literal=a%2Bb&encoded=%26%3D", 404],
  ]) {
    const requested = new URL(`https://nangsoul.com${path}`);
    const redirect = await runtime.dispatchFetch(requested, { redirect: "manual" });
    assert.equal(redirect.status, 308, path);
    const destination = new URL(redirect.headers.get("location"));
    assert.equal(destination.origin, "https://www.nangsoul.com");
    assert.equal(destination.pathname, requested.pathname);
    assert.equal(destination.search, requested.search);
    assert.deepEqual([...destination.searchParams], [...requested.searchParams]);
    const followed = await runtime.dispatchFetch(destination, { redirect: "manual" });
    assert.equal(followed.status, finalStatus, path);
    assert.equal(followed.headers.get("location"), null);
    await followed.arrayBuffer();
  }
  for (const host of ["www.nangsoul.com", "nangsoul.squikyus.workers.dev", "nangsoul-staging.squikyus.workers.dev", "nangsoulXcom"]) {
    const response = await runtime.dispatchFetch(`https://${host}/`, { redirect: "manual", headers: { "x-forwarded-host": "nangsoul.com" } });
    assert.equal(response.status, 200, host);
    assert.equal(response.headers.get("location"), null);
    await response.arrayBuffer();
  }
  const httpApex = await runtime.dispatchFetch("http://nangsoul.com/?source=http", { redirect: "manual" });
  assert.equal(httpApex.status, 308);
  assert.equal(httpApex.headers.get("location"), "https://www.nangsoul.com/?source=http");
  const apexPost = await runtime.dispatchFetch("https://nangsoul.com/api/memorial/submissions?source=apex", { ...submission("apex must redirect before writing"), redirect: "manual" });
  assert.equal(apexPost.status, 308);
  assert.equal(apexPost.headers.get("location"), "https://www.nangsoul.com/api/memorial/submissions?source=apex");
  assert.equal((await db.prepare("SELECT count(*) AS count FROM memorial_messages").first()).count, 0);
  const apexStatic = await runtime.dispatchFetch(`https://nangsoul.com/_next/static/css/${cssFiles[0]}`, { redirect: "manual" });
  assert.equal(apexStatic.status, 200);
  assert.equal(apexStatic.headers.get("location"), null);
  assert.match(await apexStatic.text(), /brightness\(1\.05\)/);
  pass("apex 308 preserves path/query, redirects before writes, and leaves www/Workers hosts without loops");

  const invalidOrigin = submission("cross-origin"); invalidOrigin.headers.origin = "https://attacker.test";
  assert.equal((await fetch("/api/memorial/submissions", invalidOrigin)).status, 403);
  assert.equal((await fetch("/api/memorial/submissions", submission("bad token", "203.0.113.5", { turnstileToken: "invalid" }))).status, 400);
  assert.equal((await fetch("/api/memorial/submissions", submission("honeypot", "203.0.113.5", { website: "spam" }))).status, 400);
  assert.equal((await fetch("/api/memorial/submissions", submission("no consent", "203.0.113.5", { consent: false }))).status, 400);
  assert.equal((await fetch("/api/memorial/submissions", submission("x".repeat(9000)))).status, 413);
  const noIp = submission("spoof"); delete noIp.headers["cf-connecting-ip"]; noIp.headers["x-real-ip"] = "198.51.100.1"; noIp.headers["x-forwarded-for"] = "198.51.100.2";
  // Miniflare injects its own edge IP when absent, so invalid CF input is the
  // controlled missing-trust case. Unit tests cover forwarded-only requests.
  noIp.headers["cf-connecting-ip"] = "invalid-ip";
  assert.equal((await fetch("/api/memorial/submissions", noIp)).status, 503);
  assert.equal((await db.prepare("SELECT count(*) AS count FROM memorial_messages").first()).count, 0);
  pass("origin, Turnstile, consent, honeypot, byte limit and trusted-IP rejections do not write");

  assert.equal((await fetch("/api/memorial/submissions", submission("Message one"))).status, 201);
  assert.equal((await fetch("/api/memorial/submissions", submission("Message one"))).status, 409);
  assert.equal((await fetch("/api/memorial/submissions", submission("Message two"))).status, 201);
  assert.equal((await fetch("/api/memorial/submissions", submission("Message three"))).status, 201);
  const limited = await fetch("/api/memorial/submissions", submission("Message four"));
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get("retry-after")) > 0);
  assert.equal((await (await fetch("/api/memorial/messages")).json()).messages.length, 0);
  pass("submission responses, duplicate suppression, quota retry header, and pending privacy");

  const login = (password, loginOrigin = origin) => fetch("/api/admin/login", { method: "POST", headers: { origin: loginOrigin, "content-type": "application/json" }, body: JSON.stringify({ password }) });
  assert.equal((await login(secrets.MEMORIAL_ADMIN_PASSWORD, "https://attacker.test")).status, 403);
  assert.equal((await login("wrong")).status, 401);
  const loggedIn = await login(secrets.MEMORIAL_ADMIN_PASSWORD);
  assert.equal(loggedIn.status, 200);
  const setCookie = loggedIn.headers.get("set-cookie");
  assert.match(setCookie, /HttpOnly/i); assert.match(setCookie, /Secure/i); assert.match(setCookie, /SameSite=Strict/i);
  const cookie = setCookie.split(";")[0];
  const session = cookie.slice(cookie.indexOf("=") + 1);
  const csrf = createHmac("sha256", secrets.MEMORIAL_ADMIN_SESSION_SECRET).update(`csrf.${session}`).digest("base64url");
  const adminResponse = await fetch("/admin/memorial", { headers: { cookie } });
  assert.match(adminResponse.headers.get("cache-control"), /no-store/);
  const adminHtml = await adminResponse.text();
  assert.match(adminHtml, /Message one/);
  assert.match(adminHtml, new RegExp(csrf));
  const anonymousHtml = await (await fetch("/admin/memorial")).text();
  assert.equal(anonymousHtml.includes("Message one"), false);
  const pending = await db.prepare("SELECT id FROM memorial_messages WHERE message = 'Message one'").first();
  const patch = (headers, status = "approved") => fetch(`/api/admin/memorial/${pending.id}`, { method: "PATCH", headers: { origin, "content-type": "application/json", ...headers }, body: JSON.stringify({ status }) });
  assert.equal((await patch({})).status, 401);
  assert.equal((await patch({ cookie: `${cookie}.unexpected`, "x-csrf-token": csrf })).status, 401);
  assert.equal((await patch({ cookie: `${cookie.slice(0, -1)}!`, "x-csrf-token": csrf })).status, 401);
  assert.equal((await patch({ cookie })).status, 403);
  assert.equal((await patch({ cookie, "x-csrf-token": "wrong" })).status, 403);
  assert.equal((await patch({ cookie, "x-csrf-token": csrf, origin: "https://attacker.test" })).status, 403);
  assert.equal((await patch({ cookie, "x-csrf-token": csrf }, "archived")).status, 400);
  assert.equal((await patch({ cookie, "x-csrf-token": csrf })).status, 200);
  assert.equal((await patch({ cookie, "x-csrf-token": csrf }, "rejected")).status, 409);
  const publicResponse = await fetch("/api/memorial/messages");
  assert.equal(publicResponse.headers.get("cache-control"), "no-store");
  const published = await publicResponse.json();
  assert.equal(published.messages.length, 1);
  assert.deepEqual(Object.keys(published.messages[0]).sort(), ["approvedAt", "displayName", "location", "message"]);
  pass("admin sign-in, private queue, signed cookie, CSRF, pending-only approval and public message contract");

  await runtime.setOptions(convertV4MiniflareOptions({ ...options, bindings: { ...secrets, MEMORIAL_PUBLIC_ORIGIN: "" } }));
  assert.equal((await login(secrets.MEMORIAL_ADMIN_PASSWORD)).status, 403);
  assert.equal((await fetch("/api/memorial/submissions", submission("no origin"))).status, 403);
  await runtime.setOptions(convertV4MiniflareOptions({ ...options, bindings: { ...secrets, MEMORIAL_ADMIN_SESSION_SECRET: "", MEMORIAL_RATE_LIMIT_SALT: "" } }));
  assert.equal((await login(secrets.MEMORIAL_ADMIN_PASSWORD)).status, 503);
  assert.equal((await fetch("/api/memorial/submissions", submission("no salt"))).status, 503);
  await runtime.setOptions(convertV4MiniflareOptions({ ...options, bindings: { ...secrets, TURNSTILE_SECRET_KEY: "" } }));
  assert.equal((await fetch("/api/memorial/submissions", submission("no Turnstile secret"))).status, 400);
  pass("missing production origin, session secret, rate salt and Turnstile secret all fail closed");

  console.log(`Built Worker HTTP checks passed (${groups} groups).`);
} finally { await runtime.dispose(); }
