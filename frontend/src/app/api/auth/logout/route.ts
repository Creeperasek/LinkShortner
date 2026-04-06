import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.API_URL || "http://localhost:8080";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const nextResponse = NextResponse.json({ message: "Logout successful" });

  try {
    nextResponse.cookies.delete("session");
    nextResponse.cookies.set("token", "", { maxAge: 0, path: "/" });

    if (token) {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Cookie: `token=${token}`,
        },
      });
    }

    return nextResponse;
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
