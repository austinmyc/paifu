"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null)

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const supabase = createClient()

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      })
      if (error) setMessage({ type: "error", text: error.message })
      else setMessage({ type: "success", text: "確認郵件已發送，請檢查您的電郵信箱。" })
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage({ type: "error", text: error.message })
      else window.location.href = "/"
    }
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center overflow-hidden relative"
      style={{ backgroundColor: "#0d1b2e" }}
    >
      {/* Diamond grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(45deg, rgba(245,200,66,0.04) 0px, rgba(245,200,66,0.04) 1px, transparent 1px, transparent 20px),
            repeating-linear-gradient(-45deg, rgba(245,200,66,0.04) 0px, rgba(245,200,66,0.04) 1px, transparent 1px, transparent 20px)
          `,
        }}
      />
      {/* Drifting glow orbs behind the glass */}
      <div
        className="glass-orb"
        style={{
          width: 420,
          height: 420,
          background: "radial-gradient(circle, rgba(46,90,160,0.55) 0%, transparent 70%)",
          top: "12%",
          left: "18%",
        }}
      />
      <div
        className="glass-orb"
        style={{
          width: 360,
          height: 360,
          background: "radial-gradient(circle, rgba(245,200,66,0.18) 0%, transparent 70%)",
          bottom: "8%",
          right: "14%",
          animationDelay: "-6s",
          animationDuration: "20s",
        }}
      />
      <div
        className="glass-orb"
        style={{
          width: 300,
          height: 300,
          background: "radial-gradient(circle, rgba(120,80,200,0.25) 0%, transparent 70%)",
          top: "55%",
          left: "8%",
          animationDelay: "-11s",
          animationDuration: "24s",
        }}
      />

      {/* Card */}
      <div className="liquid-glass relative z-10 w-[380px] max-w-[calc(100%-48px)] rounded-3xl px-10 py-12">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <svg width="48" height="48" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="2" width="24" height="28" rx="3" ry="3" fill="#1a3a6e"/>
            <rect x="6" y="4" width="20" height="24" rx="2" ry="2" fill="none" stroke="#f5c842" strokeWidth="1.2"/>
            <ellipse cx="16" cy="16" rx="1.5" ry="7" fill="#f5c842"/>
            <ellipse cx="16" cy="16" rx="7" ry="1.5" fill="#f5c842"/>
            <ellipse cx="16" cy="16" rx="1.1" ry="5" fill="#ffe07a" transform="rotate(45 16 16)"/>
            <ellipse cx="16" cy="16" rx="1.1" ry="5" fill="#ffe07a" transform="rotate(-45 16 16)"/>
            <circle cx="16" cy="16" r="2" fill="#fff" opacity="0.9"/>
          </svg>
          <div className="text-2xl font-bold tracking-wide" style={{ color: "#f5c842" }}>
            牌庫 PaiFu
          </div>
          <div className="text-xs tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>
            寶可夢卡牌　繁中收藏追蹤
          </div>
        </div>

        {/* Divider */}
        <div
          className="mx-auto mb-8"
          style={{
            width: 40,
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(245,200,66,0.4), transparent)",
          }}
        />

        {/* Google button */}
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 rounded-xl text-sm text-white transition-colors mb-5"
          style={{
            padding: "13px 20px",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
            cursor: "pointer",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)"
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.25)"
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.15)"
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          以 Google 帳號登入
        </button>

        {/* Separator */}
        <div className="flex items-center gap-3 mb-5">
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em" }}>或使用電郵</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmail} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="電郵地址"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="glass-input"
          />
          <input
            type="password"
            placeholder="密碼"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="glass-input"
          />

          {message && (
            <div style={{
              fontSize: 12,
              padding: "8px 12px",
              borderRadius: 8,
              background: message.type === "error" ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
              color: message.type === "error" ? "#fca5a5" : "#86efac",
              border: `1px solid ${message.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
            }}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              background: "linear-gradient(135deg, #f8d35e, #e8a800)",
              border: "none",
              borderRadius: 10,
              color: "#0d1b2e",
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              marginTop: 2,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 20px rgba(245,200,66,0.25)",
            }}
          >
            {loading ? "處理中…" : mode === "signin" ? "登入" : "註冊"}
          </button>
        </form>

        {/* Toggle mode */}
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
          {mode === "signin" ? (
            <>沒有帳號？{" "}
              <button onClick={() => { setMode("signup"); setMessage(null) }} style={{ background: "none", border: "none", color: "rgba(245,200,66,0.7)", cursor: "pointer", fontSize: 12, padding: 0 }}>
                立即註冊
              </button>
            </>
          ) : (
            <>已有帳號？{" "}
              <button onClick={() => { setMode("signin"); setMessage(null) }} style={{ background: "none", border: "none", color: "rgba(245,200,66,0.7)", cursor: "pointer", fontSize: 12, padding: 0 }}>
                登入
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
