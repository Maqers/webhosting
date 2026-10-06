import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useScrollLock } from '../hooks/useScrollLock'
import { getDeliveryFee, FREE_DELIVERY_MIN } from '../utils/delivery'
import { DIWALI_COUPON, hasDiwaliOffer, priceWithDiwaliCode, diwaliCartDiscount } from '../data/offers'
import './CartDrawer.css'

export default function CartDrawer() {
  const { items, removeItem, updateQty, total, count, isOpen, setIsOpen } = useCart()

  // Same rules as checkout: delivery on the pre-coupon subtotal
  // (utils/delivery.js), and MAQERSDIWALI5 applied to Diwali items
  // (data/offers.js), which checkout auto-applies to match.
  const deliveryFee = getDeliveryFee(total)
  const deliveryFree = deliveryFee === 0
  const couponDiscount = diwaliCartDiscount(items)
  const grandTotal = total - couponDiscount + deliveryFee
  const inr = (n) => `₹${n.toLocaleString('en-IN')}`

  useScrollLock(isOpen)

  return (
    <>
      <div className={`cart-backdrop ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(false)} />
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`} aria-label="Shopping cart" role="dialog">
        <div className="cart-header">
          <div className="cart-header-left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <span>YOUR CART {count > 0 && `(${count})`}</span>
          </div>
          <button className="cart-close" onClick={() => setIsOpen(false)} aria-label="Close cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="cart-body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              <p>Your cart is empty</p>
              <button className="cart-continue-btn" onClick={() => setIsOpen(false)}>Continue Shopping</button>
            </div>
          ) : (
            <div className="cart-items">
              {items.map(item => (
                <div key={item.key} className="cart-item">
                  <div className="cart-item-img">
                    {item.image && <img src={item.image} alt={item.title} />}
                  </div>
                  <div className="cart-item-info">
                    <p className="cart-item-category">{item.categoryId?.replace(/-/g, ' ')}</p>
                    <p className="cart-item-title">{item.title}</p>
                    {item.selectedColor && <p className="cart-item-variant">Colour: {item.selectedColor}</p>}
                    {item.selectedSize && <p className="cart-item-variant">Size: {item.selectedSize}</p>}
                    {item.selectedPersonalisation?.length > 0 && (
                      <p className="cart-item-variant">+ {item.selectedPersonalisation.join(', ')}</p>
                    )}
                    {item.orderNote?.trim() && (
                      <p className="cart-item-variant">Note: {item.orderNote.trim()}</p>
                    )}
                    {hasDiwaliOffer(item) ? (
                      <>
                        <p className="cart-item-price">
                          <span className="cart-item-price-original">{inr(item.price)}</span>
                          {inr(priceWithDiwaliCode(item.price))}
                        </p>
                        <p className="cart-item-coupon">✓ {DIWALI_COUPON.code} applied</p>
                      </>
                    ) : (
                      <p className="cart-item-price">{inr(item.price)}</p>
                    )}
                    <div className="cart-item-controls">
                      <div className="cart-qty">
                        <button onClick={() => updateQty(item.key, item.qty - 1)} disabled={item.qty <= 1}>−</button>
                        <span>{item.qty}</span>
                        <button onClick={() => updateQty(item.key, item.qty + 1)}>+</button>
                      </div>
                      <button className="cart-remove" onClick={() => removeItem(item.key)} aria-label="Remove item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Summary sits under the products and scrolls with them */}
              <div className="cart-summary">
                {deliveryFree ? (
                  <div className="cart-free-delivery-banner">🎉 FREE DELIVERY UNLOCKED!</div>
                ) : (
                  <div className="cart-delivery-nudge">
                    Add {inr(FREE_DELIVERY_MIN - total)} more for FREE delivery
                  </div>
                )}
                <div className="cart-subtotal">
                  <span>SUBTOTAL</span>
                  <span className="cart-total-amount">{inr(total)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="cart-subtotal cart-coupon-row">
                    <span>COUPON ({DIWALI_COUPON.code})</span>
                    <span className="cart-total-amount">−{inr(couponDiscount)}</span>
                  </div>
                )}
                <div className="cart-subtotal">
                  <span>DELIVERY</span>
                  <span className={`cart-total-amount ${deliveryFree ? 'cart-delivery-free' : ''}`}>
                    {deliveryFree ? 'FREE' : inr(deliveryFee)}
                  </span>
                </div>
                <div className="cart-subtotal cart-grand-total">
                  <span>TOTAL</span>
                  <span className="cart-total-amount">{inr(grandTotal)}</span>
                </div>
                <button className="cart-continue-link" onClick={() => setIsOpen(false)}>
                  CONTINUE SHOPPING
                </button>
              </div>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            <Link to="/checkout" className="cart-checkout-btn" onClick={() => setIsOpen(false)}>
              PROCEED TO CHECKOUT · {inr(grandTotal)}
            </Link>
          </div>
        )}
      </div>
    </>
  )
}