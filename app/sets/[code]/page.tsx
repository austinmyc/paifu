export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { Nav } from "@/components/nav"
import { notFound } from "next/navigation"
import { CardGrid } from "@/components/card-grid"
import { EXPANSION_PACK_IMAGE, EXPANSION_REGULATION } from "@/lib/expansion-images"
import { PageLoader } from "@/components/page-loader"

export default async function SetPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()

  const [{ data: expansion }, { data: cards }, { data: { user } }] = await Promise.all([
    supabase.from("expansions").select("code, name, symbol_url").eq("code", code).single(),
    supabase.from("cards")
      .select("card_id, name, stage, type, collector_number, image_url, dex_number")
      .eq("expansion_code", code)
      .order("collector_number", { ascending: true }),
    supabase.auth.getUser(),
  ])

  if (!expansion) notFound()

  const packImage = EXPANSION_PACK_IMAGE[code]
  const regulation = EXPANSION_REGULATION[code]

  return (
    <>
      <Nav />
      <PageLoader><main className="max-w-5xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="flex items-center gap-4 mb-8">
          {/* Pack image thumbnail */}
          {packImage ? (
            <img src={packImage} alt={expansion.name} className="flex-shrink-0 object-contain rounded-lg" style={{ width: 64, height: 80 }} />
          ) : expansion.symbol_url ? (
            <img src={expansion.symbol_url} alt={code} className="flex-shrink-0 h-10 w-auto object-contain" />
          ) : null}

          {/* Title + badges */}
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#1a3a6e" }}>{expansion.name}</h1>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(26,58,110,0.08)", color: "#1a3a6e" }}>
                {code}
              </span>
              {regulation && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(245,200,66,0.2)", color: "#92680a" }}>
                  {regulation}
                </span>
              )}
              <span className="text-xs" style={{ color: "rgba(26,58,110,0.4)" }}>
                {cards?.length ?? 0} 張卡牌
              </span>
            </div>
          </div>
        </div>

        <CardGrid cards={cards ?? []} isLoggedIn={!!user} />
      </main></PageLoader>
    </>
  )
}
