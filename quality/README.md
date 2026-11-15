# نظام الجودة — Al-Sakhra quality system

Internal quality management system for AlSakhra Factory for Manufacturing, served at **sop.alsakhrah.com**.
It is a separate app from the company website (repo root): its own packages, build, Vercel project and database.

## Stack
Next.js 16 (App Router) · Supabase (Postgres, Auth, private Storage) · Tailwind 4 · same brand theme as alsakhrah.com.

## Set up
1. Create a Supabase project and run `supabase/migrations/0001_quality_system.sql` in the SQL editor.
2. Copy `.env.example` to `.env.local` and fill the three values (Settings > API).
3. Create the first admin in Supabase (Authentication > Add user, e.g. `admin@alsakhrah.com`), then:
   ```sql
   insert into public.profiles (user_id, full_name, username, role)
   select id, 'مدير النظام', email, 'admin' from auth.users where email = 'admin@alsakhrah.com';
   ```
4. `npm install` then `npm run dev` (http://localhost:3300).

## Vercel
New project from this repo with **Root Directory = `quality`**, the three environment variables, and the domain `sop.alsakhrah.com`.

## Roles
- **admin**: everything, including users and the change log.
- **manager**: views everything, writes assessor notes on self-assessment clauses.
- **inspector**: views everything, writes inspection notes.

## Security
- Every page and file route requires a signed-in, active account (`proxy.ts` + `lib/auth/session.ts`).
- Tables are read through row level security; all writes go through server actions that check the role first, then use the service role (`app/admin-actions.ts`). Every write is recorded in `audit_log`.
- PDFs live in a private bucket and are streamed by `/api/files` and `/api/distributed/[copyId]` (which stamps "CONTROLLED COPY No. XX - DEPT").
- Uploads go straight from the browser to storage through one-time signed upload URLs (no size limit from Vercel functions).
