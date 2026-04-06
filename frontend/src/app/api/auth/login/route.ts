import { NextResponse } from "next/server";
import { encrypt } from "../../../../lib/session";

const API_URL = process.env.API_URL || "http://localhost:8080";

export async function GET() {
  return NextResponse.json({ message: "Login API is working" });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.error || "Login failed" },
        { status: response.status },
      );
    }

    const nextResponse = NextResponse.json({
      message: "Login successful",
      user: data.user,
    });

    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session = await encrypt({ userId: data.user.id.toString(), expires });
    nextResponse.cookies.set("session", session, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      expires,
    });

    if (data.token) {
      nextResponse.cookies.set("token", data.token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return nextResponse;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
