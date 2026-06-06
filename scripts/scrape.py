"""
Scrape card data from asia.pokemon-card.com/hk for any expansion code.

Usage:
    python scripts/scrape.py M1
    python scripts/scrape.py M5 --output data/M5.json
    python scripts/scrape.py M1 M2 M3  # multiple sets
"""

import argparse
import json
import re
import time

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://asia.pokemon-card.com"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ptcg-scraper/1.0)"}
DELAY = 0.5


def _get(url: str) -> BeautifulSoup:
    resp = requests.get(url, headers=HEADERS, timeout=15)
    resp.raise_for_status()
    time.sleep(DELAY)
    return BeautifulSoup(resp.text, "html.parser")


_SESSION = requests.Session()
_SESSION.headers.update({
    **HEADERS,
    "Referer": f"{BASE_URL}/hk/card-search/list/",
    "Origin": BASE_URL,
})
# Prime the session once so cookies/state are set
_SESSION_PRIMED = False


def _prime_session():
    global _SESSION_PRIMED
    if not _SESSION_PRIMED:
        _SESSION.get(f"{BASE_URL}/hk/card-search/list/", timeout=15)
        _SESSION_PRIMED = True


def _post_list(expansion_code: str, page: int = 1) -> BeautifulSoup:
    """POST to the card search list endpoint (GET returns 0 results)."""
    _prime_session()
    url = f"{BASE_URL}/hk/card-search/list/"
    data = [
        ("sortCondition", ""),
        ("keyword", ""),
        ("cardType", "all"),
        ("regulation", "all"),
        ("expansionCodes", expansion_code),
        ("pageNo", str(page)),
    ]
    resp = _SESSION.post(url, data=data, timeout=15)
    resp.raise_for_status()
    time.sleep(DELAY)
    return BeautifulSoup(resp.text, "html.parser")


def _energy_type(img_src: str) -> str:
    m = re.search(r"/energy/(\w+)\.png", img_src)
    return m.group(1) if m else img_src


def scrape_list_page(expansion_code: str, page: int = 1) -> tuple[list[str], int]:
    soup = _post_list(expansion_code, page)

    detail_urls = [
        BASE_URL + a["href"]
        for li in soup.select("li.card")
        for a in li.select("a[href]")
    ]

    total_pages = 1
    total_tag = soup.select_one("p.resultTotalPages")
    if total_tag:
        m = re.search(r"\d+", total_tag.get_text())
        if m:
            total_pages = int(m.group())

    return detail_urls, total_pages


def get_all_detail_urls(expansion_code: str) -> list[str]:
    urls, total_pages = scrape_list_page(expansion_code, page=1)
    print(f"  Page 1/{total_pages} — {len(urls)} cards")
    for page in range(2, total_pages + 1):
        page_urls, _ = scrape_list_page(expansion_code, page=page)
        print(f"  Page {page}/{total_pages} — {len(page_urls)} cards")
        urls.extend(page_urls)
    print(f"Total cards found: {len(urls)}")
    return urls


