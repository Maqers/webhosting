import { Link, useLocation } from 'react-router-dom'
import './SubNavbar.css'

const SubNavbar = () => {
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/products') {
      return location.pathname === '/products' || location.pathname.startsWith('/product/')
    }
    if (path === '/categories') {
      return location.pathname === '/categories' || location.pathname.startsWith('/category/')
    }
    return location.pathname === path
  }

  return (
    <nav className="sub-navbar">
      <div className="sub-navbar-container">
        <Link 
          to="/products" 
          className={`sub-navbar-link ${isActive('/products') ? 'active' : ''}`}
        >
          Products
        </Link>
        <Link 
          to="/categories" 
          className={`sub-navbar-link ${isActive('/categories') ? 'active' : ''}`}
        >
          Categories
        </Link>
      </div>
    </nav>
  )
}

export default SubNavbar

