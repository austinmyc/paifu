"use client"

import { useState, useEffect, useRef } from "react"
import type { PaidleCard } from "./page"

const MAX_GUESSES = 6

const ENERGY_ZH: Record<string, string> = {
  Grass: "草", Fire: "火", Water: "水", Lightning: "雷",
  Psychic: "超", Fighting: "格", Darkness: "惡", Metal: "鋼",
  Dragon: "龍", Colorless: "無",
}

const ENERGY_COLOR: Record<string, { bg: string; text: string }> = {
  Grass:     { bg: "#16a34a", text: "#fff" },
  Fire:      { bg: "#dc2626", text: "#fff" },
  Water:     { bg: "#2563eb", text: "#fff" },
  Lightning: { bg: "#ca8a04", text: "#fff" },
  Psychic:   { bg: "#9333ea", text: "#fff" },
  Fighting:  { bg: "#ea580c", text: "#fff" },
  Darkness:  { bg: "#1e293b", text: "#e2e8f0" },
  Metal:     { bg: "#475569", text: "#fff" },
  Dragon:    { bg: "#4338ca", text: "#fff" },
  Colorless: { bg: "#94a3b8", text: "#1e293b" },
}

function getDailyAnswer(pool: PaidleCard[]): PaidleCard {
  const today = new Date().toISOString().slice(0, 10)
  let hash = 0
  for (const ch of today) hash = (hash * 31 + ch.charCodeAt(0)) & 0x7fffffff
  return pool[hash % pool.length]
}

function parseWeight(w: string | null): number | null {
  if (!w) return null
  const m = w.match(/[\d.]+/)
  return m ? parseFloat(m[0]) : null
}

function parseMaxAttack(attacks: PaidleCard["attacks"]): number | null {
  if (!attacks || attacks.length === 0) return null
  let max: number | null = null
  for (const a of attacks) {
    const nums = a.damage.match(/\d+/g)
    if (nums) {
      const localMax = Math.max(...nums.map(Number))
      if (max === null || localMax > max) max = localMax
    }
  }
  return max
}

type Hint = "correct" | "higher" | "lower" | "wrong" | "no-data"

type GuessResult = {
  card: PaidleCard
  type: Hint
  stage: Hint
  hp: Hint
  retreat: Hint
  weight: Hint
  regulation: Hint
  maxAttack: Hint
}

function evaluate(guess: PaidleCard, answer: PaidleCard): GuessResult {
  function numHint(g: number | null, a: number | null): Hint {
    if (g === null || a === null) return "no-data"
    if (g === a) return "correct"
    return a > g ? "higher" : "lower"
  }
  return {
    card: guess,
    type: guess.type === answer.type ? "correct" : "wrong",
    stage: guess.stage === answer.stage ? "correct" : "wrong",
    hp: numHint(guess.hp, answer.hp),
    retreat: numHint(guess.retreat_cost, answer.retreat_cost),
    weight: numHint(parseWeight(guess.weight), parseWeight(answer.weight)),
    regulation: guess.regulation_mark === answer.regulation_mark ? "correct" : "wrong",
    maxAttack: numHint(parseMaxAttack(guess.attacks), parseMaxAttack(answer.attacks)),
  }
}

// ── Hint cell ────────────────────────────────────────────────────────────────

function cellBg(hint: Hint): { bg: string; textColor: string; arrowColor: string } {
  switch (hint) {
    case "correct":  return { bg: "#538d4e", textColor: "#fff", arrowColor: "#fff" }
    case "higher":
    case "lower":    return { bg: "#b59f3b", textColor: "#fff", arrowColor: "#fff" }
    case "wrong":    return { bg: "#3a3a3c", textColor: "rgba(255,255,255,0.7)", arrowColor: "transparent" }
    default:         return { bg: "#3a3a3c", textColor: "rgba(255,255,255,0.4)", arrowColor: "transparent" }
  }
}

