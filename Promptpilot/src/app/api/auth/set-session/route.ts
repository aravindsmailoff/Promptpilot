import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    console.error('[SetSession] Missing token parameter');
    return NextResponse.redirect(new URL('/', request.url));
  }

  console.log('[SetSession] Setting session cookie from deep link');
  const response = NextResponse.redirect(new URL('/', request.url));

  // Set the next-auth.session-token cookie with same properties NextAuth uses
  response.cookies.set('next-auth.session-token', token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return response;
}
