import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import './BottomNav.css'

export default function BottomNav() {
  const location = useLocation()
  const { count, setIsOpen } = useCart()
  const path = location.pathname

  return (
    <nav className="bottom-nav">
      <Link to="/" className={`bottom-nav-item ${path === '/' ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>Home</span>
      </Link>

      <Link to="/by-product" className={`bottom-nav-item ${path === '/by-product' ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 6h16M4 12h10M4 18h7"/>
        </svg>
        <span>By Category</span>
      </Link>

      <Link to="/by-occasion" className={`bottom-nav-item ${path === '/by-occasion' || path.startsWith('/category/') ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
        <span>By Occasion</span>
      </Link>

      <button
        className={`bottom-nav-item bottom-nav-cart ${path === '/cart' || path === '/checkout' ? 'active' : ''}`}
        onClick={() => setIsOpen(true)}
      >
        <div className="bottom-nav-cart-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          {count > 0 && <span className="bottom-nav-badge">{count > 9 ? '9+' : count}</span>}
        </div>
        <span>Cart</span>
      </button>
    </nav>
  )
}