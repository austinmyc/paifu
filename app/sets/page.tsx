export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { Nav } from "@/components/nav"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function SetsPage() {
  const supabase = await createClient()
  const { data: expansions } = await supabase
    .from("expansions")
    .select("*")
    .order("code", { ascending: true })

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">所有牌組</h1>
        {!expansions?.length && (
          <p className="text-muted-foreground">尚未載入任何牌組。請先執行爬蟲腳本。</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {expansions?.map(exp => (
            <Link key={exp.code} href={`/sets/${exp.code}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex flex-col gap-2">
                  {exp.symbol_url && (
                    <img src={exp.symbol_url} alt={exp.code} className="h-8 w-auto object-contain" />
                  )}
                  <div>
                    <p className="font-semibold text-sm">{exp.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{exp.code}</Badge>
                      {exp.regulation_mark && (
                        <Badge variant="outline">{exp.regulation_mark}</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </>
  )
}
