"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

const links = [
  { href: "/sets", label: "牌組" },
  { href: "/collection", label: "我的收藏" },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/sets" className="font-bold text-lg tracking-tight">PaiFu 牌庫</Link>
        <nav className="flex items-center gap-4">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm ${pathname.startsWith(l.href) ? "font-semibold" : "text-muted-foreground hover:text-foreground"}`}
            >
              {l.label}
            </Link>
          ))}
          {process.env.NEXT_PUBLIC_SELF_HOSTED !== "true" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => createClient().auth.signOut().then(() => window.location.href = "/login")}
            >
              登出
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
