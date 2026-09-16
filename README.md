# ShortStack API

A URL-shortening API built with TypeScript, Express, and SQLite. Registered users can create short links, choose aliases, set expiration dates, view click analytics, generate QR codes, and deactivate or delete links.

## What it does

- Creates short URLs with generated codes or a custom alias.
- Redirects visitors through `GET /:code` and records clicks.
- Reports clicks over 24 hours, 7 days, or 30 days.
- Generates a QR code for a link.
- Uses JWT authentication, request validation, rate limiting, and an LRU cache.
- Applies the SQL migrations in `src/db/migrations/` when the database starts.

**Stack:** Node.js 22.5+, TypeScript, Express 5, SQLite (`node:sqlite`), Zod, Vitest.

## Run locally

```bash
git clone https://github.com/Nwobi/Shortstack-API.git
cd Shortstack-API
npm install
cp .env.example .env
npm run dev
```

Replace `JWT_SECRET` in `.env` with a long random secret before exposing the API. The development server uses `http://localhost:3000` by default. `.env` and local database files are ignored by Git.

For a production build:

```bash
npm run build
npm start
```

The build copies the SQL migration files to `dist/db/migrations/`; migrations run automatically at startup.

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Health check |
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Receive an authentication token |
| GET | `/api/auth/me` | Read the signed-in user |
| POST | `/api/links` | Create a short link |
| GET | `/api/links` | List the signed-in user's links |
| GET | `/api/links/:id/analytics` | Click analytics; optional `period=24h|7d|30d` |
| GET | `/api/links/:id/qr` | QR code data URL |
| PATCH | `/api/links/:id/deactivate` | Disable a link and keep its analytics |
| DELETE | `/api/links/:id` | Permanently remove a link |
| GET | `/:code` | Redirect to the target URL |

The `/api/links` routes and `/api/auth/me` require a bearer token returned by registration or login. The root `/:code` route is public.

## Configuration

Copy `.env.example` to `.env`. `DB_PATH` sets the SQLite file location; `BASE_URL` is used when constructing short links. `PORT`, `JWT_EXPIRES_IN`, `CACHE_MAX_SIZE`, `LOG_LEVEL`, and `RATE_LIMIT_MAX` can also be changed there. Never commit your real `.env`.

## Checks

```bash
npm test
npm run test:coverage
npm run lint
```

The tests use Vitest. Issues and contributions are welcome through this repository.
