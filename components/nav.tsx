"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const links = [
  { href: "/sets", label: "卡牌" },
  { href: "/collection", label: "我的收藏" },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        backgroundColor: "#0d1b2e",
        borderBottom: "1px solid rgba(245,200,66,0.15)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.3)",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/sets" className="flex items-center gap-2.5 no-underline">
          <svg width="28" height="28" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="2" width="24" height="28" rx="3" ry="3" fill="#1a3a6e"/>
            <rect x="6" y="4" width="20" height="24" rx="2" ry="2" fill="none" stroke="#f5c842" strokeWidth="1.2"/>
            <ellipse cx="16" cy="16" rx="1.5" ry="7" fill="#f5c842"/>
            <ellipse cx="16" cy="16" rx="7" ry="1.5" fill="#f5c842"/>
            <ellipse cx="16" cy="16" rx="1.1" ry="5" fill="#ffe07a" transform="rotate(45 16 16)"/>
            <ellipse cx="16" cy="16" rx="1.1" ry="5" fill="#ffe07a" transform="rotate(-45 16 16)"/>
            <circle cx="16" cy="16" r="2" fill="#fff" opacity="0.9"/>
          </svg>
          <span className="font-bold text-base tracking-wide" style={{ color: "#f5c842" }}>
            牌庫 PaiFu
          </span>
        </Link>

        {/* Nav links + sign out */}
        <nav className="flex items-center gap-1">
          {links.map(l => {
            const active = pathname.startsWith(l.href)
            return (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  color: active ? "#f5c842" : "rgba(255,255,255,0.55)",
                  background: active ? "rgba(245,200,66,0.1)" : "transparent",
                  fontWeight: active ? 600 : 400,
                }}
              >
                {l.label}
              </Link>
            )
          })}

          {process.env.NEXT_PUBLIC_SELF_HOSTED !== "true" && (
            <button
              onClick={() => createClient().auth.signOut().then(() => window.location.href = "/login")}
              className="text-sm px-3 py-1.5 rounded-lg transition-colors ml-1"
              style={{ color: "rgba(255,255,255,0.35)", background: "transparent", border: "none", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
            >
              登出
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}
