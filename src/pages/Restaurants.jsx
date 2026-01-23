import { Link } from 'react-router-dom'
import { restaurants } from '../data/products'
import ImageWithFallback from '../components/ImageWithFallback'
import './Restaurants.css'

const Restaurants = () => {
  return (
    <div className="restaurants-page">
      <div className="restaurants-hero">
        <div className="container">
          <h1 className="page-title">Discover Restaurants</h1>
          <p className="page-subtitle">Order from your favorite restaurants</p>
        </div>
      </div>

      <div className="container">
        <div className="restaurants-grid">
          {restaurants.map((restaurant, index) => (
            <Link 
              to={`/restaurant/${restaurant.id}`}
              key={restaurant.id}
              className="restaurant-card scroll-animate"
              style={{ '--i': index }}
            >
              <div className="restaurant-image">
                <ImageWithFallback
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="restaurant-img"
                />
                <div className="restaurant-badge">
                  <span className="rating">⭐ {restaurant.rating}</span>
                </div>
              </div>
              <div className="restaurant-info">
                <h3>{restaurant.name}</h3>
                <p className="cuisine">{restaurant.cuisine}</p>
                <div className="restaurant-meta">
                  <span className="delivery-time">🕐 {restaurant.deliveryTime}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Restaurants

