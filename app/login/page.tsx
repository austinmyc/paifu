"use client"

export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-8 border rounded-xl shadow-sm">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">PaiFu 牌庫</h1>
          <p className="text-sm text-muted-foreground">寶可夢集換式卡牌收藏追蹤</p>
        </div>
        <Button className="w-full" onClick={handleGoogle}>
          以 Google 登入
        </Button>
      </div>
    </div>
  )
}