function HintCell({ hint, value }: { hint: Hint; value: React.ReactNode }) {
  const s = cellBg(hint)
  const arrow = hint === "higher" ? "↑" : hint === "lower" ? "↓" : null
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg gap-0.5 py-2 px-1"
      style={{ background: s.bg, minHeight: 52 }}
    >
      <span className="text-xs sm:text-sm font-semibold leading-none" style={{ color: s.textColor }}>
        {value}
      </span>
      {arrow && (
        <span className="text-xs font-bold leading-none" style={{ color: s.arrowColor }}>
          {arrow}
        </span>
      )}
    </div>
  )
}

function TypeCell({ hint, type }: { hint: Hint; type: string | null }) {
  const s = cellBg(hint)
  const zh = type ? (ENERGY_ZH[type] ?? type) : "—"
  const col = type ? ENERGY_COLOR[type] : null
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg gap-0.5 py-2 px-1"
      style={{ background: s.bg, minHeight: 52 }}
    >
      {col ? (
        <span
          className="text-xs font-bold px-1.5 py-0.5 rounded"
          style={{ background: col.bg, color: col.text }}
        >
          {zh}
        </span>
      ) : (
        <span className="text-xs font-semibold" style={{ color: s.textColor }}>—</span>
      )}
    </div>
  )
}

// ── Guess row ─────────────────────────────────────────────────────────────────

const COLS = [
  { key: "stage",      label: "階段" },
  { key: "hp",         label: "HP" },
  { key: "retreat",    label: "撤退" },
  { key: "weight",     label: "重量" },
  { key: "regulation", label: "賽制標記" },
  { key: "maxAttack",  label: "最高傷害" },
] as const

function GuessRow({ result, isCorrect }: { result: GuessResult; isCorrect: boolean }) {
  const c = result.card
  const stageZh: Record<string, string> = { "基礎": "基礎", "1階進化": "1階", "2階進化": "2階" }

  return (
    <div className="flex gap-2 items-stretch">
      {/* Card image — portrait ratio */}
      <div
        className="flex-shrink-0 rounded-lg overflow-hidden"
        style={{
          width: 80,
          aspectRatio: "2.5/3.5",
          background: "rgba(255,255,255,0.05)",
          border: isCorrect ? "2px solid #538d4e" : "1px solid rgba(255,255,255,0.1)",
          boxShadow: isCorrect ? "0 0 12px rgba(83,141,78,0.5)" : "0 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        {c.image_url
          ? <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center" style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>?</div>
        }
      </div>

      {/* Hint cells — 7 columns */}
      <div className="grid gap-1 flex-1 min-w-0" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
        <TypeCell hint={result.type} type={c.type} />
        <HintCell hint={result.stage} value={stageZh[c.stage] ?? c.stage ?? "—"} />
        <HintCell hint={result.hp} value={c.hp ?? "—"} />
        <HintCell hint={result.retreat} value={c.retreat_cost ?? "—"} />
        <HintCell hint={result.weight} value={c.weight ? c.weight.replace("kg","") + "kg" : "—"} />
        <HintCell hint={result.regulation} value={c.regulation_mark ?? "—"} />
        <HintCell hint={result.maxAttack} value={parseMaxAttack(c.attacks) ?? "—"} />
      </div>
    </div>
  )
}

function EmptyRow() {
  return (
    <div className="flex gap-2 items-stretch">
      <div
        className="flex-shrink-0 rounded-lg"
        style={{ width: 80, aspectRatio: "2.5/3.5", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      />
      <div className="grid gap-1 flex-1 min-w-0" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="rounded-lg" style={{ minHeight: 52, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }} />
        ))}
      </div>
    </div>
  )
}

// ── Column header row ─────────────────────────────────────────────────────────

