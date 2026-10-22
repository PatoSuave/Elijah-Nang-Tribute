import assert from "node:assert/strict";
import test from "node:test";
import { fingerprintForIp, trustedClientIp } from "./rate-limit.ts";

test("production accepts only Cloudflare's trusted client-IP header", () => {
  const request = new Request("https://nangsoul.com/api/memorial/submissions", { headers: { "x-forwarded-for": "203.0.113.50", "x-real-ip": "198.51.100.20", "cf-connecting-ip": "203.0.113.51" } });
  assert.equal(trustedClientIp(request, "production"), "203.0.113.51");
  const spoofed = new Request("https://nangsoul.com", { headers: { "x-forwarded-for": "198.51.100.20" } });
  assert.equal(trustedClientIp(spoofed, "production"), null);
  assert.equal(trustedClientIp(new Request("https://nangsoul.com", { headers: { "x-real-ip": "198.51.100.20" } }), "production"), null);
  for (const ip of ["", "garbage", "203.0.113.51, 203.0.113.52", "127.0.0.1:1234"]) {
    assert.equal(trustedClientIp(new Request("https://nangsoul.com", { headers: { "cf-connecting-ip": ip } }), "production"), null);
  }
  assert.equal(trustedClientIp(new Request("https://nangsoul.com", { headers: { "cf-connecting-ip": "2001:db8::1" } }), "production"), "2001:db8::1");
});

test("only local development has a loopback fallback", () => {
  const local = new Request("http://127.0.0.1/api/memorial/submissions");
  assert.equal(trustedClientIp(local, "development"), "127.0.0.1");
  assert.equal(trustedClientIp(local), null);
  assert.equal(trustedClientIp(new Request("https://attacker.example"), "development"), null);
});

test("fingerprinting fails closed without an IP or salt", () => {
  assert.equal(fingerprintForIp(null, "salt"), null);
  assert.equal(fingerprintForIp("198.51.100.20", undefined), null);
  assert.match(fingerprintForIp("198.51.100.20", "salt") || "", /^[a-f0-9]{64}$/);
});
