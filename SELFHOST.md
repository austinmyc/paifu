# Self-Hosting PaiFu 牌庫

Run the app locally without any account or authentication.

## Requirements

- Node.js 18+
- Python 3.11+
- A Supabase project (free tier) **or** a local Postgres instance

---

## 1. Clone & install

```bash
git clone https://github.com/austinmyc/paifu
cd paifu

# JS dependencies
npm install

# Python environment
python3 -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r scripts/requirements.txt
```

---

## 2. Database

Choose one of the two options below.

### Option A — Supabase (recommended, free tier)

1. Create a project at [supabase.com](https://supabase.com)
2. Open the **SQL Editor** and paste + run `supabase/schema.sql`
3. Copy your keys from **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### Option B — Local Postgres

1. Install Postgres and create a database:

```bash
createdb paifu
```

2. Apply the schema:

```bash
psql -d paifu -f supabase/schema.sql
```

3. Install [Supabase CLI](https://supabase.com/docs/guides/cli) and start a local Supabase stack (handles auth + RLS):

```bash
supabase init
supabase start
```

This prints a local `API URL`, `anon key`, and `service_role key` — use those in your `.env.local`.

> **Note:** With `NEXT_PUBLIC_SELF_HOSTED=true` (see below), RLS and auth are bypassed in the app, so a plain Postgres instance without Supabase is sufficient if you only need local browsing.

---

## 3. Environment

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Set to true to bypass login entirely (no OAuth / email setup needed)
NEXT_PUBLIC_SELF_HOSTED=true
```

---

## 4. Scrape card data

Scrape the sets you want (data is saved to `data/*.json`, gitignored):

```bash
# All current HK M-series sets
python scripts/scrape.py M1L M1S M2 M2a MBG MBD MC MJ M3 M4 M5

# Or just a few
python scripts/scrape.py M4 M5
```

---

## 5. Seed the database

The seed script reads your `.env.local` and upserts cards + expansions via the Supabase API (works for both hosted and local Supabase):

```bash
# Seed all scraped files
python scripts/seed.py data/*.json

# Or seed specific sets
python scripts/seed.py data/M4.json data/M5.json
```

The script is idempotent — safe to re-run if scraping is updated.

---

## 6. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

With `NEXT_PUBLIC_SELF_HOSTED=true` you land directly on the sets page — no login required.
