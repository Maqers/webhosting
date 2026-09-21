import { useMemo, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPopularProducts, getSortedCategories } from "../data/catalog";
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
  const openGiftFinder = useCallback(
    () => window.dispatchEvent(new Event('maqers:open-gift-finder')),
    []
  );
  const featuredGridRef = useRef(null);
  useMobileCenterSwap(featuredGridRef, '.feat-img-zone.has-second-img');

// Thumbnail images for category circles (168px webp, displayed at 82-84px @2x retina)
const HOME_CAT_IMAGES = {
  'Handbags':             '/images/thumb-photo-2026-05-12-09-25-50.webp',
  'Handmade-Accessories': '/images/thumb-remove-the-white-text-box-with-kl-53-from-the-imag.webp',
  'Candles':              '/images/thumb-8.webp',
  'Florals':              '/images/thumb-remove-the-background-make-it-transparent.webp',
  'Wedding-Gifts':        '/images/thumb-whatsapp-image-2026-04-17-at-15.22.22.webp',
  'Kids-Accessories':     '/images/thumb-dsc_8211.webp',
  'Home-decor':           '/images/thumb-28.webp',
  'Handmade-Soaps':       '/images/thumb-56.webp',
  'Customised-Hampers':   '/images/thumb-48.webp',
  'Cosmetics':            '/images/thumb-whatsapp-image-2026-05-01-at-2.16.13-pm-(1).webp',
  'resin-products':       '/images/thumb-29.webp',
  'Charm-accessories':    '/images/thumb-enchanted_charm_watch_2.webp',
  'Frames&Paintings':     '/images/thumb-17.webp',
}
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
                  Hundreds of independent Indian makers, each one personally vetted,
                  in a single place with a checkout that actually works.
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
        <div className="category-circles-scroll">
          {getSortedCategories()
            .filter(c => c.id !== 'Oxidised-jewellery')
            .map((cat, catIndex) => {
              const img = HOME_CAT_IMAGES[cat.id] || ''
              // Only the first 5 circles are typically above the fold on mobile
              const isAboveFold = catIndex < 5
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
                      ? <img
                          src={img}
                          alt={cat.name}
                          width="82"
                          height="82"
                          loading={isAboveFold ? 'eager' : 'lazy'}
                          fetchPriority="low"
                          decoding="async"
                          onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextSibling && (e.currentTarget.nextSibling.style.display='flex') }}
                        />
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
      </div>

      <section className="featured-section">
        <div className="container">
          <div className="featured-header">
            <div className="featured-header-left">
              <h2 className="featured-title">Most loved right now</h2>
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