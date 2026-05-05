import { useState, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { getProductById, getCategoryByIdOrSlug, getAllProducts } from '../data/catalog'
import { getWhatsAppNumber } from '../data/contactInfo'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import ImageWithFallback from '../components/ImageWithFallback'
import './ProductDetail.css'

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/products");
    }
  };

  const product = getProductById(id)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const [lensVisible, setLensVisible] = useState(false)
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 })
  const imageWrapRef = useRef(null)
  const imgRef = useRef(null)

  const whatsappNumber = getWhatsAppNumber()
  const { addItem } = useCart()
  const { toggleItem, isWishlisted } = useWishlist()
  const wishlisted = isWishlisted(product?.id)

  const handleAddToCart = () => {
    addItem(product, selectedColor, selectedSize)
  }
  const handleContactUs = () => {
    let message = `Hello! I want to buy Product ID: ${id} - ${product.title}.`
    if (selectedColor) message += ` Colour: ${selectedColor}.`
    if (selectedSize) message += ` Size: ${selectedSize}.`
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank')
  }

  const images = product?.images || []
  const hasMultiple = images.length > 1
  const goPrev = () => setSelectedImage((i) => (i <= 0 ? images.length - 1 : i - 1))
  const goNext = () => setSelectedImage((i) => (i >= images.length - 1 ? 0 : i + 1))

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
      <div className="container">
        <button onClick={handleBack} className="back-button">← Back</button>

        <div className="product-detail-content">
          {/* Left: Image slider */}
          <div className="product-images-section">
            <div
              ref={imageWrapRef}
              className="main-image-wrap"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
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
            <p className="product-detail-id">Product ID: {product.id}</p>
            <p className="product-detail-description">{product.description}</p>

            <div className="price-section">
              <span className="price-label">Price:</span>
              <span className="product-detail-price">₹{product.price}</span>
              <p className="delivery-info">Delivery: 7-14 business days</p>
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

            {/* Size dropdown */}
            {product.meta?.sizes && product.meta.sizes.length > 0 && (
              <div className="product-colors">
                <label className="colors-label" htmlFor="size-select">Select Size:</label>
                <select id="size-select" className="colors-select" value={selectedSize}
                  onChange={e => setSelectedSize(e.target.value)}>
                  <option value="">— Choose a size —</option>
                  {product.meta.sizes.map((s, i) => (
                    <option key={i} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="product-actions">
              <div className="product-action-buttons">
                <button type="button" onClick={handleAddToCart} className="add-to-cart-button">
                  Add to Cart
                </button>
                <button type="button" onClick={() => toggleItem(product)} className={`add-to-wishlist-button ${wishlisted ? 'wishlisted' : ''}`}>
                  {wishlisted ? '♥ Wishlisted' : '♡ Wishlist'}
                </button>
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

          {/* More from this maker — spans full width */}
          {moreProducts.length > 0 && (
            <div className="more-from-maker">
              <h3 className="more-from-maker-title">
                {makerCode ? (
                  <a href={`/maker/${makerCode}`} className="more-from-maker-link">
                    More from this maker →
                  </a>
                ) : "You'd also love →"}
              </h3>
              <div className="more-from-maker-grid">
                {moreProducts.map(p => (
                  <a key={p.id} href={`/product/${p.id}`} className="more-from-maker-card">
                    <div className="more-from-maker-img">
                      {p.images[0] && <img src={p.images[0]} alt={p.title} loading="lazy" />}
                    </div>
                    <p className="more-from-maker-name">{p.title}</p>
                    <p className="more-from-maker-price">₹{p.price}</p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductDetail