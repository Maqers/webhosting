import { useState, useMemo, useEffect, memo, useCallback } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { getAllProducts, getSortedCategories, getProductsByCategory, occasionProductMap } from '../data/catalog'
import { searchAll } from '../utils/search'
import { sortProducts, extractRelevanceScores, SORT_TYPES, DEFAULT_SORT } from '../utils/sorting'
import ProductSort from '../components/ProductSort'
import ImageWithFallback from '../components/ImageWithFallback'
import ProductSkeleton from '../components/ProductSkeleton'
import './Products.css'

let cachedCategories = null
let cachedCategoryMap = null

const getCachedCategories = () => {
  if (!cachedCategories) cachedCategories = getSortedCategories()
  return cachedCategories
}

const getCachedCategoryMap = () => {
  if (!cachedCategoryMap) {
    const categories = getCachedCategories()
    cachedCategoryMap = new Map(categories.map(cat => [cat.id, cat]))
    categories.forEach(cat => {
      if (!cachedCategoryMap.has(cat.name)) cachedCategoryMap.set(cat.name, cat)
    })
  }
  return cachedCategoryMap
}

const Products = () => {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedCategories, setSelectedCategories] = useState([])

  const sortBy = searchParams.get('sort') || DEFAULT_SORT
  const searchQuery = location.state?.searchQuery
  const searchResults = location.state?.searchResults

  const categories = useMemo(() => getCachedCategories(), [])
  const categoryMap = useMemo(() => getCachedCategoryMap(), [])

  const searchResultsData = useMemo(() => {
    if (searchQuery && searchQuery.trim().length >= 1) {
      return searchAll(searchQuery, { productLimit: 50, categoryLimit: 10 })
    }
    return null
  }, [searchQuery])

  const relevanceScores = useMemo(() => {
    return extractRelevanceScores(searchResultsData || searchResults)
  }, [searchResultsData, searchResults])

  const filteredProducts = useMemo(() => {
    const hasSearch = searchQuery && searchQuery.trim().length >= 1

    let filtered = hasSearch
      ? (searchResultsData?.products ?? searchResults?.products ?? [])
      : (searchResultsData?.products ?? searchResults?.products ?? getAllProducts())

    if (selectedCategories.length > 0) {
      const occasionSelected = selectedCategories.filter(id => occasionProductMap[id])
      const sourceSelected = selectedCategories.filter(id => !occasionProductMap[id])

      const occasionIds = new Set(
        occasionSelected.flatMap(id => occasionProductMap[id] || [])
      )
      const sourceSet = new Set(sourceSelected)

      filtered = filtered.filter(product => {
        if (occasionSelected.length > 0 && occasionIds.has(product.id)) return true;
        if (sourceSelected.length > 0 && sourceSet.has(product.categoryId)) return true;
        // Also match via secondaryCategories
        if (sourceSelected.length > 0 && product.meta?.secondaryCategories?.some(c => sourceSet.has(c))) return true;
        return false;
      });
    }

    filtered = sortProducts(filtered, sortBy, {
      searchQuery: searchQuery || null,
      relevanceScores
    })

    return filtered
  }, [selectedCategories, sortBy, searchResults, searchResultsData, searchQuery, relevanceScores])

  const showSkeletons = filteredProducts.length === 0 && !searchQuery && !searchResults && selectedCategories.length === 0

  const handleCategoryToggle = useCallback((categoryId) => {
    setSelectedCategories(prev => {
      if (categoryId === 'All') return []
      if (prev.includes(categoryId)) return prev.filter(id => id !== categoryId)
      return [...prev, categoryId]
    })
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('page')
    setSearchParams(newParams, { replace: true })
  }, [searchParams, setSearchParams])

  const handleClearAll = useCallback(() => {
    setSelectedCategories([])
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('page')
    setSearchParams(newParams, { replace: true })
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      requestAnimationFrame(() => {
        const productsGrid = document.querySelector('.products-grid')
        if (productsGrid) void productsGrid.offsetHeight
        document.querySelectorAll('.product-card').forEach(card => {
          card.style.visibility = 'visible'
          card.style.opacity = '1'
        })
      })
    }
  }, [sortBy, selectedCategories.length, filteredProducts.length])

  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('productsScrollY', window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const saved = sessionStorage.getItem('productsScrollY')
    if (saved) {
      requestAnimationFrame(() => {
        window.scrollTo(0, parseInt(saved, 10))
        sessionStorage.removeItem('productsScrollY')
      })
    }
  }, [])

  return (
    <div className="products-page">
      <div className="products-hero">
        <div className="container">
          <h1 className="products-title">Our Custom Collection</h1>
          <p className="products-subtitle">Discover unique, handcrafted gifts from Indian home businesses</p>
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
                    <span>{category.emoji} {category.name}</span>
                    {isSelected && (
                      <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
            <ProductSort onSortChange={() => { }} />
          </div>
        </div>
      </div>

      <div className="products-content">
        <div className="container">
          {(searchQuery || searchResults) && (
            <div className="search-results-header">
              <h2>{searchQuery ? `Search Results for "${searchQuery}"` : 'Search Results'}</h2>
              <p>{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found</p>
            </div>
          )}

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
                  priority={index < 12}
                />
              ))}
            </div>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="64" height="64">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                  <line x1="11" y1="8" x2="11" y2="14" />
                  <line x1="8" y1="11" x2="14" y2="11" />
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

const ProductCard = memo(({ product, index, categoryMap, priority = false }) => {
  const location = useLocation()
  const categoryName = useMemo(() => {
    if (product.categoryId) {
      const category = categoryMap.get(product.categoryId)
      return category ? category.name : 'Handmade Gift'
    }
    const category = categoryMap.get(product.category)
    return category ? category.name : (product.category || 'Handmade Gift')
  }, [product.categoryId, product.category, categoryMap])

  return (
    <Link
      to={`/product/${product.id}`}
      state={{ from: location.pathname + location.search }}
      className="product-card hover-lift touch-feedback"
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
}, (prevProps, nextProps) => (
  prevProps.product.id === nextProps.product.id &&
  prevProps.product.title === nextProps.product.title &&
  prevProps.product.price === nextProps.product.price &&
  prevProps.product.images[0] === nextProps.product.images[0] &&
  prevProps.product.popular === nextProps.product.popular &&
  prevProps.product.categoryId === nextProps.product.categoryId &&
  prevProps.index === nextProps.index &&
  prevProps.priority === nextProps.priority
))

ProductCard.displayName = 'ProductCard'

export default Products