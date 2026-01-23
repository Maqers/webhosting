import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProductById, getCategoryByIdOrSlug } from '../data/catalog'
import { getWhatsAppNumber } from '../data/contactInfo'
import ImageWithFallback from '../components/ImageWithFallback'
import ZoomControls from '../components/ZoomControls'
import {
  normalizeZoom,
  calculatePanBounds,
  clampPanPosition,
  calculateWheelZoom,
  calculatePinchZoom,
  ZOOM_CONFIG
} from '../utils/zoom'
import './ProductDetail.css'

const ProductDetail = () => {
  const { id } = useParams()
  const product = getProductById(id)
  const [selectedImage, setSelectedImage] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(ZOOM_CONFIG.DEFAULT)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const imageContainerRef = useRef(null)
  const imageRef = useRef(null)

  const whatsappNumber = getWhatsAppNumber() // Get WhatsApp number from contactInfo
  const handleContactUs = () => {
    const message = `Hello! I'm interested in Product ID: ${id} - ${product.title}. Could you please provide more information about availability, pricing, and delivery options?`
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  /**
   * Handle zoom change from controls
   */
  const handleZoomChange = (newZoom) => {
    const normalizedZoom = normalizeZoom(newZoom)
    setZoomLevel(normalizedZoom)
    
    // Reset position if zooming to default or below
    if (normalizedZoom <= ZOOM_CONFIG.DEFAULT) {
      setImagePosition({ x: 0, y: 0 })
    } else {
      // Recalculate pan bounds when zooming in
      const container = imageContainerRef.current
      const image = imageRef.current
      if (container && image) {
        const rect = container.getBoundingClientRect()
        const bounds = calculatePanBounds(
          normalizedZoom,
          rect.width,
          rect.height,
          image.naturalWidth || rect.width,
          image.naturalHeight || rect.height
        )
        setImagePosition(prev => clampPanPosition(prev, bounds))
      }
    }
  }

  /**
   * Handle reset zoom
   */
  const handleResetZoom = () => {
    setZoomLevel(ZOOM_CONFIG.DEFAULT)
    setImagePosition({ x: 0, y: 0 })
  }

  /**
   * Handle wheel zoom
   */
  const handleWheel = (e) => {
    if (zoomLevel > ZOOM_CONFIG.DEFAULT || e.deltaY < 0) {
      e.preventDefault()
      const newZoom = calculateWheelZoom(zoomLevel, e.deltaY)
      handleZoomChange(newZoom)
    }
  }

  /**
   * Drag to pan when zoomed - Enhanced for better panning
   */
  const handleMouseDown = (e) => {
    // Only allow dragging when zoomed in
    if (zoomLevel > ZOOM_CONFIG.DEFAULT) {
      e.preventDefault()
      setIsDragging(true)
      // Calculate drag start relative to current image position
      const container = imageContainerRef.current
      if (container) {
        const rect = container.getBoundingClientRect()
        setDragStart({ 
          x: e.clientX - imagePosition.x, 
          y: e.clientY - imagePosition.y 
        })
    }
  }
  }

  // Use ref for dragStart to avoid stale closures
  const dragStartRef = useRef(dragStart)
  useEffect(() => {
    dragStartRef.current = dragStart
  }, [dragStart])

  const handleMouseMove = useCallback((e) => {
    if (isDragging && zoomLevel > ZOOM_CONFIG.DEFAULT) {
      e.preventDefault()
      const container = imageContainerRef.current
      const image = imageRef.current
      if (container && image) {
        const rect = container.getBoundingClientRect()
        const bounds = calculatePanBounds(
          zoomLevel,
          rect.width,
          rect.height,
          image.naturalWidth || rect.width,
          image.naturalHeight || rect.height
        )
        
        // Calculate new position based on mouse movement using ref
        const newX = e.clientX - dragStartRef.current.x
        const newY = e.clientY - dragStartRef.current.y
        
        // Clamp to bounds and update position
        const newPosition = clampPanPosition({ x: newX, y: newY }, bounds)
        setImagePosition(newPosition)
      }
    }
  }, [isDragging, zoomLevel])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Touch support for pinch zoom and pan - Enhanced for mobile
  const touchStartRef = useRef({ 
    distance: 0, 
    center: { x: 0, y: 0 },
    initialTouch: { x: 0, y: 0 },
    initialPosition: { x: 0, y: 0 }
  })
  
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Pinch zoom - two fingers
      e.preventDefault()
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      const centerX = (touch1.clientX + touch2.clientX) / 2
      const centerY = (touch1.clientY + touch2.clientY) / 2
      touchStartRef.current = { 
        ...touchStartRef.current,
        distance, 
        center: { x: centerX, y: centerY }
      }
      setIsDragging(false) // Disable pan when pinching
    } else if (e.touches.length === 1) {
      // Single touch - pan when zoomed
      const touch = e.touches[0]
      if (zoomLevel > ZOOM_CONFIG.DEFAULT) {
        e.preventDefault()
      setIsDragging(true)
        touchStartRef.current = {
          ...touchStartRef.current,
          initialTouch: { x: touch.clientX, y: touch.clientY },
          initialPosition: { ...imagePosition }
        }
        setDragStart({ 
          x: touch.clientX - imagePosition.x, 
          y: touch.clientY - imagePosition.y 
        })
      }
    }
  }

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      e.preventDefault()
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      if (touchStartRef.current.distance > 0) {
        const newZoom = calculatePinchZoom(
          zoomLevel,
          touchStartRef.current.distance,
          distance
        )
        handleZoomChange(newZoom)
      }
      touchStartRef.current.distance = distance
    } else if (e.touches.length === 1 && zoomLevel > ZOOM_CONFIG.DEFAULT) {
      // Single touch pan - Enhanced for mobile
      e.preventDefault()
      const touch = e.touches[0]
      if (isDragging) {
        const container = imageContainerRef.current
        const image = imageRef.current
        if (container && image) {
          const rect = container.getBoundingClientRect()
          const bounds = calculatePanBounds(
            zoomLevel,
            rect.width,
            rect.height,
            image.naturalWidth || rect.width,
            image.naturalHeight || rect.height
          )
          
          // Calculate position based on touch movement
          const deltaX = touch.clientX - touchStartRef.current.initialTouch.x
          const deltaY = touch.clientY - touchStartRef.current.initialTouch.y
          
          const newX = touchStartRef.current.initialPosition.x + deltaX
          const newY = touchStartRef.current.initialPosition.y + deltaY
          
          const newPosition = clampPanPosition({ x: newX, y: newY }, bounds)
          setImagePosition(newPosition)
        }
      }
    }
  }

  const handleTouchEnd = (e) => {
    if (e.touches.length === 0) {
      // All touches ended
    setIsDragging(false)
      touchStartRef.current = { 
        distance: 0, 
        center: { x: 0, y: 0 },
        initialTouch: { x: 0, y: 0 },
        initialPosition: { x: 0, y: 0 }
      }
    } else if (e.touches.length === 1) {
      // One finger lifted, continue with remaining touch
      const touch = e.touches[0]
      if (zoomLevel > ZOOM_CONFIG.DEFAULT) {
        setIsDragging(true)
        touchStartRef.current = {
          ...touchStartRef.current,
          initialTouch: { x: touch.clientX, y: touch.clientY },
          initialPosition: { ...imagePosition }
        }
        setDragStart({ 
          x: touch.clientX - imagePosition.x, 
          y: touch.clientY - imagePosition.y 
        })
      }
    }
  }

  // Mouse drag handlers - Enhanced with proper dependencies
  useEffect(() => {
    if (isDragging) {
      const handleMove = (e) => handleMouseMove(e)
      const handleUp = () => handleMouseUp()
      
      document.addEventListener('mousemove', handleMove, { passive: false })
      document.addEventListener('mouseup', handleUp)
      document.addEventListener('mouseleave', handleUp) // Handle mouse leaving window
      
      return () => {
        document.removeEventListener('mousemove', handleMove)
        document.removeEventListener('mouseup', handleUp)
        document.removeEventListener('mouseleave', handleUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Add touch event listeners with passive: false for proper mobile panning
  useEffect(() => {
    const container = imageContainerRef.current
    if (container) {
      // Use named functions to ensure proper cleanup
      const touchStartHandler = (e) => handleTouchStart(e)
      const touchMoveHandler = (e) => handleTouchMove(e)
      const touchEndHandler = (e) => handleTouchEnd(e)
      
      container.addEventListener('touchstart', touchStartHandler, { passive: false })
      container.addEventListener('touchmove', touchMoveHandler, { passive: false })
      container.addEventListener('touchend', touchEndHandler, { passive: false })
      container.addEventListener('touchcancel', touchEndHandler, { passive: false })
      
      return () => {
        container.removeEventListener('touchstart', touchStartHandler)
        container.removeEventListener('touchmove', touchMoveHandler)
        container.removeEventListener('touchend', touchEndHandler)
        container.removeEventListener('touchcancel', touchEndHandler)
      }
    }
  }, [zoomLevel, imagePosition, isDragging])

  // Reset zoom and position when product changes
  useEffect(() => {
    if (product) {
      setSelectedImage(0)
      setZoomLevel(ZOOM_CONFIG.DEFAULT)
      setImagePosition({ x: 0, y: 0 })
      setIsDragging(false)
    }
  }, [id, product])

  // Preload next/previous images for smoother experience
  useEffect(() => {
    if (!product || !product.images || product.images.length === 0) return

    const preloadImages = () => {
      const imagesToPreload = []
      
      // Preload current image
      if (product.images[selectedImage]) {
        imagesToPreload.push(product.images[selectedImage])
      }
      
      // Preload next image
      if (product.images[selectedImage + 1]) {
        imagesToPreload.push(product.images[selectedImage + 1])
      }
      
      // Preload previous image
      if (product.images[selectedImage - 1]) {
        imagesToPreload.push(product.images[selectedImage - 1])
      }

      imagesToPreload.forEach((src) => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'image'
        link.href = src
        document.head.appendChild(link)
      })
    }

    preloadImages()
  }, [product, selectedImage])

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

  return (
    <div className="product-detail">
      <div className="container">
        <Link to="/" className="back-button">← Back to Products</Link>
        
        <div className="product-detail-content">
          <div className="product-images-section" data-animate="fade-up">
            <div className="image-zoom-wrapper">
              <div 
                className="main-image-container"
                ref={imageContainerRef}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                style={{ cursor: zoomLevel > ZOOM_CONFIG.DEFAULT ? (isDragging ? 'grabbing' : 'grab') : 'default', touchAction: 'none' }}
              >
                <ImageWithFallback
                  ref={imageRef}
                  src={product.images[selectedImage]} 
                  alt={product.title}
                  className="main-image"
                  priority={true}
                  loading="eager"
                  style={{
                    transform: `scale(${zoomLevel}) translate(${imagePosition.x / zoomLevel}px, ${imagePosition.y / zoomLevel}px)`,
                    transition: isDragging ? 'none' : 'transform 0.3s ease-out'
                  }}
                />
                
                {zoomLevel !== ZOOM_CONFIG.DEFAULT && (
                  <div className="zoom-hint">
                    <span>Drag to pan • Scroll to zoom • </span>
                    <button onClick={handleResetZoom} className="reset-zoom-btn">Reset</button>
                  </div>
                )}
              </div>
              
              {/* Enhanced Zoom Controls */}
              <ZoomControls
                zoomLevel={zoomLevel}
                onZoomChange={handleZoomChange}
                onReset={handleResetZoom}
                showSlider={true}
                showPresets={false}
              />
            </div>
            
            <div className="thumbnail-images">
              {product.images.map((image, index) => (
                <div
                  key={index}
                  className={`thumbnail ${selectedImage === index ? 'active' : ''} touch-feedback`}
                  onClick={() => setSelectedImage(index)}
                  onMouseEnter={() => {
                    // Preload image on hover for desktop
                    if (index !== selectedImage) {
                      const link = document.createElement('link')
                      link.rel = 'preload'
                      link.as = 'image'
                      link.href = image
                      document.head.appendChild(link)
                    }
                  }}
                >
                  <ImageWithFallback 
                    src={image} 
                    alt={`${product.title} view ${index + 1}`}
                    loading={index < 3 ? 'eager' : 'lazy'}
                  />
                </div>
              ))}
            </div>
          </div>

            <div className="product-info-section" data-animate="fade-up" data-delay="100">
            <div className="product-category-badge">{product.category || (product.categoryId ? getCategoryByIdOrSlug(product.categoryId)?.name : '')}</div>
            {product.popular && (
              <div className="popular-tag">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                Popular
              </div>
            )}
            <h1 className="product-detail-title">{product.title}</h1>
            <p className="product-detail-id">Product ID: {product.id}</p>
            <div className="product-meta-info">
              <div className="product-category-display">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                  <line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
                {product.category || (product.categoryId ? getCategoryByIdOrSlug(product.categoryId)?.name : '')}
              </div>
            </div>
            <p className="product-detail-description">{product.description}</p>
            
            <div className="price-section">
              <div>
                <span className="price-label">Price:</span>
                <span className="product-detail-price">₹{product.price}</span>
              </div>
              <div className="delivery-info">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>Delivery: 7-14 business days</span>
              </div>
            </div>

            <div className="product-actions">
              <button onClick={handleContactUs} className="contact-us-button">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Contact Us via WhatsApp
              </button>
              <p className="inquiry-text">
                Click above to inquire about this product directly!
              </p>
            </div>

            <div className="product-features">
              <h3>Product Features</h3>
              <ul>
                <li>Premium quality materials</li>
                <li>Handcrafted with attention to detail</li>
                <li>Elegant royal design</li>
                <li>Perfect for gifting</li>
                <li>Authentic Indian craftsmanship</li>
                <li>Certificate of authenticity included</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail

