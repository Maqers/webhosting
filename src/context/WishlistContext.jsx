import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { trackEvent } from '../utils/analytics'
import { useSupabaseSync } from '../hooks/useSupabaseSync'

const WishlistContext = createContext(null)

function mergeWishlists(local, remote) {
  const byId = new Map(remote.map(i => [i.id, i]))
  local.forEach(i => byId.set(i.id, i)) // local wins on conflict, freshest device
  return Array.from(byId.values())
}

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('maqers_wishlist')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    try { localStorage.setItem('maqers_wishlist', JSON.stringify(items)) } catch {}
  }, [items])

  useSupabaseSync('wishlist', items, setItems, mergeWishlists)

  const toggleItem = useCallback((product) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === product.id)
      if (exists) {
        trackEvent('RemoveFromWishlist', { product_id: product.id, title: product.title })
        return prev.filter(i => i.id !== product.id)
      }
      trackEvent('AddToWishlist', {
        product_id: product.id,
        title: product.title,
        price: product.price,
        category_id: product.categoryId,
      })
      return [...prev, {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.images?.[0] || '',
        categoryId: product.categoryId,
      }]
    })
  }, [])

  const isWishlisted = useCallback((id) => items.some(i => i.id === id), [items])
  const count = items.length

  return (
    <WishlistContext.Provider value={{ items, toggleItem, isWishlisted, count, isOpen, setIsOpen }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}