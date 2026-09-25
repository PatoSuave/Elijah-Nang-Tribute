import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE, validAdminSession, validCsrf } from "@/lib/admin-auth";
import { isSameOrigin } from "@/lib/request-security";
import { isMemorialMessageId, moderateMessage } from "@/lib/database";

export async function PATCH(request: Request, context: RouteContext<"/api/admin/memorial/[id]">) {
  const session = (await cookies()).get(COOKIE)?.value;
  if (!validAdminSession(session)) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isSameOrigin(request) || !validCsrf(session, request.headers.get("x-csrf-token"))) return NextResponse.json({ error: "This request could not be verified." }, { status: 403 });
  const { id } = await context.params;
  if (!isMemorialMessageId(id)) return NextResponse.json({ error: "Invalid message." }, { status: 400 });
  let status: unknown;
  try { status = (await request.json()).status; } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (status !== "approved" && status !== "rejected") return NextResponse.json({ error: "Invalid moderation action." }, { status: 400 });
  try {
    const updated = await moderateMessage(id, status);
    if (!updated) return NextResponse.json({ error: "This message may already have been reviewed." }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "This message could not be updated right now. Please try again." }, { status: 503 });
  }
}
