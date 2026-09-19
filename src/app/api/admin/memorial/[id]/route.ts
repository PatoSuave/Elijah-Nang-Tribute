import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE, validAdminSession, validCsrf } from "@/lib/admin-auth";
import { isSameOrigin } from "@/lib/request-security";
import { moderateMessage } from "@/lib/database";

export async function PATCH(request: Request, context: RouteContext<"/api/admin/memorial/[id]">) {
  const session = (await cookies()).get(COOKIE)?.value;
  if (!validAdminSession(session)) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isSameOrigin(request) || !validCsrf(session, request.headers.get("x-csrf-token"))) return NextResponse.json({ error: "This request could not be verified." }, { status: 403 });
  const { id } = await context.params;
  let status: unknown;
  try { status = (await request.json()).status; } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (status !== "approved" && status !== "rejected") return NextResponse.json({ error: "Invalid moderation action." }, { status: 400 });
  try { await moderateMessage(id, status); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "This message could not be updated. It may already have been reviewed." }, { status: 409 }); }
}
