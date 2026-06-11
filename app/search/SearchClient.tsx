"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { CardGrid, type CardSummary } from "@/components/card-grid"
import { HypotrochoidLoader } from "@/components/hypotrochoid-loader"

const RESULT_LIMIT = 120

const ENERGY_TYPES = [
  "Grass", "Fire", "Water", "Lightning", "Psychic",
  "Fighting", "Darkness", "Metal", "Dragon", "Colorless",
] as const

const ENERGY_ZH: Record<string, string> = {
  Grass: "草", Fire: "火", Water: "水", Lightning: "雷",
  Psychic: "超", Fighting: "鬥", Darkness: "惡", Metal: "鋼",
  Dragon: "龍", Colorless: "普通",
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

const STAGES = ["基礎", "1階進化", "2階進化"] as const
const STAGE_LABEL: Record<string, string> = { "基礎": "基礎", "1階進化": "1階進化", "2階進化": "2階進化" }

// 寶可夢 = stage is not null; the rest match the card_type column
// (能量 expands to 基本能量 + 特殊能量)
const CATEGORIES = ["寶可夢", "物品", "支援者", "競技場", "寶可夢道具", "能量"] as const

type Filters = {
  categories: string[]
  types: string[]
  stages: string[]
  expansion: string
  regulations: string[]
  hpMin: string
  hpMax: string
  retreatMin: string
  retreatMax: string
}

const EMPTY_FILTERS: Filters = {
  categories: [], types: [], stages: [], expansion: "", regulations: [],
  hpMin: "", hpMax: "", retreatMin: "", retreatMax: "",
}

function countActiveFilters(f: Filters): number {
  return (
    f.categories.length + f.types.length + f.stages.length + f.regulations.length +
    (f.expansion ? 1 : 0) +
    (f.hpMin ? 1 : 0) + (f.hpMax ? 1 : 0) +
    (f.retreatMin ? 1 : 0) + (f.retreatMax ? 1 : 0)
  )
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value]
}

