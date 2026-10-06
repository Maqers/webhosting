import { hasDiwaliOffer, priceWithDiwaliCode } from '../data/offers'

const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`

// Price line on product cards (Home, All Products, category pages).
// While the Diwali code applies: regular price struck through, code price
// beside it (the OfferTag under it says "with code …").
export default function CardPrice({ product }) {
  const hasSizes = product.meta?.sizePrices && Object.keys(product.meta.sizePrices).length > 0
  const onSale = product.meta?.originalPrice > product.price
  const onwards = hasSizes ? ' onwards' : ''

  if (hasDiwaliOffer(product)) {
    return (
      <p className="feat-price">
        <span className="feat-price-original">{inr(onSale ? product.meta.originalPrice : product.price)}</span>
        <span className="feat-price-current">{inr(priceWithDiwaliCode(product.price))}{onwards}</span>
      </p>
    )
  }
  return (
    <p className="feat-price">
      {hasSizes ? (
        `${inr(product.price)} onwards`
      ) : onSale ? (
        <>
          <span className="feat-price-original">{inr(product.meta.originalPrice)}</span>
          <span className="feat-price-current">{inr(product.price)}</span>
        </>
      ) : (
        inr(product.price)
      )}
    </p>
  )
}
