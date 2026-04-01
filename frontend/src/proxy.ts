import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const pathname = request.nextUrl.pathname;

  if (pathname == "/") {
    if (session) {
      return NextResponse.redirect(new URL("/user", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!session && pathname.startsWith("/user")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
