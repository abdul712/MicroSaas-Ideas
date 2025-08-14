import { withAuth } from 'next-auth/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { ratelimit } from '@/lib/rate-limit'

export default withAuth(
  async function middleware(req: NextRequest) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Rate limiting for API routes
    if (pathname.startsWith('/api/')) {
      try {
        const identifier = req.ip ?? '127.0.0.1'
        const { success, limit, reset, remaining } = await ratelimit.limit(identifier)

        const response = success 
          ? NextResponse.next() 
          : NextResponse.json(
              { error: 'Too many requests' },
              { status: 429 }
            )

        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', limit.toString())
        response.headers.set('X-RateLimit-Remaining', remaining.toString())
        response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString())

        if (!success) {
          return response
        }
      } catch {
        // If rate limiting fails, continue without blocking
        console.warn('Rate limiting failed, continuing without rate limit')
      }
    }

    // Protected routes
    const protectedPaths = ['/dashboard', '/expenses', '/receipts', '/reports', '/settings']
    const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

    if (isProtectedPath) {
      if (!token) {
        const url = new URL('/auth/signin', req.url)
        url.searchParams.set('callbackUrl', req.url)
        return NextResponse.redirect(url)
      }

      // Check if organization subscription is active
      if (token.subscriptionTier && token.subscriptionTier !== 'ACTIVE') {
        return NextResponse.redirect(new URL('/billing/suspended', req.url))
      }
    }

    // Admin-only routes
    const adminPaths = ['/admin', '/dashboard/admin']
    const isAdminPath = adminPaths.some(path => pathname.startsWith(path))

    if (isAdminPath && token?.role !== 'ADMIN' && token?.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    // Super admin only routes
    const superAdminPaths = ['/super-admin']
    const isSuperAdminPath = superAdminPaths.some(path => pathname.startsWith(path))

    if (isSuperAdminPath && token?.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    // Security headers
    const response = NextResponse.next()
    
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
    
    // CSP header
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://vercel.live;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https:;
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim()
    
    response.headers.set('Content-Security-Policy', cspHeader)

    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow public routes
        const publicRoutes = ['/', '/auth', '/api/auth', '/api/health', '/pricing', '/about']
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true
        }

        // Require authentication for protected routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public|icons|manifest.json).*)',
  ],
}