import { Link } from 'react-router-dom'
import { occasionCategories } from '../data/occasionCatalog'
import { occasionProductMap } from '../data/catalog'
import SeoHead from '../components/SeoHead'
import './ByOccasion.css'

export default function ByOccasion() {
  return (
    <div className="by-page">
      <SeoHead
        title="Shop Gifts by Occasion"
        description="Find the perfect handmade gift by occasion — birthdays, weddings, anniversaries, Diwali and more. Curated from India's finest artisans."
        url="/by-occasion"
      />
      <div className="by-page-header">
        <h1>Shop by Occasion</h1>
        <p>Who are you gifting?</p>
      </div>
      <div className="by-page-list">
        {occasionCategories.map(cat => (
          <Link key={cat.id} to={`/category/${cat.slug}`} className="by-page-item">
            <span className="by-page-emoji">{cat.emoji}</span>
            <span className="by-page-name">{cat.name}</span>
            <span className="by-page-arrow">›</span>
          </Link>
        ))}
      </div>
    </div>
  )
}