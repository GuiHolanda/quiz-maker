# Auth System Design — MyQuiz

**Date:** 2026-04-20
**Status:** Approved

---

## Context

MyQuiz is a certification exam prep platform intended for public launch. Currently, all routes are public and all data is global — no user concept exists. To support multiple users, each with their own certifications, questions, and quiz history, a full authentication and authorization system is needed.

This spec covers: user registration, login (credentials + Google OAuth), logout, password reset via email, route protection, and per-user data isolation.

---

## Decisions

| Concern | Decision | Rationale |
|---------|----------|-----------|
| Auth library | NextAuth.js v5 (Auth.js) | Native App Router support, minimal boilerplate, Prisma Adapter |
| Session strategy | Database sessions (stateful) | Revocable, secure; handled by NextAuth |
| Credentials | Email + bcryptjs password | Simple, no external dependency |
| OAuth | Google | Low-friction social login |
| Password reset | Email with token link via Resend | Industry standard; Resend is the recommended Next.js email provider |
| State management | NextAuth `SessionProvider` + `useSession()` | No custom reducer needed; avoids duplicating session state |
| Data isolation | `userId` FK on `Certification` and `Question` | Each user owns their own data |

---

## Dependencies to Install

```bash
npm install next-auth@beta @auth/prisma-adapter bcryptjs resend
npm install -D @types/bcryptjs
```

---

## Schema Changes

> **Approval required for schema changes per CLAUDE.md — approved in design session.**

Both `prisma/dev/schema.prisma` and `prisma/prod/schema.prisma` need the following additions.

### New Models (NextAuth Prisma Adapter standard)

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?         // null for OAuth-only users
  accounts      Account[]
  sessions      Session[]
  certifications Certification[]
  questions     Question[]
  createdAt     DateTime  @default(now())
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

### Changes to Existing Models

Add `userId` to `Certification` and `Question`:

```prisma
model Certification {
  // ... existing fields ...
  userId  String
  user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Question {
  // ... existing fields ...
  userId  String
  user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Migrations needed:** `npm run prisma:migrate:dev` (dev), and equivalent for prod.

---

## New Files

### Auth Configuration

**`auth.ts`** (project root)
- NextAuth config: `PrismaAdapter`, `CredentialsProvider`, `GoogleProvider`
- Callbacks: `session` callback adds `user.id` to session object
- Pages: custom `signIn: '/login'`

**`auth.config.ts`** (project root, edge-compatible subset)
- Used by middleware (Edge runtime, can't import Prisma)
- Only declares protected/public routes and redirect logic

### Middleware

**`middleware.ts`** (project root)
- Imports `auth` from `auth.config.ts`
- Redirects unauthenticated users to `/login`
- Allows public routes: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/api/auth/**`

### New Pages

| File | Route | Purpose |
|------|-------|---------|
| `app/login/page.tsx` | `/login` | Login form (credentials + Google button) |
| `app/login/components/LoginForm.tsx` | — | Email/password form + Google sign-in button |
| `app/register/page.tsx` | `/register` | Registration form |
| `app/register/components/RegisterForm.tsx` | — | Name, email, password fields |
| `app/forgot-password/page.tsx` | `/forgot-password` | Request password reset |
| `app/forgot-password/components/ForgotPasswordForm.tsx` | — | Email field |
| `app/reset-password/page.tsx` | `/reset-password` | Set new password |
| `app/reset-password/components/ResetPasswordForm.tsx` | — | New password + confirm, reads `?token=` from URL |

All auth pages are server components wrapping client form components. No authentication required to access them (public routes).

### New API Routes

| File | Method | Function |
|------|--------|----------|
| `app/api/auth/[...nextauth]/route.ts` | GET/POST | NextAuth handler (all OAuth flows) |
| `app/api/auth/register/route.ts` | POST | Create user: validate email uniqueness, hash password with bcryptjs, insert User |
| `app/api/auth/forgot-password/route.ts` | POST | Generate reset token, store as VerificationToken, send email via Resend |
| `app/api/auth/reset-password/route.ts` | POST | Validate token expiry, update user password, delete token |

Business logic lives in co-located service files:
- `app/api/auth/register/register.service.ts`
- `app/api/auth/forgot-password/forgot-password.service.ts`
- `app/api/auth/reset-password/reset-password.service.ts`

---

## Changes to Existing Files