def scrape_card_detail(url: str) -> dict:
    soup = _get(url)
    card_id = url.rstrip("/").split("/")[-1]
    data: dict = {"card_id": card_id, "detail_url": url}

    # Name & stage
    header = soup.select_one("h1.pageHeader.cardDetail")
    if header:
        stage_tag = header.select_one("span.evolveMarker")
        data["stage"] = stage_tag.get_text(strip=True) if stage_tag else None
        if stage_tag:
            stage_tag.decompose()
        data["name"] = header.get_text(strip=True)

    # Image
    img = soup.select_one("section.imageColumn img[src]")
    data["image_url"] = img["src"] if img else None

    # HP & type
    main_info = soup.select_one("p.mainInfomation")
    if main_info:
        hp_tag = main_info.select_one("span.number")
        data["hp"] = int(hp_tag.get_text(strip=True)) if hp_tag else None
        type_img = main_info.select_one("img[src]")
        data["type"] = _energy_type(type_img["src"]) if type_img else None
    else:
        data["hp"] = None
        data["type"] = None

    # Evolves from — use the evolution chain div on the detail page.
    # Stage 1 (1階進化) → pre-evo is in ul.evolutionStep.first
    # Stage 2 (2階進化) → pre-evo is in ul.evolutionStep.second
    # Each level can have multiple parallel cards (regular + ex); take the first one.
    evolves_from = None
    stage_val = data.get("stage", "")
    evo_div = soup.select_one("div.evolution")
    if evo_div and stage_val:
        if "1階" in stage_val:
            pre_list = evo_div.select_one("ul.evolutionStep.first")
        elif "2階" in stage_val:
            pre_list = evo_div.select_one("ul.evolutionStep.second")
        else:
            pre_list = None
        if pre_list:
            first_step = pre_list.select_one("li.step a")
            evolves_from = first_step.get_text(strip=True) if first_step else None
    data["evolves_from"] = evolves_from

    # Attacks
    attacks = []
    for skill in soup.select("div.skill"):
        name = skill.select_one("span.skillName")
        damage_tag = skill.select_one("span.skillDamage")
        effect_tag = skill.select_one("p.skillEffect")
        cost_imgs = skill.select("span.skillCost img[src]")
        attacks.append({
            "name": name.get_text(strip=True) if name else None,
            "cost": [_energy_type(i["src"]) for i in cost_imgs],
            "damage": damage_tag.get_text(strip=True) if damage_tag else "",
            "effect": effect_tag.get_text(strip=True) if effect_tag else "",
        })
    data["attacks"] = attacks

    # Weakness / Resistance / Retreat
    weak_td = soup.select_one("td.weakpoint")
    if weak_td:
        weak_img = weak_td.select_one("img[src]")
        weak_text = weak_td.get_text(strip=True)
        data["weakness"] = {
            "type": _energy_type(weak_img["src"]) if weak_img else None,
            "modifier": re.search(r"[×x\+\-]\d+", weak_text).group() if re.search(r"[×x\+\-]\d+", weak_text) else weak_text,
        }
    else:
        data["weakness"] = None

    resist_td = soup.select_one("td.resist")
    if resist_td:
        resist_img = resist_td.select_one("img[src]")
        resist_text = resist_td.get_text(strip=True)
        data["resistance"] = {
            "type": _energy_type(resist_img["src"]) if resist_img else None,
            "modifier": re.search(r"[×x\+\-]\d+", resist_text).group() if re.search(r"[×x\+\-]\d+", resist_text) else resist_text,
        } if resist_img else None
    else:
        data["resistance"] = None

    escape_td = soup.select_one("td.escape")
    data["retreat_cost"] = len(escape_td.select("img")) if escape_td else 0

    # Expansion / regulation / collector number
    exp_col = soup.select_one("section.expansionColumn")
    if exp_col:
        reg_tag = exp_col.select_one("span.alpha")
        data["regulation_mark"] = reg_tag.get_text(strip=True) if reg_tag else None
        num_tag = exp_col.select_one("span.collectorNumber")
        data["collector_number"] = num_tag.get_text(strip=True) if num_tag else None
        sym_img = exp_col.select_one("img[src]")
        data["expansion_symbol_url"] = sym_img["src"] if sym_img else None

    exp_link_col = soup.select_one("section.expansionLinkColumn a[href]")
    if exp_link_col:
        href = exp_link_col["href"]
        m = re.search(r"expansionCodes=(\w+)", href)
        data["expansion_code"] = m.group(1) if m else None
        data["expansion_name"] = exp_link_col.get_text(strip=True)

    # Pokédex info
    extra = soup.select_one("div.extraInformation")
    if extra:
        h3 = extra.select_one("h3")
        if h3:
            dex_text = h3.get_text(strip=True)
            m = re.match(r"No\.(\d+)\s*(.*)", dex_text)
            if m:
                data["dex_number"] = int(m.group(1))
                data["species"] = m.group(2).strip() or None
            else:
                data["dex_number"] = None
                data["species"] = dex_text
        size_values = [s.get_text(strip=True) for s in extra.select("p.size span.value")]
        data["height"] = size_values[0] if len(size_values) > 0 else None
        data["weight"] = size_values[1] if len(size_values) > 1 else None
        flavor = extra.select_one("p.discription")
        data["flavor_text"] = flavor.get_text(strip=True) if flavor else None
    else:
        data.update({"dex_number": None, "species": None, "height": None, "weight": None, "flavor_text": None})

    # Illustrator
    illustrator_div = soup.select_one("div.illustrator a")
    data["illustrator"] = illustrator_div.get_text(strip=True) if illustrator_div else None

    return data


def scrape_expansion(expansion_code: str, output_json: str | None = None) -> list[dict]:
    print(f"\nScraping expansion: {expansion_code}")
    detail_urls = get_all_detail_urls(expansion_code)

    cards = []
    for i, url in enumerate(detail_urls, 1):
        try:
            card = scrape_card_detail(url)
            cards.append(card)
            print(f"  [{i}/{len(detail_urls)}] {card.get('name', '?')} ({card.get('collector_number', '?')})")
        except Exception as e:
            print(f"  [{i}/{len(detail_urls)}] ERROR {url}: {e}")

    if output_json:
        with open(output_json, "w", encoding="utf-8") as f:
            json.dump(cards, f, ensure_ascii=False, indent=2)
        print(f"Saved {len(cards)} cards to {output_json}")

    return cards


def main():
    parser = argparse.ArgumentParser(description="Scrape PTCG HK card data")
    parser.add_argument("codes", nargs="+", help="Expansion code(s), e.g. M1 M2 M5")
    parser.add_argument("--output", "-o", help="Output JSON path (used only when scraping a single set)")
    args = parser.parse_args()

    if len(args.codes) == 1:
        code = args.codes[0]
        out = args.output or f"data/{code}.json"
        scrape_expansion(code, output_json=out)
    else:
        for code in args.codes:
            scrape_expansion(code, output_json=f"data/{code}.json")


if __name__ == "__main__":
    main()
