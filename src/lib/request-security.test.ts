import assert from "node:assert/strict";
import test from "node:test";
import { isSameOrigin } from "./request-security.ts";

function request(origin: string) {
  return new Request("http://internal-service:3000/api/memorial/submissions", { headers: { origin } });
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
