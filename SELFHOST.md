# Self-Hosting PaiFu 牌庫

Run the app locally without any account or authentication.

## Requirements

- Node.js 18+
- Python 3.11+
- A Supabase project (free tier is fine) or local Postgres

## Setup

```bash
# Clone the repo
git clone https://github.com/your-username/paifu
cd paifu

# Install JS dependencies
npm install

# Set up Python environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r scripts/requirements.txt
```

## Environment

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SELF_HOSTED=true
```

With `NEXT_PUBLIC_SELF_HOSTED=true`, login is bypassed entirely — no OAuth or email setup needed.

## Database

Run `supabase/schema.sql` in your Supabase SQL editor or local Postgres instance.

## Card data

Scrape the sets you want:

```bash
python scripts/scrape.py M1L M1S M2 M3 M4 M5
```

Seed into the database:

```bash
python scripts/seed.py data/*.json
```

## Run

```bash
node node_modules/next/dist/bin/next dev
```

Open [http://localhost:3000](http://localhost:3000).
