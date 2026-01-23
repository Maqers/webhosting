// /**
//  * Image Optimization Utilities
//  *
//  * Provides utilities for optimizing images with:
//  * - WebP format detection and fallback
//  * - Responsive image srcset generation
//  * - Image compression hints
//  * - Lazy loading optimization
//  */

// /**
//  * Generate responsive srcset for images
//  * @param {string} baseUrl - Base image URL
//  * @param {Object} options - Options for srcset generation
//  * @returns {string} - srcset string
//  */
// export const generateSrcSet = (baseUrl, options = {}) => {
//   const {
//     widths = [400, 800, 1200, 1600],
//     format = "webp",
//     quality = 80,
//   } = options;

//   // If URL is from external source (unsplash, placeholder, etc), return as-is
//   if (baseUrl.startsWith("http://") || baseUrl.startsWith("https://")) {
//     // For external URLs, try to add size parameters if supported
//     if (baseUrl.includes("unsplash.com")) {
//       return widths
//         .map((w) => `${baseUrl}&w=${w}&q=${quality} ${w}w`)
//         .join(", ");
//     }
//     // For other external URLs, return single URL
//     return baseUrl;
//   }

//   // For local images, generate srcset with different sizes
//   // Note: This assumes you have image optimization service or multiple sizes
//   return widths.map((w) => `${baseUrl}?w=${w}&q=${quality} ${w}w`).join(", ");
// };

// /**
//  * Get optimal image size based on viewport
//  * @param {number} viewportWidth - Viewport width
//  * @param {number} devicePixelRatio - Device pixel ratio
//  * @returns {number} - Optimal image width
//  */
// export const getOptimalImageSize = (viewportWidth, devicePixelRatio = 1) => {
//   const effectiveWidth = viewportWidth * devicePixelRatio;

//   // Common breakpoints for image sizes
//   if (effectiveWidth <= 400) return 400;
//   if (effectiveWidth <= 800) return 800;
//   if (effectiveWidth <= 1200) return 1200;
//   if (effectiveWidth <= 1600) return 1600;
//   return 1920;
// };

// /**
//  * Check if browser supports WebP format
//  * @returns {Promise<boolean>} - Promise resolving to WebP support status
//  */
// export const supportsWebP = () => {
//   return new Promise((resolve) => {
//     const webP = new Image();
//     webP.onload = webP.onerror = () => {
//       resolve(webP.height === 2);
//     };
//     webP.src =
//       "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA";
//   });
// };

// /**
//  * Get optimal image format based on browser support
//  * @param {string} originalUrl - Original image URL
//  * @param {boolean} preferWebP - Whether to prefer WebP
//  * @returns {string} - Optimized image URL
//  */
// export const getOptimalImageFormat = async (originalUrl, preferWebP = true) => {
//   // If URL is external, return as-is (external services handle format)
//   if (originalUrl.startsWith("http://") || originalUrl.startsWith("https://")) {
//     // For Unsplash, add format parameter
//     if (originalUrl.includes("unsplash.com") && preferWebP) {
//       const webPSupported = await supportsWebP();
//       if (webPSupported && !originalUrl.includes("fm=")) {
//         return (
//           originalUrl + (originalUrl.includes("?") ? "&" : "?") + "fm=webp&q=80"
//         );
//       }
//     }
//     return originalUrl;
//   }

//   // For local images (/images/..., /assets/..., or relative paths): use as-is.
//   // Do NOT rewrite to .webp — those files usually don't exist, causing 404 → fallback to dummy.
//   // Use the exact URL/path you provide (e.g. /images/name.jpg or full URL).
//   return originalUrl;
// };

// /**
//  * Preload critical images
//  * @param {string[]} imageUrls - Array of image URLs to preload
//  */
// export const preloadImages = (imageUrls) => {
//   imageUrls.forEach((url) => {
//     const link = document.createElement("link");
//     link.rel = "preload";
//     link.as = "image";
//     link.href = url;
//     link.fetchPriority = "high";
//     document.head.appendChild(link);
//   });
// };

// /**
//  * Generate image placeholder (blur data URL)
//  * @param {number} width - Placeholder width
//  * @param {number} height - Placeholder height
//  * @returns {string} - Data URL for placeholder
//  */
// export const generatePlaceholder = (width = 400, height = 400) => {
//   const canvas = document.createElement("canvas");
//   canvas.width = width;
//   canvas.height = height;
//   const ctx = canvas.getContext("2d");

//   // Create a simple gradient placeholder
//   const gradient = ctx.createLinearGradient(0, 0, width, height);
//   gradient.addColorStop(0, "#f0f0f0");
//   gradient.addColorStop(1, "#e0e0e0");
//   ctx.fillStyle = gradient;
//   ctx.fillRect(0, 0, width, height);

//   return canvas.toDataURL("image/jpeg", 0.1);
// };

// /**
//  * Lazy load image with intersection observer
//  * @param {HTMLImageElement} img - Image element
//  * @param {string} src - Image source URL
//  * @param {Object} options - Observer options
//  */
// export const lazyLoadImage = (img, src, options = {}) => {
//   const { rootMargin = "50px", threshold = 0.01 } = options;

//   const observer = new IntersectionObserver(
//     (entries) => {
//       entries.forEach((entry) => {
//         if (entry.isIntersecting) {
//           img.src = src;
//           img.removeAttribute("data-src");
//           observer.unobserve(img);
//         }
//       });
//     },
//     { rootMargin, threshold },
//   );

//   observer.observe(img);
// };
