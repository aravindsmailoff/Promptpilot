import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Public local-service proxy routes & live data endpoints — no auth needed
  const publicPaths = [
    '/api/context/whatsapp/status',
    '/api/context/whatsapp/chats',
    '/api/context/stats',
    '/api/cofounder',
  ];
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Bypass authentication for internal calls using NEXTAUTH_SECRET as a bearer token
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.NEXTAUTH_SECRET;
  if (authHeader && expectedSecret && authHeader === `Bearer ${expectedSecret}`) {
    return NextResponse.next();
  }

  // Protect /api endpoints excluding authentication endpoints
  if (
    (pathname.startsWith('/api/submissions') ||
     pathname.startsWith('/api/settings') ||
     pathname.startsWith('/api/context')) &&
    !pathname.startsWith('/api/auth')
  ) {
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized. Please sign in.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/submissions/:path*',
    '/api/settings/:path*',
    '/api/context/:path*',
    '/api/cofounder/:path*',
  ],
};
