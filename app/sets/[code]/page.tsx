export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { Nav } from "@/components/nav"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { notFound } from "next/navigation"

export default async function SetPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()

  const { data: expansion } = await supabase
    .from("expansions")
    .select("*")
    .eq("code", code)
    .single()

  if (!expansion) notFound()

  const { data: cards } = await supabase
    .from("cards")
    .select("card_id, name, stage, type, collector_number, image_url, dex_number")
    .eq("expansion_code", code)
    .order("collector_number", { ascending: true })

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          {expansion.symbol_url && (
            <img src={expansion.symbol_url} alt={code} className="h-8 w-auto" />
          )}
          <div>
            <h1 className="text-2xl font-bold">{expansion.name}</h1>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary">{code}</Badge>
              {expansion.regulation_mark && <Badge variant="outline">{expansion.regulation_mark}</Badge>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {cards?.map(card => (
            <Link key={card.card_id} href={`/card/${card.card_id}`} className="group">
              <div className="rounded-lg overflow-hidden border bg-card hover:shadow-md transition-shadow">
                {card.image_url ? (
                  <img
                    src={card.image_url}
                    alt={card.name}
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
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  )
}
