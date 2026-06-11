export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { Nav } from "@/components/nav"
import { Badge } from "@/components/ui/badge"
import { notFound } from "next/navigation"
import Link from "next/link"
import { CollectionControls } from "@/components/collection-controls"

const ENERGY_LABEL: Record<string, string> = {
  Grass: "草", Fire: "火", Water: "水", Lightning: "雷",
  Psychic: "超", Fighting: "鬥", Darkness: "惡", Metal: "鋼",
  Dragon: "龍", Colorless: "普通",
}

// Attack costs keep the card-text convention: colorless cost is 無, not 普通
const COST_LABEL: Record<string, string> = { ...ENERGY_LABEL, Colorless: "無" }

export default async function CardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: card } = await supabase
    .from("cards")
    .select("*")
    .eq("card_id", id)
    .single()

  if (!card) notFound()

  const selfHosted = process.env.NEXT_PUBLIC_SELF_HOSTED === "true"
  const { data: { user } } = selfHosted ? { data: { user: null } } : await supabase.auth.getUser()
  let collection = null
  if (user) {
    const { data } = await supabase
      .from("user_collections")
      .select("quantity_owned, want")
      .eq("user_id", user.id)
      .eq("card_id", id)
      .single()
    collection = data
  }

  const attacks = card.attacks as Array<{ name: string; cost: string[]; damage: string; effect: string }> ?? []

  return (
    <>
      <Nav />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-[280px_1fr] gap-8">
          {/* Card image */}
          <div>
            {card.image_url ? (
              <img src={card.image_url} alt={card.name} className="w-full rounded-xl shadow-lg" />
            ) : (
              <div className="w-full aspect-[2.5/3.5] bg-muted rounded-xl flex items-center justify-center text-muted-foreground">
                無圖片
              </div>
            )}
            {user && (
              <div className="mt-4">
                <CollectionControls
                  cardId={id}
                  initialQuantity={collection?.quantity_owned ?? 0}
                  initialWant={collection?.want ?? false}
                />
              </div>
            )}
          </div>

          {/* Card info */}
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {card.stage && <Badge variant="outline">{card.stage}</Badge>}
                <h1 className="text-3xl font-bold">{card.name}</h1>
                {card.hp && <span className="text-lg text-muted-foreground">HP {card.hp}</span>}
                {card.type && <Badge>{ENERGY_LABEL[card.type] ?? card.type}</Badge>}
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Link href={`/sets/${card.expansion_code}`} className="text-sm text-muted-foreground hover:underline">
                  {card.expansion_name}
                </Link>
                <span className="text-sm text-muted-foreground">{card.collector_number}</span>
                {card.regulation_mark && <Badge variant="secondary">{card.regulation_mark}</Badge>}
              </div>
            </div>

            {/* Attacks */}
            {attacks.length > 0 && (
              <div className="space-y-2">
                <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">技能</h2>
                {attacks.map((atk, i) => (
                  <div key={i} className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {atk.cost.map(c => COST_LABEL[c] ?? c).join(" ")}
                        </span>
                        <span className="font-semibold">{atk.name}</span>
                      </div>
                      {atk.damage && <span className="font-bold">{atk.damage}</span>}
                    </div>
                    {atk.effect && <p className="text-sm text-muted-foreground">{atk.effect}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Stats — Pokémon only (trainers/energies have no retreat cost) */}
            {card.stage && (
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              {card.weakness && (
                <div className="border rounded-lg p-2">
                  <p className="text-muted-foreground text-xs">弱點</p>
                  <p className="font-medium">
                    {ENERGY_LABEL[(card.weakness as { type: string }).type] ?? (card.weakness as { type: string }).type}
                    {" "}{(card.weakness as { modifier: string }).modifier}
                  </p>
                </div>
              )}
              {card.resistance && (
                <div className="border rounded-lg p-2">
                  <p className="text-muted-foreground text-xs">抵抗力</p>
                  <p className="font-medium">
                    {ENERGY_LABEL[(card.resistance as { type: string }).type] ?? (card.resistance as { type: string }).type}
                    {" "}{(card.resistance as { modifier: string }).modifier}
                  </p>
                </div>
              )}
              {card.retreat_cost != null && (
                <div className="border rounded-lg p-2">
                  <p className="text-muted-foreground text-xs">退場費</p>
                  <p className="font-medium">{card.retreat_cost}</p>
                </div>
              )}
            </div>
            )}

            {/* Pokédex info */}
            {card.dex_number && (
              <div className="border rounded-lg p-3 space-y-1 text-sm">
                <div className="flex gap-4 flex-wrap">
                  <span className="text-muted-foreground">No.{String(card.dex_number).padStart(4, "0")}</span>
                  {card.species && <span>{card.species}</span>}
                  {card.height && <span>{card.height}</span>}
                  {card.weight && <span>{card.weight}</span>}
                </div>
                {card.flavor_text && <p className="text-muted-foreground">{card.flavor_text}</p>}
              </div>
            )}

            {/* Evo line link */}
            {card.dex_number && (
              <Link href={`/evo/${card.dex_number}`} className="text-sm underline text-muted-foreground">
                查看進化線
              </Link>
            )}

            {card.illustrator && (
              <p className="text-xs text-muted-foreground">繪師：{card.illustrator}</p>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
