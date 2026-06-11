"""
Backfill `card_type` for already-scraped cards (trainers/energies).

Fetches the detail page for every card with stage == null in data/*.json,
parses the category header (物品卡, 支援者卡, …), writes it back into the
JSON files, and updates the matching rows in Supabase.

Run the schema migration first (Supabase SQL editor):
    alter table cards add column if not exists card_type text;

Usage:
    python scripts/backfill_card_type.py            # JSON + Supabase
    python scripts/backfill_card_type.py --json-only
    python scripts/backfill_card_type.py --db-only  # JSONs already patched

Requires: pip install requests beautifulsoup4 supabase python-dotenv
"""

import argparse
import glob
import json
import os
import sys
import time

import requests
from bs4 import BeautifulSoup

# Note: the site labels tools as 寶可夢道具 (no trailing 卡), the others end in 卡.
CARD_CATEGORIES = {"物品卡", "支援者卡", "競技場卡", "寶可夢道具", "寶可夢道具卡", "基本能量卡", "特殊能量卡"}
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ptcg-scraper/1.0)"}
DELAY = 0.4


def fetch_card_type(detail_url: str) -> str | None:
    resp = requests.get(detail_url, headers=HEADERS, timeout=15)
    resp.raise_for_status()
    time.sleep(DELAY)
    soup = BeautifulSoup(resp.text, "html.parser")
    for h in soup.select("div.skillInformation h3.commonHeader"):
        txt = h.get_text(strip=True)
        if txt in CARD_CATEGORIES:
            return txt.removesuffix("卡")
    return None


def patch_json_files() -> dict[str, str]:
    """Fill card_type in data/*.json; returns {card_id: card_type}."""
    resolved: dict[str, str] = {}  # card_id → card_type (shared across files)
    for path in sorted(glob.glob("data/*.json")):
        with open(path, encoding="utf-8") as f:
            cards = json.load(f)
        changed = False
        for c in cards:
            if c.get("stage") is not None:
                continue
            if c.get("card_type"):
                resolved[c["card_id"]] = c["card_type"]
                continue
            if c["card_id"] in resolved:
                c["card_type"] = resolved[c["card_id"]]
                changed = True
                continue
            url = c.get("detail_url")
            if not url:
                continue
            try:
                ct = fetch_card_type(url)
            except Exception as e:
                print(f"  ! {c['card_id']} {c.get('name')}: {e}")
                continue
            if ct:
                c["card_type"] = ct
                resolved[c["card_id"]] = ct
                changed = True
                print(f"  {c['card_id']} {c.get('name')} → {ct}")
            else:
                print(f"  ? {c['card_id']} {c.get('name')}: no category header found")
        if changed:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(cards, f, ensure_ascii=False, indent=1)
            print(f"Updated {path}")
    return resolved


def collect_from_json() -> dict[str, str]:
    """Read already-patched card_type values from data/*.json."""
    resolved: dict[str, str] = {}
    for path in sorted(glob.glob("data/*.json")):
        with open(path, encoding="utf-8") as f:
            for c in json.load(f):
                if c.get("card_type"):
                    resolved[c["card_id"]] = c["card_type"]
    return resolved


def update_supabase(resolved: dict[str, str]) -> None:
    from dotenv import load_dotenv
    from supabase import create_client

    load_dotenv(".env.local")
    client = create_client(
        os.environ["NEXT_PUBLIC_SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )

    # Group by card_type so each category is one bulk update
    by_type: dict[str, list[str]] = {}
    for card_id, ct in resolved.items():
        by_type.setdefault(ct, []).append(card_id)

    for ct, ids in sorted(by_type.items()):
        try:
            client.table("cards").update({"card_type": ct}).in_("card_id", ids).execute()
        except Exception as e:
            if "card_type" in str(e):
                sys.exit(
                    "Supabase update failed — run this in the SQL editor first:\n"
                    "  alter table cards add column if not exists card_type text;"
                )
            raise
        print(f"Supabase: {ct} × {len(ids)}")


def main():
    parser = argparse.ArgumentParser(description="Backfill card_type for trainer/energy cards")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--json-only", action="store_true", help="only patch data/*.json")
    group.add_argument("--db-only", action="store_true", help="only push existing JSON values to Supabase")
    args = parser.parse_args()

    resolved = collect_from_json() if args.db_only else patch_json_files()
    print(f"\n{len(resolved)} cards resolved.")

    census: dict[str, int] = {}
    for ct in resolved.values():
        census[ct] = census.get(ct, 0) + 1
    for ct, n in sorted(census.items()):
        print(f"  {ct}: {n}")

    if not args.json_only and resolved:
        update_supabase(resolved)


if __name__ == "__main__":
    main()
