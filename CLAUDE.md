# CLAUDE.md

## Overview

AccessEval is a website accessibility scanner and ADA compliance management platform for K-12 schools and small governments. Scans websites for WCAG 2.1 Level AA violations using Playwright + axe-core, translates results to plain English, and provides compliance documentation.

## Development Commands

```bash
cd accesseval

npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests (vitest)
npm run test:watch   # Run tests in watch mode

npm run db:migrate   # Run Prisma migrations
npm run db:generate  # Regenerate Prisma client
npm run db:studio    # Open Prisma Studio

npm run worker       # Start scan worker (separate process)
```

## Architecture

- **Web container**: Next.js App Router — landing page, dashboard, API routes, auth, Stripe webhooks
- **Worker container**: BullMQ processor — crawls sites, runs Playwright + axe-core, sends emails
- **Postgres**: Primary data store via Prisma ORM
- **Redis**: BullMQ job queue for scan jobs
- **Stripe**: Billing (Checkout + Customer Portal)
- **AWS SES**: Transactional and digest emails

## Key Files

- `prisma/schema.prisma` — full data model (12 tables)
- `src/lib/scoring.ts` — page score + site score + letter grade
- `src/lib/plan-limits.ts` — tier feature gates
- `src/lib/translations.ts` — axe-core rule → plain English
- `src/data/axe-translations.json` — translation data
- `worker/` — scan worker (crawler, scanner, scorer, differ)

## Tiers

| | Scan ($99/yr) | Comply ($299/yr) | Fix ($599/yr) |
|---|---|---|---|
| Pages | 100 | 500 | 2,000 |
| Sites | 1 | Unlimited | Unlimited |
| Frequency | Monthly | Weekly | Weekly |
| On-demand | 2/mo | 5/mo | Unlimited |
| AI fix suggestions | No | No | Yes |
| PO / invoice | No | Yes | Yes |

Manage tier: "Contact us" placeholder (no self-serve yet).

## Database & Migrations

Prisma ORM manages the schema and migrations. The Dockerfile does NOT run migrations automatically.

**When you change `prisma/schema.prisma`:**

1. Generate a migration locally: `npx prisma migrate dev --name describe_change`
2. Regenerate the client: `npx prisma generate`
3. Commit the migration file in `prisma/migrations/`
4. Deploy to production from local machine:
   ```bash
   source .env && DATABASE_URL="$PROD_DATABASE_URL" npx prisma migrate deploy
   ```
5. Push code and redeploy via Coolify

**Local `.env`** has `DATABASE_URL` pointing to localhost and `PROD_DATABASE_URL` pointing to Neon.

**Useful commands:**
- `npx prisma studio` — browse data in a web UI
- `npx prisma migrate status` — check which migrations have been applied
- `npx prisma db pull` — pull schema from an existing database

## Deployment

- **Hosting**: Coolify (self-hosted, NOT Vercel)
- **Domain**: accesseval.com
- **Database**: Neon (PostgreSQL), connection string in Coolify env vars as `DATABASE_URL`
- **Reverse proxy**: Cloudflare DNS (proxy can be on or off; NextAuth cookies are configured to handle either)

## Environment Variables

See `.env.example` for all required variables. Local `.env` has both `DATABASE_URL` (localhost) and `PROD_DATABASE_URL` (Neon).

## Testing

Tests use Vitest. Unit tests in `tests/unit/`, integration tests in `tests/integration/`.

```bash
npx vitest run                    # All tests
npx vitest run tests/unit/        # Unit tests only
npx vitest run tests/unit/scoring # Specific test file
```
