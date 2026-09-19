import assert from "node:assert/strict";
import test from "node:test";
import { adminPaging, isValidStatusTransition, validateMemorialSubmission } from "./memorial.ts";

test("submission validation enforces consent and message limits", () => {
  assert.equal(validateMemorialSubmission({ displayName: "A", message: "A memory", consent: true }).ok, true);
  assert.equal(validateMemorialSubmission({ displayName: "A", message: "x".repeat(1001), consent: true }).ok, false);
  assert.equal(validateMemorialSubmission({ displayName: "A", message: "A memory", consent: false }).ok, false);
});

test("only pending messages can transition to a moderation outcome", () => {
  assert.equal(isValidStatusTransition("pending", "approved"), true);
  assert.equal(isValidStatusTransition("pending", "rejected"), true);
  assert.equal(isValidStatusTransition("approved", "rejected"), false);
});

test("admin paging bounds query construction", () => {
  assert.deepEqual(adminPaging(-1, 100), { offset: 0, limit: 25 });
  assert.deepEqual(adminPaging(10_000, 0), { offset: 9_975, limit: 25 });
});
