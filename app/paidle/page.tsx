export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import { Nav } from "@/components/nav"
import { PaidleClient } from "./PaidleClient"

export type PaidleCard = {
  card_id: string
  name: string
  stage: string
  hp: number | null
  type: string | null
  retreat_cost: number | null
  weight: string | null
  regulation_mark: string | null
  attacks: { name: string; damage: string; cost: string[] }[] | null
  expansion_code: string | null
  collector_number: string | null
  image_url: string | null
}

function parseCollectorNumber(cn: string | null): { num: number; total: number } | null {
  if (!cn) return null
  const m = cn.match(/^(\d+)\/(\d+)$/)
  if (!m) return null
  return { num: parseInt(m[1]), total: parseInt(m[2]) }
}

function attackFingerprint(attacks: PaidleCard["attacks"]): string {
  if (!attacks) return ""
  return attacks
    .map(a => `${a.name}:${a.damage}`)
    .sort()
    .join("|")
}

export default async function PaidlePage() {
  const supabase = await createClient()

  const { data: raw } = await supabase
    .from("cards")
    .select(
      "card_id, name, stage, hp, type, retreat_cost, weight, regulation_mark, attacks, expansion_code, collector_number, image_url"
    )
    .not("stage", "is", null)
    .order("card_id", { ascending: true })

  const cards = (raw ?? []) as (PaidleCard & { collector_number: string | null })[]

  // Exclude secret rares (collector num > set total)
  const base = cards.filter(c => {
    const parsed = parseCollectorNumber(c.collector_number)
    if (!parsed) return false
    return parsed.num <= parsed.total
  })

  // Deduplicate: same name + hp + attacks → keep earliest card_id
  const seen = new Map<string, boolean>()
  const eligible: PaidleCard[] = []
  for (const c of base) {
    const key = `${c.name}|${c.hp}|${attackFingerprint(c.attacks)}`
    if (!seen.has(key)) {
      seen.set(key, true)
      eligible.push({
        card_id: c.card_id,
        name: c.name,
        stage: c.stage,
        hp: c.hp,
        type: c.type,
        retreat_cost: c.retreat_cost,
        weight: c.weight,
        regulation_mark: c.regulation_mark,
        attacks: c.attacks,
        expansion_code: c.expansion_code,
        collector_number: c.collector_number,
        image_url: c.image_url,
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0d1b2e" }}>
      <Nav />
      <PaidleClient cards={eligible} />
    </div>
  )
}
