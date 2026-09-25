import { NextResponse } from "next/server";
import { validateMemorialSubmission } from "@/lib/memorial";
import { fingerprintForIp, trustedClientIp } from "@/lib/rate-limit";
import { isSameOrigin, verifyTurnstile } from "@/lib/request-security";
import { submitPendingMessage } from "@/lib/database";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "This request could not be verified." }, { status: 403 });
  if (!request.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: "Invalid request format." }, { status: 415 });
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 8_000) return NextResponse.json({ error: "Submission is too large." }, { status: 413 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request format." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid request format." }, { status: 400 });
  const submission = body as Record<string, unknown>;
  if (typeof submission.website === "string" && submission.website.trim()) return NextResponse.json({ error: "We could not receive this message." }, { status: 400 });
  const parsed = validateMemorialSubmission(submission);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const remoteIp = trustedClientIp(request);
  const key = fingerprintForIp(remoteIp);
  if (!key) return NextResponse.json({ error: "This request could not be safely verified." }, { status: 503 });
  if (!(await verifyTurnstile(submission.turnstileToken, remoteIp ?? undefined))) return NextResponse.json({ error: "Please complete the verification and try again." }, { status: 400 });
  try {
    const limit = await submitPendingMessage(parsed.value, key);
    if (limit.duplicate) return NextResponse.json({ error: "We already received this message. Please avoid sending it again." }, { status: 409 });
    if (!limit.allowed) return NextResponse.json({ error: "Please wait before sending another message.", retryAfter: limit.retry_after_seconds }, { status: 429, headers: { "Retry-After": String(limit.retry_after_seconds) } });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "We could not save your message right now. Please try again later." }, { status: 503 });
  }
}
