import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter } from '@/lib/validation';
import { getClientIP, sanitizeLogData } from '@/lib/security';

// レート制限インスタンス
const rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute
const apiRateLimiter = new RateLimiter(30, 60000); // 30 API requests per minute

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIP = getClientIP(request);
  
  // セキュリティヘッダー設定
  const response = NextResponse.next();
  
  // CSP (Content Security Policy)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "connect-src 'self' https://api.anthropic.com https://api.line.me https://*.googleapis.com; " +
    "frame-ancestors 'none'"
  );
  
  // セキュリティヘッダー
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS (本番環境のみ)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // API ルートに対するレート制限
  if (pathname.startsWith('/api/')) {
    if (!apiRateLimiter.isAllowed(clientIP)) {
      console.warn(`API Rate limit exceeded for IP: ${clientIP}`, {
        path: pathname,
        timestamp: new Date().toISOString(),
        userAgent: sanitizeLogData(request.headers.get('user-agent'))
      });
      
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests' }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        }
      );
    }
    
    // APIキーの検証（Claude, LINE API用）
    if (pathname.startsWith('/api/claude') || pathname.startsWith('/api/line')) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader && pathname !== '/api/line/webhook') {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  }
  
  // 認証が必要なページへのアクセス制御
  if (pathname.startsWith('/dashboard')) {
    if (!rateLimiter.isAllowed(clientIP)) {
      return new NextResponse(
        'Too many requests',
        { status: 429 }
      );
    }
  }
  
  // ログ記録（機密情報は除外）
  if (process.env.NODE_ENV === 'production') {
    console.log('Request:', {
      method: request.method,
      path: pathname,
      ip: clientIP,
      userAgent: sanitizeLogData(request.headers.get('user-agent')),
      timestamp: new Date().toISOString()
    });
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}