import type { NextAuthConfig } from 'next-auth';

// Prefix-matched public routes. The homepage `/` is handled by an exact match
// in `authorized` to avoid matching every other path (startsWith('/') is always true).
const publicRoutePrefixes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/pricing'];

export default {
  providers: [],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      const isPublicRoute =
        pathname === '/' ||
        publicRoutePrefixes.some((r) => pathname.startsWith(r)) ||
        pathname.startsWith('/api/auth');

      if (isPublicRoute) return true;

      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
