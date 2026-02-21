# FleetFlow

Full-stack hackathon implementation of the problem statement:
- Role-based login and authentication (Manager, Dispatcher, Safety Officer, Financial Analyst)
- Signup (new user registration with role selection)
- Forgot/reset password flow (token-based reset for demo/local)
- Command Center dashboard with KPIs and filters
- Vehicle Registry (asset CRUD, unique license plate, out-of-service toggle)
- Trip Dispatcher with capacity validation and lifecycle transitions
- Maintenance & Service Logs (auto `In Shop` rule)
- Expense & Fuel Logging (trip/driver/vehicle linked entries)
- Driver Performance & Safety Profiles (license expiry auto-suspend)
- Operational Analytics + monthly financial summary
- One-click report downloads (`CSV` and `PDF`)
- Search, sort, group-by, and pagination across module tables
- Middleware security guard (`middleware.ts`) for API/session gate + security headers
- Distributed cache support with Redis fallback to memory (dashboard/analytics/drivers)

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + custom UI styles
- Next API routes for backend
- Prisma ORM + SQLite database (local dev)
- Session table + hashed passwords (`bcryptjs`)
- Zod for request validation

## Run

```bash
npm install
npm run db:setup
npm run dev
```

Open `http://localhost:3000`.

## Database

Copy `.env.example` to `.env` if needed:

```bash
cp .env.example .env
```

Default:

```env
DATABASE_URL="file:./dev.db"
```

`npm run db:push` rebuilds local SQLite schema from `prisma/schema.prisma` using Prisma schema diff + `sqlite3`.
It recreates `prisma/dev.db` for deterministic local setup.

Optional reset email delivery:

```env
APP_BASE_URL="http://localhost:3000"
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="FleetFlow <no-reply@yourdomain.com>"
RESET_EMAIL_ENDPOINT="https://your-mail-worker.example/send"
```

If not set, reset token is shown in UI for local/dev testing.
`APP_BASE_URL` enables a clickable reset link that prefills `?resetToken=...` on the login page.

Optional distributed cache (Upstash Redis):

```env
UPSTASH_REDIS_REST_URL="https://...upstash.io"
UPSTASH_REDIS_REST_TOKEN="..."
```

## Seeded Credentials

Seeded users use password `fleet123`:
- `manager@fleetflow.local`
- `dispatcher@fleetflow.local`
- `safety@fleetflow.local`
- `finance@fleetflow.local`
