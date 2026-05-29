import { Link } from 'react-router-dom'
import { getSortedCategories, getCategoryProductCount } from '../data/catalog'
import SeoHead from '../components/SeoHead'
import './ByOccasion.css'

export default function ByProduct() {
  const categories = getSortedCategories().filter(c => !['Oxidised-jewellery', 'cosmetics'].includes(c.id))

  return (
    <div className="by-page">
      <SeoHead
        title="Shop Gifts by Category"
        description="Browse handcrafted gifts by category — jewellery, candles, home decor, soaps, hampers and more. All from independent Indian artisans."
        url="/by-product"
      />
      <div className="by-page-header">
        <h1>Shop by Category</h1>
        <p>Browse by what you're looking for</p>
      </div>
      <div className="by-page-list">
        {categories.map(cat => (
          <Link key={cat.id} to={`/category/${cat.id}`} className="by-page-item">
            <span className="by-page-name">{cat.name}</span>
            <span className="by-page-arrow">›</span>
          </Link>
        ))}
      </div>
    </div>
  )
}