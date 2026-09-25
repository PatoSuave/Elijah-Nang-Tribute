import { NextResponse } from "next/server";
import { approvedMessages } from "@/lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const raw = Number(new URL(request.url).searchParams.get("offset") || "0");
  const offset = Number.isInteger(raw) && raw >= 0 && raw <= 10_000 ? raw : 0;
  try {
    const result = await approvedMessages(offset);
    return NextResponse.json({ messages: result.messages.map(({ display_name, location, message, approved_at }) => ({ displayName: display_name, location, message, approvedAt: approved_at })), hasMore: result.hasMore, nextOffset: offset + result.messages.length }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Messages are temporarily unavailable." }, { status: 503 });
  }
}
