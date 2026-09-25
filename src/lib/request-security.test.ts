import assert from "node:assert/strict";
import test from "node:test";
import { isSameOrigin } from "./request-security.ts";

function request(origin: string, options: { url?: string; host?: string } = {}) {
  const headers = new Headers({ origin });
  if (options.host) headers.set("host", options.host);
  return new Request(options.url || "http://internal-service:3000/api/memorial/submissions", { headers });
}

function withPublicOrigin(value: string | undefined, run: () => void) {
  const previous = process.env.MEMORIAL_PUBLIC_ORIGIN;
  if (value === undefined) delete process.env.MEMORIAL_PUBLIC_ORIGIN;
  else process.env.MEMORIAL_PUBLIC_ORIGIN = value;
  try { run(); } finally {
    if (previous === undefined) delete process.env.MEMORIAL_PUBLIC_ORIGIN;
    else process.env.MEMORIAL_PUBLIC_ORIGIN = previous;
  }
}

test("production accepts the configured public origin despite an internal request URL", () => {
  withPublicOrigin("https://nangsoul-web-staging.up.railway.app", () => {
    assert.equal(isSameOrigin(request("https://nangsoul-web-staging.up.railway.app"), "production"), true);
  });
});

test("production rejects a different public origin", () => {
  withPublicOrigin("https://nangsoul-web-staging.up.railway.app", () => {
    assert.equal(isSameOrigin(request("https://attacker.example"), "production"), false);
  });
});

test("production fails closed without a configured public origin", () => {
  withPublicOrigin(undefined, () => {
    assert.equal(isSameOrigin(request("https://nangsoul-web-staging.up.railway.app"), "production"), false);
  });
});

test("development honors a validated direct Host header when Next normalizes the request URL", () => {
  const local = request("http://127.0.0.1:3107", { url: "http://localhost:3107/api/memorial/submissions", host: "127.0.0.1:3107" });
  assert.equal(isSameOrigin(local, "development"), true);
});

test("development rejects a mismatched Host or an invalid Host header", () => {
  const mismatched = request("http://127.0.0.1:3107", { url: "http://localhost:3107/api/memorial/submissions", host: "localhost:3107" });
  const invalid = request("http://127.0.0.1:3107", { host: "127.0.0.1:3107/not-a-host" });
  assert.equal(isSameOrigin(mismatched, "development"), false);
  assert.equal(isSameOrigin(invalid, "development"), false);
});

test("development fails closed when Host is present but invalid or empty", () => {
  const invalid = request("http://localhost:3107", { url: "http://localhost:3107/api/memorial/submissions", host: "127.0.0.1:3107/not-a-host" });
  const empty = new Request("http://localhost:3107/api/memorial/submissions", { headers: { origin: "http://localhost:3107", host: "" } });
  assert.equal(isSameOrigin(invalid, "development"), false);
  assert.equal(isSameOrigin(empty, "development"), false);
});

test("development falls back to the request URL when Host is absent", () => {
  assert.equal(isSameOrigin(request("http://localhost:3107", { url: "http://localhost:3107/api/memorial/submissions" }), "development"), true);
});

test("production ignores a spoofed Host header and still requires the configured origin", () => {
  withPublicOrigin("https://nangsoul-web-staging.up.railway.app", () => {
    const spoofed = request("https://attacker.example", { host: "attacker.example" });
    const configured = request("https://nangsoul-web-staging.up.railway.app", { host: "attacker.example" });
    assert.equal(isSameOrigin(spoofed, "production"), false);
    assert.equal(isSameOrigin(configured, "production"), true);
  });
});
