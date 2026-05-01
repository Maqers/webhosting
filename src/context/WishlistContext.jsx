import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const WishlistContext = createContext(null)

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

  const toggleItem = useCallback((product) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === product.id)
      if (exists) return prev.filter(i => i.id !== product.id)
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