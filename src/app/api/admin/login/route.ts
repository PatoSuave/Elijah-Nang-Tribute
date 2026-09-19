import { NextResponse } from "next/server";
import { COOKIE, createAdminSession, adminAuthConfigured, maxAge } from "@/lib/admin-auth";
import { isSameOrigin } from "@/lib/request-security";
import { timingSafeEqual } from "crypto";

const same = (a: string, b: string) => { const left = Buffer.from(a); const right = Buffer.from(b); return left.length === right.length && timingSafeEqual(left, right); };
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "This request could not be verified." }, { status: 403 });
  if (!adminAuthConfigured()) return NextResponse.json({ error: "Admin authentication is not configured." }, { status: 503 });
  let password = "";
  try { password = String((await request.json()).password || ""); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!same(password, process.env.MEMORIAL_ADMIN_PASSWORD!)) return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE, createAdminSession(), { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge });
  return response;
}
