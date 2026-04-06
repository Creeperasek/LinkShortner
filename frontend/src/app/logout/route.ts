import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || 'http://localhost:3000';

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  try {
    // Clear frontend cookies
    cookieStore.delete('session');
    cookieStore.delete('token');

    // Inform backend (optional, but good practice)
    if (token) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          Cookie: `token=${token}`,
        },
      });
    }

    return NextResponse.json({ message: 'Logout successful' });
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
