"use client"

import { useState } from "react"
import Link from "next/link"
import { CardGrid } from "@/components/card-grid"

type Card = {
  card_id: string; name: string; image_url: string | null
  collector_number: string; expansion_code: string
  stage: string | null; type: string | null; dex_number: number | null
}

export function WishlistView({ initialCards }: { initialCards: Card[] }) {
  const [cards, setCards] = useState(initialCards)
  const [exporting, setExporting] = useState(false)

  function handleWantChange(cardId: string, want: boolean) {
    if (!want) setCards(prev => prev.filter(c => c.card_id !== cardId))
  }

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch("/api/wishlist-export")
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "paifu-wishlist.png"
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const bySet = new Map<string, Card[]>()
  for (const card of cards) {
    if (!bySet.has(card.expansion_code)) bySet.set(card.expansion_code, [])
    bySet.get(card.expansion_code)!.push(card)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm" style={{ color: "rgba(26,58,110,0.5)" }}>{cards.length} 張卡牌</span>
        {cards.length > 0 && (
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: "rgba(26,58,110,0.08)", color: "#1a3a6e" }}
          >
            {exporting ? "匯出中…" : "匯出圖片"}
          </button>
        )}
      </div>

      {cards.length === 0 && (
        <p className="text-muted-foreground">還沒有願望卡牌。在卡牌頁面點擊 ♡ 即可加入。</p>
      )}

      <div className="flex flex-col gap-10">
        {[...bySet.entries()].map(([setCode, setCards]) => (
          <section key={setCode}>
            <div className="flex items-center gap-2 mb-3">
              <Link
                href={`/sets/${setCode}`}
                className="text-sm font-semibold px-2.5 py-0.5 rounded-full hover:opacity-80 transition-opacity"
                style={{ background: "rgba(26,58,110,0.08)", color: "#1a3a6e" }}
              >
                {setCode}
              </Link>
              <span className="text-xs" style={{ color: "rgba(26,58,110,0.4)" }}>{setCards.length} 張</span>
            </div>
            <CardGrid cards={setCards} isLoggedIn={true} onWantChange={handleWantChange} />
          </section>
        ))}
      </div>
    </>
  )
}
