import NextAuth from 'next-auth';
import authConfig from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|messages/.*\\.properties|api/webhooks/lemonsqueezy|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
