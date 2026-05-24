import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPopularProducts } from "../data/catalog";
import ImageWithFallback from "../components/ImageWithFallback";
import MarqueeBanner from '../components/Marqueebanner';
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import SeoHead from "../components/SeoHead";
import "./Home.css";

const Home = () => {
  const popularProducts = useMemo(() => getPopularProducts(), []);
  const circlesRef = useRef(null);

  // Prevent iOS from stealing the gesture when horizontal scroll hits right edge
  useEffect(() => {
    const el = circlesRef.current;
    if (!el) return;
    let startX = 0, startY = 0, isHorizontal = null;
    const onTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isHorizontal = null;
    };
    const onTouchMove = (e) => {
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      // Determine direction on first significant move
      if (isHorizontal === null && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        isHorizontal = Math.abs(dx) > Math.abs(dy);
      }
      if (isHorizontal) {
        // Prevent page scroll / back-gesture for the entire horizontal swipe
        e.preventDefault();
      }
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    // Must be non-passive to call preventDefault
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  return (
    <div className="home">
      <SeoHead
        title="Curated Handcrafted Gifts from India"
        description="Discover unique handmade gifts from India's best independent artisans — jewellery, candles, home decor, skincare and more. Curated for every person, every occasion."
        url="/"
      />

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
          </div>
        </div>
      </section>

      <MarqueeBanner />

      {/* ── Scrollable category circles ──────────────────────────────────── */}
      <section className="category-circles-strip">
        <div className="category-circles-scroll" ref={circlesRef}>
          {[
            { id: "Handbags",             name: "Handbags",    img: "/images/photo-2026-05-12-09-25-50.jpg" },
            { id: "Handmade-Accessories", name: "Jewellery",   img: "/images/remove-the-white-text-box-with-kl-53-from-the-imag.jpeg" },
            { id: "Candles",              name: "Candles",     img: "/images/8.png" },
            { id: "Florals",              name: "Florals",     img: "/images/remove-the-background-make-it-transparent.jpeg" },
            { id: "Wedding-Gifts",        name: "Wedding",     img: "/images/whatsapp-image-2026-04-17-at-15.22.22.jpeg" },
            { id: "Kids-Accessories",     name: "Kids",        img: "/images/dsc_8211.jpg" },
            { id: "Home-decor",           name: "Home Decor",  img: "/images/28.png" },
            { id: "Handmade-Soaps",       name: "Soaps",       img: "/images/56.png" },
            { id: "Customised-Hampers",   name: "Hampers",     img: "/images/48.png" },
            { id: "Cosmetics",            name: "Cosmetics",   img: "/images/whatsapp-image-2026-05-01-at-2.16.13-pm-(1).jpeg" },
            { id: "resin-products",       name: "Resin Art",   img: "/images/29.png" },
            { id: "Frames&Paintings",     name: "Frames",      img: "/images/17.png" },
          ].map(cat => (
            <Link
              key={cat.id}
              to={`/category/${cat.id}`}
              className="category-circle-item"
            >
              <div className="category-circle-img">
                <img src={cat.img} alt={cat.name} loading="lazy"
                  onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                />
                <span className="category-circle-fallback" style={{display:'none'}}>{cat.name[0]}</span>
              </div>
              <span className="category-circle-label">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

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
    navigate(`/product/${product.slug}`);
  }, [product.id, navigate]);

  return (
    <article
      className="feat-card"
      style={{ "--i": index % 12, ...(product.inStock === false ? { opacity: 0.45, filter: 'grayscale(80%)' } : {}) }}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
      aria-label={product.title}
    >
      <div className="feat-img-zone">
        <ImageWithFallback src={product.images[0]} alt={product.title} className="feat-img" loading="lazy" />
        {product.popular && <span className="feat-badge-popular">Popular</span>}
        {product.inStock === false && <span className="feat-badge-out-of-stock">Out of Stock</span>}
        <button className={`feat-wishlist-btn${wishlisted ? " active" : ""}`} onClick={handleWishlist} aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"} type="button">
          <svg viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
      <div className="feat-info-zone">
        <p className="feat-category">{product.category}</p>
        <h3 className="feat-title">{product.title}</h3>
        <p className="feat-price">{product.meta?.sizePrices && Object.keys(product.meta.sizePrices).length > 0 ? `₹${product.price.toLocaleString("en-IN")} onwards` : `₹${product.price.toLocaleString("en-IN")}`}</p>
        <div className="feat-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className={`feat-add-btn${addedFeedback ? " added" : ""}`}
            onClick={product.inStock === false ? undefined : handleAddToCart}
            type="button"
            aria-label="Add to cart"
            disabled={product.inStock === false}
            style={product.inStock === false ? { background: '#aaa', cursor: 'not-allowed', pointerEvents: 'none' } : {}}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {product.inStock === false ? "Out of Stock" : addedFeedback ? "Added!" : "Add to Cart"}
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