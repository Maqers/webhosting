import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPopularProducts, getSortedCategories } from "../data/catalog";
import ImageWithFallback from "../components/ImageWithFallback";
import MarqueeBanner from '../components/Marqueebanner';
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import SeoHead from "../components/SeoHead";
import "./Home.css";

const Home = () => {
  const popularProducts = useMemo(() => getPopularProducts(), []);

// First product image per category for circles
const HOME_CAT_IMAGES = {
  'Handbags':             '/images/photo-2026-05-12-09-25-50.jpg',
  'Handmade-Accessories': '/images/remove-the-white-text-box-with-kl-53-from-the-imag.jpeg',
  'Candles':              '/images/8.png',
  'Florals':              '/images/remove-the-background-make-it-transparent.jpeg',
  'Wedding-Gifts':        '/images/whatsapp-image-2026-04-17-at-15.22.22.jpeg',
  'Kids-Accessories':     '/images/dsc_8211.jpg',
  'Home-decor':           '/images/28.png',
  'Handmade-Soaps':       '/images/56.png',
  'Customised-Hampers':   '/images/48.png',
  'Cosmetics':            '/images/whatsapp-image-2026-05-01-at-2.16.13-pm-(1).jpeg',
  'resin-products':       '/images/29.png',
  'Charm-accessories':    '/images/enchanted_charm_watch_2.png',
  'Frames&Paintings':     '/images/17.png',
}
  const circlesRef = useRef(null);

  // Smooth horizontal scroll on iOS without page takeover
  useEffect(() => {
    const el = circlesRef.current;
    if (!el) return;
    let startX = 0, startScrollLeft = 0, startY = 0, isHorizontal = null;

    const onTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startScrollLeft = el.scrollLeft;
      isHorizontal = null;
    };
    const onTouchMove = (e) => {
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (isHorizontal === null && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        isHorizontal = Math.abs(dx) > Math.abs(dy);
      }
      if (isHorizontal) {
        // Drive scroll manually so iOS doesn't grab it
        el.scrollLeft = startScrollLeft - dx;
        e.preventDefault();
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
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
          <h1 className="hero-bright-title">
            Saw it on Instagram?<br /><em>Buy it here.</em>
          </h1>
          <p className="hero-bright-subtitle">
            The best independent Indian sellers, in one place.
          </p>
          <div className="hero-bright-actions">
            <Link to="/products" className="hero-bright-btn-primary">Shop All Gifts</Link>
            <Link to="/by-occasion" className="hero-bright-btn-secondary">Shop by Occasion</Link>
          </div>
        </div>
      </section>

      <MarqueeBanner />

      {/* ── Scrollable category circles ── */}
      <section className="category-circles-strip">
        <div className="category-circles-scroll" ref={circlesRef}>
          {getSortedCategories()
            .filter(c => c.id !== 'Oxidised-jewellery')
            .map(cat => {
              const img = HOME_CAT_IMAGES[cat.id] || ''
              return (
                <Link
                  key={cat.id}
                  to={`/category/${cat.id}`}
                  state={{ from: '/' }}
                  className="category-circle-item category-circle-item--btn"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="category-circle-img">
                    {img
                      ? <img src={img} alt={cat.name} loading="lazy"
                          onError={e => { e.target.style.display='none'; e.target.nextSibling && (e.target.nextSibling.style.display='flex') }} />
                      : null
                    }
                    <span className="category-circle-fallback" style={{display:'none'}}>{cat.name[0]}</span>
                  </div>
                  <span className="category-circle-label">{cat.name}</span>
                </Link>
              )
            })
          }
        </div>
      </section>

      <section className="featured-section">
        <div className="container">
          <div className="featured-header">
            <div className="featured-header-left">
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

    </div>
  );
};

export const FeaturedCard = ({ product, index }) => {
  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const navigate = useNavigate();
  const wishlisted = isWishlisted(product.id);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [heartPop, setHeartPop] = useState(false);

  const handleAddToCart = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    addItem(product);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1400);
  }, [product, addItem]);

  const handleWishlist = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    toggleItem(product);
    setHeartPop(true);
    setTimeout(() => setHeartPop(false), 400);
  }, [product, toggleItem]);

  const handleCardClick = useCallback(() => {
    navigate(`/product/${product.slug}`);
  }, [product.slug, navigate]);

  const secondImage = product.images[1] || null;
  const imgZoneRef = useRef(null);

  // Match tile dimension to taller image — touch/mobile only
  useEffect(() => {
    if (!secondImage || !imgZoneRef.current) return
    if (!window.matchMedia('(hover: none) and (max-width: 768px)').matches) return
    const el = imgZoneRef.current
    const loadImg = (src) => new Promise((res) => {
      const img = new Image()
      img.onload = () => res(img.naturalWidth / img.naturalHeight)
      img.onerror = () => res(1)
      img.src = src
    })
    Promise.all([loadImg(product.images[0]), loadImg(secondImage)]).then(([r1, r2]) => {
      const ratio = Math.min(r1, r2)
      if (el) el.style.aspectRatio = String(ratio)
    })
  }, [product.images[0], secondImage]);

  // Mobile: swap to second image when card scrolls into centre of viewport
  useEffect(() => {
    if (!secondImage || !imgZoneRef.current) return;
    const el = imgZoneRef.current;
    // Only run on touch devices
    const isTouch = window.matchMedia('(hover: none) and (max-width: 768px)').matches
    if (!isTouch) return
    let timer = null
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => el.classList.add('mobile-swap'), 250)
        } else {
          clearTimeout(timer)
          el.classList.remove('mobile-swap')
        }
      },
      { threshold: 0.85 }
    );
    obs.observe(el);
    return () => { obs.disconnect(); clearTimeout(timer); };
  }, [secondImage]);

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
      <div ref={imgZoneRef} className={`feat-img-zone${secondImage ? ' has-second-img' : ''}`}>
        <ImageWithFallback src={product.images[0]} alt={product.title} className="feat-img" loading="lazy" />
        {secondImage && <img src={secondImage} alt="" className="feat-img-hover" aria-hidden="true" loading="lazy" />}
        {product.popular && <span className="feat-badge-popular">Popular</span>}
        {product.inStock === false && <span className="feat-badge-out-of-stock">Out of Stock</span>}
        <button className={`feat-wishlist-btn${wishlisted ? " active" : ""}${heartPop ? " heart-pop" : ""}`} onClick={handleWishlist} aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"} type="button">
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