import { useState, useEffect } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { getAllProducts, getSortedCategories, getProductsByCategory, getCategoryProductCount, occasionProductMap } from '../data/catalog'
import { occasionCategories, getOccasionProducts } from '../data/occasionCatalog'
import ImageWithFallback from '../components/ImageWithFallback'
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

  // KEY FIX: pass occasionProductMap from catalog.js so it's always in sync
  const categoryProducts = selectedCategory === 'All'
    ? getAllProducts()
    : occasionProductMap[selectedCategory]
      ? getOccasionProducts(getAllProducts, occasionProductMap, selectedCategory)
      : getProductsByCategory(selectedCategory)

  return (
    <div className="categories-page">
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
                    {cat.description && (
                      <p className="category-description">{cat.description}</p>
                    )}
                    <p className="category-count">{(occasionProductMap[cat.id] || []).length} products</p>
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
                    <p className="category-count">{getCategoryProductCount(cat.id)} products</p>
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
                {selectedCategoryObj?.description && (
                  <p className="category-page-description">{selectedCategoryObj.description}</p>
                )}
                <p className="category-page-subtitle">
                  {categoryProducts.length} {categoryProducts.length === 1 ? 'product' : 'products'} available
                </p>
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
  return (
    <Link to={`/product/${product.id}`} state={{ from: location.pathname }} className="product-card hover-lift touch-feedback" style={{ '--i': index }}>
      <div className="product-image-container">
        <ImageWithFallback src={product.images[0]} alt={product.title} className="product-image" loading={index < 8 ? 'eager' : 'lazy'} />
        {product.popular && <div className="popular-badge">Popular</div>}
      </div>
      <div className="product-info">
        <h3 className="product-title">{product.title}</h3>
        <p className="product-id">Product ID: {product.id}</p>
        <p className="product-category">{product.category || product.categoryId}</p>
        <div className="product-footer"><span className="product-price">₹{product.price}</span></div>
      </div>
    </Link>
  )
}

export default Categories