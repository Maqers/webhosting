import { useMemo, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAllProducts } from '../data/catalog'
import SeoHead from '../components/SeoHead'
import { FeaturedCard } from './Home'
import { useMobileCenterSwap } from '../hooks/useMobileCenterSwap'
import './SellerStorefront.css'
import './Home.css'

export default function SellerStorefront() {
  const { sellerCode } = useParams()

  const products = useMemo(
    () => getAllProducts().filter(p => p.meta?.sellerCode === sellerCode),
    [sellerCode]
  )

  const gridRef = useRef(null)
  useMobileCenterSwap(gridRef, '.feat-img-zone.has-second-img', [products.length])

  if (products.length === 0) {
    return (
      <div className="storefront-page">
        <div className="container storefront-empty">
          <h2>Maker not found</h2>
          <p>This link doesn't match any of our makers.</p>
          <Link to="/products" className="storefront-back">← Browse all products</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="storefront-page">
      <SeoHead
        title="Maker Collection"
        description="Handmade products from one of our featured Maqers makers."
        url={`/maker/${sellerCode}`}
      />
      <div className="container">
        <Link to="/products" className="storefront-back">← Back to products</Link>

        <div className="storefront-header">
          <h1 className="storefront-title">Maker Collection</h1>
          <p className="storefront-subtitle">
            {products.length} handmade {products.length === 1 ? 'product' : 'products'} from this maker
          </p>
        </div>

        <div className="storefront-grid featured-grid" ref={gridRef}>
          {products.map((product, index) => (
            <FeaturedCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </div>
  )
}
