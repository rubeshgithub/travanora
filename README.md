# Travanora — App Monorepo

Kuwait-based travel platform. Free membership unlocks an automatic 10% discount on every flight booking.

| Service | Local dev | Production |
|---|---|---|
| React app (`apps/web`) | `http://localhost:5173` | `https://app.travanora.com` |
| API (`apps/api`) | `http://localhost:4000` | `https://api.travanora.com` |
| MongoDB | `localhost:27017` (Docker) | MongoDB Atlas — Bahrain (ME-South-1) |
| Marketing site | *(separate repo)* | `https://travanora.com` |

The marketing site's **Sign in** and **Join free** buttons link to `https://app.travanora.com/login` and `https://app.travanora.com/register`. CORS, cookie domains, and the API client are all pre-configured for this subdomain split — see [Environment variables](#environment-variables) below.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Routing | React Router v6 |
| Server state | TanStack Query v5 |
| Client state | Zustand (auth store) |
| Forms | React Hook Form + Zod resolver |
| Backend | Node.js LTS, Express, TypeScript |
| Database | MongoDB 7 via Mongoose |
| Auth | JWT (15 min access) + HttpOnly refresh cookie (7 d, rotating) |
| Travel API | Duffel (`@duffel/api`) — server-side only |
| Validation | Zod — same schemas shared between client and server via `packages/shared` |
| Logging | Pino + pino-pretty (dev) |
| Security | Helmet, CORS, bcrypt (cost 12), rate limiting, refresh-token rotation |
| Package manager | pnpm v9 workspaces |

---

## Repo structure

```
travanora-app/
├── apps/
│   ├── web/          # React app → app.travanora.com
│   └── api/          # Express API → api.travanora.com
├── packages/
│   └── shared/       # Zod schemas + TypeScript types (used by both apps)
├── docker-compose.yml
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

## Setup — from clone to running locally

### Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **pnpm 9+** — `npm install -g pnpm`
- **Docker Desktop** — [docker.com](https://www.docker.com/products/docker-desktop/) (for local MongoDB)
- **Duffel account** — [app.duffel.com](https://app.duffel.com) (free test token, no billing required)

---

### Step 1 — Clone the repo

```bash
git clone <your-repo-url> travanora-app
cd travanora-app
```

---

### Step 2 — Install dependencies

Install everything from the repo root. pnpm workspaces links all packages automatically.

```bash
pnpm install
```

---

### Step 3 — Copy the environment files

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

---

### Step 4 — Generate JWT secrets

Each secret must be at least 64 random characters. Use two **different** values — one for access tokens, one for refresh tokens.

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Run twice — paste the first output into JWT_ACCESS_SECRET
#              paste the second into JWT_REFRESH_SECRET
```

Open `apps/api/.env` and replace the placeholder values:

```
JWT_ACCESS_SECRET=<paste first output here>
JWT_REFRESH_SECRET=<paste second output here>
```

> **Why two different secrets?** Access tokens and refresh tokens have different lifetimes, audiences, and revocation semantics. Using the same secret means a leaked refresh token could be crafted into an access token.

---

### Step 5 — Add your Duffel test token

1. Sign in at [app.duffel.com](https://app.duffel.com)
2. Go to **Developers → Access tokens**
3. Create a **test** token (starts with `duffel_test_`)
4. Paste it into `apps/api/.env`:

```
DUFFEL_ACCESS_TOKEN=duffel_test_your_token_here
```

Leave `DUFFEL_LIVE=false` for local development. The test environment returns realistic fake flight data without charging anyone.

---

### Step 6 — Start MongoDB

```bash
pnpm db:up
```

This spins up MongoDB 7 in Docker on port 27017 with a named volume (`mongo-data`) so your data persists between restarts.

To stop it: `pnpm db:down`

---

### Step 7 — Start the API

```bash
pnpm dev:api
```

You should see:

```
INFO  MongoDB connected
INFO  Travanora API running on http://localhost:4000
INFO  Environment: development
```

Verify it's healthy:

```bash
curl http://localhost:4000/health
# → {"ok":true,"service":"travanora-api"}
```

---

### Step 8 — Start the web app

In a second terminal:

```bash
pnpm dev:web
```

Open [http://localhost:5173](http://localhost:5173). You should see the flight search page.

**Quick smoke test:**

1. Search `KWI → DXB`, any dates — you should see real Duffel flight results.
2. Click **Join free** and register an account.
3. After registration you're redirected to search — results now show the 10% member price with a "SAVED KD X" badge.
4. Sign out, then sign back in via **Sign in**.

---

## Running all services together

```bash
pnpm db:up && pnpm dev
```

`pnpm dev` runs both `apps/api` and `apps/web` in parallel.

---

## Available scripts (root)

| Script | What it does |
|---|---|
| `pnpm dev` | Start web + API in parallel |
| `pnpm dev:web` | Start web app only |
| `pnpm dev:api` | Start API only |
| `pnpm build` | Production build for all packages |
| `pnpm typecheck` | TypeScript check across all packages |
| `pnpm lint` | ESLint across all packages |
| `pnpm test` | Vitest unit tests across all packages |
| `pnpm db:up` | Start MongoDB via Docker Compose |
| `pnpm db:down` | Stop MongoDB |

---

## Environment variables

### `apps/api/.env`

| Variable | Description | Example |
|---|---|---|
| `PORT` | API server port | `4000` |
| `NODE_ENV` | `development` / `production` | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/travanora` |
| `JWT_ACCESS_SECRET` | ≥64 random chars — access token signing key | *(generate — see Step 4)* |
| `JWT_REFRESH_SECRET` | ≥64 random chars — refresh token signing key | *(generate — see Step 4)* |
| `JWT_ACCESS_TTL` | Access token lifetime | `15m` |
| `JWT_REFRESH_TTL` | Refresh token lifetime | `7d` |
| `JWT_REFRESH_TTL_REMEMBER_ME` | Refresh token lifetime when "Remember me" | `30d` |
| `DUFFEL_ACCESS_TOKEN` | Your Duffel API token | `duffel_test_xxxxx` |
| `DUFFEL_LIVE` | `true` to use Duffel live data | `false` |
| `COOKIE_DOMAIN` | Cookie domain — `localhost` in dev, `.travanora.com` in prod | `localhost` |
| `CORS_ORIGIN` | Allowed origins (comma-separated) | `http://localhost:5173` |

**Production values** (set on your server / hosting platform):

```
COOKIE_DOMAIN=.travanora.com
CORS_ORIGIN=https://app.travanora.com,https://travanora.com
MONGODB_URI=mongodb+srv://...  # Atlas connection string
NODE_ENV=production
DUFFEL_LIVE=true
```

### `apps/web/.env`

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Full URL of the API | `http://localhost:4000` |

**Production:**

```
VITE_API_URL=https://api.travanora.com
```

---

## Architecture notes

### Auth flow

```
Browser                          API
  │                               │
  ├─ POST /api/auth/login ────────►│ Validate credentials
  │                               │ Issue access token (15 min JWT)
  │◄──── { accessToken } ─────────┤ Set HttpOnly refresh cookie (7 d)
  │                               │
  │  [access token expires]       │
  │                               │
  ├─ POST /api/auth/refresh ──────►│ Read HttpOnly cookie
  │  (cookie sent automatically)  │ Verify refresh token hash in DB
  │                               │ Rotate: revoke old, issue new cookie
  │◄──── { accessToken } ─────────┤
```

Refresh tokens are stored as SHA-256 hashes in MongoDB with a TTL index — expired tokens self-delete. Token reuse (a stolen token used twice) revokes *all* tokens for that user immediately.

### Member discount

The discount is applied **server-side** in `flights.service.ts`. The browser never receives a formula — it only receives the already-computed `memberPrice`. The shared package's `FlightSearchResponseSchema` carries both `publicPrice` and `memberPrice` so the UI can show the crossed-out price without any arithmetic on the client.

### Flight search cache

In-memory, 5-minute TTL, keyed by `origin-destination-departDate-returnDate-cabin-passengers`. Caches **public prices only** — discount is applied per-request on top of cached data. This means two users hitting the same search within 5 minutes share one Duffel API call, but each sees their own correct price.

### CORS + subdomain split

The marketing site at `travanora.com` links to `app.travanora.com` (the React app). The React app calls `api.travanora.com`. CORS is configured to allow both origins in production. Cookies use `Domain=.travanora.com` (note the leading dot) so the refresh cookie is sent on all subdomain requests automatically.

---

## Security checklist

- [x] bcrypt cost factor 12 on all password hashes
- [x] Passwords never logged, never returned in any API response (`toJSON` transform strips `passwordHash`)
- [x] JWT secrets enforced ≥64 chars at startup — server refuses to boot otherwise
- [x] Refresh tokens stored as SHA-256 hashes, never plaintext
- [x] HttpOnly + Secure (production) + SameSite=Lax cookies
- [x] CORS: allow-list only, `credentials: true`
- [x] Helmet defaults on all Express responses
- [x] Rate limiting: 5 auth attempts / 15 min per IP (skips successful requests), 60 flight searches / min per IP
- [x] All user input validated through Zod before reaching Mongoose
- [x] Duffel token server-side only — never in any response body
- [x] Token reuse detection: if a refresh token hash is presented twice, all sessions for that user are revoked

---

## What's next — Phase 2+

These are deliberately out of scope for Phase 1 but the codebase is structured to accommodate them cleanly:

**Booking flow**
- Add `POST /api/flights/orders` using `duffel.orders.create`
- New route `/book/:offerId` in the React app
- Order stored in a new `Booking` Mongoose model

**Payments**
- Stripe or Tap Payments integration on the API side
- Webhook handler for payment confirmation before order is confirmed with Duffel

**Email**
- Replace `forgotPassword` console stub with Resend or AWS SES
- Transactional emails: registration, booking confirmation, member welcome

**OAuth (SSO)**
- Google and Apple OAuth via Passport.js or Auth.js
- SSO buttons in `RegisterPage` and `LoginPage` are already wired to stub toasts

**Member tiers**
- `Member.tier` already accepts `'gold' | 'platinum' | 'corporate'`
- Add upgrade logic in `members.service.ts`
- Different `discountPercent` values per tier

**Arabic / RTL**
- Add `i18next` — string literals in all components are already in one place (no hardcoded Arabic)
- Set `dir="rtl"` on `<html>` based on `i18n.language`
- Tailwind `rtl:` variant handles layout flipping

**Admin dashboard**
- New `apps/admin` workspace (same monorepo pattern)
- Role field on `User` model (`user | admin`)
- JWT payload carries role; `requireRole('admin')` middleware guards admin routes

**Testing**
- Playwright e2e happy path: search → register → see member price (test stub is in scope for Phase 1 — implementation in Phase 2)
- API integration tests using `supertest` + real MongoDB (testcontainers)

---

## Troubleshooting

**`JWT_ACCESS_SECRET must be at least 64 characters`** — You haven't generated real secrets yet. Run the command in Step 4.

**`MongoDB connect ECONNREFUSED`** — Docker isn't running, or you skipped `pnpm db:up`. Check `docker ps`.

**Flight results are empty** — Your Duffel test token may be expired or invalid. Regenerate it at [app.duffel.com](https://app.duffel.com).

**CORS error in browser** — Check that `CORS_ORIGIN` in `apps/api/.env` exactly matches the URL your browser is using (including `http://` and port). No trailing slash.

**`pnpm: command not found`** — Install pnpm globally: `npm install -g pnpm`.
