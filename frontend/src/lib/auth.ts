import { cookies } from 'next/headers';
import { encrypt } from './session';

export async function createSession(userId: string) {
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const session = await encrypt({ userId, expires });

    const cookieStore = await cookies();
    cookieStore.set('session', session, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        expires,
    });
}