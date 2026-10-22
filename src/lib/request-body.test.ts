import assert from "node:assert/strict";
import test from "node:test";
import { readJsonBody, RequestBodyError } from "./request-body.ts";

test("JSON parsing bounds actual bytes without trusting Content-Length", async () => {
  assert.deepEqual(await readJsonBody(new Request("https://example.test", { method: "POST", body: '{"message":"🌸"}' })), { message: "🌸" });
  const large = new Request("https://example.test", { method: "POST", body: JSON.stringify({ message: "🌸".repeat(3000) }) });
  await assert.rejects(readJsonBody(large), (error) => error instanceof RequestBodyError && error.status === 413);
  await assert.rejects(readJsonBody(new Request("https://example.test", { method: "POST", body: "bad JSON" })), (error) => error instanceof RequestBodyError && error.status === 400);
});
