"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

const authedLinks = [
  { href: "/sets", label: "卡牌" },
  { href: "/wishlist", label: "願望清單" },
  { href: "/paidle", label: "Paidle" },
]

const publicLinks = [
  { href: "/paidle", label: "Paidle" },
]

export function Nav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const client = createClient()
    client.auth.getSession().then(({ data }) => setLoggedIn(!!data.session))
    const { data: { subscription } } = client.auth.onAuthStateChange((_, session) => {
      setLoggedIn(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const links = loggedIn ? authedLinks : publicLinks

  function signOut() {
    createClient().auth.signOut().then(() => (window.location.href = "/login"))
  }

  return (
    <>
      {/* GitHub link — desktop only */}
      <a
        href="https://github.com/austinmyc/paifu"
        target="_blank"
        rel="noreferrer"
        aria-label="GitHub"
        className="fixed top-3 right-4 z-[60] hidden sm:flex items-center justify-center w-8 h-8 rounded-lg"
        style={{ color: "rgba(255,255,255,0.35)" }}
        onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
        </svg>
      </a>

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

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
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
            {process.env.NEXT_PUBLIC_SELF_HOSTED !== "true" && loggedIn !== null && (
              loggedIn ? (
                <button
                  onClick={signOut}
                  className="text-sm px-3 py-1.5 rounded-lg transition-colors ml-1"
                  style={{ color: "rgba(255,255,255,0.35)", background: "transparent", border: "none", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
                >
                  登出
                </button>
              ) : (
                <Link
                  href="/login"
                  className="text-sm px-3 py-1.5 rounded-lg transition-colors ml-1"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  登入
                </Link>
              )
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-lg"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="選單"
            style={{ background: "transparent", border: "none", cursor: "pointer" }}
          >
            <span className="block w-5 h-0.5" style={{ background: "rgba(255,255,255,0.7)" }} />
            <span className="block w-5 h-0.5" style={{ background: "rgba(255,255,255,0.7)" }} />
            <span className="block w-5 h-0.5" style={{ background: "rgba(255,255,255,0.7)" }} />
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div
            className="sm:hidden flex flex-col py-2"
            style={{ borderTop: "1px solid rgba(245,200,66,0.1)", backgroundColor: "#0d1b2e" }}
          >
            {links.map(l => {
              const active = pathname.startsWith(l.href)
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm px-6 py-3"
                  style={{
                    color: active ? "#f5c842" : "rgba(255,255,255,0.65)",
                    fontWeight: active ? 600 : 400,
                    background: active ? "rgba(245,200,66,0.06)" : "transparent",
                  }}
                >
                  {l.label}
                </Link>
              )
            })}
            {process.env.NEXT_PUBLIC_SELF_HOSTED !== "true" && loggedIn !== null && (
              loggedIn ? (
                <button
                  onClick={signOut}
                  className="text-sm px-6 py-3 text-left"
                  style={{ color: "rgba(255,255,255,0.35)", background: "transparent", border: "none", cursor: "pointer" }}
                >
                  登出
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm px-6 py-3"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  登入
                </Link>
              )
            )}
          </div>
        )}
      </header>
    </>
  )
}
