"""
Seed Supabase from a scraped JSON file.

Usage:
    python scripts/seed.py data/M1.json
    python scripts/seed.py data/*.json  # glob expanded by shell
    python scripts/seed.py data/M1.json data/M2.json

Requires: pip install supabase python-dotenv
Needs SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL in .env.local
"""

import argparse
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]


def get_client() -> Client:
    return create_client(SUPABASE_URL, SERVICE_KEY)


def seed_file(path: str, client: Client) -> None:
    print(f"\nSeeding {path}...")
    with open(path, encoding="utf-8") as f:
        cards: list[dict] = json.load(f)

    if not cards:
        print("  Empty file, skipping.")
        return

    # Derive expansion row from first card that has expansion info
    exp_card = next((c for c in cards if c.get("expansion_code")), None)
    if exp_card:
        expansion = {
            "code": exp_card["expansion_code"],
            "name": exp_card.get("expansion_name", exp_card["expansion_code"]),
            "symbol_url": exp_card.get("expansion_symbol_url"),
            "regulation_mark": exp_card.get("regulation_mark"),
        }
        client.table("expansions").upsert(expansion, on_conflict="code").execute()
        print(f"  Upserted expansion: {expansion['code']} — {expansion['name']}")

    # Upsert cards in batches of 50
    rows = []
    for c in cards:
        rows.append({
            "card_id": c["card_id"],
            "expansion_code": c.get("expansion_code"),
            "collector_number": c.get("collector_number"),
            "name": c.get("name", ""),
            "stage": c.get("stage"),
            "card_type": c.get("card_type"),
            "evolves_from": c.get("evolves_from"),
            "dex_number": c.get("dex_number"),
            "species": c.get("species"),
            "hp": c.get("hp"),
            "type": c.get("type"),
            "attacks": c.get("attacks"),
            "weakness": c.get("weakness"),
            "resistance": c.get("resistance"),
            "retreat_cost": c.get("retreat_cost"),
            "image_url": c.get("image_url"),
            "height": c.get("height"),
            "weight": c.get("weight"),
            "flavor_text": c.get("flavor_text"),
            "illustrator": c.get("illustrator"),
            "regulation_mark": c.get("regulation_mark"),
        })

    batch_size = 50
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        client.table("cards").upsert(batch, on_conflict="card_id").execute()
        print(f"  Upserted cards {i + 1}–{i + len(batch)}/{len(rows)}")

    print(f"  Done. {len(rows)} cards seeded.")


def main():
    parser = argparse.ArgumentParser(description="Seed Supabase from scraped card JSON")
    parser.add_argument("files", nargs="+", help="JSON file(s) to seed")
    args = parser.parse_args()

    client = get_client()
    for path in args.files:
        seed_file(path, client)


if __name__ == "__main__":
    main()
