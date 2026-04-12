import { useMemo } from "react";
import { Link } from "react-router-dom";
import { getPopularProducts, getSortedCategories } from "../data/catalog";
import ImageWithFallback from "../components/ImageWithFallback";
import "./Home.css";
import { useRef } from "react";

import heroBg from "../assets/images/hero/slide1.png";

const Home = () => {
  const popularProducts = useMemo(() => getPopularProducts(), []);
  const categories = useMemo(() => getSortedCategories(), []);
  const scrollRef = useRef(null);

  const scroll = (dir) => {
  const el = scrollRef.current
  if (!el) return

  const max = el.scrollWidth - el.clientWidth
  const step = 200

  let next = dir === "left"
    ? el.scrollLeft - step
    : el.scrollLeft + step

  next = Math.max(0, Math.min(next, max))

  el.scrollTo({ left: next, behavior: "smooth" })
}
  return (
    <div className="home">
      <section
        className="hero-banner"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="hero-banner-content">
          <h1 className="hero-banner-title">
            Custom Gifts from Indian Home Businesses
          </h1>
          <p className="hero-banner-subtitle">
            Handcrafted with love, delivered with care
          </p>
          <div className="hero-category-wrapper">
            <button className="scroll-btn left" onClick={() => scroll("left")}>
              ‹
            </button>

            <div className="hero-category-links" ref={scrollRef}>
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

            <button
              className="scroll-btn right"
              onClick={() => scroll("right")}
            >
              ›
            </button>
          </div>
        </div>
      </section>

      <section className="trust-bar">
        <div className="container trust-bar-inner">
          <div className="trust-item">
            <span className="trust-icon" role="img" aria-label="search">
              🔍
            </span>
            <div>
              <strong>Hand-picked sellers</strong>
              <span>Every business vetted personally</span>
            </div>
          </div>
          <div className="trust-divider" />
          <div className="trust-item">
            <span className="trust-icon" role="img" aria-label="gift">
              🎁
            </span>
            <div>
              <strong>Genuinely handmade</strong>
              <span>No generic products, only real craft</span>
            </div>
          </div>
          <div className="trust-divider" />
          <div className="trust-item">
            <span className="trust-icon" role="img" aria-label="chat">
              💬
            </span>
            <div>
              <strong>Order via WhatsApp</strong>
              <span>No DM anxiety — we handle it</span>
            </div>
          </div>
          <div className="trust-divider" />
          <div className="trust-item">
            <span className="trust-icon" role="img" aria-label="India flag">
              🇮🇳
            </span>
            <div>
              <strong>Support small</strong>
              <span>Every rupee goes to an Indian home biz</span>
            </div>
          </div>
        </div>
      </section>

      <section className="popular-section">
        <div className="container">
          <div className="section-header">
            <div>
              <p className="section-eyebrow">Crowd favourites</p>
              <h2 className="section-title">Most loved right now</h2>
            </div>
            <Link to="/products" className="view-all-link">
              View all →
            </Link>
          </div>
          <div className="products-grid">
            {popularProducts.slice(0, 6).map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="home-cta-section">
        <div className="container">
          <div className="home-cta-content">
            <h2>Not sure what to get?</h2>
            <p>
              Chat with us on WhatsApp — tell us who you're buying for and your
              budget, and we'll find the right gift in minutes.
            </p>
            <div className="home-cta-buttons">
              <Link to="/products" className="home-cta-btn">
                Browse All Gifts
              </Link>
              <Link to="/contact" className="home-cta-btn">
                Chat with us on WhatsApp
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const ProductCard = ({ product, index }) => (
  <Link
    to={`/product/${product.id}`}
    className="product-card hover-lift hover-zoom touch-feedback"
    style={{ "--i": index }}
  >
    <div className="product-image-container">
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
);

export default Home;
