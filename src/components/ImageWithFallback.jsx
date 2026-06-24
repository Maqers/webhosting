// import { useState, forwardRef, useEffect, useRef } from 'react'
// import './ImageWithFallback.css'

// /**
//  * Simple product image component.
//  * - Uses exact src (URL or /images/name.jpg) — no rewriting, no dummy fallback.
//  * - Native loading="lazy". On error, shows "No image" placeholder only (no external URLs).
//  * - Forces image reload when src changes (fixes cache issues).
//  */
// const ImageWithFallback = forwardRef(({
//   src,
//   alt,
//   className = '',
//   style,
//   loading = 'lazy',
//   priority = false,
//   sizes,
//   srcSet,
//   ...props
// }, ref) => {
//   const [error, setError] = useState(false)
//   const [loadingState, setLoadingState] = useState(true)
//   const imgRef = useRef(null)
//   const currentSrcRef = useRef(null)

//   // Force image reload when src changes (fixes cache issues)
//   useEffect(() => {
//     if (src !== currentSrcRef.current) {
//       setError(false)
//       setLoadingState(true)
//       currentSrcRef.current = src
//     }
//   }, [src])

//   // Add cache-busting for local images in development
//   const [cacheBuster, setCacheBuster] = useState(() => Date.now())
  
//   useEffect(() => {
//     // Reset cache buster when src changes to force reload
//     if (src) {
//       setCacheBuster(Date.now())
//       // Also force reload by clearing error state
//       setError(false)
//       setLoadingState(true)
//     }
//   }, [src])

//   const getImageSrc = () => {
//     if (!src) return ''
//     // For local images (/images/...), add cache-busting in development to bypass browser cache
//     if (src.startsWith('/images/') && import.meta.env.DEV) {
//       return `${src}?t=${cacheBuster}`
//     }
//     // For external URLs, use as-is
//     return src
//   }

//   const effectiveLoading = priority ? 'eager' : loading

//   const needsAbsolute = className?.includes('food-image') ||
//     className?.includes('featured-image') ||
//     className?.includes('hero-slide-image') ||
//     className?.includes('showcase-img') ||
//     className?.includes('product-image') ||
//     className?.includes('main-image') ||
//     className?.includes('category-product-image')

//   const noImageEl = (
//     <div
//       className={`image-no-image ${className}`}
//       style={{
//         position: needsAbsolute ? 'absolute' : 'relative',
//         top: 0,
//         left: 0,
//         width: '100%',
//         height: '100%',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         background: '#e8e8e8',
//         color: '#999',
//         fontSize: '14px',
//         ...style
//       }}
//       aria-label="No image"
//     >
//       No image
//     </div>
//   )

//   if (!src) {
//     return needsAbsolute ? <>{noImageEl}</> : (
//       <div className={`image-wrapper ${className}`} style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
//         {noImageEl}
//       </div>
//     )
//   }

//   if (error) {
//     return needsAbsolute ? <>{noImageEl}</> : (
//       <div className={`image-wrapper ${className}`} style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
//         {noImageEl}
//       </div>
//     )
//   }

//   const imgStyle = needsAbsolute
//     ? {
//         position: 'absolute',
//         top: 0,
//         left: 0,
//         width: '100%',
//         height: '100%',
//         objectFit: 'cover',
//         objectPosition: 'center',
//         opacity: loadingState ? 0 : 1,
//         transition: 'opacity 0.2s ease',
//         display: 'block',
//         ...style
//       }
//     : {
//         opacity: loadingState ? 0 : 1,
//         transition: 'opacity 0.2s ease',
//         width: '100%',
//         height: '100%',
//         objectFit: 'cover',
//         display: 'block',
//         ...style
//       }

//   const img = (
//     <>
//       {loadingState && (
//         <div
//           className="image-skeleton"
//           style={{
//             position: needsAbsolute ? 'absolute' : 'relative',
//             top: 0,
//             left: 0,
//             width: '100%',
//             height: '100%',
//             ...style
//           }}
//         />
//       )}
//       <img
//         ref={(node) => {
//           imgRef.current = node
//           if (typeof ref === 'function') {
//             ref(node)
//           } else if (ref) {
//             ref.current = node
//           }
//         }}
//         key={`${src}-${cacheBuster}`} // Force re-render when src changes (cache-busting)
//         src={getImageSrc()}
//         alt={alt ?? ''}
//         className={className}
//         loading={effectiveLoading}
//         {...(priority && { fetchPriority: 'high' })}
//         decoding={priority ? 'sync' : 'async'}
//         sizes={sizes}
//         srcSet={srcSet}
//         onError={(e) => {
//           if (import.meta.env.DEV) {
//             console.warn('ImageWithFallback: Image failed to load:', src, e)
//           }
//           setError(true)
//           setLoadingState(false)
//         }}
//         onLoad={() => {
//           setLoadingState(false)
//           setError(false)
//         }}
//         style={imgStyle}
//         {...props}
//       />
//     </>
//   )

//   if (needsAbsolute) {
//     return img
//   }

//   return (
//     <div className={`image-wrapper ${className}`} style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
//       {img}
//     </div>
//   )
// })

// ImageWithFallback.displayName = 'ImageWithFallback'

// export default ImageWithFallback



import { forwardRef, useState } from 'react'
import './ImageWithFallback.css'

function toWebPSrc(src) {
  if (!src || !src.startsWith('/images/')) return null
  return src.replace(/\.[^.]+$/, '.webp')
}

// WebP <picture> delivery with automatic fallback to original format when the
// webp sidecar 404s. Browsers select the <source> URL, not the <img src>, so a
// missing webp never reaches the <img> fallback automatically — we handle it here.
const ImageWithFallback = forwardRef(
  (
    {
      src,
      alt = '',
      className = '',
      style,
      loading = 'lazy',
      priority = false,
      sizes,
      srcSet,
      webpSrc: webpSrcProp,
      ...props
    },
    ref
  ) => {
    const [webpFailed, setWebpFailed] = useState(false)

    if (!src) return null

    const effectiveWebpSrc = webpSrcProp || toWebPSrc(src)
    const useWebp = effectiveWebpSrc && !webpFailed

    const handleError = (event) => {
      if (useWebp) {
        // webp 404'd — re-render without <picture> so the JPEG/PNG loads directly
        setWebpFailed(true)
      } else {
        event.currentTarget.style.display = 'none'
      }
    }

    const effectiveLoading = priority ? 'eager' : loading
    const effectiveFetchPriority = priority ? 'high' : undefined
    const effectiveDecoding = priority ? 'sync' : 'async'
    const imgStyle = { width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }

    if (useWebp) {
      return (
        <picture>
          <source srcSet={effectiveWebpSrc} type="image/webp" sizes={sizes} />
          <img
            ref={ref}
            src={src}
            alt={alt}
            className={className}
            loading={effectiveLoading}
            fetchPriority={effectiveFetchPriority}
            decoding={effectiveDecoding}
            sizes={sizes}
            srcSet={srcSet}
            onError={handleError}
            style={imgStyle}
            {...props}
          />
        </picture>
      )
    }

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={className}
        loading={effectiveLoading}
        fetchPriority={effectiveFetchPriority}
        decoding={effectiveDecoding}
        sizes={sizes}
        srcSet={srcSet}
        onError={handleError}
        style={imgStyle}
        {...props}
      />
    )
  }
)

ImageWithFallback.displayName = 'ImageWithFallback'
export default ImageWithFallback
