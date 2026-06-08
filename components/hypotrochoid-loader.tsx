"use client"

import { useEffect, useRef } from "react"

interface Props {
  size?: number
  color?: string
}

const CONFIG = {
  particleCount: 82,
  trailSpan: 0.46,
  durationMs: 3200,
  pulseDurationMs: 2800,
  strokeWidth: 4.6,
  spiroR: 8.2,
  spiror: 2.7,
  spirorBoost: 0.45,
  spirod: 4.8,
  spirodBoost: 1.2,
  spiroScale: 3.05,
}

function point(progress: number, detailScale: number) {
  const t = progress * Math.PI * 2
  const r = CONFIG.spiror + detailScale * CONFIG.spirorBoost
  const d = CONFIG.spirod + detailScale * CONFIG.spirodBoost
  const x = (CONFIG.spiroR - r) * Math.cos(t) + d * Math.cos(((CONFIG.spiroR - r) / r) * t)
  const y = (CONFIG.spiroR - r) * Math.sin(t) - d * Math.sin(((CONFIG.spiroR - r) / r) * t)
  return { x: 50 + x * CONFIG.spiroScale, y: 50 + y * CONFIG.spiroScale }
}

function normalizeProgress(p: number) {
  return ((p % 1) + 1) % 1
}

function getDetailScale(time: number) {
  const angle = ((time % CONFIG.pulseDurationMs) / CONFIG.pulseDurationMs) * Math.PI * 2
  return 0.52 + ((Math.sin(angle + 0.55) + 1) / 2) * 0.48
}

function buildPath(detailScale: number, steps = 480) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const p = point(i / steps, detailScale)
    return `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`
  }).join(" ")
}

const SVG_NS = "http://www.w3.org/2000/svg"

export function HypotrochoidLoader({ size = 80, color = "#f5c842" }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    // Build DOM
    const group = document.createElementNS(SVG_NS, "g")
    const path = document.createElementNS(SVG_NS, "path")
    path.setAttribute("fill", "none")
    path.setAttribute("stroke", color)
    path.setAttribute("stroke-linecap", "round")
    path.setAttribute("stroke-linejoin", "round")
    path.setAttribute("stroke-width", String(CONFIG.strokeWidth))
    path.setAttribute("opacity", "0.15")
    group.appendChild(path)

    const particles = Array.from({ length: CONFIG.particleCount }, () => {
      const circle = document.createElementNS(SVG_NS, "circle")
      circle.setAttribute("fill", color)
      group.appendChild(circle)
      return circle
    })

    svg.appendChild(group)

    const startedAt = performance.now()

    function render(now: number) {
      const time = now - startedAt
      const progress = (time % CONFIG.durationMs) / CONFIG.durationMs
      const detailScale = getDetailScale(time)

      path.setAttribute("d", buildPath(detailScale))

      particles.forEach((node, index) => {
        const tailOffset = index / (CONFIG.particleCount - 1)
        const p = point(normalizeProgress(progress - tailOffset * CONFIG.trailSpan), detailScale)
        const fade = Math.pow(1 - tailOffset, 0.56)
        node.setAttribute("cx", p.x.toFixed(2))
        node.setAttribute("cy", p.y.toFixed(2))
        node.setAttribute("r", (0.9 + fade * 2.7).toFixed(2))
        node.setAttribute("opacity", (0.04 + fade * 0.96).toFixed(3))
      })

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(rafRef.current)
      svg.removeChild(group)
    }
  }, [color])

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-label="載入中"
      style={{ display: "block" }}
    />
  )
}
