import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPopularProducts, getSortedCategories } from "../data/catalog";
import { occasionCategories } from "../data/occasionCatalog";
import { expandProductsByColor, productLinkQuery } from "../utils/productVariants";
import ImageWithFallback from "../components/ImageWithFallback";
import MarqueeBanner from '../components/Marqueebanner';
import DiwaliSparkles from '../components/DiwaliSparkles';
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import SeoHead from "../components/SeoHead";
import { useMobileCenterSwap } from "../hooks/useMobileCenterSwap";
import "./Home.css";

// Raksha Bandhan 2026 falls on Aug 28 — this banner auto-hides itself the day
// after, reverting to the normal hero with no code change needed next year.
const RAKHI_BANNER_EXPIRES = new Date("2026-08-29T00:00:00+05:30");
const showRakhiBanner = new Date() < RAKHI_BANNER_EXPIRES;

// Diwali 2026 runs Nov 6-10 (main day Nov 8) — starts showing ~3 weeks out
// and auto-hides itself the day after the festival ends, same self-expiring
// pattern as the Rakhi banner above.
const DIWALI_BANNER_STARTS = new Date("2026-10-18T00:00:00+05:30");
const DIWALI_BANNER_EXPIRES = new Date("2026-11-11T00:00:00+05:30");
const now = new Date();
const showDiwaliBanner = !showRakhiBanner && now >= DIWALI_BANNER_STARTS && now < DIWALI_BANNER_EXPIRES;

