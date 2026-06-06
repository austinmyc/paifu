"use client"

import { useState, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Props {
  cardId: string
  initialQuantity: number
  initialWant: boolean
}

export function CollectionControls({ cardId, initialQuantity, initialWant }: Props) {
  const [qty, setQty] = useState(initialQuantity)
  const [want, setWant] = useState(initialWant)
  const [pending, startTransition] = useTransition()

  async function upsert(quantity: number, wantVal: boolean) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from("user_collections").upsert(
      { user_id: user.id, card_id: cardId, quantity_owned: quantity, want: wantVal },
      { onConflict: "user_id,card_id" }
    )
    if (error) toast.error("更新失敗")
  }

  function changeQty(delta: number) {
    const next = Math.max(0, qty + delta)
    setQty(next)
    startTransition(() => upsert(next, want))
  }

  function toggleWant() {
    const next = !want
    setWant(next)
    startTransition(() => upsert(qty, next))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">持有數量</span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => changeQty(-1)} disabled={pending || qty === 0}>−</Button>
          <span className="w-6 text-center font-mono">{qty}</span>
          <Button size="sm" variant="outline" onClick={() => changeQty(1)} disabled={pending}>+</Button>
        </div>
      </div>
      <Button
        variant={want ? "default" : "outline"}
        size="sm"
        onClick={toggleWant}
        disabled={pending}
        className="w-full"
      >
        {want ? "✓ 已加入願望清單" : "加入願望清單"}
      </Button>
    </div>
  )
}
