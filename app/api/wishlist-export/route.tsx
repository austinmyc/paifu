import { ImageResponse } from "@vercel/og"
import { createClient } from "@/lib/supabase/server"

export const runtime = "edge"

const NAVY = "#1a3a6e"
const GOLD = "#f5c842"
const BG = "#f0f2f7"

// Instagram story width — 1080px native, crisp on all screens
const WIDTH = 1080
const PADDING = 48
const GAP = 16
const COLS = 4
const CARD_W = Math.floor((WIDTH - PADDING * 2 - GAP * (COLS - 1)) / COLS) // ~237px
const CARD_H = Math.round(CARD_W * (88 / 63)) // Pokémon card aspect ratio
const BADGE_H = 22
const HEADER_H = 80
const FOOTER_H = 56

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const { data: rows } = await supabase
    .from("user_collections")
    .select("card_id, cards(name, image_url, collector_number, expansion_code)")
    .eq("user_id", user.id)
    .eq("want", true)

  type CardRow = { card_id: string; name: string; image_url: string | null; collector_number: string; expansion_code: string }

  const cards: CardRow[] = (rows ?? [])
    .map((r: any) => r.cards ? { card_id: r.card_id, ...r.cards } : null)
    .filter(Boolean)

  const gridRows = Math.ceil(cards.length / COLS)
  const totalHeight = PADDING + HEADER_H + gridRows * (CARD_H + BADGE_H + GAP) + FOOTER_H + PADDING

  const LOGO = 44
  const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${LOGO}" height="${LOGO}"><rect x="4" y="2" width="24" height="28" rx="3" ry="3" fill="${NAVY}"/><rect x="6" y="4" width="20" height="24" rx="2" ry="2" fill="none" stroke="${GOLD}" stroke-width="1.5"/><ellipse cx="16" cy="16" rx="1.5" ry="7" fill="${GOLD}"/><ellipse cx="16" cy="16" rx="7" ry="1.5" fill="${GOLD}"/><ellipse cx="16" cy="16" rx="1.1" ry="5" fill="#ffe07a" transform="rotate(45 16 16)"/><ellipse cx="16" cy="16" rx="1.1" ry="5" fill="#ffe07a" transform="rotate(-45 16 16)"/><circle cx="16" cy="16" r="2" fill="#fff" opacity="0.9"/></svg>`
  const logoDataUrl = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString("base64")}`

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: WIDTH,
          height: totalHeight,
          background: BG,
          padding: PADDING,
          fontFamily: "sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoDataUrl} width={LOGO} height={LOGO} alt="logo" />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: NAVY, lineHeight: 1 }}>牌庫 PaiFu — 願望清單</span>
            <span style={{ fontSize: 15, color: "rgba(26,58,110,0.45)" }}>{cards.length} 張卡牌</span>
          </div>
        </div>

        {/* Flat card grid — 4 per row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: GAP }}>
          {cards.map(card => (
            <div key={card.card_id} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: CARD_W, gap: 6 }}>
              {card.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={card.image_url}
                  width={CARD_W}
                  height={CARD_H}
                  style={{ borderRadius: 10, objectFit: "cover" }}
                  alt={card.name}
                />
              ) : (
                <div style={{ display: "flex", width: CARD_W, height: CARD_H, background: "rgba(26,58,110,0.08)", borderRadius: 10, alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 13, color: NAVY }}>{card.collector_number}</span>
                </div>
              )}
              <span style={{ fontSize: 13, color: "rgba(26,58,110,0.5)", textAlign: "center" as const }}>{card.expansion_code} · {card.collector_number}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", marginTop: "auto", paddingTop: 20, borderTop: "1px solid rgba(26,58,110,0.12)", justifyContent: "center" }}>
          <span style={{ fontSize: 14, color: "rgba(26,58,110,0.35)" }}>paifu.vercel.app</span>
        </div>
      </div>
    ),
    { width: WIDTH, height: totalHeight }
  )
}
