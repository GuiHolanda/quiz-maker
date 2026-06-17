import type { NextAuthConfig } from 'next-auth';

const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

export default {
  providers: [],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      const isPublicRoute = publicRoutes.some((r) => pathname.startsWith(r)) || pathname.startsWith('/api/auth');

      if (isPublicRoute) return true;

      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
