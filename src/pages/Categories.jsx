import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom'
import { getAllProducts, getSortedCategories, getProductsByCategory, occasionProductMap } from '../data/catalog'
import { occasionCategories, getOccasionProducts } from '../data/occasionCatalog'
import ImageWithFallback from '../components/ImageWithFallback'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import SeoHead from '../components/SeoHead'
import './Categories.css'

const SOURCE_CATS = getSortedCategories().filter(c => c.id !== 'Oxidised-jewellery')

const Categories = () => {
  const { name } = useParams()
  const [selectedCategory, setSelectedCategory] = useState(name || 'All')

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

  const categoryProducts = (selectedCategory === 'All'
    ? getAllProducts()
    : occasionProductMap[selectedCategory]
      ? getOccasionProducts(getAllProducts, occasionProductMap, selectedCategory)
      : getProductsByCategory(selectedCategory)
  ).filter(Boolean)

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
                <Link to="/categories" className="back-to-categories">← All Categories</Link>
                <h1 className="category-page-title">
                  {selectedCategoryObj?.emoji && <span className="category-page-emoji">{selectedCategoryObj.emoji} </span>}
                  {selectedCategoryObj?.name || selectedCategory}
                </h1>
              </div>

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

  const handleAddToCart = useCallback((e) => {
    e.preventDefault(); e.stopPropagation()
    addItem(product)
    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 1400)
  }, [product, addItem])

  const handleWishlist = useCallback((e) => {
    e.preventDefault(); e.stopPropagation()
    toggleItem(product)
  }, [product, toggleItem])

  const handleCardClick = useCallback(() => {
    navigate(`/product/${product.slug}`, { state: { from: location.pathname } })
  }, [product.id, navigate, location])

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
      <div className="feat-img-zone">
        <ImageWithFallback src={product.images[0]} alt={product.title} className="feat-img" loading={index < 8 ? 'eager' : 'lazy'} />
        {product.popular && <span className="feat-badge-popular">Popular</span>}
        {product.inStock === false && <span className="feat-badge-out-of-stock">Out of Stock</span>}
        <button className={`feat-wishlist-btn${wishlisted ? " active" : ""}`} onClick={handleWishlist} aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"} type="button">
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