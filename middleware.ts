import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Cache user roles to avoid repeated API calls (5 minute TTL)
const roleCache = new Map<string, { role: string | undefined; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health(.*)',
  '/',
  '/api/webhook(.*)', // Webhook endpoints
]);

// Define role-based route matchers
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)',
]);

const isStaffRoute = createRouteMatcher([
  '/ticketing(.*)',
  '/contractors(.*)',
  '/inventory(.*)',
  '/api/ticketing(.*)',
  '/api/contractors(.*)',
]);

// Simple edge-compatible logging
function edgeLog(level: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const log = {
    timestamp,
    level,
    message,
    ...data
  };

  if (process.env.NODE_ENV === 'development') {
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, data || '');
  } else {
    console.log(JSON.stringify(log));
  }
}

export default clerkMiddleware(async (auth, req) => {
  const startTime = Date.now();
  const { pathname } = req.nextUrl;

  // Skip static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|map)$/)
  ) {
    return NextResponse.next();
  }

  // Log API requests
  if (pathname.startsWith('/api/')) {
    edgeLog('info', 'API Request', {
      method: req.method,
      path: pathname,
      ip: req.ip || req.headers.get('x-forwarded-for'),
      userAgent: req.headers.get('user-agent')
    });
  }

  // Check if route requires authentication
  if (!isPublicRoute(req)) {
    const { userId, sessionClaims } = await auth();
    
    if (!userId) {
      // Redirect to sign-in if not authenticated
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Get user role from cache or fetch from Clerk API
    let userRole: string | undefined;
    const cached = roleCache.get(userId);

    if (cached && cached.expiry > Date.now()) {
      userRole = cached.role;
    } else {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        userRole = (user.publicMetadata as { role?: string })?.role;
        roleCache.set(userId, { role: userRole, expiry: Date.now() + CACHE_TTL });
      } catch (error) {
        edgeLog('error', 'Failed to fetch user role', { userId, error: String(error) });
      }
    }

    edgeLog('debug', 'Auth check', { userId, userRole, path: pathname });

    if (isAdminRoute(req) && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    if (isStaffRoute(req) && (!userRole || !['admin', 'staff', 'contractor'].includes(userRole))) {
      return NextResponse.json(
        { error: 'Unauthorized: Staff access required' },
        { status: 403 }
      );
    }
  }

  const response = NextResponse.next();
  response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
  
  // Log slow requests
  const responseTime = Date.now() - startTime;
  if (responseTime > 1000) {
    edgeLog('warn', 'Slow Request', {
      path: pathname,
      responseTime: `${responseTime}ms`
    });
  }
  
  return response;
}, {
  // Clerk middleware configuration
  debug: process.env.NODE_ENV === 'development',
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
