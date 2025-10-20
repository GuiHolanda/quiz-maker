# Quiz Maker — Next.js + OpenAI

This repository contains a Quiz Maker application: a Next.js 14 + TypeScript app that uses the OpenAI API to generate examination-style questions per certification and topic, persists data with Prisma (SQLite in development), and provides a UI to manage certifications and quizzes.

Key features
- Generate question banks per certification and topic using OpenAI.
- Persist quiz data with Prisma (SQLite by default in development).
- Manage certifications from the UI; state is held by React Context + reducers.

Technologies
- Next.js 14 (app router)
- TypeScript
- Tailwind CSS + HeroUI
- Prisma (SQLite for development)
- OpenAI (GPT) for question generation

Quick start (development)
1. Prerequisites
   - Node.js 18+ (recommended)
   - Git
   - (optional) pnpm or yarn

2. Clone

```bash
git clone git@github.com:GuiHolanda/quiz-maker.git
cd quiz-maker
```

3. Install dependencies

```bash
npm install
# or: pnpm install
```

4. Environment variables

- Create a `.env` file in the project root. Minimum variables required:

```env
OPENAI_API_KEY=sk-...
DATABASE_URL="file:.dev.db"
# (optional) other variables for your environment
```

- Replace `sk-...` with your OpenAI API key. Never commit `.env` to source control.

Obtaining an OpenAI API key (do this before running the app)
- Create an account at OpenAI: https://platform.openai.com/
- Visit the API keys page to create a key: https://platform.openai.com/account/api-keys
- Click "Create new secret key" and copy the key into your local `.env` as `OPENAI_API_KEY`.
- If a key is ever exposed, revoke it immediately from the same page and create a replacement.

4.5 Generate local database (create dev.db)
- If you already have committed Prisma migrations (recommended), run:

```bash
npx prisma migrate dev
```

This will create/apply migrations, populate `prisma/dev.db`, and regenerate the Prisma Client.

5. Run the app

```bash
npm run dev
# open http://localhost:3000
```

Prisma — migrations and database management
- Backup (SQLite file):

```bash
mkdir -p prisma/backups
cp prisma/dev.db prisma/backups/dev.db.$(date +%Y%m%d_%H%M%S).db
```

- Generate and apply a migration (development):

```bash
npx prisma migrate dev --name add-some-field
# regenerates Prisma Client automatically
```

- Push schema without creating migrations (fast, use in dev only):

```bash
npx prisma db push
npx prisma generate
```

- Reset (destructive):

```bash
npx prisma migrate reset --force --skip-seed
```

- Apply migrations in production / CI:

```bash
npx prisma migrate deploy
npx prisma generate
```

- Open Prisma Studio to inspect data:

```bash
npx prisma studio
```

Notes on migrations
- `migrate dev` creates a migration and applies it (recommended in development).
- `db push` syncs schema to the database without creating migration files (useful for experiments in dev).
- In production, prefer creating migration files and applying them with `migrate deploy`.

Architecture overview
- Providers and state:
  - `features/providers/CertificationsProvider` — manages `certifications` and `selectedCertification` using a reducer and local persistence.
  - `features/providers/QuizProvider` — manages quiz state (questions, answers, finished state) and local persistence.

- Hooks:
  - `features/hooks/useCertificationsContext.hook.ts` — consumable hook for certifications.
  - `features/hooks/useQuizContext.hook.ts` — consumable hook for quiz state.

- OpenAI integration:
  - Server route(s) under `app/api` call OpenAI to generate questions. Prompt construction and validation live in `features/` and `config/` (including JSON Schema validations in `config/promptSchemas`).

Where to edit the certifications list
- Default certifications are seeded or kept in `config/constants/index.ts`.
- You can add, edit or remove certifications from the UI; they persist in local storage via the certifications provider.

Best practices
- Never commit secrets. Use environment variables in your deployment platform (Vercel, Render, etc.).
- Rotate OpenAI keys when they are exposed.
- Commit Prisma migration files (prisma/migrations) but do not commit the generated database (`prisma/dev.db`).

Helpful commands
- Type-check the project:

```bash
npx tsc --noEmit
```
