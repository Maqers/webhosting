import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getAllProducts } from '../data/catalog'
import ImageWithFallback from '../components/ImageWithFallback'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import './SellerPage.css'

const SUPABASE_URL = "https://ipkyssauulddtthrebnw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlwa3lzc2F1dWxkZHR0aHJlYm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDAyMTEsImV4cCI6MjA4MTYxNjIxMX0.TIZuwR0Vu2cyhhpGuCoB38fC6K8ZtnW17NeVzHWc-n0";

export default function SellerPage() {
  const { sellerCode } = useParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/sellers_db?seller_code=eq.${encodeURIComponent(sellerCode)}&select=product_ids`,
          { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` } }
        )
        const data = await res.json()
        if (!data || data.length === 0) { setNotFound(true); return; }

        const productIds = data[0].product_ids || []
        if (productIds.length === 0) { setProducts([]); return; }

        const allProds = getAllProducts()
        const sellerProds = productIds
          .map(id => allProds.find(p => p.id === id))
          .filter(Boolean)
          .filter(p => p.inStock)

        setProducts(sellerProds)
      } catch (err) {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sellerCode])

  if (loading) return (
    <div className="seller-page"><div className="container"><div className="seller-loading">Loading...</div></div></div>
  )

  if (notFound) return (
    <div className="seller-page"><div className="container"><div className="seller-not-found">
      <h2>Maker not found</h2>
      <Link to="/products" className="seller-back-link">Browse all products</Link>
    </div></div></div>
  )

  return (
    <div className="seller-page">
      <div className="container">
        <Link to="/products" className="seller-back">← Back to products</Link>
        <div className="seller-header">
          <h1 className="seller-code">{sellerCode}</h1>
          <p className="seller-count">{products.length} product{products.length !== 1 ? "s" : ""}</p>
        </div>
        {products.length === 0 ? (
          <p className="seller-empty">No products available from this maker right now.</p>
        ) : (
          <div className="products-grid">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const ProductCard = ({ product, index }) => {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { toggleItem, isWishlisted } = useWishlist()
  const wishlisted = isWishlisted(product.id)
  const [addedFeedback, setAddedFeedback] = useState(false)

  const handleAddToCart = useCallback((e) => {
    e.preventDefault(); e.stopPropagation()
    addItem(product)
    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 1400)
  }, [product, addItem])

  const handleWishlist = useCallback((e) => {
    e.preventDefault(); e.stopPropagation()
    toggleItem(product)
  }, [product, toggleItem])

  const handleCardClick = useCallback(() => {
    navigate(`/product/${product.id}`)
  }, [product.id, navigate])

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
        <p className="feat-category">{product.category || product.categoryId}</p>
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
          <button className={`feat-wishlist-text-btn${wishlisted ? " active" : ""}`} onClick={handleWishlist} type="button">
            <svg viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {wishlisted ? "Saved" : "Wishlist"}
          </button>
        </div>
      </div>
    </article>
  )
}