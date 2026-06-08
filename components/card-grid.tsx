"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Sheet } from "@/components/ui/sheet"
import { CollectionControls } from "@/components/collection-controls"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { HypotrochoidLoader } from "@/components/hypotrochoid-loader"

interface CardSummary {
  card_id: string
  name: string
  stage: string | null
  type: string | null
  collector_number: string
  image_url: string | null
  dex_number: number | null
}

interface CardDetail extends CardSummary {
  hp: number | null
  attacks: Array<{ name: string; cost: string[]; damage: string; effect: string }> | null
  weakness: { type: string; modifier: string } | null
  resistance: { type: string; modifier: string } | null
  retreat_cost: number | null
  species: string | null
  height: string | null
  weight: string | null
  flavor_text: string | null
  illustrator: string | null
  expansion_code: string
  expansion_name: string | null
  regulation_mark: string | null
}

const ENERGY_LABEL: Record<string, string> = {
  Grass: "草", Fire: "火", Water: "水", Lightning: "雷",
  Psychic: "超", Fighting: "格", Darkness: "惡", Metal: "鋼",
  Dragon: "龍", Colorless: "無",
}

function lsRead(cardId: string): { qty: number; want: boolean } | null {
  try {
    const raw = localStorage.getItem(`paifu:col:${cardId}`)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function lsWrite(cardId: string, qty: number, want: boolean) {
  try {
    localStorage.setItem(`paifu:col:${cardId}`, JSON.stringify({ qty, want }))
  } catch {}
}

async function bgUpsert(cardId: string, qty: number, want: boolean) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  supabase.from("user_collections").upsert(
    { user_id: user.id, card_id: cardId, quantity_owned: qty, want },
    { onConflict: "user_id,card_id" }
  )
}

const STAGE_ORDER: Record<string, number> = { "基礎": 0, "1階進化": 1, "2階進化": 2 }
const STAGE_LABEL: Record<string, string> = { "基礎": "基礎", "1階進化": "1階", "2階進化": "2階" }

function EvoStrip({
  evoLine,
  currentCardId,
  onSelect,
}: {
  evoLine: { stage: string | null; card_id: string; name: string; image_url: string | null }[]
  currentCardId: string
  onSelect: (cardId: string) => void
}) {
  // Group by stage and pick one representative per stage (prefer the current card's stage slot)
  const byStage: Record<string, typeof evoLine> = {}
  for (const c of evoLine) {
    const s = c.stage ?? "基礎"
    if (!byStage[s]) byStage[s] = []
    byStage[s].push(c)
  }

  const stages = ["基礎", "1階進化", "2階進化"]

  return (
    <div className="flex gap-2">
      {stages.map(stage => {
        const group = byStage[stage]
        if (!group || group.length === 0) {
          return (
            <div key={stage} className="flex-1 aspect-[2.5/3.5] rounded-xl flex items-center justify-center text-xs text-muted-foreground"
              style={{ background: "rgba(26,58,110,0.04)", border: "1px dashed rgba(26,58,110,0.15)" }}>
              {STAGE_LABEL[stage]}
            </div>
          )
        }
        // Pick first card, or the current card if it's in this stage
        const pick = group.find(c => c.card_id === currentCardId) ?? group[0]
        const isActive = group.some(c => c.card_id === currentCardId)
        return (
          <div key={stage} className="flex-1 flex flex-col gap-1">
            {group.length > 1 && (
              <p className="text-center text-xs" style={{ color: "rgba(26,58,110,0.4)" }}>×{group.length}</p>
            )}
            <button
              onClick={() => onSelect(pick.card_id)}
              className="flex-1 rounded-xl overflow-hidden transition-all"
              style={{
                border: isActive ? "2px solid #f5c842" : "1px solid rgba(26,58,110,0.12)",
                boxShadow: isActive ? "0 0 8px rgba(245,200,66,0.4)" : undefined,
                background: "transparent",
                padding: 0,
              }}
            >
              {pick.image_url ? (
                <img src={pick.image_url} alt={pick.name} className="w-full h-full object-cover" style={{ aspectRatio: "2.5/3.5" }} />
              ) : (
                <div className="w-full aspect-[2.5/3.5] flex items-center justify-center text-xs text-muted-foreground"
                  style={{ background: "rgba(26,58,110,0.04)" }}>
                  {pick.name}
                </div>
              )}
            </button>
          </div>
        )
      })}
    </div>
  )
}

interface Props {
  cards: CardSummary[]
  isLoggedIn: boolean
}

export function CardGrid({ cards, isLoggedIn }: Props) {
  // qty map keyed by card_id — pre-populated from localStorage on mount
  const [qtys, setQtys] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return {}
    const result: Record<string, number> = {}
    for (const card of cards) {
      const cached = lsRead(card.card_id)
      if (cached && cached.qty > 0) result[card.card_id] = cached.qty
    }
    return result
  })
  const loadedQtys = useRef<Set<string>>(new Set(cards.map(c => c.card_id)))

  // Background sync: pull Supabase collection for this page's cards on mount
  useEffect(() => {
    if (!isLoggedIn) return
    const cardIds = cards.map(c => c.card_id)
    if (cardIds.length === 0) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from("user_collections")
        .select("card_id, quantity_owned, want")
        .eq("user_id", user.id)
        .in("card_id", cardIds)
        .then(({ data }) => {
          if (!data) return
          const updates: Record<string, number> = {}
          for (const row of data) {
            lsWrite(row.card_id, row.quantity_owned, row.want)
            if (row.quantity_owned > 0) updates[row.card_id] = row.quantity_owned
          }
          if (Object.keys(updates).length > 0) {
            setQtys(prev => ({ ...prev, ...updates }))
          }
        })
    })
  }, [isLoggedIn]) // eslint-disable-line react-hooks/exhaustive-deps

  function ensureQtyLoaded(cardId: string) {
    if (loadedQtys.current.has(cardId)) return
    loadedQtys.current.add(cardId)
    const cached = lsRead(cardId)
    if (cached) setQtys(prev => ({ ...prev, [cardId]: cached.qty }))
  }

  function adjustQty(cardId: string, delta: number) {
    const current = qtys[cardId] ?? 0
    const next = Math.max(0, current + delta)
    setQtys(prev => ({ ...prev, [cardId]: next }))
    const want = lsRead(cardId)?.want ?? false
    lsWrite(cardId, next, want)
    bgUpsert(cardId, next, want)
  }

  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<CardDetail | null>(null)
  const [colInit, setColInit] = useState<{ qty: number; want: boolean }>({ qty: 0, want: false })
  const [loading, setLoading] = useState(false)
  const [evoLine, setEvoLine] = useState<{ stage: string | null; card_id: string; name: string; image_url: string | null }[]>([])

  const openDrawer = useCallback(async (cardId: string) => {
    setDetail(null)
    setEvoLine([])
    setLoading(true)
    setOpen(true)

    const cached = lsRead(cardId)
    setColInit(cached ?? { qty: qtys[cardId] ?? 0, want: false })

    const supabase = createClient()
    const [{ data: card }, authResult] = await Promise.all([
      supabase.from("cards").select("*").eq("card_id", cardId).single(),
      isLoggedIn ? supabase.auth.getUser() : Promise.resolve({ data: { user: null } }),
    ])

    if (card) {
      setDetail(card as CardDetail)
      // Fetch evolution line cards (same dex_number)
      if (card.dex_number) {
        const { data: evoCards } = await supabase
          .from("cards")
          .select("card_id, name, stage, image_url")
          .eq("dex_number", card.dex_number)
          .order("collector_number", { ascending: true })
        if (evoCards) setEvoLine(evoCards)
      }
    }

    const user = (authResult as { data: { user: { id: string } | null } }).data.user
    if (user && !cached) {
      const { data: col } = await supabase
        .from("user_collections")
        .select("quantity_owned, want")
        .eq("user_id", user.id)
        .eq("card_id", cardId)
        .single()
      if (col) {
        setColInit({ qty: col.quantity_owned, want: col.want })
        setQtys(prev => ({ ...prev, [cardId]: col.quantity_owned }))
        lsWrite(cardId, col.quantity_owned, col.want)
      }
    }

    setLoading(false)
  }, [isLoggedIn, qtys])

  function closeDrawer() {
    setOpen(false)
    setTimeout(() => { setDetail(null); setLoading(false) }, 300)
  }

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {cards.map(card => (
          <div
            key={card.card_id}
            className="group relative cursor-pointer rounded-lg overflow-hidden border bg-card hover:shadow-md transition-shadow"
            onMouseEnter={() => isLoggedIn && ensureQtyLoaded(card.card_id)}
            onClick={() => openDrawer(card.card_id)}
          >
            {card.image_url ? (
              <img
                src={card.image_url}
                alt={card.name}
                loading="lazy"
                className="w-full aspect-[2.5/3.5] object-cover"
              />
            ) : (
              <div className="w-full aspect-[2.5/3.5] bg-muted flex items-center justify-center text-xs text-muted-foreground">
                {card.name}
              </div>
            )}
            <div className="p-1.5">
              <p className="text-xs font-medium truncate">{card.name}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{card.collector_number}</p>
                {isLoggedIn && (qtys[card.card_id] ?? 0) > 0 && (
                  <span
                    className="text-xs font-bold tabular-nums leading-none px-1.5 py-0.5 rounded-full"
                    style={{ background: "#1a3a6e", color: "#f5c842" }}
                  >
                    {qtys[card.card_id]}
                  </span>
                )}
              </div>
            </div>

            {isLoggedIn && (
              <>

                {/* Hover overlay with +/− controls */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none group-hover:pointer-events-auto">
                  <div className="absolute bottom-8 inset-x-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div
                      className="flex items-center gap-1 bg-background/90 rounded-full px-2 py-1 shadow text-xs font-medium"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        className="w-6 h-6 rounded-full hover:bg-muted flex items-center justify-center"
                        onClick={e => { e.stopPropagation(); adjustQty(card.card_id, -1) }}
                      >−</button>
                      <span className="w-4 text-center tabular-nums">{qtys[card.card_id] ?? 0}</span>
                      <button
                        className="w-6 h-6 rounded-full hover:bg-muted flex items-center justify-center"
                        onClick={e => { e.stopPropagation(); adjustQty(card.card_id, 1) }}
                      >+</button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <Sheet open={open} onClose={closeDrawer}>
        <div className="flex flex-col h-full overflow-hidden">

          {/* Close button */}
          <div className="px-5 pt-4 pb-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(26,58,110,0.08)" }}>
            <button onClick={closeDrawer} className="text-muted-foreground hover:text-foreground text-sm">← 返回</button>
          </div>

          {loading && !detail && (
            <div className="flex items-center justify-center flex-1">
              <HypotrochoidLoader size={96} color="#f5c842" />
            </div>
          )}

          {detail && (
            <>
              {/* ── Middle: 2-column layout, scrollable ── */}
              <div className="flex flex-1 overflow-hidden">

                {/* Left: card image */}
                <div className="flex-shrink-0 p-4 overflow-y-auto" style={{ width: "42%" }}>
                  {detail.image_url ? (
                    <img src={detail.image_url} alt={detail.name} className="w-full rounded-2xl shadow-lg" />
                  ) : (
                    <div className="w-full aspect-[2.5/3.5] bg-muted rounded-2xl flex items-center justify-center text-sm text-muted-foreground">無圖片</div>
                  )}
                </div>

                {/* Right: all card info */}
                <div className="flex-1 py-4 pr-5 overflow-y-auto space-y-4">

                  {/* Name + badges + HP */}
                  <div>
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {detail.stage && <Badge variant="outline" className="text-xs">{detail.stage}</Badge>}
                      {detail.type && <Badge className="text-xs">{ENERGY_LABEL[detail.type] ?? detail.type}</Badge>}
                    </div>
                    <h2 className="text-lg font-bold leading-tight" style={{ color: "#1a3a6e" }}>{detail.name}</h2>
                    <div className="flex gap-2 flex-wrap mt-1">
                      <Link href={`/sets/${detail.expansion_code}`} className="text-xs text-muted-foreground hover:underline" onClick={closeDrawer}>
                        {detail.expansion_name}
                      </Link>
                      <span className="text-xs text-muted-foreground">{detail.collector_number}</span>
                    </div>
                    {detail.illustrator && <p className="text-xs text-muted-foreground mt-0.5">繪師：{detail.illustrator}</p>}
                  </div>

                  {/* Collection controls */}
                  {isLoggedIn && (
                    <CollectionControls
                      cardId={detail.card_id}
                      initialQuantity={colInit.qty}
                      initialWant={colInit.want}
                    />
                  )}

                  {/* Stats */}
                  {(detail.weakness || detail.resistance || detail.retreat_cost != null) && (
                    <div className="grid grid-cols-3 gap-1.5">
                      {detail.weakness && (
                        <div className="rounded-lg p-2 text-center" style={{ background: "rgba(26,58,110,0.05)", border: "1px solid rgba(26,58,110,0.1)" }}>
                          <p className="text-muted-foreground text-xs">弱點</p>
                          <p className="font-semibold text-xs mt-0.5">{ENERGY_LABEL[detail.weakness.type] ?? detail.weakness.type} {detail.weakness.modifier}</p>
                        </div>
                      )}
                      {detail.resistance && (
                        <div className="rounded-lg p-2 text-center" style={{ background: "rgba(26,58,110,0.05)", border: "1px solid rgba(26,58,110,0.1)" }}>
                          <p className="text-muted-foreground text-xs">抵抗力</p>
                          <p className="font-semibold text-xs mt-0.5">{ENERGY_LABEL[detail.resistance.type] ?? detail.resistance.type} {detail.resistance.modifier}</p>
                        </div>
                      )}
                      {detail.retreat_cost != null && (
                        <div className="rounded-lg p-2 text-center" style={{ background: "rgba(26,58,110,0.05)", border: "1px solid rgba(26,58,110,0.1)" }}>
                          <p className="text-muted-foreground text-xs">退場費</p>
                          <p className="font-semibold text-xs mt-0.5">{detail.retreat_cost}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Attacks */}
                  {(detail.attacks?.length ?? 0) > 0 && (
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">技能</h3>
                      {detail.attacks!.map((atk, i) => (
                        <div key={i} className="rounded-lg p-2.5 space-y-1" style={{ background: "rgba(26,58,110,0.03)", border: "1px solid rgba(26,58,110,0.1)" }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground">{atk.cost.map(c => ENERGY_LABEL[c] ?? c).join(" ")}</span>
                              <span className="font-semibold text-sm">{atk.name}</span>
                            </div>
                            {atk.damage && <span className="font-bold text-sm" style={{ color: "#1a3a6e" }}>{atk.damage}</span>}
                          </div>
                          {atk.effect && <p className="text-xs text-muted-foreground">{atk.effect}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pokédex */}
                  {detail.dex_number && (
                    <div className="rounded-lg p-2.5" style={{ background: "rgba(26,58,110,0.03)", border: "1px solid rgba(26,58,110,0.1)" }}>
                      <div className="flex gap-3 flex-wrap text-xs text-muted-foreground">
                        <span>No.{String(detail.dex_number).padStart(4, "0")}</span>
                        {detail.species && <span>{detail.species}</span>}
                        {detail.height && <span>{detail.height}</span>}
                        {detail.weight && <span>{detail.weight}</span>}
                      </div>
                      {detail.flavor_text && <p className="text-xs text-muted-foreground mt-1">{detail.flavor_text}</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Bottom: evolution line — always visible ── */}
              {detail.dex_number && (
                <div className="flex-shrink-0 px-5 py-3" style={{ borderTop: "1px solid rgba(26,58,110,0.08)" }}>
                  <div className="mb-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#1a3a6e" }}>進化線</h3>
                  </div>
                  <EvoStrip evoLine={evoLine} currentCardId={detail.card_id} onSelect={openDrawer} />
                </div>
              )}
            </>
          )}
        </div>
      </Sheet>
    </>
  )
}
