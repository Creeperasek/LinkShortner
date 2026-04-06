import { NextResponse } from "next/server";
import { createSession } from "@/src/lib/auth";

const API_URL = process.env.API_URL || "http://localhost:3000";

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

    // data.user should have id and email
    await createSession(data.user.id.toString());

    // Extract the token cookie from the backend response
    const setCookieHeader = response.headers.get("set-cookie");

    const nextResponse = NextResponse.json({
      message: "Login successful",
      user: data.user,
    });

    if (setCookieHeader) {
      // Pass the backend token cookie along to the browser
      // Fastify sets "token=...; HttpOnly; ..."
      nextResponse.headers.set("set-cookie", setCookieHeader);
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
