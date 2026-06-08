"use client"

import { useEffect, useRef, useState } from "react"
import { HypotrochoidLoader } from "@/components/hypotrochoid-loader"

const MAX_WAIT_MS = 2500

export function PageLoader({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) { setReady(true); return }

    const images = Array.from(container.querySelectorAll<HTMLImageElement>("img"))
    if (images.length === 0) { setReady(true); return }

    let done = false
    function finish() {
      if (done) return
      done = true
      setReady(true)
    }

    // Failsafe — never block longer than MAX_WAIT_MS
    const timeout = setTimeout(finish, MAX_WAIT_MS)

    let remaining = images.filter(img => !img.complete).length
    if (remaining === 0) {
      clearTimeout(timeout)
      finish()
      return
    }

    function onLoad() {
      remaining--
      if (remaining <= 0) {
        clearTimeout(timeout)
        finish()
      }
    }

    images.forEach(img => {
      if (!img.complete) {
        img.addEventListener("load", onLoad, { once: true })
        img.addEventListener("error", onLoad, { once: true })
      }
    })

    return () => clearTimeout(timeout)
  }, [])

  return (
    <>
      {/* Loader — shown while content is hidden */}
      <div
        className="flex items-center justify-center transition-opacity duration-300"
        style={{
          minHeight: "60vh",
          opacity: ready ? 0 : 1,
          pointerEvents: "none",
          position: ready ? "absolute" : "relative",
          // keep in flow while loading, collapse after
          width: ready ? 0 : undefined,
          height: ready ? 0 : undefined,
          overflow: "hidden",
        }}
      >
        <HypotrochoidLoader size={100} color="#f5c842" />
      </div>

      {/* Content — hidden until images ready, then fade in */}
      <div
        ref={containerRef}
        style={{
          opacity: ready ? 1 : 0,
          transition: ready ? "opacity 0.4s ease" : undefined,
        }}
      >
        {children}
      </div>
    </>
  )
}
