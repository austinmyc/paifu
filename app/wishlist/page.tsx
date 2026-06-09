export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { Nav } from "@/components/nav"
import { redirect } from "next/navigation"
import { WishlistView } from "./WishlistView"

export default async function WishlistPage() {
  const supabase = await createClient()

  const selfHosted = process.env.NEXT_PUBLIC_SELF_HOSTED === "true"
  const { data: { user } } = selfHosted ? { data: { user: { id: "local" } } } : await supabase.auth.getUser()
  if (!selfHosted && !user) redirect("/login")

  const { data: rows, error } = await supabase
    .from("user_collections")
    .select("cards(card_id, name, image_url, collector_number, expansion_code, stage, type, dex_number)")
    .eq("user_id", user!.id)
    .eq("want", true)

  if (error) console.error("wishlist query error", JSON.stringify(error))

  const toCard = (c: unknown) => (Array.isArray(c) ? c[0] : c) as {
    card_id: string; name: string; image_url: string | null
    collector_number: string; expansion_code: string
    stage: string | null; type: string | null; dex_number: number | null
  } | null

  const cards = rows?.map(r => toCard(r.cards)).filter(Boolean) as {
    card_id: string; name: string; image_url: string | null
    collector_number: string; expansion_code: string
    stage: string | null; type: string | null; dex_number: number | null
  }[]

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6" style={{ color: "#1a3a6e" }}>願望清單</h1>
        <WishlistView initialCards={cards ?? []} />
      </main>
    </>
  )
}
