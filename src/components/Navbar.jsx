import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import EnhancedSearchBar from './EnhancedSearchBar'
import { getSortedCategories } from '../data/catalog'
import './Navbar.css'

const OCCASION_CATEGORIES = [
  { id: 'for-your-best-friend',  name: 'For Your Best Friend',    slug: 'for-your-best-friend',  emoji: '🫂' },
  { id: 'for-your-partner',      name: 'For Your Partner',         slug: 'for-your-partner',       emoji: '💕' },
  { id: 'situationship',         name: 'For Your Situationship',   slug: 'situationship',           emoji: '🫠' },
  { id: 'self-love-kits',        name: 'Self-Love Kits',           slug: 'self-love-kits',          emoji: '🌸' },
  { id: 'breakup-hampers',       name: 'Breakup Hampers',          slug: 'breakup-hampers',         emoji: '🫶' },
  { id: 'late-night-cravings',   name: 'Midnight Crisis Gifts',    slug: 'late-night-cravings',     emoji: '🌙' },
  { id: 'the-main-character',    name: 'Main Character Energy',    slug: 'the-main-character',      emoji: '✨' },
  { id: 'for-your-work-friend',  name: 'For Your Work Friend',     slug: 'for-your-work-friend',    emoji: '☕' },
  { id: 'for-your-mom',          name: 'For Your Mom',             slug: 'for-your-mom',            emoji: '🌷' },
  { id: 'for-your-dad',          name: 'For Your Dad',             slug: 'for-your-dad',            emoji: '🫡' },
  { id: 'for-your-sibling',      name: 'For Your Sibling',         slug: 'for-your-sibling',        emoji: '👀' },
  { id: 'the-host-gift',         name: 'The Host Gift',            slug: 'the-host-gift',           emoji: '🥂' },
  { id: 'occasion-gifts',        name: 'Occasion Gifts',           slug: 'occasion-gifts',          emoji: '🎉' },
]

const PRODUCT_CATEGORIES = [
  { id: 'Crochet',              name: 'Handmade Crochet',     slug: 'Crochet'              },
  { id: 'Candles',              name: 'Candles & Diffusers',  slug: 'Candles'              },
  { id: 'Handbags',             name: 'Handbags & Totes',     slug: 'Handbags'             },
  { id: 'Frames&Paintings',     name: 'Frames & Paintings',   slug: 'Frames&Paintings'     },
  { id: 'Home-decor',           name: 'Home Decor',           slug: 'Home-decor'           },
  { id: 'resin-products',       name: 'Resin Products',       slug: 'resin-products'       },
  { id: 'Handmade-Accessories', name: 'Jewellery & Accessories', slug: 'Handmade-Accessories' },
  { id: 'Customised-Hampers',   name: 'Customised Hampers',   slug: 'Customised-Hampers'   },
  { id: 'Handmade-Soaps',       name: 'Handmade Soaps',       slug: 'Handmade-Soaps'       },
]

