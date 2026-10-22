import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const destination = new URL(request.url);
  if (destination.hostname !== "nangsoul.com") return NextResponse.next();

  // vinext config redirects omit query strings for absolute destinations.
  // Changing only the origin here preserves the original path and query text.
  destination.protocol = "https:";
  destination.hostname = "www.nangsoul.com";
  destination.port = "";
  return NextResponse.redirect(destination, 308);
}
