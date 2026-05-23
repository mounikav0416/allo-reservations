# Allo Reservations Demo

This repository implements the Allo take-home exercise for inventory reservation across warehouses.

## What is built

- Next.js App Router frontend with:
  - product listing
  - available stock by warehouse
  - reserve flow
  - reservation details page with countdown
  - confirm and cancel actions
- API routes for:
  - `GET /api/products`
  - `GET /api/warehouses`
  - `POST /api/reservations`
  - `GET /api/reservations/:id`
  - `POST /api/reservations/:id/confirm`
  - `POST /api/reservations/:id/release`
- Prisma data model for products, warehouses, stock, and reservations
- Concurrency-safe reservation logic using transactional stock updates
- Expiry cleanup on read and action endpoints

## Run locally

1. Install dependencies

```bash
npm install
```

2. Create database and migrate schema

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

3. Start the dev server

```bash
npm run dev
```

4. Open http://localhost:3000

## Database and expiry behavior

The app uses Prisma with a SQLite database for local development. The schema is compatible with hosted Postgres if you replace `DATABASE_URL` in `.env` with a Postgres connection string.

Reservation expiry is handled lazily in server-side code:

- `releaseExpiredReservations()` runs before product queries and reservation actions.
- expired pending reservations are released automatically before the app computes availability or confirms a reservation.
- This keeps the API correct without requiring a separate worker in the demo.

## Concurrency correctness

The reservation endpoint uses a transaction with a guarded stock update:

- it updates `Stock.reserved` only when `reserved + quantity <= total`
- if the update affects no rows, the request returns `409` for insufficient stock
- this ensures that simultaneous requests for the final unit cannot both succeed

Confirmed reservations move units from `reserved` into permanent depletion by decrementing both `reserved` and `total`.
Released reservations only decrement `reserved`, returning units to availability.

## Trade-offs / notes

- I used SQLite locally for simplicity; the same Prisma schema and transactional logic will work with Postgres.
- Expiry cleanup is implemented lazily instead of a cron worker. That is acceptable for the exercise and keeps the demo self-contained.
- Idempotency headers were not implemented in this version in order to focus on the concurrency-safe reservation path.

## API usage

- Reserve: `POST /api/reservations` with `{ productId, warehouseId, quantity }`
- Confirm: `POST /api/reservations/:id/confirm`
- Release: `POST /api/reservations/:id/release`

Error statuses:

- `409` when there is not enough stock available
- `410` when a reservation has expired or been released

## Deploy to Vercel + Supabase

### 1. Create a Supabase project

1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Copy the **Project URL** and **anon/service_role key** from Settings → API
4. Generate a new database password if needed
5. Get the **full connection string** from Settings → Database → Connection String (URI format)

### 2. Push code to GitHub

1. Create a new repository on [github.com](https://github.com)
2. Push the code:

```bash
git remote add origin https://github.com/YOUR_USERNAME/allo-reservations.git
git branch -M main
git push -u origin main
```

### 3. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project"
3. Select your `allo-reservations` repository
4. In **Environment Variables**, add:
   - `DATABASE_URL`: Your Supabase connection string from step 1
   - `NEXT_PUBLIC_RESERVATION_TTL_SECONDS`: `600` (10 minutes)
5. Click **Deploy**

Vercel will automatically:
- Install dependencies
- Run `prisma generate` and `prisma migrate deploy`
- Build the Next.js app
- Deploy to a live URL

### 4. Seed the database

Once deployed, seed your Supabase database with sample products and warehouses:

```bash
npm run prisma:seed
```

Or, in the Vercel console, run the command via the deployment logs or SSH into the instance.

### Live URL

After deployment completes, Vercel will provide your live URL. The app will be fully functional with live inventory, reservation flow, and countdown timer.
