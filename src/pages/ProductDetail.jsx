import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { getProductById, getProductBySlug, getCategoryByIdOrSlug, getAllProducts } from '../data/catalog'
import { getWhatsAppNumber } from '../data/contactInfo'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import ImageWithFallback from '../components/ImageWithFallback'
import { FeaturedCard } from './Home'
import SeoHead from '../components/SeoHead'
import './ProductDetail.css'
import './Home.css'

const ProductDetail = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
    } else {
      // No history state — go to the product's own category
      navigate(product ? `/category/${product.categoryId}` : '/products');
    }
  };

  // Support both slug-based URLs (/product/customised-pouch) and
  // old numeric-id URLs (/product/190) so existing shares don't 404
  const product = getProductBySlug(slug) || getProductById(slug)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const [lensVisible, setLensVisible] = useState(false)
  const [selectedPersonalisation, setSelectedPersonalisation] = useState([])
  const [orderNote, setOrderNote] = useState("")
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 })
  const imageWrapRef = useRef(null)
  const imgRef = useRef(null)

  const whatsappNumber = getWhatsAppNumber()
  const { addItem } = useCart()
  const { toggleItem, isWishlisted } = useWishlist()
  const wishlisted = isWishlisted(product?.id)

  // ── Delivery timeline ─────────────────────────────────────────────────────
  const deliveryTimeline = useMemo(() => {
    const today = new Date()
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const fmt = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]}`
    const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }

    // Parse delivery_time like "3-4 days", "7 days", etc. Default 3-4 making + 3-4 delivery
    const raw = product?.meta?.delivery_time || ''
    const nums = raw.match(/\d+/g)?.map(Number) || []
    const makingMin = nums[0] || 3
    const makingMax = nums[1] || makingMin + 1

    const dispatchMin = addDays(today, makingMin)
    const dispatchMax = addDays(today, makingMax)
    const deliveryMin = addDays(dispatchMin, 3)
    const deliveryMax = addDays(dispatchMax, 4)

    const dispatchStr = dispatchMin.getDate() === dispatchMax.getDate() && dispatchMin.getMonth() === dispatchMax.getMonth()
      ? fmt(dispatchMin)
      : `${fmt(dispatchMin)} – ${fmt(dispatchMax)}`
    const deliveryStr = `${fmt(deliveryMin)} – ${fmt(deliveryMax)}`

    return { orderDate: fmt(today), dispatchStr, deliveryStr }
  }, [product?.meta?.delivery_time])

  // ── Track recently viewed ──────────────────────────────────────────────────
  const [recentlyViewed, setRecentlyViewed] = useState([])
  useEffect(() => {
    if (!product) return
    const KEY = 'maqers_recently_viewed'
    const stored = JSON.parse(localStorage.getItem(KEY) || '[]')
    const filtered = stored.filter(id => id !== product.id).slice(0, 7)
    localStorage.setItem(KEY, JSON.stringify([product.id, ...filtered]))
    const all = getAllProducts()
    const recent = filtered.map(id => all.find(p => p.id === id)).filter(Boolean).slice(0, 6)
    setRecentlyViewed(recent)
  }, [product?.id])

  const handleAddToCart = () => {
    addItem(product, selectedColor, selectedSize, selectedPersonalisation, orderNote)
  }
  const handleContactUs = () => {
    let message = `Hello! I want to buy ${product.title} — https://maqers.in/product/${product.slug}`
    if (selectedColor) message += ` Colour: ${selectedColor}.`
    if (selectedSize) message += ` Size: ${selectedSize}.`
    if (selectedPersonalisation.length > 0) message += ` Personalisation: ${selectedPersonalisation.join(', ')}.`
    if (orderNote.trim()) message += ` Note: ${orderNote.trim()}.`
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank')
  }

  const images = product?.images || []
  const hasMultiple = images.length > 1
  const goPrev = useCallback(() => setSelectedImage((i) => (i <= 0 ? images.length - 1 : i - 1)), [images.length])
  const goNext = useCallback(() => setSelectedImage((i) => (i >= images.length - 1 ? 0 : i + 1)), [images.length])

  const touchStartX = useRef(null)
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX
  }, [])
  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null || !hasMultiple) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) dx < 0 ? goNext() : goPrev()
    touchStartX.current = null
  }, [hasMultiple, goNext, goPrev])

  const LENS_SIZE = 120
  const ZOOM = 2
  const handleMouseMove = useCallback(
    (e) => {
      if (!imageWrapRef.current || !images[selectedImage]) return
      const rect = imageWrapRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        setLensVisible(true)
        const bgX = LENS_SIZE / 2 - x * ZOOM
        const bgY = LENS_SIZE / 2 - y * ZOOM
        setLensPos({ x, y, bgX, bgY, w: rect.width, h: rect.height })
      } else {
        setLensVisible(false)
      }
    },
    [selectedImage, images]
  )
  const handleMouseLeave = useCallback(() => setLensVisible(false), [])

  if (!product) {
    return (
      <div className="product-not-found">
        <div className="container">
          <h2>Product not found</h2>
          <p>The product you're looking for doesn't exist or has been removed.</p>
          <div className="product-not-found-actions">
            <Link to="/products" className="back-link">Browse All Products</Link>
            <Link to="/" className="back-link secondary">Back to Home</Link>
          </div>
        </div>
      </div>
    )
  }

  const currentImage = images[selectedImage]
  const categoryName = product.category || (product.categoryId ? getCategoryByIdOrSlug(product.categoryId)?.name : '') || ''

  // ── JSON-LD Product schema ─────────────────────────────────────────────────
  const BASE_URL = 'https://maqers.in'
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: images.map(img => img.startsWith('http') ? img : `${BASE_URL}${img}`),
    sku: String(product.id),
    brand: {
      '@type': 'Brand',
      name: 'Maqers',
    },
    ...(categoryName && {
      category: categoryName,
    }),
    ...(product.tags?.length > 0 && {
      keywords: product.tags.join(', '),
    }),
    offers: {
      '@type': 'Offer',
      url: `${BASE_URL}/product/${product.slug}`,
      priceCurrency: 'INR',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      availability: product.inStock !== false
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'Maqers',
        url: BASE_URL,
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: 0,
          currency: 'INR',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 7,
            maxValue: 14,
            unitCode: 'DAY',
          },
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'IN',
        },
      },
    },
  }

  // ── More from this maker logic ─────────────────────────────────────────────
  const getMoreFromMaker = () => {
    const allProds = getAllProducts().filter(p => p.id !== product.id && p.inStock)
    const sellerCode = product.meta?.sellerCode
    if (sellerCode) {
      const fromSeller = allProds.filter(p => p.meta?.sellerCode === sellerCode)
      if (fromSeller.length > 0) return { products: fromSeller, sellerCode }
    }
    return { products: allProds.filter(p => p.categoryId === product.categoryId).slice(0, 6), sellerCode: null }
  }
  const { products: moreProducts, sellerCode: makerCode } = getMoreFromMaker()

  return (
    <div className="product-detail">
      <SeoHead
        title={product.title}
        description={product.description}
        image={images[0] || undefined}
        url={`/product/${product.slug}`}
        type="product"
        price={product.price}
        jsonLd={productSchema}
      />
      <div className="container">
        <button onClick={handleBack} className="back-button">← Back</button>

        <div className="product-detail-content">
          {/* Left: Image slider */}
          <div className="product-images-section">
            {hasMultiple && (
              <div className="thumbnail-images">
                {images.map((src, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                    aria-label={`View image ${index + 1}`}
                  >
                    <ImageWithFallback src={src} alt={`${product.title} ${index + 1}`} loading={index < 4 ? 'eager' : 'lazy'} />
                  </button>
                ))}
              </div>
            )}
            <div
              ref={imageWrapRef}
              className="main-image-wrap"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="main-image-container">
                <ImageWithFallback
                  ref={imgRef}
                  src={currentImage}
                  alt={product.title}
                  className="main-image"
                  priority
                  loading="eager"
                />
              </div>
              {hasMultiple && (
                <>
                  <button type="button" className="slider-btn slider-prev" onClick={goPrev} aria-label="Previous image">‹</button>
                  <button type="button" className="slider-btn slider-next" onClick={goNext} aria-label="Next image">›</button>
                </>
              )}
              {lensVisible && currentImage && lensPos.w != null && (
                <div
                  className="zoom-lens"
                  style={{
                    left: lensPos.x,
                    top: lensPos.y,
                    backgroundImage: `url(${currentImage})`,
                    backgroundSize: `${lensPos.w * ZOOM}px ${lensPos.h * ZOOM}px`,
                    backgroundPosition: `${lensPos.bgX ?? 0}px ${lensPos.bgY ?? 0}px`,
                  }}
                  aria-hidden
                />
              )}
            </div>

          </div>

          {/* Right: Product info */}
          <div className="product-info-section">
            {categoryName && <span className="product-category-badge">{categoryName}</span>}

            {/* Also in */}
            {product.meta?.secondaryCategories && product.meta.secondaryCategories.length > 0 && (
              <p className="product-also-in">
                Also in:{" "}
                {product.meta.secondaryCategories.map((catId, i) => {
                  const cat = getCategoryByIdOrSlug(catId)
                  return cat ? <span key={i} className="product-also-in-tag">{cat.name}</span> : null
                })}
              </p>
            )}

            {product.popular && <span className="popular-tag">Popular</span>}
            <h1 className="product-detail-title">{product.title}</h1>
            <p className="product-detail-description" dangerouslySetInnerHTML={{ __html: product.description.split('\\n').join('<br/>') }} />

            <div className="price-section">
              <span className="price-label">Price:</span>
              {product.meta?.sizePrices && Object.keys(product.meta.sizePrices).length > 0 ? (
                <span className="product-detail-price">
                  {selectedSize && product.meta.sizePrices[selectedSize]
                    ? `₹${Number(product.meta.sizePrices[selectedSize]).toLocaleString("en-IN")}`
                    : `₹${product.price.toLocaleString("en-IN")} onwards`
                  }
                </span>
              ) : (
                <span className="product-detail-price">₹{product.price.toLocaleString("en-IN")}</span>
              )}
            </div>

            {/* MOQ */}
            {product.meta?.moq > 0 && (
              <p className="product-moq">Minimum Order Quantity: <strong>{product.meta.moq} units</strong></p>
            )}

            {/* Colour dropdown — switches image */}
            {product.meta?.colors && product.meta.colors.length > 0 && (
              <div className="product-colors">
                <label className="colors-label" htmlFor="color-select">Select Colour:</label>
                <select id="color-select" className="colors-select" value={selectedColor}
                  onChange={e => {
                    setSelectedColor(e.target.value);
                    const found = product.meta.colors.find(c =>
                      (typeof c === "object" ? c.name : c) === e.target.value
                    );
                    if (found && typeof found === "object" && found.imageIndex != null) {
                      setSelectedImage(found.imageIndex);
                    }
                  }}>
                  <option value="">— Choose a colour —</option>
                  {product.meta.colors.map((c, i) => {
                    const name = typeof c === "object" ? c.name : c;
                    return <option key={i} value={name}>{name}</option>;
                  })}
                </select>
              </div>
            )}

            {/* Size dropdown — shows per-size price if available */}
            {product.meta?.sizes && product.meta.sizes.length > 0 && (
              <div className="product-colors">
                <label className="colors-label" htmlFor="size-select">Select Size:</label>
                <select id="size-select" className="colors-select" value={selectedSize}
                  onChange={e => setSelectedSize(e.target.value)}>
                  <option value="">— Choose a size —</option>
                  {product.meta.sizes.map((s, i) => {
                    const sizePrice = product.meta.sizePrices?.[s];
                    return (
                      <option key={i} value={s}>
                        {s}{sizePrice ? ` — ₹${Number(sizePrice).toLocaleString("en-IN")}` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* ── Personalisation options ── */}
            {product.meta?.personalisation_options?.filter(o => o.trim()).length > 0 && (
              <div className="personalisation-section">
                <label className="personalisation-title">Add Personalisation</label>
                <div className="personalisation-options">
                  {product.meta.personalisation_options.filter(o => o.trim()).map((opt, i) => {
                    const price = product.meta.personalisation_prices?.[i]
                    return (
                      <label key={i} className="personalisation-option">
                        <input
                          type="checkbox"
                          checked={selectedPersonalisation.includes(opt)}
                          onChange={e => setSelectedPersonalisation(prev =>
                            e.target.checked ? [...prev, opt] : prev.filter(o => o !== opt)
                          )}
                        />
                        <span>{opt}</span>
                        {price > 0 && <span className="personalisation-option-price">+₹{Number(price).toLocaleString('en-IN')}</span>}
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Order note ── */}
            <div className="order-note-section">
              <label className="order-note-label">Add a note for us <span className="order-note-hint">(optional)</span></label>
              <textarea
                className="order-note-input"
                placeholder="Any special instructions, customisation details, or requests..."
                value={orderNote}
                onChange={e => setOrderNote(e.target.value)}
                rows={2}
              />
            </div>

            <div className="product-actions">
              <div className="product-action-buttons">
                {product.inStock === false ? (
                  <>
                    <button type="button" className="add-to-cart-button out-of-stock-button" disabled>
                      Out of Stock
                    </button>
                    <p className="out-of-stock-note">This item is currently unavailable. Check back soon.</p>
                  </>
                ) : (
                  <button type="button" onClick={handleAddToCart} className="add-to-cart-button">
                    Add to Cart
                  </button>
                )}
                <button type="button" onClick={() => toggleItem(product)} className={`add-to-wishlist-button ${wishlisted ? 'wishlisted' : ''}`}>
                  {wishlisted ? '♥ Wishlisted' : '♡ Wishlist'}
                </button>
              </div>
            </div>

            {/* Delivery timeline — below actions */}
            <div className="delivery-timeline">
              <div className="dtl-step">
                <div className="dtl-icon dtl-icon--done">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <div className="dtl-label">{deliveryTimeline.orderDate}</div>
                <div className="dtl-sublabel">Order Placed</div>
              </div>
              <div className="dtl-line"><span className="dtl-line-label">Crafting</span></div>
              <div className="dtl-step">
                <div className="dtl-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                </div>
                <div className="dtl-label">{deliveryTimeline.dispatchStr}</div>
                <div className="dtl-sublabel">Dispatched</div>
              </div>
              <div className="dtl-line"><span className="dtl-line-label">Shipping</span></div>
              <div className="dtl-step">
                <div className="dtl-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
                <div className="dtl-label">{deliveryTimeline.deliveryStr}</div>
                <div className="dtl-sublabel">Delivered</div>
              </div>
            </div>

            <div className="product-features">
              <h3>Product Features</h3>
              <ul>
                <li>Premium quality materials</li>
                <li>Handcrafted with attention to detail</li>
                <li>Elegant royal design</li>
                <li>Perfect for gifting</li>
                <li>Authentic Indian home businesses & small businesses</li>
              </ul>
            </div>
          </div>

          {/* ── Customer Reviews — only shown if reviews exist ── */}
          {product.meta?.reviews && product.meta.reviews.length > 0 && (
          <div className="reviews-section">
            <h3 className="reviews-title">Customer Reviews</h3>
                <div className="reviews-summary">
                  <span className="reviews-avg">
                    {(product.meta.reviews.reduce((s, r) => s + r.rating, 0) / product.meta.reviews.length).toFixed(1)}
                  </span>
                  <div className="reviews-stars-big">
                    {[1,2,3,4,5].map(n => (
                      <svg key={n} viewBox="0 0 24 24" width="20" height="20"
                        fill={n <= Math.round(product.meta.reviews.reduce((s,r)=>s+r.rating,0)/product.meta.reviews.length) ? "var(--primary-color)" : "none"}
                        stroke="var(--primary-color)" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    ))}
                  </div>
                  <span className="reviews-count">({product.meta.reviews.length} review{product.meta.reviews.length !== 1 ? "s" : ""})</span>
                </div>
                <div className="reviews-list">
                  {product.meta.reviews.map((r, i) => (
                    <div key={i} className="review-card">
                      <div className="review-card-top">
                        <div className="review-stars">
                          {[1,2,3,4,5].map(n => (
                            <svg key={n} viewBox="0 0 24 24" width="14" height="14"
                              fill={n <= r.rating ? "var(--primary-color)" : "none"}
                              stroke="var(--primary-color)" strokeWidth="2">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                          ))}
                        </div>
                        <span className="review-name">{r.name}</span>
                        {r.date && <span className="review-date">{r.date}</span>}
                      </div>
                      {r.text && <p className="review-text">{r.text}</p>}
                    </div>
                  ))}
                </div>
          </div>
          )}

          {/* More from this maker — compact FeaturedCard grid */}
          {moreProducts.length > 0 && (
            <div className="more-from-maker">
              <h3 className="more-from-maker-title">More from this maker</h3>
              <div className="more-from-maker-grid">
                {moreProducts.slice(0, 4).map((p, i) => (
                  <FeaturedCard key={p.id} product={p} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Recently Viewed ── */}
      {recentlyViewed.length > 0 && (
        <div className="recently-viewed-section">
          <div className="container">
            <h3 className="recently-viewed-title">Recently viewed</h3>
            <div className="recently-viewed-grid">
              {recentlyViewed.map(p => (
                <a key={p.id} href={`/product/${p.slug}`} className="rv-card">
                  <div className="rv-img">
                    {p.images[0] && (
                      <picture>
                        {p.images[0].startsWith('/images/') && <source srcSet={p.images[0].replace(/\.[^.]+$/, '.webp')} type="image/webp" />}
                        <img src={p.images[0]} alt={p.title} loading="lazy" />
                      </picture>
                    )}
                  </div>
                  <p className="rv-title">{p.title}</p>
                  <p className="rv-price">₹{p.price.toLocaleString('en-IN')}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductDetail