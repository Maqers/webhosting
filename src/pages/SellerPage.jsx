import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllProducts } from '../data/catalog'
import ImageWithFallback from '../components/ImageWithFallback'
import './SellerPage.css'

const SUPABASE_URL = "https://ipkyssauulddtthrebnw.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlwa3lzc2F1dWxkZHR0aHJlYm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDAyMTEsImV4cCI6MjA4MTYxNjIxMX0.TIZuwR0Vu2cyhhpGuCoB38fC6K8ZtnW17NeVzHWc-n0"
const SB_HEADERS = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }

export default function SellerPage() {
  const sellerCode = window.location.pathname.split('/maker/')[1]
  const [seller, setSeller] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/sellers_db?seller_code=eq.${encodeURIComponent(sellerCode)}&select=*`,
          { headers: SB_HEADERS }
        )
        const data = await res.json()
        if (!data || data.length === 0) { setNotFound(true); return }

        const s = data[0]
        setSeller(s)

        const productIds = s.product_ids || []
        if (productIds.length > 0) {
          const allProds = getAllProducts()
          setProducts(productIds.map(id => allProds.find(p => p.id === id)).filter(Boolean))
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sellerCode])

  if (loading) return <div className="seller-page"><div className="seller-loading">Loading...</div></div>
  if (notFound) return (
    <div className="seller-page"><div className="seller-not-found">
      <h2>Maker not found</h2>
      <Link to="/products">Browse all products</Link>
    </div></div>
  )

  return (
    <div className="seller-page">
      <div className="seller-inner">
        <Link to="/products" className="seller-back">← Back to products</Link>

        {/* Seller profile card */}
        <div className="seller-profile-card">
          <div className="seller-profile-header">
            <div className="seller-profile-avatar">{(seller.business_name || 'M')[0].toUpperCase()}</div>
            <div>
              <h1 className="seller-profile-name">{seller.business_name}</h1>
              <span className="seller-profile-code">{seller.seller_code}</span>
            </div>
          </div>

          <div className="seller-profile-grid">
            <div className="seller-profile-field">
              <span className="seller-profile-label">Owner</span>
              <span className="seller-profile-value">
                {(seller.owners || []).length > 0 ? seller.owners.join(', ') : '—'}
              </span>
            </div>
            <div className="seller-profile-field">
              <span className="seller-profile-label">City</span>
              <span className="seller-profile-value">{seller.location || '—'}</span>
            </div>
            <div className="seller-profile-field seller-profile-field--full">
              <span className="seller-profile-label">Address</span>
              <span className="seller-profile-value">{seller.address || '—'}</span>
            </div>
            <div className="seller-profile-field">
              <span className="seller-profile-label">Pincode</span>
              <span className="seller-profile-value">{seller.pincode || '—'}</span>
            </div>
            <div className="seller-profile-field">
              <span className="seller-profile-label">Notes</span>
              <span className="seller-profile-value">{seller.notes || seller.internal_notes || '—'}</span>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="seller-products-section">
          <h2 className="seller-products-title">
            Products <span className="seller-products-count">{products.length}</span>
          </h2>

          {products.length === 0 ? (
            <p className="seller-empty">No products listed yet.</p>
          ) : (
            <div className="seller-products-grid">
              {products.map(product => (
                <div key={product.id} className="seller-product-card">
                  <div className="seller-product-img">
                    <ImageWithFallback
                      src={product.images?.[0]}
                      alt={product.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div className="seller-product-info">
                    <p className="seller-product-category">{product.category || product.categoryId}</p>
                    <p className="seller-product-title">{product.title}</p>
                    <p className="seller-product-price">₹{product.price?.toLocaleString('en-IN')}</p>
                    <p className="seller-product-id">ID {product.id}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}