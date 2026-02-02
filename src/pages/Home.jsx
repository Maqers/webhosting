import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getPopularProducts } from '../data/catalog'
import ImageWithFallback from '../components/ImageWithFallback'
import './Home.css'

import slide1 from '../assets/images/hero/slide1.png'
import slide2 from '../assets/images/hero/slide2.png'
import slide3 from '../assets/images/hero/slide3.png'

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [heroTextVisible, setHeroTextVisible] = useState(false)

  const heroSlides = useMemo(() => [slide1, slide2, slide3], [])
  const popularProducts = useMemo(() => getPopularProducts(), [])

  // Show hero text immediately with animation
  useEffect(() => {
    const timer = setTimeout(() => setHeroTextVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Auto-slide hero images
  useEffect(() => {
    if (heroSlides.length <= 1) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [heroSlides.length])

  // Scroll animation for stat cards
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('animate-in')
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('.stat-card.scroll-animate').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-slider">
          {heroSlides.map((src, index) => (
            <div key={index} className={`hero-slide ${currentSlide === index ? 'active' : ''}`}>
              <ImageWithFallback
                src={src}
                alt={`Hero slide ${index + 1}`}
                className="hero-slide-image"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>

        <div className="hero-overlay"></div>

        <div className={`hero-content ${heroTextVisible ? 'visible' : ''}`}>
          <div className="hero-text">
            <h1 className="hero-title">Custom Gifts from Indian home businesses</h1>
            <p className="hero-subtitle">
              Handcrafted with love, delivered with care. Order unique personalized gifts from Indian home
              businesses and small businesses.
            </p>
          </div>
        </div>

        <div className="hero-indicators">
          {heroSlides.map((_, index) => (
            <span
              key={index}
              className={`indicator ${currentSlide === index ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            ></span>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card scroll-animate hover-lift touch-feedback" data-animate="fade-up" data-delay="0">
              <div className="stat-icon-wrapper">
                <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="stat-number">20+</div>
              <div className="stat-label">Unique Products</div>
            </div>

            <div className="stat-card scroll-animate hover-lift touch-feedback" data-animate="fade-up" data-delay="100">
              <div className="stat-icon-wrapper">
                <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div className="stat-number">5</div>
              <div className="stat-label">Average Rating</div>
            </div>

            <div className="stat-card scroll-animate hover-lift touch-feedback" data-animate="fade-up" data-delay="200">
              <div className="stat-icon-wrapper">
                <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="stat-number">5-7</div>
              <div className="stat-label">Days Delivery</div>
            </div>

            <div className="stat-card scroll-animate hover-lift touch-feedback" data-animate="fade-up" data-delay="300">
              <div className="stat-icon-wrapper">
                <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="stat-number">100+</div>
              <div className="stat-label">Happy Customers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title" data-animate="fade-up">Featured Products</h2>
            <p className="section-description" data-animate="fade-up" data-delay="100">
              Handpicked favorites from our collection
            </p>
          </div>

          <div className="featured-grid" data-animate="stagger" data-stagger-delay="100">
            {popularProducts.slice(0, 3).map((product, index) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="featured-card hover-lift hover-zoom touch-feedback"
                data-stagger-item
                style={{ '--i': index }}
              >
                <div className="featured-image-wrapper hover-zoom">
                  <ImageWithFallback
                    src={product.images[0]}
                    alt={product.title}
                    className="featured-image"
                    loading="lazy"
                  />
                  <div className="featured-overlay">
                    <span className="featured-badge">Popular</span>
                  </div>
                </div>

                <div className="featured-content">
                  <h3>{product.title}</h3>
                  <p className="product-id">Product ID: {product.id}</p>
                  <p className="featured-category">{product.category}</p>
                  <div className="featured-footer">
                    <span className="featured-price">₹{product.price}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section className="showcase-section">
        <div className="showcase-content">
          <div className="showcase-text" data-animate="slide-right">
            <h2>Handcrafted with Tradition, Made for You</h2>
            <p>
              We bring you authentic Indian craftsmanship, home-businesses where every piece tells a story.
              From traditional designs to modern personalized gifts, we curate unique products that celebrate
              Indian home and small sellers.
            </p>
            <Link to="/about" className="showcase-btn hover-underline touch-feedback">Our Story</Link>
          </div>
        </div>
      </section>

      {/* Popular Products */}
      <section className="popular-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title" data-animate="fade-up">Popular Products</h2>
            <Link to="/products" className="view-all-link hover-underline touch-feedback">View All →</Link>
          </div>

          <div className="products-grid" data-animate="stagger" data-stagger-delay="80">
            {popularProducts.slice(0, 6).map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content" data-animate="fade-up">
            <h2>Ready to Order?</h2>
            <p>Browse our complete collection and find the perfect custom gift</p>
            <div className="cta-buttons">
              <Link to="/contact" className="cta-button primary hover-lift touch-feedback ripple-effect">
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
