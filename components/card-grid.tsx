"use client"

import { useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Sheet } from "@/components/ui/sheet"
import { CollectionControls } from "@/components/collection-controls"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

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

interface Props {
  cards: CardSummary[]
  isLoggedIn: boolean
}

export function CardGrid({ cards, isLoggedIn }: Props) {
  // qty map keyed by card_id, lazily populated from localStorage on hover
  const [qtys, setQtys] = useState<Record<string, number>>({})
  const loadedQtys = useRef<Set<string>>(new Set())

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

  const openDrawer = useCallback(async (cardId: string) => {
    setDetail(null)
    setLoading(true)
    setOpen(true)

    const cached = lsRead(cardId)
    setColInit(cached ?? { qty: qtys[cardId] ?? 0, want: false })

    const supabase = createClient()
    const [{ data: card }, authResult] = await Promise.all([
      supabase.from("cards").select("*").eq("card_id", cardId).single(),
      isLoggedIn ? supabase.auth.getUser() : Promise.resolve({ data: { user: null } }),
    ])

    if (card) setDetail(card as CardDetail)

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
              <p className="text-xs text-muted-foreground">{card.collector_number}</p>
            </div>

            {isLoggedIn && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none group-hover:pointer-events-auto">
                <div className="absolute top-1/3 inset-x-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="7" />
                    <line x1="16.5" y1="16.5" x2="22" y2="22" />
                  </svg>
                </div>
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
            )}
          </div>
        ))}
      </div>

      <Sheet open={open} onClose={closeDrawer}>
        <div className="p-5 space-y-5">
          <button onClick={closeDrawer} className="text-muted-foreground hover:text-foreground text-sm">
            ← 返回
          </button>

          {loading && !detail && (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">載入中…</div>
          )}

          {detail && (
            <>
              <div className="flex gap-4">
                {detail.image_url ? (
                  <img src={detail.image_url} alt={detail.name} className="w-32 rounded-xl shadow" />
                ) : (
                  <div className="w-32 aspect-[2.5/3.5] bg-muted rounded-xl flex items-center justify-center text-xs text-muted-foreground">
                    無圖片
                  </div>
                )}
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1 items-center">
                    {detail.stage && <Badge variant="outline" className="text-xs">{detail.stage}</Badge>}
                    {detail.type && <Badge className="text-xs">{ENERGY_LABEL[detail.type] ?? detail.type}</Badge>}
                  </div>
                  <h2 className="text-xl font-bold">{detail.name}</h2>
                  {detail.hp && <p className="text-sm text-muted-foreground">HP {detail.hp}</p>}
                  <div className="flex gap-2 flex-wrap">
                    <Link href={`/sets/${detail.expansion_code}`} className="text-xs text-muted-foreground hover:underline" onClick={closeDrawer}>
                      {detail.expansion_name}
                    </Link>
                    <span className="text-xs text-muted-foreground">{detail.collector_number}</span>
                  </div>
                </div>
              </div>

              {isLoggedIn && (
                <CollectionControls
                  cardId={detail.card_id}
                  initialQuantity={colInit.qty}
                  initialWant={colInit.want}
                />
              )}

              {(detail.attacks?.length ?? 0) > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">技能</h3>
                  {detail.attacks!.map((atk, i) => (
                    <div key={i} className="border rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {atk.cost.map(c => ENERGY_LABEL[c] ?? c).join(" ")}
                          </span>
                          <span className="font-semibold text-sm">{atk.name}</span>
                        </div>
                        {atk.damage && <span className="font-bold text-sm">{atk.damage}</span>}
                      </div>
                      {atk.effect && <p className="text-xs text-muted-foreground">{atk.effect}</p>}
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-sm">
                {detail.weakness && (
                  <div className="border rounded-lg p-2 text-center">
                    <p className="text-muted-foreground text-xs">弱點</p>
                    <p className="font-medium text-sm">{ENERGY_LABEL[detail.weakness.type] ?? detail.weakness.type} {detail.weakness.modifier}</p>
                  </div>
                )}
                {detail.resistance && (
                  <div className="border rounded-lg p-2 text-center">
                    <p className="text-muted-foreground text-xs">抵抗力</p>
                    <p className="font-medium text-sm">{ENERGY_LABEL[detail.resistance.type] ?? detail.resistance.type} {detail.resistance.modifier}</p>
                  </div>
                )}
                {detail.retreat_cost != null && (
                  <div className="border rounded-lg p-2 text-center">
                    <p className="text-muted-foreground text-xs">退場費</p>
                    <p className="font-medium text-sm">{detail.retreat_cost}</p>
                  </div>
                )}
              </div>

              {detail.dex_number && (
                <div className="border rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex gap-4 flex-wrap">
                    <span className="text-muted-foreground">No.{String(detail.dex_number).padStart(4, "0")}</span>
                    {detail.species && <span>{detail.species}</span>}
                    {detail.height && <span>{detail.height}</span>}
                    {detail.weight && <span>{detail.weight}</span>}
                  </div>
                  {detail.flavor_text && <p className="text-muted-foreground text-xs">{detail.flavor_text}</p>}
                </div>
              )}

              <div className="flex gap-3 text-sm">
                {detail.dex_number && (
                  <Link href={`/evo/${detail.dex_number}`} className="underline text-muted-foreground" onClick={closeDrawer}>
                    查看進化線
                  </Link>
                )}
                <Link href={`/card/${detail.card_id}`} className="underline text-muted-foreground" onClick={closeDrawer}>
                  完整頁面
                </Link>
              </div>

              {detail.illustrator && (
                <p className="text-xs text-muted-foreground">繪師：{detail.illustrator}</p>
              )}
            </>
          )}
        </div>
      </Sheet>
    </>
  )
}
