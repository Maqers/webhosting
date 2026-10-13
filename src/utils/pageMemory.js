// Remembers per-visit page state (scroll position, "Show more" count, chosen
// filter chip…) so Back lands where the shopper left, not at the top of a
// freshly reset list. Keyed by React Router's location.key, which is unique to
// each history entry, and only read back on a POP (Back/Forward) navigation:
// a fresh visit to the same page always starts clean.
import { useEffect, useState } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const storageKey = (locKey, name) => `pm:${locKey}:${name}`

export function readPageMemory(locKey, name) {
  try {
    const raw = sessionStorage.getItem(storageKey(locKey, name))
    return raw == null ? undefined : JSON.parse(raw)
  } catch { return undefined }
}

export function writePageMemory(locKey, name, value) {
  try { sessionStorage.setItem(storageKey(locKey, name), JSON.stringify(value)) } catch { /* private mode etc. */ }
}

// useState that survives Back: restored on POP, saved on every change.
export function useRestoredState(name, initial) {
  const location = useLocation()
  const navType = useNavigationType()
  const [value, setValue] = useState(() => {
    if (navType === 'POP') {
      const saved = readPageMemory(location.key, name)
      if (saved !== undefined) return saved
    }
    return typeof initial === 'function' ? initial() : initial
  })
  // Follows the entry's current key: a replace (e.g. tidying ?category= out
  // of the URL) gives the same page a new key.
  useEffect(() => { writePageMemory(location.key, name, value) }, [location.key, name, value])
  return [value, setValue]
}
