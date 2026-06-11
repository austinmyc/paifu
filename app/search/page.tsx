export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { Nav } from "@/components/nav"
import { EXPANSION_REGULATION } from "@/lib/expansion-images"
import { SearchClient } from "./SearchClient"

export const metadata: Metadata = {
  title: "搜尋卡牌 — PaiFu 牌庫",
  description: "搜尋繁中版寶可夢卡牌：名稱、屬性、階段、系列、HP 等條件篩選",
}

export default async function SearchPage() {
  const supabase = await createClient()

  const [{ data: expansions }, { data: { user } }] = await Promise.all([
    supabase.from("expansions").select("code, name").order("code", { ascending: true }),
    supabase.auth.getUser(),
  ])

  // Distinct regulation marks, derived from the per-set ranges (e.g. "I–J" → I, J)
  const regulations = [...new Set(
    Object.values(EXPANSION_REGULATION).flatMap(r => r.split(/[^A-Z]+/).filter(Boolean))
  )].sort()

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1a3a6e" }}>
            搜尋卡牌
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(26,58,110,0.5)" }}>
            以名稱搜尋，或展開進階搜尋以卡牌資料篩選
          </p>
        </div>

        <SearchClient
          expansions={expansions ?? []}
          regulations={regulations}
          isLoggedIn={!!user}
        />
      </main>
    </>
  )
}
