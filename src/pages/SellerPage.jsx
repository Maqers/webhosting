import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getAllProducts } from '../data/catalog'
import ImageWithFallback from '../components/ImageWithFallback'
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
        // Fetch seller by seller_code
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
    <div className="seller-page">
      <div className="container">
        <div className="seller-loading">Loading...</div>
      </div>
    </div>
  )

  if (notFound) return (
    <div className="seller-page">
      <div className="container">
        <div className="seller-not-found">
          <h2>Maker not found</h2>
          <Link to="/products" className="seller-back-link">Browse all products</Link>
        </div>
      </div>
    </div>
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
          <div className="seller-grid">
            {products.map(product => (
              <Link key={product.id} to={`/product/${product.id}`} className="seller-product-card">
                <div className="seller-product-img">
                  <ImageWithFallback
                    src={product.images[0]}
                    alt={product.title}
                    className="seller-product-image"
                    loading="lazy"
                  />
                  {product.popular && <div className="seller-popular-badge">Popular</div>}
                </div>
                <div className="seller-product-info">
                  <h3 className="seller-product-title">{product.title}</h3>
                  <p className="seller-product-price">₹{product.price}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}