function HeaderRow() {
  return (
    <div className="flex gap-2 items-center mb-1">
      <div className="flex-shrink-0" style={{ width: 80 }} />
      <div className="grid gap-1 flex-1 min-w-0" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
        {["屬性", "階段", "HP", "撤退", "重量", "賽制標記", "最高傷害"].map(l => (
          <div key={l} className="text-center text-[9px] font-semibold uppercase tracking-wide py-0.5 hidden sm:block" style={{ color: "rgba(255,255,255,0.3)" }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Storage ───────────────────────────────────────────────────────────────────

function storageKey() {
  return `paidle_${new Date().toISOString().slice(0, 10)}`
}

type SavedState = { guessIds: string[]; solved: boolean; failed: boolean }

// ── Main component ────────────────────────────────────────────────────────────

export function PaidleClient({ cards }: { cards: PaidleCard[] }) {
  const answer = getDailyAnswer(cards)
  const [guesses, setGuesses] = useState<PaidleCard[]>([])
  const [solved, setSolved] = useState(false)
  const [failed, setFailed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [input, setInput] = useState("")
  const [suggestions, setSuggestions] = useState<PaidleCard[]>([])
  const [highlightIdx, setHighlightIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey())
      if (!raw) return
      const saved: SavedState = JSON.parse(raw)
      const restored = saved.guessIds
        .map(id => cards.find(c => c.card_id === id))
        .filter(Boolean) as PaidleCard[]
      setGuesses(restored)
      setSolved(saved.solved)
      setFailed(saved.failed)
    } catch {}
  }, [cards])

  useEffect(() => {
    if (guesses.length === 0) return
    localStorage.setItem(storageKey(), JSON.stringify({
      guessIds: guesses.map(g => g.card_id),
      solved,
      failed,
    }))
  }, [guesses, solved, failed])

  function onInputChange(val: string) {
    setInput(val)
    setHighlightIdx(0)
    if (!val.trim()) { setSuggestions([]); return }
    const lower = val.toLowerCase()
    const guessedIds = new Set(guesses.map(g => g.card_id))
    setSuggestions(
      cards.filter(c => c.name.toLowerCase().includes(lower) && !guessedIds.has(c.card_id)).slice(0, 8)
    )
  }

  function submitGuess(card: PaidleCard) {
    if (solved || failed) return
    const next = [...guesses, card]
    const win = card.card_id === answer.card_id
    const lose = !win && next.length >= MAX_GUESSES
    setGuesses(next)
    setSolved(win)
    setFailed(lose)
    setInput("")
    setSuggestions([])
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!suggestions.length) return
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlightIdx(i => Math.min(i + 1, suggestions.length - 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlightIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === "Enter") { e.preventDefault(); if (suggestions[highlightIdx]) submitGuess(suggestions[highlightIdx]) }
    else if (e.key === "Escape") setSuggestions([])
  }

  const results = guesses.map(g => evaluate(g, answer))
  const emptyRows = Math.max(0, MAX_GUESSES - guesses.length)
  const done = solved || failed

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-0 lg:gap-8 max-w-5xl mx-auto w-full px-4 py-8">

      {/* ── Left: guess board ── */}
      <div className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#f5c842" }}>Paidle</h1>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
            猜今日的寶可夢卡牌 · {new Date().toLocaleDateString("zh-HK")}
          </p>
        </div>

        <HeaderRow />

        <div className="flex flex-col gap-1.5">
          {results.map((r, i) => <GuessRow key={i} result={r} isCorrect={solved && i === results.length - 1} />)}
          {Array.from({ length: emptyRows }).map((_, i) => <EmptyRow key={i} />)}
        </div>
      </div>

      {/* ── Right: controls + info ── */}
      <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-4 mt-6 lg:mt-0">

        {/* Desktop header */}
        <div className="hidden lg:block">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#f5c842" }}>Paidle</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
            猜今日的寶可夢卡牌
          </p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
            {new Date().toLocaleDateString("zh-HK")}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5">
          {Array.from({ length: MAX_GUESSES }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full transition-all duration-300"
              style={{
                background: i < guesses.length
                  ? (solved && i === guesses.length - 1 ? "#f5c842" : "rgba(255,255,255,0.25)")
                  : "rgba(255,255,255,0.08)",
              }}
            />
          ))}
        </div>

        {/* Input */}
        {!done && (
          <div className="relative">
            <input
              ref={inputRef}
              value={input}
              onChange={e => onInputChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="輸入卡牌名稱…"
              autoComplete="off"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(245,200,66,0.2)",
                color: "#e2e8f0",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(245,200,66,0.5)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(245,200,66,0.2)")}
            />
            {suggestions.length > 0 && (
              <div
                className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-50"
                style={{ background: "#111f35", border: "1px solid rgba(245,200,66,0.15)", boxShadow: "0 12px 40px rgba(0,0,0,0.6)" }}
              >
                {suggestions.map((c, i) => (
                  <button
                    key={c.card_id}
                    onMouseDown={() => submitGuess(c)}
                    onMouseEnter={() => setHighlightIdx(i)}
                    className="w-full text-left px-4 py-2.5 text-sm flex justify-between items-center gap-2"
                    style={{
                      background: i === highlightIdx ? "rgba(245,200,66,0.08)" : "transparent",
                      color: "#e2e8f0",
                      border: "none",
                      cursor: "pointer",
                      borderBottom: i < suggestions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    }}
                  >
                    <span className="font-medium truncate">{c.name}</span>
                    <span className="text-xs flex-shrink-0 tabular-nums" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {c.expansion_code} {c.collector_number ?? ""}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Remaining */}
        {!done && (
          <p className="text-xs text-center lg:text-left" style={{ color: "rgba(255,255,255,0.25)" }}>
            剩餘 <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{MAX_GUESSES - guesses.length}</span> 次機會
          </p>
        )}

        {/* Win / lose */}
        {done && (
          <div
            className="rounded-xl p-4"
            style={{
              background: solved ? "rgba(83,141,78,0.1)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${solved ? "#538d4e" : "rgba(255,255,255,0.1)"}`,
            }}
          >
            <p className="font-bold text-base mb-1" style={{ color: solved ? "#f5c842" : "rgba(255,255,255,0.5)" }}>
              {solved ? `${guesses.length}/${MAX_GUESSES} 答對了` : "答錯了"}
            </p>
            <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
              今日答案：<span className="font-semibold" style={{ color: "#e2e8f0" }}>{answer.name}</span>
            </p>
            {answer.image_url && (
              <img
                src={answer.image_url}
                alt={answer.name}
                className="rounded-xl mb-3"
                style={{ width: "100%", maxWidth: 200, aspectRatio: "2.5/3.5", objectFit: "cover", boxShadow: solved ? "0 0 0 3px #538d4e, 0 8px 24px rgba(83,141,78,0.4)" : "0 8px 24px rgba(0,0,0,0.5)" }}
              />
            )}
            <button
              onClick={() => {
                function e(h: Hint) { return h === "correct" ? "🟩" : h === "higher" || h === "lower" ? "🟨" : "⬛" }
                const lines = results.map(r =>
                  [e(r.type), e(r.stage), e(r.hp), e(r.retreat), e(r.weight), e(r.regulation), e(r.maxAttack)].join("")
                )
                const score = solved ? `${guesses.length}/${MAX_GUESSES}` : "X/6"
                const text = `Paidle ${new Date().toLocaleDateString("zh-HK")} ${score}\n\n${lines.join("\n")}`
                navigator.clipboard.writeText(text).then(() => {
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }).catch(() => {})
              }}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold"
              style={{ background: "rgba(245,200,66,0.12)", color: "#f5c842", border: "1px solid rgba(245,200,66,0.25)", cursor: "pointer" }}
            >
              {copied ? "已複製 ✓" : "分享結果"}
            </button>
          </div>
        )}

        {/* Legend */}
        <div
          className="rounded-xl p-4 text-xs space-y-2"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="font-semibold uppercase tracking-wide text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>說明</p>
          <div className="space-y-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 rounded-sm flex-shrink-0" style={{ background: "#538d4e" }} />
              <span>完全正確</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 rounded-sm flex-shrink-0" style={{ background: "#b59f3b" }} />
              <span>數值有差距，↑ 答案更高，↓ 答案更低</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 rounded-sm flex-shrink-0" style={{ background: "#3a3a3c" }} />
              <span>不正確</span>
            </div>
          </div>
          <p className="text-[10px] pt-1" style={{ color: "rgba(255,255,255,0.2)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            最高傷害數字 = 攻擊欄中出現的最大數字（不計算效果）
          </p>
        </div>
      </div>
    </div>
  )
}
