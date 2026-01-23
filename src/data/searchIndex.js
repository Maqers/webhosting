/**
 * SEARCH INDEX & SYNONYM MAPPING
 * 
 * Intent-aware search index with:
 * - Keyword-to-category mapping
 * - Synonym expansion
 * - Intent understanding
 * - Easy to extend without changing core logic
 * 
 * To add new synonyms:
 * 1. Add keyword to appropriate category array
 * 2. Or create new category mapping
 * 3. Search automatically includes synonyms
 */

/**
 * Keyword-to-category mapping
 * Maps user queries to relevant categories
 * Multiple keywords can map to the same category
 */
export const keywordToCategoryMap = {
  'home-decor': [
    // Direct matches
    'home', 'decor', 'decoration', 'decorative', 'interior', 'furniture',
    // Synonyms and related terms
    'house', 'houses', 'household', 'home decor', 'home decoration',
    'interior design', 'interior decor', 'room', 'rooms', 'living room',
    'bedroom', 'kitchen', 'dining', 'furnishings', 'furnishing',
    'home accessories', 'home goods', 'household items', 'domestic',
    'residential', 'indoor', 'indoor decor', 'home improvement',
    'home styling', 'home design', 'decorative items', 'ornaments',
    'homeware', 'homewares'
  ],
  'personalized-gifts': [
    // Direct matches
    'personalized', 'personalised', 'custom', 'customized', 'customised',
    'gift', 'gifts', 'present', 'presents',
    // Synonyms and related terms
    'engraved', 'engraving', 'monogram', 'monogrammed', 'initial',
    'initials', 'name', 'names', 'personal', 'bespoke', 'made to order',
    'custom made', 'personalized gift', 'custom gift', 'engraved gift',
    'special gift', 'unique gift', 'thoughtful gift', 'meaningful gift',
    'memorial', 'commemorative', 'dedicated', 'inscribed', 'etched',
    'carved', 'personalization', 'customization'
  ],
  'fashion-accessories': [
    // Direct matches
    'fashion', 'accessories', 'accessory', 'clothing', 'clothes', 'apparel',
    'jewelry', 'jewellery', 'jewel', 'jewels',
    // Synonyms and related terms
    'style', 'styling', 'wear', 'wearing', 'attire', 'outfit', 'outfits',
    'wardrobe', 'garment', 'garments', 'dress', 'dresses', 'fashionable',
    'trendy', 'trend', 'trends', 'style accessories', 'fashion items',
    'fashion accessories', 'jewelry items', 'ornaments', 'adornments',
    'trinkets', 'fashion pieces', 'style pieces', 'wearable', 'wearables',
    'necklace', 'necklaces', 'bracelet', 'bracelets', 'earring', 'earrings',
    'ring', 'rings', 'pendant', 'pendants'
  ]
}

/**
 * Plural to singular mapping
 * Handles singular/plural variations
 */
export const pluralToSingular = {
  'houses': 'house',
  'gifts': 'gift',
  'presents': 'present',
  'accessories': 'accessory',
  'jewelries': 'jewelry',
  'jewelleries': 'jewellery',
  'jewels': 'jewel',
  'rooms': 'room',
  'items': 'item',
  'products': 'product',
  'categories': 'category',
  'decorations': 'decoration',
  'furnishings': 'furnishing',
  'ornaments': 'ornament',
  'names': 'name',
  'initials': 'initial',
  'outfits': 'outfit',
  'garments': 'garment',
  'dresses': 'dress',
  'trends': 'trend',
  'necklaces': 'necklace',
  'bracelets': 'bracelet',
  'earrings': 'earring',
  'rings': 'ring',
  'pendants': 'pendant'
}

/**
 * Singular to plural mapping
 */
export const singularToPlural = {
  'house': 'houses',
  'gift': 'gifts',
  'present': 'presents',
  'accessory': 'accessories',
  'jewelry': 'jewelries',
  'jewellery': 'jewelleries',
  'jewel': 'jewels',
  'room': 'rooms',
  'item': 'items',
  'product': 'products',
  'category': 'categories',
  'decoration': 'decorations',
  'furnishing': 'furnishings',
  'ornament': 'ornaments',
  'name': 'names',
  'initial': 'initials',
  'outfit': 'outfits',
  'garment': 'garments',
  'dress': 'dresses',
  'trend': 'trends',
  'necklace': 'necklaces',
  'bracelet': 'bracelets',
  'earring': 'earrings',
  'ring': 'rings',
  'pendant': 'pendants'
}

