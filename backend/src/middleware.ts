import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

// Only protect certain paths
const protectedPaths = [
  '/api/audits',
  '/api/excel/upload',
  '/api/excel/analyze',
  '/api/upload',
  '/api/subscription',
  '/api/create-checkout-session',
  '/api/subscription-status',
  '/api/cancel-subscription',
  '/api/webhook',
];

// Define allowed origins
const allowedOrigins = [
  'https://auditmyfile.com',
  'https://www.auditmyfile.com',
  'http://localhost:3000'
];

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const authHeader = request.headers.get('authorization');
  const requestOrigin = request.headers.get('origin');
  
  // Determine if the origin is allowed
  let origin = 'https://auditmyfile.com'; // Default fallback
  if (requestOrigin) {
    if (allowedOrigins.includes(requestOrigin)) {
      origin = requestOrigin;
    } else {
      console.log('[Middleware] Unknown origin:', requestOrigin);
    }
  }
  
  // Log the auth header for debugging
  console.log('[Middleware] Request method:', request.method);
  console.log('[Middleware] Request URL:', request.nextUrl.pathname);
  console.log('[Middleware] Auth header present:', !!authHeader);
  console.log('[Middleware] Origin:', origin);
  
  // Ensure the authorization header is properly passed through
  if (authHeader) {
    requestHeaders.set('authorization', authHeader);
  }
  
  // Add CORS headers for API routes
  if (request.method === 'OPTIONS') {
    console.log('[Middleware] Handling OPTIONS request for', request.nextUrl.pathname);
    
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  // For actual requests, add appropriate CORS headers
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));
  
  // Only enforce authorization on protected paths that aren't OPTIONS requests
  if (isProtectedPath && request.method !== 'OPTIONS') {
    // Check for valid authorization header format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized', message: 'Authentication token is required' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }
    
    // Token validation will be done in the route handlers
  }
  
  return response;
}

// Configure the paths that should trigger this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes that must be public)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 