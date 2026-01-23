/**
 * PRODUCT SORTING UTILITIES
 * 
 * Senior-level, scalable sorting system for products
 * 
 * Features:
 * - Data-driven sorting (no hardcoded logic)
 * - Works with any product structure
 * - Efficient performance
 * - Easy to extend with new sort types
 */

/**
 * Sort types configuration
 * Easy to extend - just add new sort type here
 */
export const SORT_TYPES = {
  RELEVANCE: 'relevance',
  LATEST: 'latest',
  PRICE_LOW: 'price-low',
  PRICE_HIGH: 'price-high'
}

/**
 * Sort type labels for UI
 */
export const SORT_LABELS = {
  [SORT_TYPES.RELEVANCE]: 'Relevance',
  [SORT_TYPES.LATEST]: 'Latest Arrivals',
  [SORT_TYPES.PRICE_LOW]: 'Price: Low to High',
  [SORT_TYPES.PRICE_HIGH]: 'Price: High to Low'
}

/**
 * Default sort type
 */
export const DEFAULT_SORT = SORT_TYPES.RELEVANCE

/**
 * Get sort function for a given sort type
 * Returns a comparator function for Array.sort()
 */
export const getSortFunction = (sortType, options = {}) => {
  const { 
    searchQuery = null,
    relevanceScores = null 
  } = options

  switch (sortType) {
    case SORT_TYPES.RELEVANCE:
      return (a, b) => {
        // If search results have relevance scores, use them
        if (relevanceScores) {
          const scoreA = relevanceScores[a.id] || 0
          const scoreB = relevanceScores[b.id] || 0
          if (scoreB !== scoreA) {
            return scoreB - scoreA
          }
        }
        
        // Fallback: Popular > Featured > Alphabetical
        if (a.popular !== b.popular) {
          return b.popular ? 1 : -1
        }
        if (a.featured !== b.featured) {
          return b.featured ? 1 : -1
        }
        return a.title.localeCompare(b.title)
      }

    case SORT_TYPES.LATEST:
      return (a, b) => {
        // Use createdAt if available, otherwise use id (higher id = newer)
        // For products without dates, assume higher ID = newer
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 
                     (a.dateAdded ? new Date(a.dateAdded).getTime() : 
                     (a.id || 0) * 1000) // Multiply by 1000 to make it comparable to timestamps
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 
                     (b.dateAdded ? new Date(b.dateAdded).getTime() : 
                     (b.id || 0) * 1000)
        return dateB - dateA // Newest first
      }

    case SORT_TYPES.PRICE_LOW:
      return (a, b) => {
        const priceA = a.price || 0
        const priceB = b.price || 0
        if (priceA !== priceB) {
          return priceA - priceB
        }
        // Tiebreaker: alphabetical
        return a.title.localeCompare(b.title)
      }

    case SORT_TYPES.PRICE_HIGH:
      return (a, b) => {
        const priceA = a.price || 0
        const priceB = b.price || 0
        if (priceB !== priceA) {
          return priceB - priceA
        }
        // Tiebreaker: alphabetical
        return a.title.localeCompare(b.title)
      }

    default:
      // Default to relevance
      return getSortFunction(SORT_TYPES.RELEVANCE, options)
  }
}

/**
 * Sort products array
 * Main sorting function - use this in components
 * 
 * @param {Array} products - Array of product objects
 * @param {string} sortType - Sort type (from SORT_TYPES)
 * @param {Object} options - Additional options
 * @returns {Array} - Sorted array (new array, doesn't mutate original)
 */
export const sortProducts = (products, sortType = DEFAULT_SORT, options = {}) => {
  if (!Array.isArray(products) || products.length === 0) {
    return products
  }

  // Validate sort type
  const validSortType = Object.values(SORT_TYPES).includes(sortType) 
    ? sortType 
    : DEFAULT_SORT

  // Get sort function
  const sortFn = getSortFunction(validSortType, options)

  // Create new array and sort (immutable)
  return [...products].sort(sortFn)
}

/**
 * Extract relevance scores from search results
 * Helper function to extract scores for relevance sorting
 */
export const extractRelevanceScores = (searchResults) => {
  if (!searchResults || !searchResults.products) {
    return null
  }

  const scores = {}
  searchResults.products.forEach(product => {
    if (product._relevanceScore !== undefined) {
      scores[product.id] = product._relevanceScore
    }
  })

  return Object.keys(scores).length > 0 ? scores : null
}

/**
 * Validate sort type
 * Returns valid sort type or default
 */
export const validateSortType = (sortType) => {
  return Object.values(SORT_TYPES).includes(sortType) 
    ? sortType 
    : DEFAULT_SORT
}

/**
 * Get sort options for UI
 * Returns array of { value, label } objects
 */
export const getSortOptions = () => {
  return Object.values(SORT_TYPES).map(value => ({
    value,
    label: SORT_LABELS[value]
  }))
}

