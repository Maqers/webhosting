# Senior Frontend Architecture Documentation

## 🏗️ Data Architecture

### Design Philosophy
- **Single Source of Truth**: All data lives in `src/data/catalog.js`
- **Hierarchical Structure**: Categories contain products
- **Zero Hardcoding**: UI is 100% data-driven
- **Scalable**: Easy to add categories/products without touching UI code

### Data Structure

```javascript
// Categories Array
categories = [
  {
    id: 'home-decor',           // Unique identifier
    name: 'Home Decor',          // Display name
    slug: 'home-decor',          // URL-friendly slug
    description: '...',          // Category description
    icon: 'home',                // Icon identifier
    order: 1,                    // Display order
    featured: true,              // Show in featured sections
    meta: {
      keywords: [...]            // Search keywords
    }
  }
]

// Products by Category
productsByCategory = {
  'home-decor': [
    {
      id: 1,
      categoryId: 'home-decor',  // Links to category
      title: '...',
      slug: '...',
      description: '...',
      price: 2499,
      images: [...],
      popular: true,
      featured: true,
      inStock: true,
      tags: [...],
      meta: { keywords: [...] }
    }
  ]
}
```

### Adding a New Category

1. Add category to `categories` array:
```javascript
{
  id: 'new-category',
  name: 'New Category',
  slug: 'new-category',
  description: 'Category description',
  icon: 'icon-name',
  order: 4,
  featured: true,
  meta: { keywords: ['keyword1', 'keyword2'] }
}
```

2. Add products array:
```javascript
productsByCategory['new-category'] = [
  {
    id: 13,
    categoryId: 'new-category',
    title: 'Product Name',
    // ... other fields
  }
]
```

**That's it!** UI automatically updates.

### Adding a Product

Simply add to the appropriate category array:
```javascript
productsByCategory['home-decor'].push({
  id: 13,
  categoryId: 'home-decor',
  title: 'New Product',
  // ... fields
})
```

---

## 🧭 Navigation Architecture

### Main Navbar
- **Static Links**: Home, About, FAQs, Contact
- **Search Bar**: Enhanced search component
- **Logo**: Brand identity

### Dynamic Sub-Navbar
- **Auto-generated** from `categories` array
- **"All Products"** link always first
- **Category links** sorted by `order` field
- **Active state** based on current route

**No hardcoded links** - fully data-driven!

---

## 🔍 Search Architecture

### Search Algorithm

1. **Normalization**: Query is lowercased and trimmed
2. **Multi-field Search**: Searches title, description, tags, keywords
3. **Relevance Scoring**:
   - Exact match: 100 points
   - Starts with: 50 points
   - Contains: 25 points
   - Description match: 10 points
   - Tag match: 5 points per tag
   - Keyword match: 3 points per keyword
4. **Multi-word Support**: All words must match somewhere
5. **Sorting**: Results sorted by relevance score

### Search Features

- ✅ **Category Search**: Finds categories by name, slug, description
- ✅ **Product Search**: Finds products by title, description, tags
- ✅ **Text Highlighting**: Matched terms highlighted in results
- ✅ **Keyboard Navigation**: Arrow keys, Enter, Escape
- ✅ **Debouncing**: 150ms delay for performance
- ✅ **Empty State**: Clear message when no results
- ✅ **Loading State**: Visual feedback during search

### Search Results Structure

```javascript
{
  products: [...],      // Product results
  categories: [...],    // Category results
  all: [...],          // Combined, sorted by relevance
  query: '...',        // Normalized query
  totalResults: 10     // Total count
}
```

---

## 🎨 UI/UX Standards

### Spacing & Alignment
- Consistent use of CSS variables (`--spacing-*`)
- Professional gaps between elements
- Proper vertical rhythm

### Typography
- Clear hierarchy (h1 → h6)
- Readable font sizes
- Proper line heights

### Animations
- Subtle transitions (250-400ms)
- Premium easing functions
- No jarring movements
- Respects `prefers-reduced-motion`

### Responsive Behavior

**Desktop (>968px)**
- Full navigation visible
- Sub-navbar shows all categories
- Search dropdown full width

**Tablet (≤968px)**
- Adaptive spacing
- Categories remain visible
- Search remains accessible

**Mobile (≤480px)**
- Sub-navbar becomes scrollable tabs
- Search remains prominent
- Touch-friendly targets (min 44px)

---

## 📁 File Structure

```
src/
├── data/
│   ├── catalog.js          # Single source of truth
│   └── products.js         # Legacy (backward compatible)
├── components/
│   ├── Navbar.jsx          # Main navigation
│   ├── DynamicSubNavbar.jsx # Auto-generated categories
│   ├── EnhancedSearchBar.jsx # Advanced search
│   └── SearchBar.jsx       # Legacy (backward compatible)
├── utils/
│   └── search.js           # Search algorithms
└── pages/
    └── ...                  # Pages use catalog data
```

---

## 🔧 Utility Functions

### Data Access
- `getAllProducts()` - Flat array of all products
- `getProductsByCategory(id)` - Products in category
- `getProductById(id)` - Single product
- `getCategoryByIdOrSlug(id)` - Single category
- `getFeaturedProducts()` - Featured products
- `getPopularProducts()` - Popular products
- `getSortedCategories()` - Categories sorted by order

### Search
- `searchProducts(query, options)` - Search products
- `searchCategories(query, options)` - Search categories
- `searchAll(query, options)` - Combined search
- `highlightMatch(text, query)` - Highlight matches
- `getSearchSuggestions(query)` - Autocomplete

---

## 🚀 Usage Examples

### Adding a Category

```javascript
// In catalog.js
export const categories = [
  // ... existing categories
  {
    id: 'electronics',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic gadgets and devices',
    icon: 'electronics',
    order: 4,
    featured: true,
    meta: { keywords: ['electronics', 'gadgets', 'devices'] }
  }
]

// Add products
export const productsByCategory = {
  // ... existing categories
  'electronics': [
    {
      id: 13,
      categoryId: 'electronics',
      title: 'Smart Watch',
      slug: 'smart-watch',
      // ... other fields
    }
  ]
}
```

### Using Search

```javascript
import { searchAll } from '../utils/search'

const results = searchAll('wooden', {
  productLimit: 10,
  categoryLimit: 5
})

// results.products - Product matches
// results.categories - Category matches
// results.all - Combined, sorted by relevance
```

---

## ✅ Best Practices

1. **Always use utility functions** - Don't access data directly
2. **Maintain data consistency** - categoryId must match category.id
3. **Use slugs for URLs** - More SEO-friendly than IDs
4. **Add keywords** - Improves search relevance
5. **Set order** - Controls display sequence
6. **Test search** - Verify new products/categories are searchable

---

## 🎯 Future Enhancements

- [ ] Sub-categories support
- [ ] Product variants (size, color)
- [ ] Advanced filters (price range, tags)
- [ ] Search analytics
- [ ] Recent searches
- [ ] Search history

---

## 📝 Maintenance Guide

### To Add a Product:
1. Open `src/data/catalog.js`
2. Find the category array
3. Add product object with all required fields
4. Save - UI updates automatically

### To Add a Category:
1. Add category to `categories` array
2. Create `productsByCategory['category-id']` array
3. Add products to that array
4. Save - Navigation updates automatically

### To Modify Search:
1. Edit `src/utils/search.js`
2. Adjust scoring algorithm
3. Test with various queries

---

**This architecture is production-ready, scalable, and maintainable.**

