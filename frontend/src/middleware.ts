  import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // If we wanted true Next.js server-side protection we'd decode JWT here
  // But since we are heavily relying on localStorage, we can do client-side protection
  // However, we can at least ensure we don't block static files
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
