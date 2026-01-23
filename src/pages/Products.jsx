import { useState, useMemo, useEffect, memo, useCallback } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { getAllProducts, getSortedCategories, getProductsByCategory } from '../data/catalog'
import { searchAll } from '../utils/search'
import { sortProducts, extractRelevanceScores, SORT_TYPES, DEFAULT_SORT } from '../utils/sorting'
import ProductSort from '../components/ProductSort'
import ImageWithFallback from '../components/ImageWithFallback'
import ProductSkeleton from '../components/ProductSkeleton'
import './Products.css'

// Memoize expensive operations - cache getAllProducts result
// let cachedAllProducts = null
let cachedCategories = null
let cachedCategoryMap = null

// const getCachedAllProducts = () => {
//   if (!cachedAllProducts) {
//     cachedAllProducts = getAllProducts()
//   }
//   return cachedAllProducts
// }

const getCachedCategories = () => {
  if (!cachedCategories) {
    cachedCategories = getSortedCategories()
  }
  return cachedCategories
}

const getCachedCategoryMap = () => {
  if (!cachedCategoryMap) {
    const categories = getCachedCategories()
    cachedCategoryMap = new Map(categories.map(cat => [cat.id, cat]))
    // Also map by name for legacy support
    categories.forEach(cat => {
      if (!cachedCategoryMap.has(cat.name)) {
        cachedCategoryMap.set(cat.name, cat)
      }
    })
  }
  return cachedCategoryMap
}

