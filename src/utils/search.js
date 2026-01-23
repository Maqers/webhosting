/**
 * ADVANCED CLIENT-SIDE SEARCH ENGINE
 * 
 * Senior-level search implementation with:
 * - Fuzzy matching for typo tolerance
 * - Multi-field search (title, description, tags, keywords)
 * - Relevance scoring algorithm
 * - Fast performance optimized for static sites
 * - Case-insensitive partial matching
 * - Regex-based highlighting
 * 
 * Algorithm Overview:
 * 1. Normalize query (lowercase, trim, remove extra spaces)
 * 2. Generate search terms (split multi-word queries)
 * 3. Score matches based on:
 *    - Exact matches (highest score)
 *    - Starts with query (high score)
 *    - Contains query (medium score)
 *    - Fuzzy/partial matches (lower score)
 *    - Field weights (title > category > description > tags)
 * 4. Sort by relevance score
 * 5. Return top N results
 */

import { getAllProducts, categories, getCategoryByIdOrSlug } from '../data/catalog'
import {
  expandQueryWithSynonyms,
  getSearchIntent,
  getCategoriesForKeyword,
  getSynonyms,
  searchIndex
} from '../data/searchIndex'

/**
 * Normalize search query with enhanced regex validation
 * - Converts to lowercase
 * - Trims whitespace
 * - Removes extra spaces
 * - Handles special characters properly
 * - Validates and sanitizes input
 */
