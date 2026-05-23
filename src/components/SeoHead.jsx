import { Helmet } from 'react-helmet-async'

const BASE_URL = 'https://maqers.in'
const DEFAULT_IMAGE = `${BASE_URL}/images/logo.png`
const SITE_NAME = 'Maqers'
const DEFAULT_TITLE = 'Maqers — Curated Handcrafted Gifts from India'
const DEFAULT_DESCRIPTION =
  'Discover unique handmade gifts from India\u2019s best independent artisans \u2014 jewellery, candles, home decor, skincare and more. Curated for every person, every occasion.'

/**
 * SeoHead — drop into any page to set title, description, Open Graph tags,
 * and optional JSON-LD structured data.
 *
 * Props:
 *   title       string  — page title (appended with " | Maqers")
 *   description string  — meta description (auto-truncated to 155 chars)
 *   image       string  — absolute URL for og:image (defaults to logo)
 *   url         string  — canonical URL path, e.g. "/products"
 *   type        string  — og:type, "product" for product pages, "website" elsewhere
 *   price       number  — for product pages, the price in INR
 *   noIndex     bool    — set true for admin/checkout pages
 *   jsonLd      object  — JSON-LD schema object, injected as <script type="application/ld+json">
 */
export default function SeoHead({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  price,
  noIndex = false,
  jsonLd,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE
  const fullImage = image.startsWith('http') ? image : `${BASE_URL}${image}`
  const canonicalUrl = url ? `${BASE_URL}${url}` : undefined

  // Truncate description to 155 chars for Google
  const safeDescription =
    description.length > 155 ? description.slice(0, 152).trimEnd() + '\u2026' : description

  return (
    <Helmet>
      {/* Core */}
      <title>{fullTitle}</title>
      <meta name="description" content={safeDescription} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={safeDescription} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:type" content={type} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={safeDescription} />
      <meta name="twitter:image" content={fullImage} />

      {/* Product price meta (Facebook/Pinterest) */}
      {price && <meta property="product:price:amount" content={price} />}
      {price && <meta property="product:price:currency" content="INR" />}

      {/* JSON-LD structured data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  )
}