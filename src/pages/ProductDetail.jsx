import { useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProductById, getCategoryByIdOrSlug } from '../data/catalog'
import { getWhatsAppNumber } from '../data/contactInfo'
import ImageWithFallback from '../components/ImageWithFallback'
import './ProductDetail.css'

const ProductDetail = () => {
  const { id } = useParams()
  const product = getProductById(id)
  const [selectedImage, setSelectedImage] = useState(0)
  const [lensVisible, setLensVisible] = useState(false)
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 })
  const imageWrapRef = useRef(null)
  const imgRef = useRef(null)

  const whatsappNumber = getWhatsAppNumber()
  const handleContactUs = () => {
    const message = `Hello! I'm interested in Product ID: ${id} - ${product.title}. Could you please provide more information about availability, pricing, and delivery options?`
    //const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    const url = `https://wa.me/${contactInfo.whatsapp.number}?text=${encodeURIComponent(message)}`;
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

  return (
    <div className="product-detail">
      <div className="container">
        <Link to="/products" className="back-button">← Back to Products</Link>

        <div className="product-detail-content">
          {/* Left 50%: Sliding image + zoom lens only */}
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
                  <button type="button" className="slider-btn slider-prev" onClick={goPrev} aria-label="Previous image">
                    ‹
                  </button>
                  <button type="button" className="slider-btn slider-next" onClick={goNext} aria-label="Next image">
                    ›
                  </button>
                </>
              )}
              {/* Zoom lens: visible on hover (desktop), shows 2x magnified area */}
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

          {/* Right 50%: Content only, normal/responsive */}
          <div className="product-info-section">
            {categoryName && <span className="product-category-badge">{categoryName}</span>}
            {product.popular && <span className="popular-tag">Popular</span>}
            <h1 className="product-detail-title">{product.title}</h1>
            <p className="product-detail-id">Product ID: {product.id}</p>
            <p className="product-detail-description">{product.description}</p>

            <div className="price-section">
              <span className="price-label">Price:</span>
              <span className="product-detail-price">₹{product.price}</span>
              <p className="delivery-info">Delivery: 7-14 business days</p>
            </div>

            <div className="product-actions">
              <button type="button" onClick={handleContactUs} className="contact-us-button">
                Contact Us via WhatsApp
              </button>
              <p className="inquiry-text">Click to inquire about this product.</p>
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
        </div>
      </div>
    </div>
  )
}

export default ProductDetail