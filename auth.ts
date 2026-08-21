import NextAuth, { CredentialsSignin, DefaultSession } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

import authConfig from './auth.config';

import { prisma } from '@/lib/prisma';
import { REFERRAL_CODE_COOKIE_KEY, UTM_COOKIE_KEY } from '@/config/constants';
import { generateUniqueReferralCode } from '@/lib/referral-code';
import { parseUtmCookie } from '@/lib/utm';

class EmailNotVerifiedError extends CredentialsSignin {
  code = 'EMAIL_NOT_VERIFIED';
}

declare module 'next-auth' {
  interface Session {
    user: { id: string; plan: string } & DefaultSession['user'];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  // JWT expires after 8 hours of absolute time. Combined with the client-side
  // inactivity timer (30 min), the effective idle timeout is 30 min while the
  // hard maximum per login is 8 hours.
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (typeof credentials?.email !== 'string' || typeof credentials?.password !== 'string') return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        console.log(
          '[authorize] user found:',
          !!user,
          '| hasPassword:',
          !!user?.password,
          '| emailVerified:',
          !!user?.emailVerified
        );

        if (!user?.password) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);

        console.log('[authorize] passwordValid:', valid);

        if (!valid) return null;

        if (!user.emailVerified) throw new EmailNotVerifiedError();

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
    Google({ allowDangerousEmailAccountLinking: true }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) token.sub = user.id;

      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
        let dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { plan: true, sprintExpiresAt: true },
        });

        // Sprint is the only plan with a fixed term — every other plan is indefinite until
        // canceled, so this is the one place that needs to expire it. Self-heals on the
        // first session read past expiry (same pattern as QuotaService's 30-day period
        // reset): this callback runs at the top of every authenticated request, so by the
        // time any other code path reads the user's plan, the downgrade has already landed.
        if (dbUser?.plan === 'sprint' && dbUser.sprintExpiresAt && dbUser.sprintExpiresAt <= new Date()) {
          dbUser = await prisma.user.update({
            where: { id: token.sub },
            data: { plan: 'free', sprintExpiresAt: null },
            select: { plan: true, sprintExpiresAt: true },
          });
        }

        session.user.plan = dbUser?.plan ?? 'free';
      }

      return session;
    },
  },
  events: {
    // Only fires for adapter-created users, i.e. Google sign-ups — credentials signups
    // are created directly by RegisterService, which sets referralCode/referredByUserId
    // itself and never touches this adapter path. Wrapped so a referral hiccup can never
    // block a Google sign-up whose User row already exists by this point; a code left
    // null here is lazily backfilled later by ReferralService.getOrCreateReferralCode.
    async createUser({ user }) {
      if (!user.id) return;

      try {
        const referralCode = await generateUniqueReferralCode(async (candidate) => {
          const existing = await prisma.user.findUnique({
            where: { referralCode: candidate },
            select: { id: true },
          });

          return !!existing;
        });

        // Set client-side right before redirecting to Google (RegisterForm.tsx), since
        // that's the only way a `?ref=` code survives the round-trip back to this handler.
        const ref = (await cookies()).get(REFERRAL_CODE_COOKIE_KEY)?.value;
        const referrer = ref
          ? await prisma.user.findUnique({ where: { referralCode: ref.toUpperCase() }, select: { id: true } })
          : null;

        // Unlike the ref cookie, this one is set well before the OAuth redirect (30-day
        // window, written by UtmCapture.tsx on any marketing page or by RegisterForm.tsx
        // on mount) — it survives the round-trip to Google and back on its own.
        const utm = parseUtmCookie((await cookies()).get(UTM_COOKIE_KEY)?.value);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            referralCode,
            referredByUserId: referrer?.id ?? null,
            utmSource: utm?.utmSource ?? null,
            utmMedium: utm?.utmMedium ?? null,
            utmCampaign: utm?.utmCampaign ?? null,
          },
        });
      } catch (err) {
        console.error('Failed to backfill referral fields for new Google user:', err);
      }
    },
  },
});
