import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner"
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PaiFu 牌庫 — 寶可夢卡牌收藏",
  description: "香港寶可夢集換式卡牌收藏追蹤",
  openGraph: {
    title: "PaiFu 牌庫 — 寶可夢卡牌收藏",
    description: "香港寶可夢集換式卡牌收藏追蹤",
    url: "https://paifu.vercel.app",
    siteName: "PaiFu 牌庫",
    locale: "zh_HK",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
        <footer className="mt-auto px-4 py-3 text-xs flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 items-center" style={{ color: "rgba(26,58,110,0.4)", borderTop: "1px solid rgba(26,58,110,0.06)" }}>
          <p className="text-center sm:text-left">
            Pokémon 及相關名稱為任天堂、Creatures、GAME FREAK 及 The Pokémon Company 之商標。本站為非官方個人收藏追蹤工具，與上述公司無任何關聯。卡牌圖片版權屬原著作權人所有。
          </p>
          <p className="flex-shrink-0">
            發現資料有誤？{" "}
            <a
              href="https://github.com/austinmyc/paifu/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:opacity-70 transition-opacity"
              style={{ color: "rgba(26,58,110,0.6)" }}
            >
              歡迎提交回報
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
