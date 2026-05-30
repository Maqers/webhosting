import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom'
import { getAllProducts, getSortedCategories, getProductsByCategory, occasionProductMap } from '../data/catalog'
import { occasionCategories, getOccasionProducts } from '../data/occasionCatalog'
import ImageWithFallback from '../components/ImageWithFallback'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import SeoHead from '../components/SeoHead'
import './Categories.css'

const SOURCE_CATS = getSortedCategories().filter(c => c.id !== 'Oxidised-jewellery')

// Smart sub-filters per category — curated from real product tags
const CATEGORY_FILTERS = {
  'Handbags':             ['Potli', 'Clutch', 'Tote Bag', 'Sling Bag', 'Backpack'],
  'Candles':              ['Scented', 'Soy Wax', 'Luxury', 'Colourful', 'Reed Diffuser'],
  'Florals':              ['Bouquet', 'Crochet', 'Keychain', 'Basket'],
  'Handmade-Accessories': ['Bangles', 'Watches', 'Earrings', 'Necklace', 'Bracelet'],
  'Kids-Accessories':     ['Hair Clips', 'Brooches', 'Plush Toys', 'Collars'],
  'Wedding-Gifts':        ['Potli', 'Shagun Envelope', 'Decor', 'Return Gifts'],
  'Home-decor':           ['Brass', 'Evil Eye', 'Spiritual', 'Dining'],
  'Customised-Hampers':   ['Anniversary', 'Luxury', 'Personalised', 'Photo Frame'],
  'Handmade-Soaps':       ['Grape Soap', 'Decorative', 'Strawberry'],
  'resin-products':       ['Clock', 'Keychain', 'Photo Frame', 'Nameplate', 'Flower'],
  'Cosmetics':            ['Pouch', 'Personalised', 'Travel'],
}

// Map filter label → tag keywords to match against
const FILTER_KEYWORDS = {
  'Potli':           ['potli','potlis','pouch'],
  'Clutch':          ['clutch'],
  'Tote Bag':        ['tote'],
  'Sling Bag':       ['sling'],
  'Backpack':        ['backpack','bagpack'],
  'Scented':         ['scented','fragrance','aromatherapy'],
  'Soy Wax':         ['soy'],
  'Luxury':          ['luxury'],
  'Colourful':       ['color','colour','colorful','colourful'],
  'Reed Diffuser':   ['reed diffuser','diffuser'],
  'Bouquet':         ['bouquet'],
  'Crochet':         ['crochet'],
  'Keychain':        ['keychain','key chain','key-ring','keyring'],
  'Basket':          ['basket'],
  'Bangles':         ['bangle','bangles'],
  'Watches':         ['watch'],
  'Earrings':        ['earring','jhumka','chaandbaali'],
  'Necklace':        ['necklace','haar'],
  'Bracelet':        ['bracelet','kada'],
  'Hair Clips':      ['hair clip','hair-clip'],
  'Brooches':        ['brooch','pin'],
  'Plush Toys':      ['teddy','bear','bunny','plush','crochet toy'],
  'Collars':         ['collar'],
  'Shagun Envelope': ['shagun','envelope'],
  'Decor':           ['decor','decoration'],
  'Return Gifts':    ['return gift'],
  'Brass':           ['brass'],
  'Evil Eye':        ['evil eye'],
  'Spiritual':       ['spiritual','ganesha'],
  'Dining':          ['dining','serving'],
  'Anniversary':     ['anniversary'],
  'Personalised':    ['personal','custom','customis'],
  'Photo Frame':     ['photo','frame'],
  'Grape Soap':      ['grape'],
  'Decorative':      ['decorative','aesthetic'],
  'Strawberry':      ['strawberry'],
  'Clock':           ['clock'],
  'Nameplate':       ['nameplate','name plate'],
  'Flower':          ['flower','floral'],
  'Pouch':           ['pouch','makeup bag'],
  'Travel':          ['travel'],
}

