import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSortedCategories, getAllProducts, getProductsByCategory, getCategoryProductCount } from '../data/catalog'
import ImageWithFallback from '../components/ImageWithFallback'
import './Categories.css'

const Categories = () => {
  const { name } = useParams()
  const categories = getSortedCategories()
  const [selectedCategory, setSelectedCategory] = useState(name || 'All')
  
  // Get products by category - handle both category name and slug
  const categoryProducts = selectedCategory === 'All' 
    ? getAllProducts() 
    : (() => {
        const category = categories.find(cat => 
          cat.name === selectedCategory || 
          cat.slug === selectedCategory || 
          cat.id === selectedCategory
        )
        return category ? getProductsByCategory(category.id) : []
      })()

  // useEffect(() => {
  //   if (name) {
  //     setSelectedCategory(name)
  //   }
  // }, [name])
useEffect(() => {
  setSelectedCategory(name || 'All');
}, [name]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('.scroll-animate').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [categoryProducts])

  // Get the selected category object for display
  const selectedCategoryObj = selectedCategory !== 'All' 
    ? categories.find(cat => 
        cat.name === selectedCategory || 
        cat.slug === selectedCategory || 
        cat.id === selectedCategory
      )
    : null

  return (
    <div className="categories-page">
      {/* Only show hero when viewing all categories */}
      {selectedCategory === 'All' && (
        <div className="categories-hero">
          <div className="container">
            <h1 className="categories-title">Our Collections</h1>
            <p className="categories-subtitle">Find the perfect gift from our curated collections</p>
          </div>
        </div>
      )}

      <div className="categories-content">
        <div className="container">
          {/* Only show categories grid when viewing all categories */}
          {selectedCategory === 'All' && (
            <div className="categories-grid">
              {categories.map((category, index) => {
                const productCount = getCategoryProductCount(category.id)
                return (
                  <Link
                    key={category.id}
                    to={`/category/${category.slug || category.name}`}
                    className="category-card-large scroll-animate"
                    style={{ '--i': index }}
                  >
                    <h3 className="category-name">{category.name}</h3>
                    <p className="category-count">{productCount} products</p>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Show products when a specific category is selected */}
          {selectedCategory !== 'All' && selectedCategoryObj && (
            <div className="category-products-section">
              <div className="category-header">
                <Link to="/categories" className="back-to-categories">
                  ← Back to Categories
                </Link>
                <h1 className="category-page-title">{selectedCategoryObj.name}</h1>
                <p className="category-page-subtitle">
                  {categoryProducts.length} {categoryProducts.length === 1 ? 'product' : 'products'} available
                </p>
              </div>
              <div className="category-products-grid">
                {categoryProducts.map((product, index) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="category-product-card scroll-animate"
                    style={{ '--i': index }}
                  >
                    <div className="category-product-image-container">
                      <ImageWithFallback
                        src={product.images[0]}
                        alt={product.title}
                        className="category-product-image"
                        loading="lazy"
                      />
                      {product.popular && <div className="popular-badge">Popular</div>}
                    </div>
                    <div className="category-product-info">
                      <h3 className="category-product-title">{product.title}</h3>
                      <p className="product-id">Product ID: {product.id}</p>
                      <p className="category-product-price">₹{product.price}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Categories
