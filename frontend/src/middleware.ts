import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host');
  
  // Railway 도메인으로 접속 시 pmms.info로 강제 리다이렉트
  if (host && host.includes('railway.app')) {
    const url = request.nextUrl.clone();
    url.host = 'pmms.info';
    url.protocol = 'https:';
    
    return NextResponse.redirect(url, 301); // 영구 리다이렉트
  }
  
  return NextResponse.next();
}

// 모든 경로에 적용
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
