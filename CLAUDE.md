# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Generate Prisma client + production build
npm run lint         # Run ESLint

# Database
npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:push      # Push schema to DB without migrations (dev)
npm run db:migrate   # Create and apply a new migration
npm run db:seed      # Seed initial data (admin user + labs + computers)
npm run db:studio    # Open Prisma Studio (visual DB browser)
npm run db:reset     # Reset DB and re-run all migrations + seed

# Docker (PostgreSQL)
docker compose up -d     # Start the DB container (port 5433)
docker compose down      # Stop the DB container
docker compose down -v   # Stop and delete all data volumes
```

## First-time setup

```bash
docker compose up -d          # 1. Start PostgreSQL
npm run db:push               # 2. Create tables from schema
npm run db:seed               # 3. Seed admin + labs
# Configure .env with real SMTP + JWT_SECRET, then:
npm run dev
```

Default admin credentials after seed: `admin@ujap.edu.ve` / `Admin1234!`

## Architecture

### Stack additions (on top of original)
- **PostgreSQL 15** via Docker (replaces mock data)
- **Prisma 5** ORM — schema at `prisma/schema.prisma`
- **bcryptjs** — password hashing
- **jose** — JWT for sessions and OTP pending state (Edge-compatible)
- **nodemailer** — OTP email delivery via SMTP

### Auth flow

1. **Register** → form → creates User (`pending_email_verification`) → sends OTP → `/verify-otp`
2. **Verify OTP (register)** → marks `emailVerified=true`, status → `pending_approval` → admin approves via `/admin/users`
3. **Login** → validates password + status → sends OTP → `/verify-otp`
4. **Verify OTP (login)** → creates JWT session cookie (`session`, 7d) → `/dashboard`

Pending OTP state is stored in a short-lived signed JWT cookie (`otp_pending`, 15 min) — no server-side session store needed.

### Session management
- `lib/auth.ts` — `getSession()`, `setSession()`, `clearSession()`, OTP pending helpers
- `proxy.ts` — Edge-compatible route guard using `jose`; reads the `session` cookie (Next.js 16 renamed `middleware.ts` → `proxy.ts`)
- Role-based access: admin → `/users`, `/admin/users`; professor → `/reservations/new`; student → `/computers`

### Key directories

- `app/(auth)/` — login, register, verify-otp pages (no sidebar, no session required)
- `app/(main-layout)/` — protected pages (sidebar + session check in layout)
- `app/actions/` — server actions: `auth.ts` (register/login/OTP/logout), `reservations.ts` (create/cancel/approve)
- `app/api/` — REST endpoints for client-side data fetching (admin users, labs, computers, reservations)
- `lib/prisma.ts` — singleton Prisma client
- `lib/reservations.ts` — `timesOverlap()` + `TIME_SLOTS` constant
- `prisma/schema.prisma` — full data model

### Domain model

| Entity | Key statuses |
|--------|-------------|
| User | `pending_email_verification` → `pending_approval` → `active` \| `blocked` |
| Laboratory | `available` \| `maintenance` \| `out_of_service` |
| Computer | `available` \| `maintenance` \| `out_of_service` |
| Reservation | `pending` → `approved` \| `rejected`; or `cancelled` \| `finished` |
| ReservationType | `lab` (professor reserves whole lab) \| `computer` (student reserves one PC) |

### Reservation logic

- **Professor** (`/reservations/new`): picks lab + date + time slot → `createLabReservationAction` checks lab status + time conflicts → creates `Reservation{type:'lab'}` in `pending` → admin approves
- **Student** (`/computers`): picks lab + date + time → `GET /api/computers` returns per-computer availability → student picks one → `createComputerReservationAction` checks conflict → creates `Reservation{type:'computer'}` + `ComputerReservation` → admin approves

Conflict detection uses `timesOverlap(startA, endA, startB, endB)` = `startA < endB && endA > startB`.

### Styling
Tailwind CSS 4 with oklch color palette in `app/globals.css`. Path alias `@/` = repo root. shadcn/ui components in `components/ui/` (don't edit manually; use CLI to add new ones).

### Notable config
- `next.config.mjs` ignores TypeScript errors in builds.
- Prisma must be `@prisma/client@^5` — Prisma 7 removed `url` from schema; do NOT upgrade.
- `components.json` — shadcn/ui, `new-york` style, `lucide` icons.
