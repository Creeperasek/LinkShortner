import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';

const API_URL = process.env.API_URL || 'http://localhost:8080';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const cookieStore = await cookies();
  const headersList = await headers();
  let token = cookieStore.get('token')?.value;

  if (!token) {
    const rawCookie = headersList.get('cookie') || '';
    const match = rawCookie.match(/token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const response = await fetch(`${API_URL}/links/${slug}/history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cookie': `token=${token}`
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ message: data.error || 'Failed to fetch history' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Fetch history error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
