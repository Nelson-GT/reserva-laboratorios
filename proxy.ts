import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'fallback-dev-secret-change-in-production'
);

const PUBLIC_PATHS = ['/login', '/register', '/verify-otp'];
const ADMIN_PATHS = ['/admin', '/users'];
const PROFESSOR_PATHS = ['/reservations/new'];
const STUDENT_PATHS = ['/computers'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;

    if (ADMIN_PATHS.some((p) => pathname.startsWith(p)) && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (
      PROFESSOR_PATHS.some((p) => pathname.startsWith(p)) &&
      role !== 'professor' &&
      role !== 'admin'
    ) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (
      STUDENT_PATHS.some((p) => pathname.startsWith(p)) &&
      role !== 'student' &&
      role !== 'admin'
    ) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.userId as string);
    response.headers.set('x-user-role', role);
    return response;
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('session');
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