const Categories = () => {
  const { name } = useParams()
  const [selectedCategory, setSelectedCategory] = useState(name || 'All')
  const [activeFilter, setActiveFilter] = useState(null)
  const [sortBy, setSortBy] = useState('default')
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => { setSelectedCategory(name || 'All'); setActiveFilter(null); setSortBy('default') }, [name])

  // Smart back
  const handleBack = () => {
    if (location.state?.from === '/') navigate('/')
    else if (location.state?.from) navigate(location.state.from)
    else if (window.history.length > 1) navigate(-1)
    else navigate('/categories')
  }
  const backLabel = location.state?.from === '/' ? '← Home' : '← All Categories'

  useEffect(() => { setSelectedCategory(name || 'All') }, [name])

  useEffect(() => {
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => { entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('animate-in'); observer.unobserve(e.target) } }) },
        { threshold: 0.05 }
      )
      document.querySelectorAll('.scroll-animate').forEach(el => { el.classList.remove('animate-in'); observer.observe(el) })
      return () => observer.disconnect()
    }, 50)
    return () => clearTimeout(timer)
  }, [selectedCategory])

  const allCats = [...occasionCategories, ...SOURCE_CATS]
  const selectedCategoryObj = selectedCategory === 'All'
    ? null
    : allCats.find(c => c.slug === selectedCategory || c.id === selectedCategory)
      || { name: selectedCategory, slug: selectedCategory, id: selectedCategory, emoji: '🎁' }

  const rawCategoryProducts = (selectedCategory === 'All'
    ? getAllProducts()
    : occasionProductMap[selectedCategory]
      ? getOccasionProducts(getAllProducts, occasionProductMap, selectedCategory)
      : getProductsByCategory(selectedCategory)
  ).filter(Boolean)

  const categoryProducts = useMemo(() => {
    let products = rawCategoryProducts
    // Apply sub-filter
    if (activeFilter && FILTER_KEYWORDS[activeFilter]) {
      const keywords = FILTER_KEYWORDS[activeFilter]
      products = products.filter(p => {
        const searchable = [
          ...(p.tags || []),
          p.title,
          p.description || ''
        ].join(' ').toLowerCase()
        return keywords.some(kw => searchable.includes(kw))
      })
    }
    // Apply sort
    if (sortBy === 'price-asc') return [...products].sort((a,b) => a.price - b.price)
    if (sortBy === 'price-desc') return [...products].sort((a,b) => b.price - a.price)
    if (sortBy === 'name') return [...products].sort((a,b) => a.title.localeCompare(b.title))
    return products
  }, [rawCategoryProducts, activeFilter, sortBy])

  const seoTitle = selectedCategoryObj
    ? `${selectedCategoryObj.name} — Handmade Gifts`
    : 'Shop All Collections'
  const seoDescription = selectedCategoryObj
    ? `Browse handpicked ${selectedCategoryObj.name.toLowerCase()} gifts from India's finest independent artisans. Unique, handcrafted, and customisable.`
    : 'Browse curated handmade gift collections from India\'s best independent artisans — by occasion or by product type.'

  return (
    <div className="categories-page">
      <SeoHead
        title={seoTitle}
        description={seoDescription}
        url={selectedCategory !== 'All' ? `/category/${selectedCategory}` : '/categories'}
      />
      {selectedCategory === 'All' && (
        <div className="categories-hero">
          <div className="container">
            <h1 className="categories-title">Shop Our Collections</h1>
            <p className="categories-subtitle">Browse by occasion or by product type.</p>
          </div>
        </div>
      )}

      <div className="categories-content">
        <div className="container">
          {selectedCategory === 'All' && (
            <>
              <div className="categories-section-heading">
                <h2>Shop by Occasion</h2>
                <p>Who are you gifting?</p>
              </div>
              <div className="categories-grid">
                {occasionCategories.map((cat) => (
                  <Link key={cat.id} to={`/category/${cat.slug}`} className="category-card-large scroll-animate">
                    <div className="category-card-emoji">{cat.emoji}</div>
                    <h3 className="category-name">{cat.name}</h3>
                  </Link>
                ))}
              </div>
              <div className="categories-section-heading" style={{ marginTop: '3rem' }}>
                <h2>Shop by Product</h2>
                <p>Browse by what you're looking for</p>
              </div>
              <div className="categories-grid">
                {SOURCE_CATS.map((cat) => (
                  <Link key={cat.id} to={`/category/${cat.slug}`} className="category-card-large scroll-animate">
                    <h3 className="category-name">{cat.name}</h3>
                  </Link>
                ))}
              </div>
            </>
          )}

          {selectedCategory !== 'All' && (
            <div className="category-products-section">
              <div className="category-header">
                <button onClick={handleBack} className="back-to-categories">{backLabel}</button>
                <h1 className="category-page-title">
                  {selectedCategoryObj?.emoji && <span className="category-page-emoji">{selectedCategoryObj.emoji} </span>}
                  {selectedCategoryObj?.name || selectedCategory}
                </h1>
              </div>

              {/* Sub-filters + sort */}
              {CATEGORY_FILTERS[selectedCategory] && (
                <div className="category-filters-row">
                  <div className="category-filter-chips">
                    <button
                      className={`cat-filter-chip${!activeFilter ? ' active' : ''}`}
                      onClick={() => setActiveFilter(null)}
                    >All</button>
                    {CATEGORY_FILTERS[selectedCategory].map(f => (
                      <button
                        key={f}
                        className={`cat-filter-chip${activeFilter === f ? ' active' : ''}`}
                        onClick={() => setActiveFilter(f === activeFilter ? null : f)}
                      >{f}</button>
                    ))}
                  </div>
                  <select className="cat-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                    <option value="default">Sort: Relevance</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="name">Name: A–Z</option>
                  </select>
                </div>
              )}

              {categoryProducts.length > 0 ? (
                <div className="products-grid">
                  {categoryProducts.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </div>
              ) : (
                <div className="no-products">
                  <p>No products found.</p>
                  <Link to="/products" className="back-to-categories">Browse all products →</Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ProductCard = ({ product, index }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { toggleItem, isWishlisted } = useWishlist()
  const wishlisted = isWishlisted(product.id)
  const [addedFeedback, setAddedFeedback] = useState(false)
  const [heartPop, setHeartPop] = useState(false)
  const imgZoneRef = useRef(null)
  const secondImage = product.images[1] || null



  useEffect(() => {
    if (!secondImage || !imgZoneRef.current) return
    const el = imgZoneRef.current
    // Only run on touch devices
    const isTouch = window.matchMedia('(hover: none) and (max-width: 768px)').matches
    if (!isTouch) return
    let timer = null
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => { el.classList.add('mobile-swap') })
            })
          }, 250)
        } else {
          clearTimeout(timer)
          el.classList.remove('mobile-swap')
        }
      },
      { threshold: 0.85 }
    )
    obs.observe(el)
    return () => { obs.disconnect(); clearTimeout(timer) }
  }, [secondImage])

  const handleAddToCart = useCallback((e) => {
    e.preventDefault(); e.stopPropagation()
    addItem(product)
    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 1400)
  }, [product, addItem])

  const handleWishlist = useCallback((e) => {
    e.preventDefault(); e.stopPropagation()
    toggleItem(product)
    setHeartPop(true)
    setTimeout(() => setHeartPop(false), 400)
  }, [product, toggleItem])

  const handleCardClick = useCallback(() => {
    navigate(`/product/${product.slug}`, { state: { from: location.pathname } })
  }, [product.slug, navigate, location])

  return (
    <article
      className="feat-card"
      style={{ "--i": index % 12, ...(product.inStock === false ? { opacity: 0.45, filter: 'grayscale(80%)' } : {}) }}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
      aria-label={product.title}
    >
      <div ref={imgZoneRef} className={`feat-img-zone${secondImage ? ' has-second-img' : ''}`}>
        <ImageWithFallback src={product.images[0]} alt={product.title} className="feat-img" loading={index < 8 ? 'eager' : 'lazy'} />
        {secondImage && <img src={secondImage} alt="" className="feat-img-hover" aria-hidden="true" loading="lazy" />}
        {product.popular && <span className="feat-badge-popular">Popular</span>}
        {product.inStock === false && <span className="feat-badge-out-of-stock">Out of Stock</span>}
        <button className={`feat-wishlist-btn${wishlisted ? " active" : ""}${heartPop ? " heart-pop" : ""}`} onClick={handleWishlist} aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"} type="button">
          <svg viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
      <div className="feat-info-zone">
        <p className="feat-category">{product.category || product.categoryId}</p>
        <h3 className="feat-title">{product.title}</h3>
        <p className="feat-price">{product.meta?.sizePrices && Object.keys(product.meta.sizePrices).length > 0 ? `₹${product.price.toLocaleString("en-IN")} onwards` : `₹${product.price.toLocaleString("en-IN")}`}</p>
        <div className="feat-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className={`feat-add-btn${addedFeedback ? " added" : ""}`}
            onClick={product.inStock === false ? undefined : handleAddToCart}
            type="button"
            aria-label="Add to cart"
            disabled={product.inStock === false}
            style={product.inStock === false ? { background: '#aaa', cursor: 'not-allowed', pointerEvents: 'none' } : {}}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {product.inStock === false ? "Out of Stock" : addedFeedback ? "Added!" : "Add to Cart"}
          </button>
          <button className={`feat-wishlist-text-btn${wishlisted ? " active" : ""}`} onClick={handleWishlist} type="button">
            <svg viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {wishlisted ? "Saved" : "Wishlist"}
          </button>
        </div>
      </div>
    </article>
  )
}

export default Categories