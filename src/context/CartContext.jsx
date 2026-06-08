import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('maqers_cart')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    try { localStorage.setItem('maqers_cart', JSON.stringify(items)) } catch {}
  }, [items])

  const addItem = useCallback((product, selectedColor = '', selectedSize = '', selectedPersonalisation = [], orderNote = '') => {
    setItems(prev => {
      const personalisationKey = selectedPersonalisation.slice().sort().join('|')
      const key = `${product.id}-${selectedColor}-${selectedSize}-${personalisationKey}`
      const existing = prev.find(i => i.key === key)
      if (existing) {
        return prev.map(i => i.key === key ? { ...i, qty: i.qty + 1 } : i)
      }
      // Compute extra price from selected personalisation options
      const prices = product.meta?.personalisation_prices || []
      const opts = product.meta?.personalisation_options || []
      const personalisationExtra = selectedPersonalisation.reduce((sum, opt) => {
        const idx = opts.indexOf(opt)
        return sum + (idx !== -1 && prices[idx] ? Number(prices[idx]) : 0)
      }, 0)
      return [...prev, {
        key,
        id: product.id,
        title: product.title,
        price: product.price + personalisationExtra,
        basePrice: product.price,
        personalisationExtra,
        image: product.images?.[0] || '',
        categoryId: product.categoryId,
        sellerId: product.meta?.sellerId || '',
        sellerCode: product.meta?.sellerCode || '',
        selectedColor,
        selectedSize,
        selectedPersonalisation,
        orderNote,
        qty: 1,
      }]
    })
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((key) => {
    setItems(prev => prev.filter(i => i.key !== key))
  }, [])

  const updateQty = useCallback((key, qty) => {
    if (qty < 1) return
    setItems(prev => prev.map(i => i.key === key ? { ...i, qty } : i))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const count = items.reduce((sum, i) => sum + i.qty, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, count, isOpen, setIsOpen }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}