const Products = () => {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  // Multi-select: Use array to store selected category IDs
  const [selectedCategories, setSelectedCategories] = useState([])

  // Get sort from URL or default
  const sortBy = searchParams.get('sort') || DEFAULT_SORT

  // Get search query or results from location state
  const searchQuery = location.state?.searchQuery
  const searchResults = location.state?.searchResults

  // Memoize categories lookup
  const categories = useMemo(() => getCachedCategories(), [])
  const categoryMap = useMemo(() => getCachedCategoryMap(), [])

  // Perform search if query exists
  const searchResultsData = useMemo(() => {
    if (searchQuery && searchQuery.trim().length >= 1) {
      return searchAll(searchQuery, {
        productLimit: 50,
        categoryLimit: 10
      })
    }
    return null
  }, [searchQuery])

  // Extract relevance scores for relevance sorting
  const relevanceScores = useMemo(() => {
    return extractRelevanceScores(searchResultsData || searchResults)
  }, [searchResultsData, searchResults])

  // Filter and sort products - optimized with cached data
  const filteredProducts = useMemo(() => {
    // Use search results if available, otherwise use cached all products
    // let filtered = searchResultsData?.products || searchResults?.products || getCachedAllProducts()
let filtered = searchResultsData?.products || searchResults?.products || getAllProducts()

    // Filter by multiple categories if any are selected (OR logic - show products from ANY selected category)
    if (selectedCategories.length > 0) {
      const selectedSet = new Set(selectedCategories) // Use Set for O(1) lookup
      filtered = filtered.filter(product => {
        if (product.categoryId) {
          return selectedSet.has(product.categoryId)
        }
        // Fallback for legacy products - check category name using cached map
        const category = categoryMap.get(product.category)
        return category && selectedSet.has(category.id)
      })
    }

    // Apply sorting using the sorting utility
    filtered = sortProducts(filtered, sortBy, {
      searchQuery: searchQuery || null,
      relevanceScores
    })

    return filtered
  }, [selectedCategories, sortBy, searchResults, searchResultsData, searchQuery, relevanceScores, categoryMap])

  // Products are computed synchronously from cache, so they're ready immediately
  // But show skeletons as fallback if somehow products aren't ready (shouldn't happen)
  const showSkeletons = filteredProducts.length === 0 && !searchQuery && !searchResults

  // Handle category toggle for multi-select - memoized with useCallback
  const handleCategoryToggle = useCallback((categoryId) => {
    setSelectedCategories(prev => {
      // If "All" is clicked, clear all selections
      if (categoryId === 'All') {
        return []
      }
      
      // Toggle category selection
      if (prev.includes(categoryId)) {
        // Remove category if already selected
        return prev.filter(id => id !== categoryId)
      } else {
        // Add category if not selected
        return [...prev, categoryId]
      }
    })
    
    // Reset to page 1 if pagination exists
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('page')
    setSearchParams(newParams, { replace: true })
  }, [searchParams, setSearchParams])
  
  // Clear all selections - memoized
  const handleClearAll = useCallback(() => {
    setSelectedCategories([])
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('page')
    setSearchParams(newParams, { replace: true })
  }, [searchParams, setSearchParams])

  // Remove Intersection Observer for animations - use CSS animations instead for better performance
  // CSS animations are handled by CSS classes, no JS needed

  // Force re-render on iPhone after sort changes to fix rendering issues
  useEffect(() => {
    // iPhone Safari sometimes needs a forced reflow after sort/filter changes
    // This ensures products are visible after UI interactions
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        const productsGrid = document.querySelector('.products-grid')
        if (productsGrid) {
          // Force layout recalculation to fix rendering
          void productsGrid.offsetHeight
        }
        // Ensure all product cards are visible
        const productCards = document.querySelectorAll('.product-card')
        productCards.forEach(card => {
          card.style.visibility = 'visible'
          card.style.opacity = '1'
        })
      })
    }
  }, [sortBy, selectedCategories.length, filteredProducts.length])

  return (
    <div className="products-page">
      <div className="products-hero">
        <div className="container">
          <h1 className="products-title">Our Custom Gifts Collection</h1>
          <p className="products-subtitle">Discover unique, handcrafted gifts from India</p>
        </div>
      </div>

      <div className="products-filters-section">
        <div className="container">
          <div className="filters-wrapper">
            <div className="category-filters">
              <button
                className={`filter-chip ${selectedCategories.length === 0 ? 'active' : ''}`}
                onClick={handleClearAll}
                aria-label="Show all products"
                type="button"
              >
                All Products
                {selectedCategories.length > 0 && (
                  <span className="filter-count">({selectedCategories.length} selected)</span>
                )}
              </button>
              {categories.map((category) => {
                const isSelected = selectedCategories.includes(category.id)
                return (
                  <button
                    key={category.id}
                    className={`filter-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => handleCategoryToggle(category.id)}
                    aria-label={`${isSelected ? 'Deselect' : 'Select'} ${category.name}`}
                    aria-pressed={isSelected}
                    type="button"
                  >
                    <span>{category.name}</span>
                    {isSelected && (
                      <svg 
                        className="check-icon" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
            <ProductSort onSortChange={(newSort) => {
              // Sort change is handled by URL params in ProductSort component
            }} />
          </div>
        </div>
      </div>

      <div className="products-content">
        <div className="container">
          {(searchQuery || searchResults) && (
            <div className="search-results-header">
              <h2>
                {searchQuery ? `Search Results for "${searchQuery}"` : 'Search Results'}
              </h2>
              <p>{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found</p>
            </div>
          )}
          
          {/* Show products immediately - they're computed synchronously from cache */}
          {showSkeletons ? (
            <div className="products-grid">
              {Array.from({ length: 12 }).map((_, index) => (
                <ProductSkeleton key={`skeleton-${index}`} />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="products-grid">
              {filteredProducts.map((product, index) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  index={index}
                  categoryMap={categoryMap}
                  // Load first 12 images eagerly (above fold)
                  priority={index < 12}
                />
              ))}
            </div>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="64" height="64">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                  <line x1="11" y1="8" x2="11" y2="14"/>
                  <line x1="8" y1="11" x2="14" y2="11"/>
                </svg>
              </div>
              <h3>No products found</h3>
              <p>Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Memoized ProductCard to prevent unnecessary re-renders
const ProductCard = memo(({ product, index, categoryMap, priority = false }) => {
  // Memoize category lookup
  const categoryName = useMemo(() => {
    if (product.categoryId) {
      const category = categoryMap.get(product.categoryId)
      return category ? category.name : 'Product'
    }
    // Fallback for legacy products
    const category = categoryMap.get(product.category)
    return category ? category.name : (product.category || 'Product')
  }, [product.categoryId, product.category, categoryMap])

  return (
    <Link
      to={`/product/${product.id}`}
      className="product-card hover-lift hover-zoom touch-feedback"
      data-animate="scale"
      data-delay={index * 50}
    >
      <div className="product-image-container">
        <ImageWithFallback
          src={product.images[0]}
          alt={product.title}
          className="product-image"
          loading={priority ? "eager" : "lazy"}
          priority={priority}
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {product.popular && <div className="popular-badge">Popular</div>}
      </div>
      <div className="product-info">
        <h3 className="product-title">{product.title}</h3>
        <p className="product-id">Product ID: {product.id}</p>
        <p className="product-category">{categoryName}</p>
        <div className="product-footer">
          <span className="product-price">₹{product.price}</span>
        </div>
      </div>
    </Link>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Only re-render if product data actually changes
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.title === nextProps.product.title &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.images[0] === nextProps.product.images[0] &&
    prevProps.product.popular === nextProps.product.popular &&
    prevProps.product.categoryId === nextProps.product.categoryId &&
    prevProps.index === nextProps.index &&
    prevProps.priority === nextProps.priority
  )
})

ProductCard.displayName = 'ProductCard'

export default Products