const normalizeQuery = (query) => {
  if (!query) return ''
  
  // Trim and normalize whitespace
  let normalized = query.trim()
  
  // Replace multiple spaces/tabs/newlines with single space
  normalized = normalized.replace(/[\s\t\n\r]+/g, ' ')
  
  // Remove potentially dangerous regex characters but keep common ones
  // Allow: letters, numbers, spaces, hyphens, apostrophes, periods
  normalized = normalized.replace(/[^\w\s\-'.,]/gi, '')
  
  // Convert to lowercase for consistent matching
  normalized = normalized.toLowerCase()
  
  // Final trim
  normalized = normalized.trim()
  
  // Limit length to prevent performance issues
  if (normalized.length > 100) {
    normalized = normalized.substring(0, 100).trim()
  }
  
  return normalized
}

/**
 * Calculate Levenshtein distance (edit distance)
 * Used for fuzzy matching and typo tolerance
 * Returns a similarity score between 0 and 1
 */
const levenshteinSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of single-character edits needed
 */
const levenshteinDistance = (str1, str2) => {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

/**
 * Check if query matches text with fuzzy tolerance
 * Enhanced with better partial word matching (e.g., "home" matches "ice home")
 * Returns match score (0-1) and match type
 */
const fuzzyMatch = (text, query, options = {}) => {
  const { fuzzyThreshold = 0.7, exactBonus = 1.5 } = options
  
  if (!text || !query) return { score: 0, type: 'none' }
  
  const normalizedText = normalizeQuery(text)
  const normalizedQuery = normalizeQuery(query)
  
  // Exact match (highest priority)
  if (normalizedText === normalizedQuery) {
    return { score: 100 * exactBonus, type: 'exact' }
  }
  
  // Starts with query
  if (normalizedText.startsWith(normalizedQuery)) {
    return { score: 80, type: 'starts' }
  }
  
  // Enhanced: Word boundary match (matches whole words) - Check this BEFORE contains
  // This handles cases like "home" matching "ice home" or "home decor"
  const escapedQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const wordBoundaryRegex = new RegExp(`\\b${escapedQuery}\\b`, 'i')
  if (wordBoundaryRegex.test(text)) {
    return { score: 75, type: 'word' } // High score for word boundary match
  }
  
  // Enhanced: Partial word match within text (e.g., "home" in "ice home")
  // Check if query appears as part of any word in the text
  const partialWordRegex = new RegExp(escapedQuery, 'i')
  if (partialWordRegex.test(text)) {
    // Check if it's part of a larger word or standalone
    const matchIndex = normalizedText.indexOf(normalizedQuery)
    if (matchIndex !== -1) {
      // Check if it's at word boundary or part of word
      const beforeChar = matchIndex > 0 ? normalizedText[matchIndex - 1] : ' '
      const afterChar = matchIndex + normalizedQuery.length < normalizedText.length 
        ? normalizedText[matchIndex + normalizedQuery.length] 
        : ' '
      
      // If surrounded by word characters, it's part of a word (lower score)
      // If at word boundary, it's a better match (higher score)
      if (/\w/.test(beforeChar) || /\w/.test(afterChar)) {
        return { score: 55, type: 'partial-word' } // Medium score for partial word match
      } else {
        return { score: 65, type: 'word-boundary' } // Higher score for word boundary
      }
    }
  }
  
  // Contains query (fallback)
  if (normalizedText.includes(normalizedQuery)) {
    return { score: 50, type: 'contains' }
  }
  
  // Fuzzy match (typo tolerance)
  const similarity = levenshteinSimilarity(normalizedText, normalizedQuery)
  if (similarity >= fuzzyThreshold) {
    return { score: 30 * similarity, type: 'fuzzy' }
  }
  
  // Check if query words appear in text (multi-word search)
  const queryWords = normalizedQuery.split(' ').filter(w => w.length > 0)
  if (queryWords.length > 1) {
    const matchingWords = queryWords.filter(word => {
      // Check for word boundary match
      const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
      return wordRegex.test(text) || 
             normalizedText.includes(word) || 
             levenshteinSimilarity(normalizedText, word) >= fuzzyThreshold
    }).length
    
    if (matchingWords > 0) {
      const matchRatio = matchingWords / queryWords.length
      return { score: 40 * matchRatio, type: 'multi-word' }
    }
  }
  
  return { score: 0, type: 'none' }
}

/**
 * Calculate relevance score for a product
 * Uses weighted scoring based on field importance
 * Enhanced with regex matching and category-aware search
 */
const calculateProductScore = (product, query, normalizedQuery, searchIntent = null) => {
  let totalScore = 0
  const queryWords = normalizedQuery.split(' ').filter(w => w.length > 0)
  
  // Expand query with synonyms for better matching
  const expandedTerms = expandQueryWithSynonyms(normalizedQuery)
  
  // Title match (highest weight) - Enhanced with regex and partial matching
  const titleMatch = fuzzyMatch(product.title, query)
  totalScore += titleMatch.score * 2.0 // Title is most important
  
  // Enhanced: Regex-based partial word matching (e.g., "home" matches "ice home")
  const titleLower = product.title.toLowerCase()
  const queryLower = normalizedQuery.toLowerCase()
  
  // Check if query appears as a word within the title (regex word boundary)
  const wordBoundaryRegex = new RegExp(`\\b${queryLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
  if (wordBoundaryRegex.test(product.title)) {
    totalScore += 70 // High score for word boundary match
  }
  
  // Check if query appears anywhere in title (partial match)
  if (titleLower.includes(queryLower) && !wordBoundaryRegex.test(product.title)) {
    totalScore += 40 // Medium score for partial match
  }
  
  // Check expanded terms (synonyms) against title
  expandedTerms.forEach(term => {
    if (term !== normalizedQuery && term.length > 2) {
      const termRegex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
      if (termRegex.test(product.title)) {
        totalScore += 30 // Score for synonym match
      }
    }
  })
  
  // Category match (high weight) - Enhanced with category name search
  let categoryName = ''
  let categoryId = ''
  if (product.categoryId) {
    const category = getCategoryByIdOrSlug(product.categoryId)
    categoryName = category?.name || ''
    categoryId = product.categoryId
  } else if (product.category) {
    categoryName = product.category
  }
  
  if (categoryName) {
    const categoryMatch = fuzzyMatch(categoryName, query)
    totalScore += categoryMatch.score * 1.5
    
    // Enhanced: If query matches category name, boost product score significantly
    const categoryLower = categoryName.toLowerCase()
    if (categoryLower.includes(queryLower) || queryLower.includes(categoryLower)) {
      totalScore += 50 // High boost for category match
    }
  }
  
  // Description match (medium weight) - Enhanced with regex
  if (product.description) {
    const descMatch = fuzzyMatch(product.description, query)
    totalScore += descMatch.score * 0.5
    
    // Regex match in description
    const descLower = product.description.toLowerCase()
    if (descLower.includes(queryLower)) {
      totalScore += 20 // Additional score for description match
    }
  }
  
  // Tags match (medium weight) - enhanced with synonyms
  if (product.tags && Array.isArray(product.tags)) {
    const tagMatches = product.tags
      .map(tag => {
        // Check against original query
        const directMatch = fuzzyMatch(tag, query)
        // Check against synonyms
        let bestMatch = directMatch
        expandedTerms.forEach(term => {
          const synonymMatch = fuzzyMatch(tag, term)
          if (synonymMatch.score > bestMatch.score) {
            bestMatch = synonymMatch
          }
        })
        return bestMatch
      })
      .filter(match => match.score > 0)
    
    if (tagMatches.length > 0) {
      const avgTagScore = tagMatches.reduce((sum, m) => sum + m.score, 0) / tagMatches.length
      totalScore += avgTagScore * 0.8
    }
  }
  
  // Meta keywords match (lower weight) - enhanced with synonyms
  if (product.meta?.keywords && Array.isArray(product.meta.keywords)) {
    const keywordMatches = product.meta.keywords
      .map(keyword => {
        // Check against original query
        const directMatch = fuzzyMatch(keyword, query)
        // Check against synonyms
        let bestMatch = directMatch
        expandedTerms.forEach(term => {
          const synonymMatch = fuzzyMatch(keyword, term)
          if (synonymMatch.score > bestMatch.score) {
            bestMatch = synonymMatch
          }
        })
        return bestMatch
      })
      .filter(match => match.score > 0)
    
    if (keywordMatches.length > 0) {
      const avgKeywordScore = keywordMatches.reduce((sum, m) => sum + m.score, 0) / keywordMatches.length
      totalScore += avgKeywordScore * 0.6
    }
  }
  
  // Intent-based category boost (highest priority)
  if (searchIntent && categoryId && searchIntent.categories.includes(categoryId)) {
    totalScore += 100 // Very high boost for intent-matched products
  }
  
  // Multi-word bonus: if all query words (or synonyms) match somewhere
  if (queryWords.length > 1) {
    const allWordsMatch = queryWords.every(word => {
      const titleMatch = fuzzyMatch(product.title, word)
      const descMatch = product.description ? fuzzyMatch(product.description, word) : { score: 0 }
      const tagMatch = product.tags?.some(tag => fuzzyMatch(tag, word).score > 0) || false
      
      // Also check synonyms
      const synonyms = getSynonyms(word)
      const synonymMatch = synonyms.some(syn => {
        const synTitleMatch = fuzzyMatch(product.title, syn)
        const synDescMatch = product.description ? fuzzyMatch(product.description, syn) : { score: 0 }
        const synTagMatch = product.tags?.some(tag => fuzzyMatch(tag, syn).score > 0) || false
        return synTitleMatch.score > 0 || synDescMatch.score > 0 || synTagMatch
      })
      
      return titleMatch.score > 0 || descMatch.score > 0 || tagMatch || synonymMatch
    })
    
    if (allWordsMatch) {
      totalScore += 25 // Bonus for matching all words
    }
  }
  
  // Popular/featured boost
  if (product.popular) totalScore += 5
  if (product.featured) totalScore += 3
  
  return Math.round(totalScore * 100) / 100 // Round to 2 decimals
}

/**
 * Calculate relevance score for a category
 * Enhanced with intent and synonym matching
 */
const calculateCategoryScore = (category, query, normalizedQuery, searchIntent = null) => {
  let totalScore = 0
  
  // Expand query with synonyms
  const expandedTerms = expandQueryWithSynonyms(normalizedQuery)
  
  // Name match (highest weight)
  const nameMatch = fuzzyMatch(category.name, query)
  totalScore += nameMatch.score * 2.0
  
  // Check name against synonyms
  expandedTerms.forEach(term => {
    if (term !== normalizedQuery) {
      const synonymMatch = fuzzyMatch(category.name, term)
      if (synonymMatch.score > 0) {
        totalScore += synonymMatch.score * 1.5
      }
    }
  })
  
  // Slug match
  const slugMatch = fuzzyMatch(category.slug, query)
  totalScore += slugMatch.score * 1.5
  
  // Description match
  if (category.description) {
    const descMatch = fuzzyMatch(category.description, query)
    totalScore += descMatch.score * 0.8
  }
  
  // Keywords match - enhanced with synonyms
  if (category.meta?.keywords && Array.isArray(category.meta.keywords)) {
    const keywordMatches = category.meta.keywords
      .map(keyword => {
        const directMatch = fuzzyMatch(keyword, query)
        let bestMatch = directMatch
        expandedTerms.forEach(term => {
          const synonymMatch = fuzzyMatch(keyword, term)
          if (synonymMatch.score > bestMatch.score) {
            bestMatch = synonymMatch
          }
        })
        return bestMatch
      })
      .filter(match => match.score > 0)
    
    if (keywordMatches.length > 0) {
      const avgKeywordScore = keywordMatches.reduce((sum, m) => sum + m.score, 0) / keywordMatches.length
      totalScore += avgKeywordScore * 1.0
    }
  }
  
  // Intent-based category boost (highest priority)
  if (searchIntent && searchIntent.categories.includes(category.id)) {
    totalScore += 50 // Very high boost for intent-matched categories
  }
  
  // Featured boost
  if (category.featured) totalScore += 5
  
  return Math.round(totalScore * 100) / 100
}

/**
 * Search products with advanced matching and intent awareness
 * Enhanced with category name matching - if query matches category, show all products in that category
 */
export const searchProducts = (query, options = {}) => {
  const {
    limit = 10,
    includeDescription = true,
    includeTags = true,
    minScore = 5 // Lower threshold for better results
  } = options
  
  if (!query || query.trim().length < 1) {
    return []
  }
  
  const normalizedQuery = normalizeQuery(query)
  
  // Get search intent (categories, synonyms, keywords)
  const searchIntent = getSearchIntent(query)
  
  const allProducts = getAllProducts()
  
  // Enhanced: Check if query matches a category name exactly or closely
  // If so, include all products from that category with high scores
  const matchingCategories = categories.filter(cat => {
    const catNameLower = cat.name.toLowerCase()
    const catSlugLower = cat.slug.toLowerCase()
    return catNameLower.includes(normalizedQuery) || 
           normalizedQuery.includes(catNameLower) ||
           catSlugLower.includes(normalizedQuery) ||
           normalizedQuery.includes(catSlugLower) ||
           searchIntent.categories.includes(cat.id)
  })
  
  const results = allProducts
    .map(product => {
      const score = calculateProductScore(product, query, normalizedQuery, searchIntent)
      
      // Enhanced: Boost products from matching categories
      if (product.categoryId) {
        const isInMatchingCategory = matchingCategories.some(cat => cat.id === product.categoryId)
        if (isInMatchingCategory) {
          // Add significant boost for category match
          const boostedScore = score + 80
          if (boostedScore >= minScore) {
            return {
              ...product,
              _relevanceScore: boostedScore,
              _matchDetails: {
                titleMatch: fuzzyMatch(product.title, query),
                categoryMatch: product.categoryId ? 
                  fuzzyMatch(getCategoryByIdOrSlug(product.categoryId)?.name || '', query) : 
                  { score: 0, type: 'none' },
                intentMatch: searchIntent.categories.includes(product.categoryId || ''),
                categoryBoost: true
              }
            }
          }
        }
      }
      
      if (score < minScore) {
        return null
      }
      
      return {
        ...product,
        _relevanceScore: score,
        _matchDetails: {
          titleMatch: fuzzyMatch(product.title, query),
          categoryMatch: product.categoryId ? 
            fuzzyMatch(getCategoryByIdOrSlug(product.categoryId)?.name || '', query) : 
            { score: 0, type: 'none' },
          intentMatch: searchIntent.categories.includes(product.categoryId || ''),
          categoryBoost: false
        }
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      // Sort by relevance score (descending)
      if (b._relevanceScore !== a._relevanceScore) {
        return b._relevanceScore - a._relevanceScore
      }
      // Category-boosted products get priority
      if (a._matchDetails.categoryBoost !== b._matchDetails.categoryBoost) {
        return a._matchDetails.categoryBoost ? -1 : 1
      }
      // Intent-matched products get priority
      if (a._matchDetails.intentMatch !== b._matchDetails.intentMatch) {
        return a._matchDetails.intentMatch ? -1 : 1
      }
      // If scores are equal, prioritize popular/featured
      if (a.popular !== b.popular) return b.popular ? 1 : -1
      if (a.featured !== b.featured) return b.featured ? 1 : -1
      // Alphabetical as final tiebreaker
      return a.title.localeCompare(b.title)
    })
    .slice(0, limit)
  
  return results
}

/**
 * Search categories with advanced matching and intent awareness
 */
export const searchCategories = (query, options = {}) => {
  const { limit = 5, minScore = 10 } = options
  
  if (!query || query.trim().length < 1) {
    return []
  }
  
  const normalizedQuery = normalizeQuery(query)
  
  // Get search intent
  const searchIntent = getSearchIntent(query)
  
  const results = categories
    .map(category => {
      const score = calculateCategoryScore(category, query, normalizedQuery, searchIntent)
      
      if (score < minScore) {
        return null
      }
      
      return {
        ...category,
        _relevanceScore: score,
        _matchDetails: {
          nameMatch: fuzzyMatch(category.name, query),
          intentMatch: searchIntent.categories.includes(category.id)
        }
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      // Intent-matched categories get highest priority
      if (a._matchDetails.intentMatch !== b._matchDetails.intentMatch) {
        return a._matchDetails.intentMatch ? -1 : 1
      }
      if (b._relevanceScore !== a._relevanceScore) {
        return b._relevanceScore - a._relevanceScore
      }
      if (a.featured !== b.featured) return b.featured ? 1 : -1
      return a.order - b.order
    })
    .slice(0, limit)
  
  return results
}

/**
 * Combined search - searches both products and categories
 * Returns structured results with type indicators
 */
export const searchAll = (query, options = {}) => {
  const {
    productLimit = 8,
    categoryLimit = 3,
    includeDescription = true,
    includeTags = true,
    minScore = 10
  } = options
  
  if (!query || query.trim().length < 1) {
    return {
      products: [],
      categories: [],
      all: [],
      query: '',
      totalResults: 0
    }
  }
  
  const normalizedQuery = normalizeQuery(query)
  
  const productResults = searchProducts(query, {
    limit: productLimit,
    includeDescription,
    includeTags,
    minScore
  }).map(product => ({
    ...product,
    _type: 'product',
    _searchType: 'product'
  }))
  
  const categoryResults = searchCategories(query, {
    limit: categoryLimit,
    minScore
  }).map(category => ({
    ...category,
    _type: 'category',
    _searchType: 'category'
  }))
  
  // Combine and sort by relevance
  const allResults = [...categoryResults, ...productResults].sort(
    (a, b) => (b._relevanceScore || 0) - (a._relevanceScore || 0)
  )
  
  return {
    products: productResults,
    categories: categoryResults,
    all: allResults,
    query: normalizedQuery,
    totalResults: allResults.length,
    hasResults: allResults.length > 0
  }
}

/**
 * Highlight matched text in a string
 * Uses regex to find and wrap matches in <mark> tags
 */
export const highlightMatch = (text, query) => {
  if (!query || !text) return text
  
  const normalizedQuery = normalizeQuery(query)
  const queryWords = normalizedQuery.split(' ').filter(w => w.length > 0)
  
  // Escape special regex characters
  const escapedWords = queryWords.map(word => 
    word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  )
  
  // Create regex pattern that matches any of the query words
  const pattern = new RegExp(`(${escapedWords.join('|')})`, 'gi')
  
  // Replace matches with highlighted version
  return text.replace(pattern, '<mark class="search-highlight">$1</mark>')
}

/**
 * Get search suggestions (for autocomplete)
 * Returns quick suggestions based on products that start with query
 */
export const getSearchSuggestions = (query, limit = 5) => {
  if (!query || query.trim().length < 2) {
    return []
  }
  
  const normalizedQuery = normalizeQuery(query)
  const allProducts = getAllProducts()
  
  // Get products that start with query (exact or fuzzy)
  const suggestions = allProducts
    .map(product => {
      const match = fuzzyMatch(product.title, query)
      return { product, match }
    })
    .filter(({ match }) => match.type === 'starts' || match.type === 'exact')
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, limit)
    .map(({ product }) => ({
      text: product.title,
      type: 'product',
      id: product.id,
      slug: product.slug
    }))
  
  return suggestions
}

/**
 * Get search statistics
 * Useful for analytics or debugging
 */
export const getSearchStats = (query) => {
  if (!query || query.trim().length < 1) {
    return null
  }
  
  const results = searchAll(query, { productLimit: 100, categoryLimit: 100 })
  
  return {
    query: normalizeQuery(query),
    totalProducts: results.products.length,
    totalCategories: results.categories.length,
    totalResults: results.totalResults,
    avgProductScore: results.products.length > 0
      ? results.products.reduce((sum, p) => sum + (p._relevanceScore || 0), 0) / results.products.length
      : 0,
    avgCategoryScore: results.categories.length > 0
      ? results.categories.reduce((sum, c) => sum + (c._relevanceScore || 0), 0) / results.categories.length
      : 0
  }
}
