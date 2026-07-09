import { useEffect } from 'react'

// On touch grids, simulate desktop's :hover image-crossfade by activating
// only the row closest to the viewport's vertical center (scrollspy
// pattern), instead of letting every card decide independently whether it's
// "visible enough" — the latter causes many rows to swap at once on scroll.
//
// Uses IntersectionObserver against a thin band around the viewport's
// vertical center instead of a scroll listener, so nothing runs
// querySelectorAll/getBoundingClientRect on every scroll frame — that
// per-frame layout work was what made the page scroll jerkily on mobile.
export function useMobileCenterSwap(containerRef, zoneSelector = '.feat-img-zone.has-second-img', deps = []) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const isTouch = window.matchMedia('(hover: none) and (max-width: 768px)').matches
    if (!isTouch) return

    const intersecting = new Set()
    let activeEls = []

    const applyWinners = () => {
      if (intersecting.size === 0) {
        activeEls.forEach((el) => el.classList.remove('mobile-swap'))
        activeEls = []
        return
      }
      // All zones intersecting the thin center band are effectively "one row"
      // (the band is narrow enough that two different rows rarely both hit it).
      const winners = intersecting
      activeEls.forEach((el) => { if (!winners.has(el)) el.classList.remove('mobile-swap') })
      winners.forEach((el) => el.classList.add('mobile-swap'))
      activeEls = Array.from(winners)
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) intersecting.add(entry.target)
        else intersecting.delete(entry.target)
      })
      applyWinners()
    }, {
      // Shrink the observed viewport to a thin 10% band around vertical center
      rootMargin: '-45% 0px -45% 0px',
      threshold: 0,
    })

    const zones = container.querySelectorAll(zoneSelector)
    zones.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
      activeEls.forEach((el) => el.classList.remove('mobile-swap'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, zoneSelector, ...deps])
}
