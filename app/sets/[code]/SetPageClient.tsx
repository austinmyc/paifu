"use client"
import { useState } from "react"
import { CardGrid } from "@/components/card-grid"

interface CardSummary {
  card_id: string
  name: string
  stage: string | null
  type: string | null
  collector_number: string | null
  image_url: string | null
  dex_number: number | null
}

function CollectionBar({ label, owned, total }: { label: string; owned: number; total: number }) {
  const pct = total > 0 ? Math.round((owned / total) * 100) : 0
  return (
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(26,58,110,0.08)" }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, #1a3a6e, #f5c842)" }}
        />
      </div>
      <span className="text-xs tabular-nums flex-shrink-0" style={{ color: "#1a3a6e", minWidth: 80 }}>
        {owned}/{total} {label}
      </span>
    </div>
  )
}

interface Props {
  cards: CardSummary[]
  isLoggedIn: boolean
  isPromo: boolean
  initialOwnedIds: string[]
  normalCardIds: string[]
  normalCount: number
}

export function SetPageClient({ cards, isLoggedIn, isPromo, initialOwnedIds, normalCardIds, normalCount }: Props) {
  const [ownedIds, setOwnedIds] = useState<Set<string>>(() => new Set(initialOwnedIds))

  const normalIdSet = new Set(normalCardIds)
  const normalOwned = [...ownedIds].filter(id => normalIdSet.has(id)).length
  const totalOwned = ownedIds.size

  function handleQtyChange(cardId: string, qty: number) {
    setOwnedIds(prev => {
      const next = new Set(prev)
      if (qty > 0) next.add(cardId)
      else next.delete(cardId)
      return next
    })
  }

  return (
    <>
      {isLoggedIn && (
        <div className="mb-8 rounded-xl px-4 py-3" style={{ background: "rgba(26,58,110,0.04)", border: "1px solid rgba(26,58,110,0.08)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "rgba(26,58,110,0.5)" }}>收藏進度</p>
          {isPromo ? (
            <CollectionBar label="張" owned={totalOwned} total={cards.length} />
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
              <CollectionBar label="一般卡" owned={normalOwned} total={normalCount} />
              <CollectionBar label="全卡" owned={totalOwned} total={cards.length} />
            </div>
          )}
        </div>
      )}
      <CardGrid cards={cards} isLoggedIn={isLoggedIn} onQtyChange={handleQtyChange} />
    </>
  )
}
