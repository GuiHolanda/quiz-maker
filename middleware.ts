import NextAuth from 'next-auth';

import authConfig from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // robots.txt and sitemap.xml must be excluded: without them the auth callback treats
  // both as protected routes and answers Googlebot with a 307 to /login, so the crawler
  // never reads the crawl rules or the URL list. They carry no user data.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|messages/.*\\.properties|api/webhooks/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
