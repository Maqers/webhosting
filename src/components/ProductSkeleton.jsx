import './ProductSkeleton.css'

const ProductSkeleton = () => {
  return (
    <div className="product-skeleton">
      <div className="skeleton-image"></div>
      <div className="skeleton-content">
        <div className="skeleton-line skeleton-title"></div>
        <div className="skeleton-line skeleton-subtitle"></div>
        <div className="skeleton-line skeleton-category"></div>
        <div className="skeleton-line skeleton-price"></div>
      </div>
    </div>
  )
}

export default ProductSkeleton

