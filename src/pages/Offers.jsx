import { Link } from 'react-router-dom'
import ImageWithFallback from '../components/ImageWithFallback'
import './Offers.css'

const Offers = () => {
  const offers = [
    {
      id: 1,
      title: "First Order Special",
      discount: "50% OFF",
      code: "FIRST50",
      description: "Get 50% off on your first order. Valid on orders above ₹200.",
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop"
    },
    {
      id: 2,
      title: "Weekend Bonanza",
      discount: "30% OFF",
      code: "WEEKEND30",
      description: "Enjoy 30% off on all orders this weekend. Use code at checkout.",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop"
    },
    {
      id: 3,
      title: "Free Delivery",
      discount: "FREE",
      code: "FREEDEL",
      description: "Free delivery on orders above ₹500. No code needed!",
      image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=400&fit=crop"
    },
    {
      id: 4,
      title: "Combo Meals",
      discount: "20% OFF",
      code: "COMBO20",
      description: "Save 20% on combo meals. Perfect for sharing!",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop"
    }
  ]

  return (
    <div className="offers-page">
      <div className="offers-hero">
        <div className="container">
          <h1 className="page-title">Special Offers</h1>
          <p className="page-subtitle">Exclusive deals just for you</p>
        </div>
      </div>

      <div className="container">
        <div className="offers-grid">
          {offers.map((offer, index) => (
            <div key={offer.id} className="offer-card scroll-animate" style={{ '--i': index }}>
              <div className="offer-image">
                <ImageWithFallback
                  src={offer.image}
                  alt={offer.title}
                  className="offer-img"
                />
                <div className="discount-badge">{offer.discount}</div>
              </div>
              <div className="offer-content">
                <h3>{offer.title}</h3>
                <p>{offer.description}</p>
                <div className="offer-code">
                  <span>Code: </span>
                  <strong>{offer.code}</strong>
                </div>
                <button className="offer-btn">Apply Offer</button>
              </div>
            </div>
          ))}
        </div>

        <div className="quote-section">
          <div className="quote-card">
            <p className="quote-text">"The best way to enjoy food is to share it with others."</p>
            <p className="quote-author">- Unknown</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Offers