function Chip({ active, onClick, children, activeBg, activeText }: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  activeBg?: string
  activeText?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs font-medium px-2.5 py-1 rounded-full transition-all cursor-pointer"
      style={{
        background: active ? (activeBg ?? "#1a3a6e") : "rgba(26,58,110,0.05)",
        color: active ? (activeText ?? "#fff") : "rgba(26,58,110,0.6)",
        border: `1px solid ${active ? "transparent" : "rgba(26,58,110,0.15)"}`,
        boxShadow: active ? "0 1px 4px rgba(26,58,110,0.25)" : "none",
      }}
    >
      {children}
    </button>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold mb-1.5" style={{ color: "rgba(26,58,110,0.5)" }}>{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

const numInputStyle: React.CSSProperties = {
  width: 72,
  padding: "5px 8px",
  fontSize: 13,
  borderRadius: 8,
  border: "1px solid rgba(26,58,110,0.2)",
  background: "#fff",
  color: "#1a3a6e",
  outline: "none",
}

export function SearchClient({ expansions, regulations, isLoggedIn }: {
  expansions: { code: string; name: string }[]
  regulations: string[]
  isLoggedIn: boolean
}) {
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [results, setResults] = useState<CardSummary[] | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [searching, setSearching] = useState(false)
  const [searchNonce, setSearchNonce] = useState(0)
  const requestSeq = useRef(0)

  const activeFilters = countActiveFilters(filters)
  const hasCriteria = query.trim().length > 0 || activeFilters > 0

  useEffect(() => {
    if (!hasCriteria) {
      setResults(null)
      setSearching(false)
      return
    }
    setSearching(true)
    const seq = ++requestSeq.current
    const timer = setTimeout(async () => {
      const supabase = createClient()
      let q = supabase
        .from("cards")
        .select("card_id, name, stage, type, collector_number, image_url, dex_number", { count: "exact" })

      const text = query.trim()
      if (text) q = q.ilike("name", `%${text}%`)
      if (filters.categories.length) {
        const wantPokemon = filters.categories.includes("寶可夢")
        const cardTypes = filters.categories
          .filter(c => c !== "寶可夢")
          .flatMap(c => (c === "能量" ? ["基本能量", "特殊能量"] : [c]))
        if (wantPokemon && cardTypes.length) {
          q = q.or(`stage.not.is.null,card_type.in.(${cardTypes.map(v => `"${v}"`).join(",")})`)
        } else if (wantPokemon) {
          q = q.not("stage", "is", null)
        } else {
          q = q.in("card_type", cardTypes)
        }
      }
      if (filters.types.length) q = q.in("type", filters.types)
      if (filters.stages.length) q = q.in("stage", filters.stages)
      if (filters.expansion) q = q.eq("expansion_code", filters.expansion)
      if (filters.regulations.length) q = q.in("regulation_mark", filters.regulations)
      if (filters.hpMin) q = q.gte("hp", parseInt(filters.hpMin))
      if (filters.hpMax) q = q.lte("hp", parseInt(filters.hpMax))
      if (filters.retreatMin) q = q.gte("retreat_cost", parseInt(filters.retreatMin))
      if (filters.retreatMax) q = q.lte("retreat_cost", parseInt(filters.retreatMax))

      const { data, count } = await q
        .order("card_id", { ascending: true })
        .limit(RESULT_LIMIT)

      if (seq !== requestSeq.current) return // a newer search superseded this one
      setResults(
        ((data ?? []) as CardSummary[]).map(c => ({ ...c, collector_number: c.collector_number ?? "" }))
      )
      setTotalCount(count ?? 0)
      setSearchNonce(n => n + 1)
      setSearching(false)
    }, 350)
    return () => clearTimeout(timer)
  }, [query, filters, hasCriteria])

  return (
    <div>
      {/* Search bar */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="rgba(26,58,110,0.4)" strokeWidth="2" strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜尋卡牌名稱…"
            autoComplete="off"
            className="w-full rounded-xl text-sm outline-none transition-all"
            style={{
              padding: "12px 14px 12px 38px",
              background: "#fff",
              border: "1px solid rgba(26,58,110,0.2)",
              color: "#1a3a6e",
              boxShadow: "0 1px 4px rgba(26,58,110,0.06)",
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = "rgba(245,200,66,0.8)"
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(245,200,66,0.15)"
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = "rgba(26,58,110,0.2)"
              e.currentTarget.style.boxShadow = "0 1px 4px rgba(26,58,110,0.06)"
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => setAdvancedOpen(o => !o)}
          className="flex items-center gap-1.5 text-sm font-medium px-3.5 rounded-xl transition-colors cursor-pointer flex-shrink-0"
          style={{
            height: 44,
            background: advancedOpen || activeFilters > 0 ? "#1a3a6e" : "#fff",
            color: advancedOpen || activeFilters > 0 ? "#f5c842" : "#1a3a6e",
            border: "1px solid rgba(26,58,110,0.2)",
          }}
        >
          進階搜尋
          {activeFilters > 0 && (
            <span
              className="text-xs font-bold rounded-full px-1.5 py-0.5 leading-none"
              style={{ background: "#f5c842", color: "#1a3a6e" }}
            >
              {activeFilters}
            </span>
          )}
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            style={{ transform: advancedOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {/* Advanced filter panel */}
      {advancedOpen && (
        <div
          className="mt-3 rounded-xl p-4 space-y-4"
          style={{ background: "#fff", border: "1px solid rgba(26,58,110,0.15)", boxShadow: "0 2px 12px rgba(26,58,110,0.08)" }}
        >
          <FilterGroup label="卡牌種類">
            {CATEGORIES.map(c => (
              <Chip
                key={c}
                active={filters.categories.includes(c)}
                onClick={() => setFilters(f => ({ ...f, categories: toggle(f.categories, c) }))}
              >
                {c}
              </Chip>
            ))}
          </FilterGroup>

          <FilterGroup label="屬性">
            {ENERGY_TYPES.map(t => (
              <Chip
                key={t}
                active={filters.types.includes(t)}
                onClick={() => setFilters(f => ({ ...f, types: toggle(f.types, t) }))}
                activeBg={ENERGY_COLOR[t].bg}
                activeText={ENERGY_COLOR[t].text}
              >
                {ENERGY_ZH[t]}
              </Chip>
            ))}
          </FilterGroup>

          <FilterGroup label="階段">
            {STAGES.map(s => (
              <Chip
                key={s}
                active={filters.stages.includes(s)}
                onClick={() => setFilters(f => ({ ...f, stages: toggle(f.stages, s) }))}
              >
                {STAGE_LABEL[s]}
              </Chip>
            ))}
          </FilterGroup>

          <FilterGroup label="賽制標記">
            {regulations.map(r => (
              <Chip
                key={r}
                active={filters.regulations.includes(r)}
                onClick={() => setFilters(f => ({ ...f, regulations: toggle(f.regulations, r) }))}
              >
                {r}
              </Chip>
            ))}
          </FilterGroup>

          <div>
            <p className="text-xs font-semibold mb-1.5" style={{ color: "rgba(26,58,110,0.5)" }}>系列</p>
            <select
              value={filters.expansion}
              onChange={e => setFilters(f => ({ ...f, expansion: e.target.value }))}
              className="text-sm rounded-lg cursor-pointer"
              style={{
                padding: "6px 10px",
                border: "1px solid rgba(26,58,110,0.2)",
                background: "#fff",
                color: "#1a3a6e",
                outline: "none",
                maxWidth: "100%",
              }}
            >
              <option value="">全部系列</option>
              {expansions.map(e => (
                <option key={e.code} value={e.code}>{e.code} — {e.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: "rgba(26,58,110,0.5)" }}>HP</p>
              <div className="flex items-center gap-1.5 text-sm" style={{ color: "rgba(26,58,110,0.4)" }}>
                <input
                  type="number" min={0} step={10} placeholder="最小"
                  value={filters.hpMin}
                  onChange={e => setFilters(f => ({ ...f, hpMin: e.target.value }))}
                  style={numInputStyle}
                />
                <span>—</span>
                <input
                  type="number" min={0} step={10} placeholder="最大"
                  value={filters.hpMax}
                  onChange={e => setFilters(f => ({ ...f, hpMax: e.target.value }))}
                  style={numInputStyle}
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: "rgba(26,58,110,0.5)" }}>撤退費用</p>
              <div className="flex items-center gap-1.5 text-sm" style={{ color: "rgba(26,58,110,0.4)" }}>
                <input
                  type="number" min={0} max={5} placeholder="最小"
                  value={filters.retreatMin}
                  onChange={e => setFilters(f => ({ ...f, retreatMin: e.target.value }))}
                  style={numInputStyle}
                />
                <span>—</span>
                <input
                  type="number" min={0} max={5} placeholder="最大"
                  value={filters.retreatMax}
                  onChange={e => setFilters(f => ({ ...f, retreatMax: e.target.value }))}
                  style={numInputStyle}
                />
              </div>
            </div>
          </div>

          {activeFilters > 0 && (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="text-xs font-medium cursor-pointer underline underline-offset-2"
              style={{ background: "none", border: "none", color: "rgba(26,58,110,0.5)", padding: 0 }}
            >
              清除全部篩選
            </button>
          )}
        </div>
      )}

      {/* Results */}
      <div className="mt-6">
        {!hasCriteria && (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: "rgba(26,58,110,0.35)" }}>
              輸入卡牌名稱，或使用進階搜尋篩選卡牌
            </p>
          </div>
        )}

        {hasCriteria && searching && (
          <div className="flex justify-center py-16">
            <HypotrochoidLoader size={80} color="#f5c842" />
          </div>
        )}

        {hasCriteria && !searching && results && (
          results.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm font-medium" style={{ color: "rgba(26,58,110,0.5)" }}>找不到符合的卡牌</p>
              <p className="text-xs mt-1" style={{ color: "rgba(26,58,110,0.35)" }}>試試放寬搜尋條件</p>
            </div>
          ) : (
            <>
              <p className="text-xs mb-3" style={{ color: "rgba(26,58,110,0.45)" }}>
                找到 {totalCount} 張卡牌
                {totalCount > RESULT_LIMIT && `（顯示前 ${RESULT_LIMIT} 張）`}
              </p>
              <CardGrid key={searchNonce} cards={results} isLoggedIn={isLoggedIn} />
            </>
          )
        )}
      </div>
    </div>
  )
}
