import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import { getAllProducts } from '../data/catalog'
import './WishlistDrawer.css'

export default function WishlistDrawer() {
  const { items, toggleItem, isOpen, setIsOpen } = useWishlist()
  const { addItem } = useCart()

  const allProducts = getAllProducts()

  const handleMoveToCart = (item) => {
    const product = allProducts.find(p => p.id === item.id)
    if (product) {
      addItem(product)
      toggleItem(item)
    }
  }

  return (
    <>
      <div className={`wishlist-backdrop ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(false)} />
      <div className={`wishlist-drawer ${isOpen ? 'open' : ''}`}>
        <div className="wishlist-header">
          <div className="wishlist-header-left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
            <span>WISHLIST {items.length > 0 && `(${items.length})`}</span>
          </div>
          <button className="wishlist-close" onClick={() => setIsOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="wishlist-body">
          {items.length === 0 ? (
            <div className="wishlist-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
              <p>Your wishlist is empty</p>
              <button className="wishlist-continue-btn" onClick={() => setIsOpen(false)}>Browse Products</button>
            </div>
          ) : (
            <div className="wishlist-items">
              {items.map(item => (
                <div key={item.id} className="wishlist-item">
                  <div className="wishlist-item-img">
                    {item.image && <img src={item.image} alt={item.title} />}
                  </div>
                  <div className="wishlist-item-info">
                    <p className="wishlist-item-category">{item.categoryId?.replace(/-/g, ' ')}</p>
                    <p className="wishlist-item-title">{item.title}</p>
                    <p className="wishlist-item-price">₹{item.price.toLocaleString('en-IN')}</p>
                    <div className="wishlist-item-actions">
                      <button className="wishlist-add-cart" onClick={() => handleMoveToCart(item)}>
                        Move to Cart
                      </button>
                      <button className="wishlist-remove" onClick={() => toggleItem(item)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}