import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabaseRest } from '../config/supabaseConfig'

// Syncs one column ('cart' or 'wishlist') of the user_carts table with local state.
// On login: pulls the remote value once and merges it into local state.
// On change while logged in: pushes local state up (debounced).
export function useSupabaseSync(column, items, setItems, mergeFn) {
  const { isLoggedIn, user, accessToken } = useAuth()
  const pushTimer = useRef(null)
  const hasMergedRef = useRef(false)
  const skipNextPushRef = useRef(false)

  // Pull + merge once per login
  useEffect(() => {
    if (!isLoggedIn || !user?.id || !accessToken) { hasMergedRef.current = false; return }
    if (hasMergedRef.current) return
    hasMergedRef.current = true

    supabaseRest(`user_carts?user_id=eq.${user.id}&select=${column}`, { accessToken })
      .then(rows => {
        const remote = rows?.[0]?.[column]
        if (Array.isArray(remote) && remote.length > 0) {
          skipNextPushRef.current = true
          setItems(prev => mergeFn(prev, remote))
        }
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user?.id, accessToken])

  // Push on change (debounced)
  useEffect(() => {
    if (!isLoggedIn || !user?.id || !accessToken) return
    if (skipNextPushRef.current) { skipNextPushRef.current = false; return }

    if (pushTimer.current) clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => {
      supabaseRest('user_carts?on_conflict=user_id', {
        method: 'POST',
        accessToken,
        body: { user_id: user.id, [column]: items, updated_at: new Date().toISOString() },
        headers: { Prefer: 'resolution=merge-duplicates' },
      }).catch(() => {})
    }, 800)

    return () => { if (pushTimer.current) clearTimeout(pushTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, isLoggedIn, user?.id, accessToken])
}
