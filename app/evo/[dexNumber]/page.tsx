export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { Nav } from "@/components/nav"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { notFound } from "next/navigation"

const STAGE_ORDER = ["基礎", "1階進化", "2階進化"]
const STAGE_LABEL: Record<string, string> = {
  "基礎": "基礎",
  "1階進化": "1階進化",
  "2階進化": "2階進化",
}

export default async function EvoPage({ params }: { params: Promise<{ dexNumber: string }> }) {
  const { dexNumber } = await params
  const dex = parseInt(dexNumber)
  if (isNaN(dex)) notFound()

  const supabase = await createClient()

  const { data: cards } = await supabase
    .from("cards")
    .select("card_id, name, stage, evolves_from, image_url, collector_number, expansion_code, expansion_name, type")
    .eq("dex_number", dex)
    .order("expansion_code")
    .order("collector_number")

  if (!cards?.length) notFound()

  const selfHosted = process.env.NEXT_PUBLIC_SELF_HOSTED === "true"
  const { data: { user } } = selfHosted ? { data: { user: null } } : await supabase.auth.getUser()
  let collectionMap: Record<string, { quantity_owned: number; want: boolean }> = {}
  if (user) {
    const ids = cards.map(c => c.card_id)
    const { data: cols } = await supabase
      .from("user_collections")
      .select("card_id, quantity_owned, want")
      .eq("user_id", user.id)
      .in("card_id", ids)
    cols?.forEach(c => { collectionMap[c.card_id] = c })
  }

  // Group by stage; cards without a stage go under their name
  const byStage: Record<string, typeof cards> = {}
  for (const card of cards) {
    const key = card.stage ?? "其他"
    if (!byStage[key]) byStage[key] = []
    byStage[key].push(card)
  }

  const stageKeys = [
    ...STAGE_ORDER.filter(s => byStage[s]),
    ...Object.keys(byStage).filter(s => !STAGE_ORDER.includes(s)),
  ]

  const pokemonName = cards[0].name

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">{pokemonName} 進化線</h1>
        <p className="text-sm text-muted-foreground mb-8">No.{String(dex).padStart(4, "0")}</p>

        <div className="flex items-start gap-4 overflow-x-auto pb-4">
          {stageKeys.map((stage, idx) => (
            <div key={stage} className="flex items-start gap-4 shrink-0">
              {idx > 0 && (
                <div className="flex items-center self-center text-muted-foreground text-2xl mt-8">▶</div>
              )}
              <div className="space-y-2">
                <div className="text-center">
                  <Badge variant="outline">{STAGE_LABEL[stage] ?? stage}</Badge>
                </div>
                <div className="flex flex-col gap-2">
                  {byStage[stage].map(card => {
                    const col = collectionMap[card.card_id]
                    return (
                      <Link key={card.card_id} href={`/card/${card.card_id}`}>
                        <div className="w-32 rounded-lg border bg-card hover:shadow-md transition-shadow overflow-hidden relative">
                          {card.image_url ? (
                            <img src={card.image_url} alt={card.name} className="w-full aspect-[2.5/3.5] object-cover" />
                          ) : (
                            <div className="w-full aspect-[2.5/3.5] bg-muted flex items-center justify-center text-xs text-muted-foreground p-1 text-center">
                              {card.name}
                            </div>
                          )}
                          {col?.quantity_owned && col.quantity_owned > 0 ? (
                            <span className="absolute top-1 right-1 bg-black/70 text-white text-xs rounded px-1">
                              ×{col.quantity_owned}
                            </span>
                          ) : null}
                          {col?.want && (
                            <span className="absolute top-1 left-1 text-xs">♡</span>
                          )}
                          <div className="p-1.5 text-xs">
                            <p className="font-medium truncate">{card.name}</p>
                            <p className="text-muted-foreground">{card.expansion_code} {card.collector_number}</p>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
