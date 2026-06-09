"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Props {
  cardId: string
  initialQuantity: number
  initialWant: boolean
  onQtyChange?: (qty: number) => void
  onWantChange?: (want: boolean) => void
}

function lsKey(cardId: string) {
  return `paifu:col:${cardId}`
}

function readCache(cardId: string): { qty: number; want: boolean } | null {
  try {
    const raw = localStorage.getItem(lsKey(cardId))
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function writeCache(cardId: string, qty: number, want: boolean) {
  try {
    localStorage.setItem(lsKey(cardId), JSON.stringify({ qty, want }))
  } catch {}
}

async function syncToSupabase(cardId: string, quantity: number, want: boolean) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { error } = await supabase.from("user_collections").upsert(
    { user_id: user.id, card_id: cardId, quantity_owned: quantity, want },
    { onConflict: "user_id,card_id" }
  )
  if (error) toast.error("更新失敗")
}

export function CollectionControls({ cardId, initialQuantity, initialWant, onQtyChange, onWantChange }: Props) {
  const cached = readCache(cardId)
  const [qty, setQty] = useState(cached?.qty ?? initialQuantity)
  const [want, setWant] = useState(cached?.want ?? initialWant)

  useEffect(() => {
    const cached = readCache(cardId)
    if (cached) {
      setQty(cached.qty)
      setWant(cached.want)
    }
  }, [cardId])

  function changeQty(delta: number) {
    const next = Math.max(0, qty + delta)
    setQty(next)
    writeCache(cardId, next, want)
    syncToSupabase(cardId, next, want)
    onQtyChange?.(next)
  }

  function toggleWant() {
    const next = !want
    setWant(next)
    writeCache(cardId, qty, next)
    syncToSupabase(cardId, qty, next)
    onWantChange?.(next)
  }

  return (
    <div className="flex items-center gap-2">
      {/* Quantity */}
      <div className="flex items-center gap-1.5">
        <Button size="sm" variant="outline" onClick={() => changeQty(-1)} disabled={qty === 0} className="h-7 w-7 p-0">−</Button>
        <span className="w-6 text-center font-mono text-sm">{qty}</span>
        <Button size="sm" variant="outline" onClick={() => changeQty(1)} className="h-7 w-7 p-0">+</Button>
      </div>
      {/* Wishlist */}
      <Button
        variant={want ? "default" : "outline"}
        size="sm"
        onClick={toggleWant}
        className="flex-1 h-7 text-xs"
      >
        {want ? "✓ 願望清單" : "加入願望清單"}
      </Button>
    </div>
  )
}
