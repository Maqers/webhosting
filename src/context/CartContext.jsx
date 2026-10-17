import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { trackEvent } from '../utils/analytics'
import { useSupabaseSync } from '../hooks/useSupabaseSync'
import { saveLeadSoon, summariseCart } from '../utils/leads'

const CartContext = createContext(null)

// Most of one product a shopper can add (all its colours and sizes together).
// Hampers are made to order, so they have no limit.
export const MAX_QTY_PER_PRODUCT = 10
export const qtyLimitFor = (product) =>
  product?.categoryId === 'Customised-Hampers' ? Infinity : MAX_QTY_PER_PRODUCT

function mergeCarts(local, remote) {
  const byKey = new Map(remote.map(i => [i.key, i]))
  local.forEach(i => byKey.set(i.key, i)) // local wins on conflict, freshest device
  return Array.from(byKey.values())
}

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

  useSupabaseSync('cart', items, setItems, mergeCarts)

  // Lead capture, step 1: remember what's in the cart even before we know who
  // the shopper is. Contact details join the same lead once checkout has them.
  useEffect(() => {
    if (items.length === 0) return
    saveLeadSoon({
      stage: 'cart',
      cart: summariseCart(items),
      cart_total: items.reduce((sum, i) => sum + i.price * i.qty, 0),
      item_count: items.reduce((sum, i) => sum + i.qty, 0),
    }, 1500)
  }, [items])

  const addItem = useCallback((product, selectedColor = '', selectedSize = '', selectedPersonalisation = [], orderNote = '', quantity = 1) => {
    setItems(prev => {
      const personalisationKey = selectedPersonalisation.slice().sort().join('|')
      const key = `${product.id}-${selectedColor}-${selectedSize}-${personalisationKey}`
      const existing = prev.find(i => i.key === key)
      const inOtherVariants = prev.reduce((sum, i) => sum + (i.id === product.id && i.key !== key ? i.qty : 0), 0)
      const room = qtyLimitFor(product) - inOtherVariants
      if (existing) {
        return prev.map(i => i.key === key ? { ...i, qty: Math.min(i.qty + quantity, room) } : i)
      }
      quantity = Math.min(quantity, room)
      if (quantity < 1) return prev
      // Compute extra price from selected personalisation options
      const prices = product.meta?.personalisation_prices || []
      const opts = product.meta?.personalisation_options || []
      const personalisationExtra = selectedPersonalisation.reduce((sum, opt) => {
        const idx = opts.indexOf(opt)
        return sum + (idx !== -1 && prices[idx] ? Number(prices[idx]) : 0)
      }, 0)
      const sizePrice = product.meta?.sizePrices?.[selectedSize]
      const basePrice = sizePrice != null ? Number(sizePrice) : product.price
      return [...prev, {
        key,
        id: product.id,
        title: product.title,
        price: basePrice + personalisationExtra,
        basePrice,
        personalisationExtra,
        image: product.images?.[0] || '',
        categoryId: product.categoryId,
        sellerId: product.meta?.sellerId || '',
        sellerCode: product.meta?.sellerCode || '',
        selectedColor,
        selectedSize,
        selectedPersonalisation,
        orderNote,
        qty: quantity,
      }]
    })
    setIsOpen(true)
    trackEvent('AddToCart', {
      product_id: product.id,
      title: product.title,
      price: product.price,
      category_id: product.categoryId,
      quantity,
    })
  }, [])

  const removeItem = useCallback((key) => {
    setItems(prev => {
      const removed = prev.find(i => i.key === key)
      if (removed) trackEvent('RemoveFromCart', { product_id: removed.id, title: removed.title })
      return prev.filter(i => i.key !== key)
    })
  }, [])

  const updateQty = useCallback((key, qty) => {
    if (qty < 1) return
    setItems(prev => {
      const line = prev.find(i => i.key === key)
      if (!line) return prev
      const inOtherVariants = prev.reduce((sum, i) => sum + (i.id === line.id && i.key !== key ? i.qty : 0), 0)
      const room = qtyLimitFor(line) - inOtherVariants
      return prev.map(i => i.key === key ? { ...i, qty: Math.min(qty, room) } : i)
    })
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