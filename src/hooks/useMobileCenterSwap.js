import { useEffect } from 'react'

// On touch grids, simulate desktop's :hover image-crossfade by activating
// only the single row closest to the viewport's vertical center (scrollspy
// pattern), instead of letting every card decide independently whether it's
// "visible enough" — the latter causes many rows to swap at once on scroll.
export function useMobileCenterSwap(containerRef, zoneSelector = '.feat-img-zone.has-second-img', deps = []) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const isTouch = window.matchMedia('(hover: none) and (max-width: 768px)').matches
    if (!isTouch) return

    let ticking = false
    let activeEls = []

    const update = () => {
      ticking = false
      const zones = container.querySelectorAll(zoneSelector)
      if (!zones.length) return
      const viewportCenter = window.innerHeight / 2
      const candidates = []
      zones.forEach((el) => {
        const rect = el.getBoundingClientRect()
        if (rect.bottom < 0 || rect.top > window.innerHeight) return
        const elCenter = rect.top + rect.height / 2
        candidates.push({ el, top: rect.top, dist: Math.abs(elCenter - viewportCenter) })
      })
      candidates.sort((a, b) => a.dist - b.dist)

      const winners = new Set()
      if (candidates[0] && candidates[0].dist < window.innerHeight * 0.35) {
        // Include any other card in the same row as the closest one
        candidates.forEach((c) => {
          if (Math.abs(c.top - candidates[0].top) < 8) winners.add(c.el)
        })
      }

      activeEls.forEach((el) => { if (!winners.has(el)) el.classList.remove('mobile-swap') })
      winners.forEach((el) => el.classList.add('mobile-swap'))
      activeEls = Array.from(winners)
    }

    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      activeEls.forEach((el) => el.classList.remove('mobile-swap'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, zoneSelector, ...deps])
}
