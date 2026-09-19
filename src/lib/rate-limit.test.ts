import assert from "node:assert/strict";
import test from "node:test";
import { fingerprintForIp, trustedClientIp } from "./rate-limit.ts";

test("production accepts only Railway's trusted client-IP header", () => {
  const request = new Request("https://nangsoul.com/api/memorial/submissions", { headers: { "x-forwarded-for": "203.0.113.50", "x-real-ip": "203.0.113.51" } });
  assert.equal(trustedClientIp(request, "production"), "203.0.113.51");
  const spoofed = new Request("https://nangsoul.com", { headers: { "x-forwarded-for": "198.51.100.20" } });
  assert.equal(trustedClientIp(spoofed, "production"), null);
});

test("fingerprinting fails closed without an IP or salt", () => {
  assert.equal(fingerprintForIp(null, "salt"), null);
  assert.equal(fingerprintForIp("198.51.100.20", undefined), null);
  assert.match(fingerprintForIp("198.51.100.20", "salt") || "", /^[a-f0-9]{64}$/);
});
