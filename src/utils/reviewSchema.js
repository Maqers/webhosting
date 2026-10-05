/**
 * Turns real reviews into schema.org Product fields (aggregateRating +
 * review) so Google can show star ratings in search results. Shared by the
 * product page's <SeoHead> JSON-LD and scripts/prerender-products.js so the
 * static and live versions stay identical.
 *
 * Only ever pass genuine reviews here: Google penalises fabricated or
 * self-written ratings in structured data.
 *
 * catalogReviews:  product.meta.reviews  ({ name, rating, text, date })
 * customerReviews: Supabase `reviews` rows ({ name, rating, text, created_at })
 * Returns {} when there are no usable reviews, so it can be spread directly.
 */
export function buildReviewSchema(catalogReviews = [], customerReviews = []) {
  const reviews = [
    ...customerReviews.map(r => ({ name: r.name, rating: r.rating, text: r.text, date: r.created_at })),
    ...catalogReviews.map(r => ({ name: r.name, rating: r.rating, text: r.text, date: r.date })),
  ].filter(r => r.name && Number(r.rating) >= 1 && Number(r.rating) <= 5)

  if (reviews.length === 0) return {}

  const average = reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length

  return {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: Number(average.toFixed(1)),
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1,
    },
    review: reviews.map(r => {
      const date = r.date ? new Date(r.date) : null
      return {
        '@type': 'Review',
        author: { '@type': 'Person', name: String(r.name) },
        reviewRating: { '@type': 'Rating', ratingValue: Number(r.rating), bestRating: 5, worstRating: 1 },
        ...(r.text && { reviewBody: String(r.text) }),
        ...(date && !isNaN(date) && { datePublished: date.toISOString().split('T')[0] }),
      }
    }),
  }
}
