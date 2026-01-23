// Premium Animation Utilities
// Enterprise-grade motion system for smooth, professional interactions

/**
 * Animation timing presets
 */
export const timing = {
  instant: '0ms',
  fast: '150ms',
  base: '250ms',
  slow: '400ms',
  slower: '600ms',
}

/**
 * Easing functions for natural motion
 */
export const easing = {
  // Standard easing
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  
  // Spring-like motion
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  springGentle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  
  // Premium easing
  premium: 'cubic-bezier(0.16, 1, 0.3, 1)',
  smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
}

/**
 * Stagger delay calculator
 */
export const stagger = (index, baseDelay = 0.05) => {
  return `${index * baseDelay}s`
}

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Page transition animation classes
 */
export const pageTransitions = {
  enter: 'page-enter',
  enterActive: 'page-enter-active',
  exit: 'page-exit',
  exitActive: 'page-exit-active',
}

/**
 * Scroll animation variants
 */
export const scrollVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.6, ease: easing.easeOut }
  },
  slideUp: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: easing.easeOut }
  },
  slideDown: {
    initial: { opacity: 0, y: -30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: easing.easeOut }
  },
  slideLeft: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6, ease: easing.easeOut }
  },
  slideRight: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6, ease: easing.easeOut }
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.5, ease: easing.springGentle }
  },
}

/**
 * Button animation states
 */
export const buttonAnimations = {
  hover: {
    scale: 1.02,
    transition: { duration: 0.2, ease: easing.easeOut }
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1, ease: easing.easeIn }
  },
  loading: {
    opacity: 0.7,
    cursor: 'not-allowed'
  }
}

/**
 * Card animation states
 */
export const cardAnimations = {
  hover: {
    y: -4,
    transition: { duration: 0.3, ease: easing.easeOut }
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.15, ease: easing.easeIn }
  }
}

/**
 * Form input animations
 */
export const inputAnimations = {
  focus: {
    scale: 1.01,
    transition: { duration: 0.2, ease: easing.easeOut }
  },
  error: {
    shake: true,
    transition: { duration: 0.4, ease: easing.easeOut }
  }
}

/**
 * Generate CSS transition string
 */
export const transition = (properties = 'all', duration = timing.base, easeFunc = easing.easeInOut) => {
  return `${properties} ${duration} ${easeFunc}`
}

/**
 * Intersection Observer for scroll animations with enhanced options
 */
export const createScrollObserver = (callback, options = {}) => {
  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
    ...options
  }

  return new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry)
      }
    })
  }, defaultOptions)
}

/**
 * Debounce function for performance
 */
export const debounce = (func, wait = 100) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function for scroll events
 */
export const throttle = (func, limit = 100) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