const Navbar = () => {
  const [isOpen, setIsOpen]           = useState(false)
  const [scrolled, setScrolled]       = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [mobileOccasionOpen, setMobileOccasionOpen] = useState(false)
  const [mobileProductOpen, setMobileProductOpen]   = useState(false)

  const location  = useLocation()
  const navigate  = useNavigate()
  const navbarRef = useRef(null)
  const menuRef   = useRef(null)
  const catRef    = useRef(null)
  const catTimerRef = useRef(null)
  const firstItemRef = useRef(null)
  const prevActiveRef = useRef(null)

  const isActive    = (path) => location.pathname === path
  const isCatActive = (slug) => location.pathname === `/category/${slug}` || location.pathname.startsWith(`/category/${slug}/`)
  const isProductsActive = () => location.pathname === '/products' || location.pathname.startsWith('/product/')

  const handleSearch = useCallback((results) => {
    if (location.pathname === '/products' && results?.query) return
    if (results?.query) navigate('/products', { state: { searchQuery: results.query, searchResults: results } })
    else if (results?.hasResults) navigate('/products', { state: { searchResults: results } })
    setIsOpen(false)
  }, [navigate, location.pathname])

  const closeMenu = useCallback(() => {
    setIsOpen(false); setCategoriesOpen(false)
    setMobileOccasionOpen(false); setMobileProductOpen(false)
  }, [])

  useEffect(() => {
    let t = false
    const fn = () => { if (!t) { window.requestAnimationFrame(() => { setScrolled(window.scrollY > 10); t = false }); t = true } }
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    if (isOpen) {
      const y = window.scrollY, root = document.getElementById('root')
      document.body.style.position = 'fixed'; document.body.style.top = `-${y}px`
      document.body.style.width = '100%'; document.body.classList.add('menu-open')
      if (root) root.classList.add('menu-open-blur')
      prevActiveRef.current = document.activeElement
      setTimeout(() => firstItemRef.current?.focus(), 150)
    } else {
      const y = document.body.style.top, root = document.getElementById('root')
      document.body.style.position = ''; document.body.style.top = ''
      document.body.style.width = ''; document.body.classList.remove('menu-open')
      if (root) root.classList.remove('menu-open-blur')
      if (y) window.scrollTo(0, parseInt(y || '0') * -1)
      prevActiveRef.current?.focus()
    }
    return () => {
      const root = document.getElementById('root')
      document.body.style.position = ''; document.body.style.top = ''
      document.body.style.width = ''; document.body.classList.remove('menu-open')
      if (root) root.classList.remove('menu-open-blur')
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const fn = (e) => {
      if (e.key === 'Escape') { closeMenu(); return }
      if (e.key === 'Tab') {
        const els = menuRef.current?.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')
        if (!els?.length) return
        const first = els[0], last = els[els.length - 1]
        if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus() } }
        else { if (document.activeElement === last) { e.preventDefault(); first.focus() } }
      }
    }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [isOpen, closeMenu])

  useEffect(() => {
    if (!isOpen) return
    const fn = (e) => { if (navbarRef.current && !navbarRef.current.contains(e.target) && menuRef.current && !menuRef.current.contains(e.target)) closeMenu() }
    document.addEventListener('mousedown', fn, true)
    return () => document.removeEventListener('mousedown', fn, true)
  }, [isOpen, closeMenu])

  useEffect(() => {
    if (!categoriesOpen) return
    const fn = (e) => { if (catRef.current && !catRef.current.contains(e.target)) { if (catTimerRef.current) clearTimeout(catTimerRef.current); setCategoriesOpen(false) } }
    document.addEventListener('mousedown', fn, true)
    return () => document.removeEventListener('mousedown', fn, true)
  }, [categoriesOpen])

  useEffect(() => () => { if (catTimerRef.current) clearTimeout(catTimerRef.current) }, [])

  const menuItems = [
    { path: '/',        label: 'Home'       },
    { path: '/about',   label: 'About'      },
    { path: '/faqs',    label: 'FAQs'       },
    { path: '/contact', label: 'Contact Us' },
  ]

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} ref={navbarRef} role="navigation" aria-label="Main navigation">
        <div className="navbar-container">
          <div className="navbar-top-row">

            {/* LEFT: Logo + desktop categories */}
            <div className="navbar-left-section">
              <Link to="/" className="navbar-logo" onClick={closeMenu} aria-label="Home">
                <span className="logo-text">maqers.in</span>
              </Link>

              {/* Desktop dropdown — hidden on mobile via CSS */}
              <div className="navbar-products-categories" ref={catRef}>
                <Link to="/products" className={`navbar-dropdown-trigger ${isProductsActive() ? 'active' : ''}`} onMouseEnter={() => setCategoriesOpen(false)}>
                  All Products
                </Link>
                <div
                  className="navbar-dropdown-wrapper"
                  onMouseEnter={() => { if (catTimerRef.current) { clearTimeout(catTimerRef.current); catTimerRef.current = null } setCategoriesOpen(true) }}
                  onMouseLeave={() => { catTimerRef.current = setTimeout(() => setCategoriesOpen(false), 150) }}
                >
                  <button
                    className={`navbar-dropdown-trigger ${location.pathname.startsWith('/category/') ? 'active' : ''}`}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCategoriesOpen(!categoriesOpen) }}
                    aria-expanded={categoriesOpen} aria-haspopup="true" type="button"
                  >
                    Categories
                    <svg className={`dropdown-arrow ${categoriesOpen ? 'open' : ''}`} width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {categoriesOpen && (
                    <div
                      className="navbar-dropdown-menu navbar-dropdown-menu--wide"
                      onMouseEnter={() => { if (catTimerRef.current) { clearTimeout(catTimerRef.current); catTimerRef.current = null } }}
                      onMouseLeave={() => { catTimerRef.current = setTimeout(() => setCategoriesOpen(false), 150) }}
                    >
                      <div className="navbar-dropdown-two-col">
                        <div className="navbar-dropdown-col">
                          <div className="navbar-dropdown-col-heading">Shop by Occasion</div>
                          {OCCASION_CATEGORIES.map((cat) => (
                            <Link key={cat.id} to={`/category/${cat.slug}`} className={`navbar-dropdown-item navbar-category-item ${isCatActive(cat.slug) ? 'active' : ''}`} onClick={() => setCategoriesOpen(false)}>
                              <span className="navbar-cat-emoji">{cat.emoji}</span><span>{cat.name}</span>
                            </Link>
                          ))}
                        </div>
                        <div className="navbar-dropdown-divider" />
                        <div className="navbar-dropdown-col">
                          <div className="navbar-dropdown-col-heading">Shop by Product</div>
                          {PRODUCT_CATEGORIES.map((cat) => (
                            <Link key={cat.id} to={`/category/${cat.slug}`} className={`navbar-dropdown-item navbar-category-item ${isCatActive(cat.slug) ? 'active' : ''}`} onClick={() => setCategoriesOpen(false)}>
                              <span>{cat.name}</span>
                            </Link>
                          ))}
                          <Link to="/categories" className="navbar-dropdown-view-all" onClick={() => setCategoriesOpen(false)}>View all →</Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CENTER: Desktop search */}
            <div className="navbar-center-section navbar-search-desktop">
              <EnhancedSearchBar onSearch={handleSearch} />
            </div>

            {/* MOBILE: inline search — sits between logo and hamburger */}
            <div className="navbar-mobile-search-inline">
              <EnhancedSearchBar onSearch={handleSearch} />
            </div>

            {/* RIGHT: Desktop nav links + hamburger */}
            <div className="navbar-right-section">
              <div className="navbar-menu-desktop">
                {menuItems.map((item) => (
                  <Link key={item.path} to={item.path} className={`navbar-link ${isActive(item.path) ? 'active' : ''}`}>{item.label}</Link>
                ))}
              </div>
              <button className={`navbar-toggle ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)} aria-label={isOpen ? 'Close menu' : 'Open menu'} aria-expanded={isOpen} type="button">
                <span className="hamburger-line"/><span className="hamburger-line"/><span className="hamburger-line"/>
              </button>
            </div>
          </div>
          {/* No second row — search is inline on mobile now */}
        </div>
      </nav>

      <div className={`navbar-menu-backdrop ${isOpen ? 'active' : ''}`} onClick={closeMenu} aria-hidden="true" />

      {/* Mobile drawer */}
      <div id="mobile-menu" ref={menuRef} className={`navbar-menu-mobile ${isOpen ? 'active' : ''}`} aria-hidden={!isOpen} role="dialog" aria-modal={isOpen} style={{ display: isOpen ? 'flex' : 'none' }}>
        <div className="mobile-menu-header">
          <div className="mobile-menu-header-content">
            <Link to="/" className="mobile-menu-logo" onClick={closeMenu}><span className="logo-text">maqers.in</span></Link>
            <button className="mobile-menu-close" onClick={closeMenu} type="button" aria-label="Close menu">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <nav className="mobile-menu-nav" aria-label="Mobile navigation">
          <div className="mobile-menu-items">
            <Link ref={firstItemRef} to="/" className={`mobile-menu-link ${isActive('/') ? 'active' : ''}`} onClick={closeMenu} tabIndex={isOpen ? 0 : -1}>Home</Link>
            <Link to="/products" className={`mobile-menu-link ${isProductsActive() ? 'active' : ''}`} onClick={closeMenu} tabIndex={isOpen ? 0 : -1}>All Products</Link>

            {/* Accordion: Shop by Occasion */}
            <button type="button" className="mobile-accordion-trigger" onClick={() => setMobileOccasionOpen(o => !o)} aria-expanded={mobileOccasionOpen}>
              <span>Shop by Occasion</span>
              <svg className={`mobile-accordion-arrow ${mobileOccasionOpen ? 'open' : ''}`} width="16" height="16" viewBox="0 0 14 14" fill="none">
                <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {mobileOccasionOpen && (
              <div className="mobile-accordion-content">
                {OCCASION_CATEGORIES.map((cat) => (
                  <Link key={cat.id} to={`/category/${cat.slug}`} className={`mobile-accordion-item ${isCatActive(cat.slug) ? 'active' : ''}`} onClick={closeMenu} tabIndex={isOpen ? 0 : -1}>
                    <span className="mobile-acc-emoji">{cat.emoji}</span>{cat.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Accordion: Shop by Product */}
            <button type="button" className="mobile-accordion-trigger" onClick={() => setMobileProductOpen(o => !o)} aria-expanded={mobileProductOpen}>
              <span>Shop by Product</span>
              <svg className={`mobile-accordion-arrow ${mobileProductOpen ? 'open' : ''}`} width="16" height="16" viewBox="0 0 14 14" fill="none">
                <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {mobileProductOpen && (
              <div className="mobile-accordion-content">
                {PRODUCT_CATEGORIES.map((cat) => (
                  <Link key={cat.id} to={`/category/${cat.slug}`} className={`mobile-accordion-item ${isCatActive(cat.slug) ? 'active' : ''}`} onClick={closeMenu} tabIndex={isOpen ? 0 : -1}>
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}

            {menuItems.filter(i => i.path !== '/').map((item) => (
              <Link key={item.path} to={item.path} className={`mobile-menu-link ${isActive(item.path) ? 'active' : ''}`} onClick={closeMenu} tabIndex={isOpen ? 0 : -1}>{item.label}</Link>
            ))}
          </div>
        </nav>
      </div>
    </>
  )
}

export default Navbar