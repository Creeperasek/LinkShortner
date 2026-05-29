import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';

const API_URL = process.env.API_URL || 'http://localhost:8080';

async function getAuthToken() {
  const cookieStore = await cookies();
  let token = cookieStore.get('token')?.value;

  // Fallback: Check raw headers if NextJS cookie proxy fails to initialize
  if (!token) {
    const headersList = await headers();
    const rawCookie = headersList.get('cookie') || '';
    const match = rawCookie.match(/(?:^|; )token=([^;]*)/);
    if (match && match[1]) {
      token = decodeURIComponent(match[1]);
    }
  }
  return token;
}

export async function GET() {
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json(
      { message: 'Unauthorized: Token missing in NextJS layer' }, 
      { status: 401 }
    );
  }

  try {
    // Server-to-server call down to Fastify container
    const response = await fetch(`${API_URL}/links`, {
      method: 'GET',
      headers: {
        // Forward the bearer token directly to the backend API request
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        // Also forward the cookie explicitly so Fastify plugins see it
        'Cookie': `token=${token}`
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { message: data.error || 'Failed to fetch links' }, 
        { status: response.status }
      );
    }
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Fetch links error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { url, expiresAt, customSlug } = body;

    let backendUrl = `${API_URL}/links`;
    if (customSlug) {
      backendUrl = `${API_URL}/links/custom/${customSlug}`;
    }

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cookie': `token=${token}`
      },
      body: JSON.stringify({ url, expiresAt }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { message: data.error || 'Failed to create link' }, 
        { status: response.status }
      );
    }
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Create link error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
