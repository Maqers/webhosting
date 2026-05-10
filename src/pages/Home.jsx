import { useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPopularProducts } from "../data/catalog";
import ImageWithFallback from "../components/ImageWithFallback";
import MarqueeBanner from '../components/Marqueebanner';
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import "./Home.css";

const Home = () => {
  const popularProducts = useMemo(() => getPopularProducts(), []);

  return (
    <div className="home">

      <section className="hero-bright">
        <div className="container hero-bright-inner">
          <span className="hero-eyebrow-pill">✦ India's Finest Artisan Gifts</span>
          <h1 className="hero-bright-title">
            Gifts That Actually<br /><em>Mean Something</em>
          </h1>
          <p className="hero-bright-subtitle">
            Handpicked from India's best home businesses — for every occasion, every person.
          </p>
          <div className="hero-bright-actions">
            <Link to="/products" className="hero-bright-btn-primary">Shop All Gifts</Link>
            <Link to="/by-occasion" className="hero-bright-btn-primary">Shop by Occasion</Link>
            <Link to="/by-product" className="hero-bright-btn-primary">Shop by Category</Link>
          </div>
        </div>
      </section>

      <MarqueeBanner />

      <section className="trust-bar">
        <div className="container trust-bar-inner">
          <div className="trust-item">
            <span className="trust-icon" role="img" aria-label="search">🔍</span>
            <div><strong>Hand-picked sellers</strong><span>Every business vetted personally</span></div>
          </div>
          <div className="trust-divider" />
          <div className="trust-item">
            <span className="trust-icon" role="img" aria-label="gift">🎁</span>
            <div><strong>Genuinely handmade</strong><span>No generic products, only real craft</span></div>
          </div>
          <div className="trust-divider" />
          <div className="trust-item">
            <span className="trust-icon" role="img" aria-label="chat">💬</span>
            <div><strong>Order via WhatsApp</strong><span>No DM anxiety — we handle it</span></div>
          </div>
          <div className="trust-divider" />
          <div className="trust-item">
            <span className="trust-icon" role="img" aria-label="India flag">🇮🇳</span>
            <div><strong>Support small</strong><span>Every rupee goes to an Indian home biz</span></div>
          </div>
        </div>
      </section>

      <section className="featured-section">
        <div className="container">
          <div className="featured-header">
            <div className="featured-header-left">
              <span className="featured-eyebrow">✦ Crowd Favourites</span>
              <h2 className="featured-title">Most Loved Right Now</h2>
            </div>
            <Link to="/products" className="featured-view-all">View all →</Link>
          </div>
          <div className="featured-grid">
            {popularProducts.slice(0, 8).map((product, index) => (
              <FeaturedCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="home-cta-section">
        <div className="container">
          <div className="home-cta-content">
            <h2>Not sure what to get?</h2>
            <p>Chat with us on WhatsApp — tell us who you're buying for and your budget, and we'll find the right gift in minutes.</p>
            <div className="home-cta-buttons">
              <Link to="/products" className="home-cta-btn">Browse All Gifts</Link>
              <Link to="/contact" className="home-cta-btn">Chat with us on WhatsApp</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export const FeaturedCard = ({ product, index }) => {
  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const navigate = useNavigate();
  const wishlisted = isWishlisted(product.id);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const handleAddToCart = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    addItem(product);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1400);
  }, [product, addItem]);

  const handleWishlist = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    toggleItem(product);
  }, [product, toggleItem]);

  const handleCardClick = useCallback(() => {
    navigate(`/product/${product.id}`);
  }, [product.id, navigate]);

  return (
    <article
      className="feat-card"
      style={{ "--i": index % 12 }}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
      aria-label={product.title}
    >
      <div className="feat-img-zone">
        <ImageWithFallback src={product.images[0]} alt={product.title} className="feat-img" loading="lazy" />
        {product.popular && <span className="feat-badge-popular">Popular</span>}
        <button className={`feat-wishlist-btn${wishlisted ? " active" : ""}`} onClick={handleWishlist} aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"} type="button">
          <svg viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
      <div className="feat-info-zone">
        <p className="feat-category">{product.category}</p>
        <h3 className="feat-title">{product.title}</h3>
        <p className="feat-price">₹{product.price.toLocaleString("en-IN")}</p>
        <div className="feat-actions" onClick={(e) => e.stopPropagation()}>
          <button className={`feat-add-btn${addedFeedback ? " added" : ""}`} onClick={handleAddToCart} type="button" aria-label="Add to cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {addedFeedback ? "Added!" : "Add to Cart"}
          </button>
          <button className={`feat-wishlist-text-btn${wishlisted ? " active" : ""}`} onClick={handleWishlist} type="button" aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}>
            <svg viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {wishlisted ? "Saved" : "Wishlist"}
          </button>
        </div>
      </div>
    </article>
  );
};

export default Home;