### `app/providers.tsx`
Add `SessionProvider` from `next-auth/react` as outermost wrapper:
```tsx
import { SessionProvider } from 'next-auth/react';
// Wrap everything with <SessionProvider>
```

### `sharedComponents/ui/navbar.tsx`
- Add `useSession()` hook
- Show "Sign In" button linking to `/login` when `status === 'unauthenticated'`
- Show user avatar/name + "Sign Out" button (calls `signOut()`) when `status === 'authenticated'`

### `features/connectors.ts`
No changes needed. The Axios instance already has `withCredentials: true`, so the session cookie is sent automatically.

### Existing API Route Handlers
Each handler gets updated to:
1. Call `auth()` (NextAuth server-side helper) to get the session
2. Return 401 if no session
3. Filter DB queries by `session.user.id`

Routes affected:
- `app/api/certifications/route.ts`
- `app/api/question-generator/route.ts` (and `question.service.ts`)
- `app/api/save-questions/route.ts`
- `app/api/get-anwers/route.ts`
- `app/api/save-certification/route.ts` (and `certification.service.ts`)
- `app/api/quiz-generator/route.ts` (and `quiz-generator.service.ts`)

### `types/index.ts`
Add auth-related types:
```typescript
export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}
```

### `config/constants/index.ts`
Add new API URL constants:
```typescript
export const REGISTER_URL = '/auth/register';
export const FORGOT_PASSWORD_URL = '/auth/forgot-password';
export const RESET_PASSWORD_URL = '/auth/reset-password';
```

---

## Environment Variables to Add

```env
NEXTAUTH_SECRET=<random-32-char-string>
NEXTAUTH_URL=http://localhost:3000        # or prod URL in production
GOOGLE_CLIENT_ID=<from-google-console>
GOOGLE_CLIENT_SECRET=<from-google-console>
RESEND_API_KEY=<from-resend.com>
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

---

## Data Flow

### Login (Credentials)
1. User submits email + password on `/login`
2. `LoginForm` calls NextAuth `signIn('credentials', { email, password })`
3. NextAuth `CredentialsProvider.authorize()` fetches user from DB, compares bcrypt hash
4. On success: NextAuth creates Session in DB, sets HttpOnly cookie
5. Redirect to `/` (or intended page)

### Login (Google)
1. User clicks "Continue with Google" on `/login`
2. `signIn('google')` → Google OAuth flow
3. NextAuth callback creates/links `Account` in DB, creates `Session`
4. Redirect to `/`

### Registration
1. User submits name, email, password on `/register`
2. `RegisterForm` POSTs to `/api/auth/register`
3. Service validates uniqueness, hashes password, inserts User
4. On success: auto-login via `signIn('credentials', ...)`, redirect to `/`

### Password Reset
1. User submits email on `/forgot-password`
2. POST `/api/auth/forgot-password` → generates token → stores as `VerificationToken` → sends email via Resend
3. User clicks link in email → `/reset-password?token=<token>`
4. User submits new password → POST `/api/auth/reset-password` with token + new password
5. Service validates token (exists + not expired), updates `user.password` with bcrypt hash, deletes token
6. Redirect to `/login`

### Logout
1. User clicks "Sign Out" in navbar
2. `signOut()` → NextAuth deletes Session from DB, clears cookie
3. Middleware detects unauthenticated, redirects to `/login`

---

## Security Considerations

- Passwords stored as bcrypt hash (never plaintext)
- Session tokens in HttpOnly cookies (inaccessible to JS)
- CSRF protection handled by NextAuth
- Reset tokens: short TTL (1 hour), single-use (deleted on use)
- Forgot password endpoint responds with generic success message regardless of whether email exists (prevents user enumeration)
- All API routes return 401 for unauthenticated requests

---

## Verification

1. Run `npm run prisma:migrate:dev` — migration applies cleanly
2. Run dev server: `npm run dev`
3. Visit `/` → redirected to `/login` ✓
4. Register new account → redirected to `/` ✓
5. Logout → redirected to `/login` ✓
6. Login with credentials → session persists on refresh ✓
7. Login with Google → OAuth flow completes, session created ✓
8. Request password reset → email received, link works, password updated ✓
9. After password reset → old password rejected, new password accepted ✓
10. API routes return 401 when called without session ✓
11. Data created by user A is not visible to user B ✓
