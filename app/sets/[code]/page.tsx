export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { Nav } from "@/components/nav"
import { Badge } from "@/components/ui/badge"
import { notFound } from "next/navigation"
import { CardGrid } from "@/components/card-grid"

export default async function SetPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()

  const [{ data: expansion }, { data: cards }, { data: { user } }] = await Promise.all([
    supabase.from("expansions").select("*").eq("code", code).single(),
    supabase.from("cards")
      .select("card_id, name, stage, type, collector_number, image_url, dex_number")
      .eq("expansion_code", code)
      .order("collector_number", { ascending: true }),
    supabase.auth.getUser(),
  ])

  if (!expansion) notFound()

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

        <CardGrid cards={cards ?? []} isLoggedIn={!!user} />
      </main>
    </>
  )
}
