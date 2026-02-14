/**
 * NAVBAR COMPONENT - MOBILE-FIRST REDESIGN
 * 
 * Senior-level, production-ready navbar implementation
 * - Mobile-first responsive design
 * - Clear hierarchy: Logo → Menu Trigger → Actions
 * - Full-screen mobile menu drawer
 * - No logo overlap or visual conflicts
 * - Accessibility-first approach
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import EnhancedSearchBar from './EnhancedSearchBar'
import { getSortedCategories } from '../data/catalog'
import './Navbar.css'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [categoriesPanelOpen, setCategoriesPanelOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const navbarRef = useRef(null)
  const menuRef = useRef(null)
  const categoriesRef = useRef(null)
  const categoriesTimeoutRef = useRef(null)
  const firstMenuItemRef = useRef(null)
  const lastMenuItemRef = useRef(null)
  const previousActiveElementRef = useRef(null)
  const categories = getSortedCategories()

  const isActive = (path) => location.pathname === path

  const isCategoryActive = (categorySlug) => {
    return location.pathname === `/category/${categorySlug}` ||
      location.pathname.startsWith(`/category/${categorySlug}/`)
  }

  const isProductsActive = () => {
    return location.pathname === '/products' ||
      location.pathname.startsWith('/product/')
  }

  const handleSearch = useCallback((results) => {
    // Prevent navigation if already on products page with same query
    if (location.pathname === '/products' && results?.query) {
      // Just update state without navigation to prevent throttling
      return
    }
    
    if (results && results.query) {
      navigate('/products', {
        state: {
          searchQuery: results.query,
          searchResults: results
        },
        replace: false
      })
    } else if (results && results.hasResults) {
      navigate('/products', { 
        state: { searchResults: results },
        replace: false
      })
    }
    setIsOpen(false)
  }, [navigate, location.pathname])

  const closeMenu = useCallback(() => {
    setIsOpen(false)
    setCategoriesPanelOpen(false)
    setCategoriesOpen(false)
  }, [])

  const openCategoriesPanel = useCallback(() => {
    setCategoriesPanelOpen(true)
  }, [])

  const closeCategoriesPanel = useCallback(() => {
    setCategoriesPanelOpen(false)
  }, [])

  // Close categories panel when mobile menu closes
  useEffect(() => {
    if (!isOpen) {
      setCategoriesPanelOpen(false)
    }
  }, [isOpen])

  // Handle scroll behavior for navbar shadow enhancement
  useEffect(() => {
    let lastScrollY = window.scrollY
    let ticking = false

    const updateScrollState = () => {
      const currentScrollY = window.scrollY
      setScrolled(currentScrollY > 10)
      lastScrollY = currentScrollY
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollState)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Prevent body scroll and blur page content when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      // Store current scroll position
      const scrollY = window.scrollY
      const rootElement = document.getElementById('root')

      // Prevent body scroll
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.classList.add('menu-open')

      // Add blur class to root for page content blurring
      if (rootElement) {
        rootElement.classList.add('menu-open-blur')
      }

      // Store previously active element for focus restoration
      previousActiveElementRef.current = document.activeElement

      // Focus first menu item after animation starts
      setTimeout(() => {
        if (firstMenuItemRef.current) {
          firstMenuItemRef.current.focus()
        }
      }, 150)
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top
      const rootElement = document.getElementById('root')

      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.classList.remove('menu-open')

      // Remove blur class from root
      if (rootElement) {
        rootElement.classList.remove('menu-open-blur')
      }

      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1)
      }

      // Restore focus to previously active element
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus()
      }
    }
    return () => {
      const rootElement = document.getElementById('root')
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.classList.remove('menu-open')
      if (rootElement) {
        rootElement.classList.remove('menu-open-blur')
      }
    }
  }, [isOpen])

  // Focus trap and keyboard navigation for mobile menu and categories panel
  useEffect(() => {
    if (!isOpen && !categoriesPanelOpen) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (categoriesPanelOpen) {
          closeCategoriesPanel()
        } else {
        closeMenu()
        }
        return
      }

      // Focus trap: Tab key navigation
      if (event.key === 'Tab') {
        const currentPanel = categoriesPanelOpen 
          ? document.querySelector('.categories-panel-content')
          : menuRef.current
        
        const focusableElements = currentPanel?.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )

        if (!focusableElements || focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (event.shiftKey) {
          // Shift + Tab: going backwards
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          // Tab: going forwards
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, categoriesPanelOpen, closeMenu, closeCategoriesPanel])

  // Close menu on outside click
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event) => {
      if (
        navbarRef.current &&
        !navbarRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        closeMenu()
      }
    }

    // Use capture phase to catch clicks before they bubble
    document.addEventListener('mousedown', handleClickOutside, true)
    return () => document.removeEventListener('mousedown', handleClickOutside, true)
  }, [isOpen, closeMenu])

  // Handle categories dropdown outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoriesRef.current && !categoriesRef.current.contains(event.target)) {
        // Clear any pending timeout
        if (categoriesTimeoutRef.current) {
          clearTimeout(categoriesTimeoutRef.current)
          categoriesTimeoutRef.current = null
        }
        setCategoriesOpen(false)
      }
    }

    if (categoriesOpen) {
      // Use capture phase to catch clicks before they bubble
      document.addEventListener('mousedown', handleClickOutside, true)
      return () => document.removeEventListener('mousedown', handleClickOutside, true)
    }
  }, [categoriesOpen])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (categoriesTimeoutRef.current) {
        clearTimeout(categoriesTimeoutRef.current)
      }
    }
  }, [])

  // Menu items configuration
  const menuItems = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/faqs', label: 'FAQs' },
    { path: '/contact', label: 'Contact Us' },
    { path: '/seller-registration', label: 'Seller Registration' }
  ]

  return (
    <>
      <nav
        className={`navbar ${scrolled ? 'scrolled' : ''} ${isOpen ? 'menu-open-search-hidden' : ''}`}
        ref={navbarRef}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className={`navbar-container ${isOpen ? 'menu-open-search-hidden' : ''}`}>
          {/* Top Row: Logo + Hamburger (Mobile) / Logo + Products/Categories + Menu (Desktop) */}
          <div className="navbar-top-row">
            {/* Left Section: Logo + Products/Categories */}
            <div className="navbar-left-section">
              {/* Logo - Always left-aligned */}
              <Link
                to="/"
                className="navbar-logo"
                onClick={closeMenu}
                aria-label="Home"
              >
                <span className="logo-text">maqers.in</span>
              </Link>

              {/* Products & Categories Dropdown - Beside Logo (Desktop Only) */}
              <div className="navbar-products-categories" ref={categoriesRef}>
                {/* All Products Link */}
                <Link
                  to="/products"
                  className={`navbar-dropdown-trigger ${isProductsActive() ? 'active' : ''}`}
                  onMouseEnter={() => setCategoriesOpen(false)}
                >
                  All Products
                </Link>

                {/* Categories Dropdown */}
                <div
                  className="navbar-dropdown-wrapper"
                  onMouseEnter={() => {
                    if (categoriesTimeoutRef.current) {
                      clearTimeout(categoriesTimeoutRef.current)
                      categoriesTimeoutRef.current = null
                    }
                    setCategoriesOpen(true)
                  }}
                  onMouseLeave={() => {
                    categoriesTimeoutRef.current = setTimeout(() => {
                      setCategoriesOpen(false)
                    }, 150)
                  }}
                >
                  <button
                    className={`navbar-dropdown-trigger ${location.pathname.startsWith('/category/') || location.pathname === '/categories' ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setCategoriesOpen(!categoriesOpen)
                    }}
                    aria-expanded={categoriesOpen}
                    aria-haspopup="true"
                    type="button"
                  >
                    Categories
                    <svg
                      className={`dropdown-arrow ${categoriesOpen ? 'open' : ''}`}
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {categoriesOpen && (
                    <div
                      className="navbar-dropdown-menu"
                      onMouseEnter={() => {
                        // Keep open when hovering over dropdown
                        if (categoriesTimeoutRef.current) {
                          clearTimeout(categoriesTimeoutRef.current)
                          categoriesTimeoutRef.current = null
                        }
                      }}
                      onMouseLeave={() => {
                        // Close when leaving dropdown
                        categoriesTimeoutRef.current = setTimeout(() => {
                          setCategoriesOpen(false)
                        }, 150)
                      }}
                      >
                      {/* Show all categories directly - no "View All Categories" button */}
                      <div className="navbar-categories-list">
                        {categories.map((category, index) => (
                        <Link
                          key={category.id}
                          to={`/category/${category.slug}`}
                            className={`navbar-dropdown-item navbar-category-item ${isCategoryActive(category.slug) ? 'active' : ''}`}
                            onClick={() => {
                              setCategoriesOpen(false)
                            }}
                            style={{ '--delay': `${index * 0.03}s` }}
                        >
                            <span>{category.name}</span>
                        </Link>
                      ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Center Section: Search Bar (Desktop) */}
            <div className="navbar-center-section navbar-search-desktop">
              <EnhancedSearchBar onSearch={handleSearch} />
            </div>

            {/* Right Section: Menu + Hamburger */}
            <div className="navbar-right-section">
              {/* Desktop Menu */}
              <div className="navbar-menu-desktop">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`navbar-link ${isActive(item.path) ? 'active' : ''}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Mobile Menu Toggle Button */}
              <button
                className={`navbar-toggle ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isOpen}
                aria-controls="mobile-menu"
                type="button"
              >
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
              </button>
            </div>
          </div>

          {/* Mobile Search Bar Section - Below Logo/Hamburger Row */}
          <div className={`navbar-mobile-search-section ${isOpen ? 'hidden' : ''}`}>
            <EnhancedSearchBar onSearch={handleSearch} />
          </div>
        </div>
      </nav>

      {/* Mobile Menu Backdrop */}
      <div
        className={`navbar-menu-backdrop ${isOpen ? 'active' : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Mobile Menu Drawer */}
      <div
        id="mobile-menu"
        ref={menuRef}
        className={`navbar-menu-mobile ${isOpen ? 'active' : ''}`}
        aria-hidden={!isOpen}
        role="dialog"
        aria-modal={isOpen}
        aria-label="Mobile navigation menu"
        style={{ display: isOpen ? 'flex' : 'none' }}
      >
        <div className="mobile-menu-header">
          <div className="mobile-menu-header-content">
          {/* Logo at top-left */}
          <Link
            to="/"
            className="mobile-menu-logo"
            onClick={closeMenu}
            aria-label="Home"
          >
            <span className="logo-text">maqers.in</span>
          </Link>
          <button
            className="mobile-menu-close"
            onClick={closeMenu}
            aria-label="Close menu"
            type="button"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          </div>
        </div>

        {/* Mobile Menu Content - Scrollable */}
        <nav className="mobile-menu-nav" aria-label="Mobile navigation">
          {/* All Menu Items in Order: Home, All Products, Categories, About, FAQs, Contact Us */}
          <div className="mobile-menu-items">
            {/* Home */}
            <Link
              to="/"
              className={`mobile-menu-link ${isActive('/') ? 'active' : ''}`}
              onClick={closeMenu}
              tabIndex={isOpen ? 0 : -1}
            >
              Home
            </Link>

            {/* All Products */}
            <Link
              to="/products"
              className={`mobile-menu-link ${isProductsActive() ? 'active' : ''}`}
              onClick={closeMenu}
              tabIndex={isOpen ? 0 : -1}
            >
              All Products
            </Link>

            {/* Categories */}
            <Link
              to="/categories"
              className={`mobile-menu-link ${location.pathname === '/categories' || location.pathname.startsWith('/category/') ? 'active' : ''}`}
              onClick={closeMenu}
              tabIndex={isOpen ? 0 : -1}
            >
              Categories
            </Link>

            {/* About, FAQs, Contact Us */}
            {menuItems.filter(item => item.path !== '/').map((item, index) => (
              <Link
                key={item.path}
                ref={index === 0 ? firstMenuItemRef : null}
                to={item.path}
                className={`mobile-menu-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={closeMenu}
                tabIndex={isOpen ? 0 : -1}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Categories Panel - Separate Slide-in Modal */}
      <div
        className={`categories-panel ${categoriesPanelOpen ? 'active' : ''}`}
        aria-hidden={!categoriesPanelOpen}
        role="dialog"
        aria-modal={categoriesPanelOpen}
        aria-label="Categories"
      >
        <div className="categories-panel-backdrop" onClick={closeCategoriesPanel} aria-hidden="true" />
        <div className="categories-panel-content">
          <div className="categories-panel-header">
            <h2 className="categories-panel-title">All Categories</h2>
            <button
              className="categories-panel-close"
              onClick={closeCategoriesPanel}
              aria-label="Close categories"
              type="button"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="categories-panel-list">
            {categories.map((category, index) => (
                <Link
                  key={category.id}
                  to={`/category/${category.slug}`}
                className={`categories-panel-item ${isCategoryActive(category.slug) ? 'active' : ''}`}
                onClick={() => {
                  closeCategoriesPanel()
                  closeMenu()
                }}
                style={{ '--delay': `${index * 0.02}s` }}
                >
                <span className="categories-panel-item-name">{category.name}</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="categories-panel-item-arrow"
                >
                  <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                </Link>
              ))}
            </div>
          </div>
      </div>
    </>
  )
}

export default Navbar
