export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { Nav } from "@/components/nav"
import Link from "next/link"
import { EXPANSION_PACK_IMAGE, EXPANSION_REGULATION } from "@/lib/expansion-images"

export default async function SetsPage() {
  const supabase = await createClient()

  const { data: expansions } = await supabase
    .from("expansions")
    .select("*, cards(count)")
    .order("code", { ascending: true })

  return (
    <>
      <Nav />
      <main className="max-w-3xl mx-auto px-4 py-8">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {expansions?.map(exp => {
            const packImage = EXPANSION_PACK_IMAGE[exp.code]
            const regulation = EXPANSION_REGULATION[exp.code] ?? exp.regulation_mark
            const cardCount = (exp.cards as any)?.[0]?.count ?? 0

            return (
              <Link key={exp.code} href={`/sets/${exp.code}`} className="group">
                <div
                  className="set-card flex rounded-xl overflow-hidden cursor-pointer transition-all duration-200 bg-white"
                  style={{ border: "1px solid rgba(26,58,110,0.2)", boxShadow: "0 1px 4px rgba(26,58,110,0.06)" }}
                >
                  {/* Pack image */}
                  <div
                    className="flex-shrink-0 flex items-center justify-center"
                    style={{
                      width: 140,
                      minHeight: 160,
                      backgroundColor: "#0d1b2e",
                      backgroundImage: `
                        repeating-linear-gradient(45deg, rgba(245,200,66,0.12) 0px, rgba(245,200,66,0.12) 1px, transparent 1px, transparent 20px),
                        repeating-linear-gradient(-45deg, rgba(245,200,66,0.12) 0px, rgba(245,200,66,0.12) 1px, transparent 1px, transparent 20px)
                      `,
                    }}
                  >
                    {packImage ? (
                      <img src={packImage} alt={exp.name} className="object-contain p-2" style={{ width: 140, height: 160 }} />
                    ) : exp.symbol_url ? (
                      <img src={exp.symbol_url} alt={exp.code} className="h-12 w-auto object-contain opacity-70" />
                    ) : (
                      <span className="text-xl font-bold text-white/40">{exp.code}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-col justify-center px-4 py-3 gap-2">
                    <p className="font-semibold text-sm leading-snug" style={{ color: "#1a3a6e" }}>{exp.name}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(26,58,110,0.08)", color: "#1a3a6e" }}
                      >
                        {exp.code}
                      </span>
                      {regulation && (
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(245,200,66,0.2)", color: "#92680a" }}
                        >
                          {regulation}
                        </span>
                      )}
                    </div>
                    {cardCount > 0 && (
                      <p className="text-xs" style={{ color: "rgba(26,58,110,0.45)" }}>{cardCount} 張卡牌</p>
                    )}
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
