# Placement Prep Tracker

Track every placement application and the interview rounds under it, and see
what it all adds up to.

**Live:** _set after the first Vercel deploy — see [Deploying](#deploying)._

---

## What it does

- **Applications** — company, role, location, job URL, salary, source, status,
  applied date, notes. Full create / read / update / delete.
- **Rounds** — interview rounds nested under an application: type, scheduled
  date, outcome, interviewer, notes. Deleting an application deletes its rounds.
- **Dashboard** — counts by status, applications per month, offer rate and
  interview-reached rate, all computed in the database.
- **Accounts** — email + password signup and login. Every account sees only its
  own data.

## Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 — utilities only, no component library |
| Database | Neon (serverless Postgres) |
| ORM | Prisma v7 via the `@prisma/adapter-neon` driver adapter |
| Auth | Auth.js (next-auth) v5, Credentials provider, JWT session cookie |
| Hashing | `bcryptjs` |
| Hosting | Vercel |

Server Components by default; `"use client"` only where interaction needs it.
Mutations are Server Actions.

## Data model

```
User ──< Application ──< Round
```

- **User** — `id`, `name?`, `email` (unique), `passwordHash`, `createdAt`.
- **Application** — belongs to a `User`. `company`, `role`, `location?`,
  `jobUrl?`, `salary?`, `source?`, `status`, `appliedDate`, `notes?`.
  Indexed on `(userId, status)` and `(userId, appliedDate)`.
- **Round** — belongs to an `Application`. `type`, `scheduledAt?`, `outcome`,
  `interviewer?`, `notes?`.

`ApplicationStatus` is `SAVED | APPLIED | ONLINE_ASSESSMENT | INTERVIEWING |
OFFER | REJECTED | WITHDRAWN`. `RoundOutcome` is `PENDING | PASSED | FAILED |
CANCELLED`.

Deleting a user cascades to their applications; deleting an application
cascades to its rounds. The full schema is in
[`prisma/schema.prisma`](prisma/schema.prisma).

## How it works: auth and per-user scoping

The app is single-tenant per account. That is enforced in three layers, and the
important one is the third.

**1. The session is the only source of identity.** Login runs through the
Auth.js Credentials provider, which looks the user up by email and compares the
submitted password against the bcrypt hash. On success the user's id is minted
into a signed JWT stored in a cookie. `src/lib/session.ts` is the only way route
code learns who is logged in — `getSessionUser()`, or `requireUser()` which
redirects to `/login` when there is no session. A `userId` never arrives from a
request body, query string, or form field.

**2. Middleware fails closed.** `src/middleware.ts` runs the edge-safe half of
the config in `src/auth.config.ts`. Anything under `/dashboard` or
`/applications` without a session is redirected to `/login`; a logged-in user
hitting `/login` or `/signup` goes to `/dashboard`.

**3. Every query is scoped to that id.** Middleware answers "is someone logged
in", not "does this row belong to them" — so it is not the security boundary.
Every read, write, update, and delete constrains on `userId`, including
single-record fetches: an application is loaded with
`where: { id, userId }`, never by `id` alone, so a guessed id from another
account returns nothing rather than someone else's row. Rounds have no `userId`
of their own and are scoped through their parent, so every round operation
first confirms the parent application belongs to the session user. Dashboard
numbers are aggregated by the database under the same `where: { userId }`
constraint — rows are never shipped to the client to be counted there.

Password hashes are never logged, returned, or serialized; they are read inside
the authorize callback and nowhere else.

## Setup

Requires Node 20+ and a free [Neon](https://neon.tech) database.

```bash
git clone <your-repo-url>
cd place
npm install                # runs `prisma generate` via postinstall

cp .env.example .env.local # then paste your Neon connection string in
npm run auth:secret        # generates AUTH_SECRET into .env.local

npm run db:apply           # apply migrations to the database
npm run dev                # http://localhost:3000
```

`.env.local` holds real values and is gitignored. `.env.example` holds
placeholders only.

Check the database connection at any time:
[`/api/health`](http://localhost:3000/api/health) returns `{ ok: true, userCount }`.

### Environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Neon **pooled** connection string (the host ends in `-pooler`). |
| `AUTH_SECRET` | yes | Signs the session JWT. Generate with `npm run auth:secret` (local) or `openssl rand -base64 32`. |
| `AUTH_URL` | production | Canonical origin, e.g. `https://your-app.vercel.app`. Optional locally. |

### Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run db:apply` | Apply pending migrations over Neon's WebSocket transport |
| `npm run db:status` | Report pending migrations, change nothing |
| `npm run auth:secret` | Write a fresh `AUTH_SECRET` into `.env.local` |
| `npm run test:scope` | Assert cross-account reads/writes on applications are refused |
| `npm run test:rounds` | Same, for rounds via their parent application |
| `npm run test:analytics` | Assert dashboard numbers only count the owner's rows |

### A note on migrations

Migrations are applied with `npm run db:apply`
([`scripts/migrate-ws.mjs`](scripts/migrate-ws.mjs)), not `prisma migrate dev`.
Prisma's schema engine only speaks raw TCP on port 5432, which many networks
block and which Neon's pooled endpoint does not serve anyway. The script runs
each pending migration in order over Neon's WebSocket transport on port 443 and
records it in `_prisma_migrations` with CLI-compatible checksums, so the two
tools agree about what has been applied.

To add a migration:

```bash
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script \
  > prisma/migrations/<timestamp>_<name>/migration.sql
npm run db:apply
```

## Deploying

[`vercel.json`](vercel.json) overrides the build command to
`npm run db:apply && next build`, so every deploy applies pending migrations
before building — and a failed migration fails the deploy rather than shipping
code against the old schema.

Set `DATABASE_URL`, `AUTH_SECRET`, and `AUTH_URL` in the Vercel project's
environment variables. Nothing real is ever committed; `.env.local` is
gitignored and `.env.example` holds placeholders only.
