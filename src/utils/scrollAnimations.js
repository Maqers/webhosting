/**
 * ENHANCED SCROLL ANIMATION SYSTEM
 * 
 * Senior-level scroll animation utility with:
 * - Multiple animation types (fade-up, slide-left, slide-right, scale, stagger)
 * - Performance-optimized (GPU acceleration, Intersection Observer)
 * - Mobile-optimized (reduced motion support, touch-friendly)
 * - Stagger animations for visual rhythm
 */

// Animation types configuration
const ANIMATION_TYPES = {
  FADE_UP: 'fade-up',
  FADE_IN: 'fade-in',
  SLIDE_LEFT: 'slide-left',
  SLIDE_RIGHT: 'slide-right',
  SLIDE_UP: 'slide-up',
  SCALE: 'scale',
  SCALE_UP: 'scale-up',
  STAGGER: 'stagger' // For parent containers with children
}

// Check if user prefers reduced motion
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Initialize enhanced scroll animations
export const initScrollAnimations = () => {
  // Skip animations if user prefers reduced motion
  if (prefersReducedMotion()) {
    const elements = document.querySelectorAll('[data-animate]')
    elements.forEach(el => {
      el.classList.add('animate-in')
      el.style.opacity = '1'
      el.style.transform = 'none'
    })
    return null
  }

  // Observer options - optimized for performance
  const observerOptions = {
    threshold: [0.1, 0.25, 0.5],
    rootMargin: '0px 0px -80px 0px' // Trigger slightly before element enters viewport
  }

  // Main Intersection Observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target
        const animationType = element.dataset.animate || 'fade-up'
        const delay = parseInt(element.dataset.delay) || 0
        const duration = parseInt(element.dataset.duration) || 600

        // Handle stagger animations (parent containers)
        if (animationType === ANIMATION_TYPES.STAGGER) {
          handleStaggerAnimation(element, delay, duration)
        } else {
          // Single element animation
          setTimeout(() => {
            element.classList.add('animate-in')
            element.style.setProperty('--animation-duration', `${duration}ms`)
          }, delay)
        }

        // Unobserve after animation triggers
        observer.unobserve(element)
      }
    })
  }, observerOptions)

  // Observe all elements with data-animate attribute
  const animateElements = document.querySelectorAll('[data-animate]')
  animateElements.forEach(el => {
    // Set initial state
    if (!el.classList.contains('animate-in')) {
      el.style.willChange = 'transform, opacity'
      observer.observe(el)
    }
  })

  // Re-observe on dynamic content changes (for React components)
  const mutationObserver = new MutationObserver(() => {
    const newElements = document.querySelectorAll('[data-animate]:not(.animate-in)')
    newElements.forEach(el => {
      el.style.willChange = 'transform, opacity'
      observer.observe(el)
    })
  })

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  })

  return { observer, mutationObserver }
}

// Handle stagger animations for parent containers
const handleStaggerAnimation = (parentElement, baseDelay = 0, duration = 600) => {
  const children = parentElement.querySelectorAll('[data-stagger-item]')
  const staggerDelay = parseInt(parentElement.dataset.staggerDelay) || 100

  children.forEach((child, index) => {
    const delay = baseDelay + (index * staggerDelay)
    setTimeout(() => {
      child.classList.add('animate-in')
      child.style.setProperty('--animation-duration', `${duration}ms`)
    }, delay)
  })

  // Mark parent as animated
  parentElement.classList.add('animate-in')
}

// Cleanup function
export const cleanupScrollAnimations = (observers) => {
  if (!observers) return
  
  if (observers.observer && observers.observer.disconnect) {
    observers.observer.disconnect()
  }
  
  if (observers.mutationObserver && observers.mutationObserver.disconnect) {
    observers.mutationObserver.disconnect()
  }
}

// Utility: Add animation attributes to element
export const addAnimation = (element, type = 'fade-up', delay = 0, duration = 600) => {
  if (!element) return
  
  element.setAttribute('data-animate', type)
  if (delay > 0) element.setAttribute('data-delay', delay)
  if (duration !== 600) element.setAttribute('data-duration', duration)
  
  // Re-observe if observer exists
  const observer = initScrollAnimations()
  return observer
}

// Export animation types for use in components
export { ANIMATION_TYPES }

