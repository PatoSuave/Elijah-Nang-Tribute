import { NextResponse } from "next/server";
import { COOKIE, createAdminSession, adminAuthConfigured, maxAge } from "@/lib/admin-auth";
import { isSameOrigin } from "@/lib/request-security";
import { createHash, timingSafeEqual } from "crypto";
import { memorialConfig } from "@/lib/runtime-config";
import { readJsonBody, RequestBodyError } from "@/lib/request-body";

const same = (a: string, b: string) => timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
export async function POST(request: Request) {
  const config = memorialConfig();
  if (!isSameOrigin(request, config.environment, config.publicOrigin)) return NextResponse.json({ error: "This request could not be verified." }, { status: 403 });
  if (!adminAuthConfigured()) return NextResponse.json({ error: "Admin authentication is not configured." }, { status: 503 });
  let password = "";
  try { const body = await readJsonBody(request); password = body && typeof body === "object" && "password" in body ? String(body.password || "") : ""; } catch (error) { return NextResponse.json({ error: "Invalid request." }, { status: error instanceof RequestBodyError ? error.status : 400 }); }
  if (!same(password, config.adminPassword)) return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE, createAdminSession(), { httpOnly: true, sameSite: "strict", secure: config.environment === "production", path: "/", maxAge });
  return response;
}
