import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const token = request.cookies.get("token")?.value;
  const pathname = request.nextUrl.pathname;

  if (pathname === "/") {
    if (session || token) {
      return NextResponse.redirect(new URL("/user", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Block route penetration if auth artifacts are wholly missing
  if ((!session && !token) && pathname.startsWith("/user")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}