const Home = () => {
  const popularProducts = useMemo(() => expandProductsByColor(getPopularProducts()), []);
  // Three real products carry the hero, so it changes as the catalogue does.
  const heroPicks = useMemo(
    () => getPopularProducts().filter(p => p.inStock !== false && p.images?.length).slice(0, 3),
    []
  );
  // A mouse-only visitor had no way to reach the overflow on this rail: the
  // scrollbar is hidden, there are no arrows, and a plain wheel scrolls the
  // page. At 1000px–1280px that hid two to five categories outright. Arrows
  // appear only where there is a fine pointer and only on the side that has
  // somewhere to go.
  const railRef = useRef(null)
  const [railEdges, setRailEdges] = useState({ left: false, right: false })

  const measureRail = useCallback(() => {
    const el = railRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setRailEdges({ left: el.scrollLeft > 4, right: el.scrollLeft < max - 4 })
  }, [])

  useEffect(() => {
    const el = railRef.current
    if (!el) return undefined
    measureRail()
    el.addEventListener('scroll', measureRail, { passive: true })
    const ro = new ResizeObserver(measureRail)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', measureRail); ro.disconnect() }
  }, [measureRail])

  const nudgeRail = useCallback(dir => {
    const el = railRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }, [])

  // The rail is whatever carries a circleImage, whether that is a product
  // category or an occasion, ordered by circleOrder. Both are editable from
  // the admin portal's Circles tab, so nothing here is hardcoded.
  const circles = useMemo(() => {
    const fromCategories = getSortedCategories()
      .filter(c => c.circleImage)
      .map(c => ({ key: `cat:${c.id}`, to: `/category/${c.id}`, name: c.name, image: c.circleImage, circleOrder: c.circleOrder ?? 999 }));
    const fromOccasions = occasionCategories
      .filter(o => o.circleImage)
      .map(o => ({ key: `occ:${o.id}`, to: `/category/${o.slug}`, name: o.name, image: o.circleImage, circleOrder: o.circleOrder ?? 0 }));
    return [...fromOccasions, ...fromCategories].sort((a, b) => a.circleOrder - b.circleOrder);
  }, []);

  const openGiftFinder = useCallback(
    () => window.dispatchEvent(new Event('maqers:open-gift-finder')),
    []
  );
  const featuredGridRef = useRef(null);
  useMobileCenterSwap(featuredGridRef, '.feat-img-zone.has-second-img');

  // The manual touchmove handler that used to live here drove el.scrollLeft by
  // hand on every frame. It existed only because a global
  // `touch-action: pan-y !important` blocked native horizontal panning; with
  // that rule gone the browser scrolls this rail itself, which restores iOS
  // momentum/fling that the hand-rolled version could never reproduce.

  return (
    <div className="home">
      <SeoHead
        title="Curated Handcrafted Gifts from India"
        description="Discover unique handmade gifts from India's best independent artisans: jewellery, candles, home decor, skincare and more. Curated for every person, every occasion."
        url="/"
      />

      {/* The hero opens on real products rather than a flat colour slab. The
          seasonal Rakhi and Diwali variants swap in a photographic backdrop
          and hide the collage, since the photograph is already the image. */}
      <section
        className={`hero${showRakhiBanner ? ' hero--rakhi' : ''}${showDiwaliBanner ? ' hero--diwali' : ''}`}
      >
        {showDiwaliBanner && <DiwaliSparkles />}
        <div className="container hero-inner">
          <div className="hero-copy">
            {showRakhiBanner ? (
              <>
                <p className="hero-eyebrow">Rakshabandhan</p>
                <h1 className="hero-title">Something she<br />will actually keep.</h1>
                <p className="hero-lede">
                  Handmade rakhi gifts from independent Indian sellers, customisable,
                  and posted anywhere in the country.
                </p>
                <div className="hero-actions">
                  <Link to="/category/rakshabandhan" className="btn btn--primary">Shop rakhi gifts</Link>
                  <button className="btn btn--ghost" onClick={openGiftFinder} type="button">
                    Help me choose
                  </button>
                </div>
              </>
            ) : showDiwaliBanner ? (
              <>
                <p className="hero-eyebrow">Diwali</p>
                <h1 className="hero-title">Light up<br />someone&rsquo;s festival.</h1>
                <p className="hero-lede">
                  Handmade diyas, hampers and decor from independent Indian sellers,
                  posted anywhere in the country.
                </p>
                <div className="hero-actions">
                  <Link to="/products" className="btn btn--primary">Shop Diwali gifts</Link>
                  <button className="btn btn--ghost" onClick={openGiftFinder} type="button">
                    Help me choose
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="hero-title">Saw it on Instagram?<br />Buy it here.</h1>
                <p className="hero-lede">
                  Straight from independent Indian makers, each one personally
                  vetted, in a single place with a checkout that actually works.
                </p>
                <div className="hero-actions">
                  <Link to="/products" className="btn btn--primary">Shop all gifts</Link>
                  <button className="btn btn--ghost" onClick={openGiftFinder} type="button">
                    Help me choose
                  </button>
                </div>
                <p className="hero-note">Free delivery over &#8377;499, anywhere in India.</p>
              </>
            )}
          </div>

          {!showRakhiBanner && !showDiwaliBanner && (
            <div className="hero-collage" aria-hidden={heroPicks.length === 0}>
              {heroPicks.map((product, i) => (
                <Link
                  key={product.id}
                  to={`/product/${product.slug}`}
                  className={`hero-tile hero-tile--${i + 1}`}
                  aria-label={product.title}
                >
                  <ImageWithFallback
                    src={product.images[0]}
                    alt={product.title}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    priority={i === 0}
                    sizes="(max-width: 900px) 40vw, 300px"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <MarqueeBanner />

      {/* ── Scrollable category circles ── */}
      <div className="category-circles-strip">
        <div className="circles-wrapper">
          {railEdges.left && (
            <button type="button" className="circles-arrow circles-arrow--left"
              onClick={() => nudgeRail(-1)} aria-label="Previous categories">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          {railEdges.right && (
            <button type="button" className="circles-arrow circles-arrow--right"
              onClick={() => nudgeRail(1)} aria-label="More categories">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        <div className="category-circles-scroll" ref={railRef}>
          {circles.map((circle, i) => (
            <Link
              key={circle.key}
              to={circle.to}
              state={{ from: '/' }}
              className="category-circle-item category-circle-item--btn"
              style={{ textDecoration: 'none' }}
            >
              <div className="category-circle-img">
                <img
                  src={circle.image}
                  alt={circle.name}
                  width="82"
                  height="82"
                  loading={i < 5 ? 'eager' : 'lazy'}
                  decoding="async"
                  onError={e => { e.currentTarget.style.display = 'none' }}
                />
              </div>
              <span className="category-circle-label">{circle.name}</span>
            </Link>
          ))}
          </div>
        </div>
      </div>

      <section className="featured-section">
        <div className="container">
          <div className="featured-header">
            <div className="featured-header-left">
              <h2 className="featured-title">Founders&rsquo; picks</h2>
            </div>
            <Link to="/products" className="featured-view-all">See everything</Link>
          </div>
          <div className="featured-grid" ref={featuredGridRef}>
            {popularProducts.slice(0, 8).map((product, index) => (
              <FeaturedCard key={product._variantKey || product.id} product={product} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="trust-bar">
        <div className="container trust-bar-inner">
          {[
            {
              title: 'Hand-picked sellers',
              body: 'Every business vetted by us before it is listed',
              icon: <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
            },
            {
              title: 'Genuinely handmade',
              body: 'Real craft from real makers, never mass produced',
              icon: <><path d="M12 2l2.4 6.5L21 9.3l-5 4.3 1.5 6.4L12 16.8 6.5 20l1.5-6.4-5-4.3 6.6-.8z" /></>,
            },
            {
              title: 'A checkout that works',
              body: 'No DMs, no waiting three days for a reply',
              icon: <><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></>,
            },
            {
              title: 'Supporting small',
              body: 'Every order goes to an independent Indian business',
              icon: <><path d="M3 21h18" /><path d="M5 21V8l7-5 7 5v13" /><path d="M10 21v-6h4v6" /></>,
            },
          ].map(item => (
            <div className="trust-item" key={item.title}>
              <svg className="trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {item.icon}
              </svg>
              <div>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </div>
            </div>
          ))}
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

  const needsOptions = (product.meta?.colors?.length > 0) || (product.meta?.sizes?.length > 0);

  const handleAddToCart = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    if (needsOptions) {
      navigate(`/product/${product.slug}${productLinkQuery(product)}`);
      return;
    }
    addItem(product);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1400);
  }, [product, addItem, needsOptions, navigate]);

  const handleWishlist = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    toggleItem(product);
    setHeartPop(true);
    setTimeout(() => setHeartPop(false), 400);
  }, [product, toggleItem]);

  const handleCardClick = useCallback(() => {
    navigate(`/product/${product.slug}${productLinkQuery(product)}`);
  }, [product, navigate]);

  const secondImage = product._variantColor ? null : (product.images[1] || null);
  const imgZoneRef = useRef(null);

  return (
    <article
      className={`feat-card${index < 2 ? ' feat-card--no-anim' : ''}`}
      style={{ "--i": index % 12, ...(product.inStock === false ? { opacity: 0.45, filter: 'grayscale(80%)' } : {}) }}
      onClick={handleCardClick}
      onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
    >
      <div ref={imgZoneRef} className={`feat-img-zone${secondImage ? ' has-second-img' : ''}`}>
        <ImageWithFallback
          src={product.images[0]}
          alt={product.title}
          className="feat-img"
          loading={index < 2 ? "eager" : "lazy"}
          priority={index < 2}
          sizes="(max-width: 480px) calc(50vw - 16px), (max-width: 968px) calc(33vw - 12px), 240px"
        />
        {secondImage && (
          <picture>
            <source srcSet={secondImage.replace(/\.[^.]+$/, '.webp')} type="image/webp" />
            <img src={secondImage} alt="" className="feat-img-hover" aria-hidden="true" loading="lazy" />
          </picture>
        )}
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
        <p className="feat-price">
          {product.meta?.sizePrices && Object.keys(product.meta.sizePrices).length > 0 ? (
            `₹${product.price.toLocaleString("en-IN")} onwards`
          ) : product.meta?.originalPrice > product.price ? (
            <>
              <span className="feat-price-original">₹{product.meta.originalPrice.toLocaleString("en-IN")}</span>
              <span className="feat-price-current">₹{product.price.toLocaleString("en-IN")}</span>
            </>
          ) : (
            `₹${product.price.toLocaleString("en-IN")}`
          )}
        </p>
        <div className="feat-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className={`feat-add-btn${addedFeedback ? " added" : ""}`}
            onClick={product.inStock === false ? undefined : handleAddToCart}
            type="button"
            aria-label="Add to cart"
            disabled={product.inStock === false}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {product.inStock === false ? <span>Out of Stock</span> : addedFeedback ? <span>Added!</span> : needsOptions ? <span>Select Options</span> : <span>Add to Cart</span>}
          </button>
        </div>
      </div>
    </article>
  );
};

export default Home;