/**
 * Get all synonyms for a keyword
 * Returns array of related terms
 */
export const getSynonyms = (keyword) => {
  const normalized = keyword.toLowerCase().trim()
  const synonyms = new Set([normalized])
  
  // Add singular/plural variations
  if (pluralToSingular[normalized]) {
    synonyms.add(pluralToSingular[normalized])
  }
  if (singularToPlural[normalized]) {
    synonyms.add(singularToPlural[normalized])
  }
  
  // Find category mappings
  for (const [categoryId, keywords] of Object.entries(keywordToCategoryMap)) {
    if (keywords.includes(normalized)) {
      // Add all keywords from the same category
      keywords.forEach(kw => synonyms.add(kw))
    }
  }
  
  return Array.from(synonyms)
}

/**
 * Get categories for a keyword
 * Returns array of category IDs
 */
export const getCategoriesForKeyword = (keyword) => {
  const normalized = keyword.toLowerCase().trim()
  const categoryIds = new Set()
  
  // Check direct mapping
  for (const [categoryId, keywords] of Object.entries(keywordToCategoryMap)) {
    if (keywords.includes(normalized)) {
      categoryIds.add(categoryId)
    }
  }
  
  // Check singular/plural variations
  const singular = pluralToSingular[normalized] || normalized
  const plural = singularToPlural[normalized] || normalized
  
  for (const [categoryId, keywords] of Object.entries(keywordToCategoryMap)) {
    if (keywords.includes(singular) || keywords.includes(plural)) {
      categoryIds.add(categoryId)
    }
  }
  
  return Array.from(categoryIds)
}

/**
 * Expand query with synonyms
 * Returns expanded query terms
 */
export const expandQueryWithSynonyms = (query) => {
  const words = query.toLowerCase().trim().split(/\s+/)
  const expandedTerms = new Set()
  
  words.forEach(word => {
    // Add original word
    expandedTerms.add(word)
    
    // Add singular/plural variations
    if (pluralToSingular[word]) {
      expandedTerms.add(pluralToSingular[word])
    }
    if (singularToPlural[word]) {
      expandedTerms.add(singularToPlural[word])
    }
    
    // Add synonyms from category mappings
    const synonyms = getSynonyms(word)
    synonyms.forEach(syn => expandedTerms.add(syn))
  })
  
  return Array.from(expandedTerms)
}

/**
 * Get search intent
 * Determines user intent from query
 */
export const getSearchIntent = (query) => {
  const normalized = query.toLowerCase().trim()
  const words = normalized.split(/\s+/)
  
  const intent = {
    categories: [],
    keywords: [],
    synonyms: []
  }
  
  words.forEach(word => {
    // Get categories for this word
    const categories = getCategoriesForKeyword(word)
    intent.categories.push(...categories)
    
    // Get synonyms
    const synonyms = getSynonyms(word)
    intent.synonyms.push(...synonyms)
    
    // Add keyword
    intent.keywords.push(word)
  })
  
  // Remove duplicates
  intent.categories = [...new Set(intent.categories)]
  intent.synonyms = [...new Set(intent.synonyms)]
  intent.keywords = [...new Set(intent.keywords)]
  
  return intent
}

/**
 * Build search index for fast lookups
 * Pre-computed index for performance
 */
export const buildSearchIndex = () => {
  const index = {
    keywordToCategories: {},
    categoryToKeywords: {},
    allKeywords: new Set()
  }
  
  // Build keyword to categories map
  for (const [categoryId, keywords] of Object.entries(keywordToCategoryMap)) {
    keywords.forEach(keyword => {
      if (!index.keywordToCategories[keyword]) {
        index.keywordToCategories[keyword] = []
      }
      index.keywordToCategories[keyword].push(categoryId)
      index.allKeywords.add(keyword)
    })
    
    // Build category to keywords map
    if (!index.categoryToKeywords[categoryId]) {
      index.categoryToKeywords[categoryId] = []
    }
    index.categoryToKeywords[categoryId].push(...keywords)
  }
  
  return index
}

// Pre-build index for performance
export const searchIndex = buildSearchIndex()

