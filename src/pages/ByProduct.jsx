import { Link } from 'react-router-dom'
import { getSortedCategories, getCategoryProductCount } from '../data/catalog'
import './ByOccasion.css'

export default function ByProduct() {
  const categories = getSortedCategories().filter(c => c.id !== 'Oxidised-jewellery')

  return (
    <div className="by-page">
      <div className="by-page-header">
        <h1>Shop by Product</h1>
        <p>Browse by what you're looking for</p>
      </div>
      <div className="by-page-list">
        {categories.map(cat => (
          <Link key={cat.id} to={`/category/${cat.slug}`} className="by-page-item">
            <span className="by-page-name">{cat.name}</span>
            <span className="by-page-count">{getCategoryProductCount(cat.id)}</span>
            <span className="by-page-arrow">›</span>
          </Link>
        ))}
      </div>
    </div>
  )
}