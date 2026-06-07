export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { Nav } from "@/components/nav"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { redirect } from "next/navigation"

type Filter = "all" | "owned" | "want"

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; set?: string }>
}) {
  const { filter = "all", set } = await searchParams
  const supabase = await createClient()

  const selfHosted = process.env.NEXT_PUBLIC_SELF_HOSTED === "true"
  const { data: { user } } = selfHosted ? { data: { user: { id: "local" } } } : await supabase.auth.getUser()
  if (!selfHosted && !user) redirect("/login")

  let query = supabase
    .from("user_collections")
    .select("quantity_owned, want, cards(card_id, name, image_url, collector_number, expansion_code, type, stage)")
    .eq("user_id", user!.id)

  if (filter === "owned") query = query.gt("quantity_owned", 0)
  if (filter === "want") query = query.eq("want", true)

  const { data: rows, error } = await query

  if (error) console.error("collection query error", JSON.stringify(error))

  const toCard = (c: unknown) => (Array.isArray(c) ? c[0] : c) as {
    card_id: string; name: string; image_url: string | null
    collector_number: string; expansion_code: string; stage: string | null
  } | null

  const filtered = (set
    ? rows?.filter(r => toCard(r.cards)?.expansion_code === set)
    : rows
  )?.filter(r => toCard(r.cards) != null)

  const filterLabel: Record<string, string> = { all: "全部", owned: "持有", want: "願望" }

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">我的收藏</h1>

        <div className="flex gap-2 mb-6">
          {(["all", "owned", "want"] as Filter[]).map(f => (
            <Link
              key={f}
              href={`/collection?filter=${f}${set ? `&set=${set}` : ""}`}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${filter === f ? "bg-foreground text-background" : "hover:bg-muted"}`}
            >
              {filterLabel[f]}
            </Link>
          ))}
        </div>

        {!filtered?.length && (
          <p className="text-muted-foreground">沒有符合條件的卡牌。</p>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {filtered?.map(row => {
            const card = toCard(row.cards)!
            return (
              <Link key={card.card_id} href={`/card/${card.card_id}`} className="group">
                <div className="rounded-lg overflow-hidden border bg-card hover:shadow-md transition-shadow relative">
                  {card.image_url ? (
                    <img src={card.image_url} alt={card.name} className="w-full aspect-[2.5/3.5] object-cover" />
                  ) : (
                    <div className="w-full aspect-[2.5/3.5] bg-muted flex items-center justify-center text-xs text-muted-foreground p-1 text-center">
                      {card.name}
                    </div>
                  )}
                  {row.quantity_owned > 0 && (
                    <span className="absolute top-1 right-1 bg-black/70 text-white text-xs rounded px-1">
                      ×{row.quantity_owned}
                    </span>
                  )}
                  {row.want && (
                    <span className="absolute top-1 left-1 text-xs">♡</span>
                  )}
                  <div className="p-1.5">
                    <p className="text-xs font-medium truncate">{card.name}</p>
                    <p className="text-xs text-muted-foreground">{card.collector_number}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </>
  )
}
