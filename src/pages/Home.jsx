import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getPopularProducts, getSortedCategories } from '../data/catalog'
import ImageWithFallback from '../components/ImageWithFallback'
import './Home.css'

import heroBg from '../assets/images/hero/slide1.png'

const Home = () => {
  const popularProducts = useMemo(() => getPopularProducts(), [])
  const categories = useMemo(() => getSortedCategories(), [])

  return (
    <div className="home">
      {/* Hero Banner — background-image on the element so it always fills full height */}
      <section
        className="hero-banner"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="hero-banner-content">
          <h1 className="hero-banner-title">Custom Gifts from Indian Home Businesses</h1>
          <p className="hero-banner-subtitle">
            Handcrafted with love, delivered with care
          </p>
          <div className="hero-category-links">
            <Link to="/products" className="hero-category-chip all">
              All Products
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug || category.name}`}
                className="hero-category-chip"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Our Collection */}
      <section className="popular-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Our Collection</h2>
            <Link to="/products" className="view-all-link hover-underline touch-feedback">View All Products →</Link>
          </div>

          <div className="products-grid">
            {popularProducts.slice(0, 6).map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Order?</h2>
            <p>Browse our complete collection and find the perfect custom gift</p>
            <div className="cta-buttons">
              <Link to="/products" className="cta-button primary hover-lift touch-feedback ripple-effect">
                View All Products
              </Link>
              <Link to="/contact" className="cta-button secondary hover-lift touch-feedback ripple-effect">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// Product Card Component
const ProductCard = ({ product, index }) => {
  return (
    <Link
      to={`/product/${product.id}`}
      className="product-card hover-lift hover-zoom touch-feedback"
      data-stagger-item
      style={{ '--i': index }}
    >
      <div className="product-image-container hover-zoom">
        <ImageWithFallback
          src={product.images[0]}
          alt={product.title}
          className="product-image"
          loading="lazy"
        />
        {product.popular && <div className="popular-badge">Popular</div>}
      </div>

      <div className="product-info">
        <h3 className="product-title">{product.title}</h3>
        <p className="product-id">Product ID: {product.id}</p>
        <p className="product-category">{product.category}</p>
        <div className="product-meta">
          <span className="product-price">₹{product.price}</span>
        </div>
      </div>
    </Link>
  )
}

export default Home