# SecOpsHQ v5

AI-powered incident response playbook platform.

## Quick Start (Local)

1. Copy `.env.example` to `.env` and fill in your values
2. Run `npm install`
3. Run `npx prisma generate`
4. Run `npm run dev`

## Deploy to Vercel

1. Push to GitHub
2. Create a Neon PostgreSQL database at neon.tech
3. Import repo on vercel.com/new
4. Add environment variables:
   - `DATABASE_URL` — Neon connection string
   - `NEXTAUTH_SECRET` — Random string
   - `ANTHROPIC_API_KEY` — Your Anthropic key
   - `ADMIN_EMAIL` — First admin email
   - `ADMIN_PASSWORD` — First admin password
5. Deploy

The schema auto-creates and admin account seeds on first login.

## Troubleshooting

**`prisma generate` fails during `npm install`:**
Make sure `.env` file exists with a valid `DATABASE_URL`. Copy from `.env.example`.

**Build fails on Vercel:**
Ensure all 5 environment variables are set in Vercel project settings.
# Wed Mar 18 02:36:40 GMT 2026
