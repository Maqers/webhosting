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

export async function hasReviewedProduct(userId, accessToken, productId) {
  const rows = await supabaseRest(`reviews?user_id=eq.${userId}&product_id=eq.${productId}&select=id`, { accessToken })
  return (rows || []).length > 0
}

export async function submitReview({ productId, userId, accessToken, name, rating, text, photoFiles }) {
  const images = []
  for (const file of photoFiles) {
    const compressed = await compressImageFile(file).catch(() => file)
    images.push(await uploadReviewPhoto(compressed, accessToken))
  }
  const result = await supabaseRest('reviews', {
    method: 'POST',
    accessToken,
    body: { product_id: productId, user_id: userId, name, rating, text, images },
  })
  return Array.isArray(result) ? result[0] : result
}
