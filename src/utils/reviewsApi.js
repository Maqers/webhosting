import { supabaseRest, uploadReviewPhoto } from '../config/supabaseConfig'
import { compressImageFile } from './imageCompress'

export async function fetchProductReviews(productId) {
  const rows = await supabaseRest(`reviews?product_id=eq.${productId}&order=created_at.desc`)
  return rows || []
}

// A user can review a product once they've actually ordered it. Cart/order
// items store the catalog product id on each line item, so this just reads
// the user's own orders and checks whether any line item matches.
export async function hasPurchasedProduct(userId, accessToken, productId) {
  const orders = await supabaseRest(`orders?user_id=eq.${userId}&select=items`, { accessToken })
  return (orders || []).some(o => (o.items || []).some(item => item?.id === productId))
}

// Every review the user has ever left, keyed by product id — used by My
// Orders to show "you already rated this" and by the product page to
// pre-fill/edit rather than block a second submission.
export async function fetchUserReviews(userId, accessToken) {
  const rows = await supabaseRest(`reviews?user_id=eq.${userId}&select=id,product_id,rating,text,images`, { accessToken })
  const byProduct = {}
  for (const r of (rows || [])) byProduct[r.product_id] = r
  return byProduct
}

export async function fetchUserReviewForProduct(userId, accessToken, productId) {
  const rows = await supabaseRest(`reviews?user_id=eq.${userId}&product_id=eq.${productId}`, { accessToken })
  return rows?.[0] || null
}

// Upserts: pass `reviewId` to update an existing review (e.g. adding text/
// photos to a quick star-rating given from My Orders) instead of creating
// a duplicate — the table has a unique (user_id, product_id) constraint.
// `existingImages` are kept as-is; `photoFiles` are uploaded and appended,
// so a quick rating update never wipes photos already on the review.
export async function submitReview({ reviewId, productId, userId, accessToken, name, rating, text, photoFiles, existingImages }) {
  const images = [...(existingImages || [])]
  for (const file of (photoFiles || [])) {
    const compressed = await compressImageFile(file).catch(() => file)
    images.push(await uploadReviewPhoto(compressed, accessToken))
  }
  const body = { product_id: productId, user_id: userId, name, rating, text, images }
  const result = reviewId
    ? await supabaseRest(`reviews?id=eq.${reviewId}`, { method: 'PATCH', accessToken, body })
    : await supabaseRest('reviews', { method: 'POST', accessToken, body })
  return Array.isArray(result) ? result[0] : result
}

// Quick star tap from My Orders — just the rating, no text/photos yet.
// Keeps whatever text/images already exist if this is updating a review
// the shopper is still filling out.
export async function submitQuickRating({ existingReview, productId, userId, accessToken, name, rating }) {
  return submitReview({
    reviewId: existingReview?.id,
    productId, userId, accessToken, name, rating,
    text: existingReview?.text || '',
    photoFiles: [],
    existingImages: existingReview?.images || [],
  })
}
