// Scroll animation utility using Intersection Observer
export const initScrollAnimations = () => {
  // Check if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  
  if (prefersReducedMotion) {
    // Skip animations for users who prefer reduced motion
    const elements = document.querySelectorAll('.scroll-animate')
    elements.forEach(el => {
      el.classList.add('animate-in')
    })
    return null
  }

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in')
        observer.unobserve(entry.target)
      }
    })
  }, observerOptions)

  // Observe all elements with scroll-animate class
  const elements = document.querySelectorAll('.scroll-animate')
  elements.forEach(el => observer.observe(el))

  // Re-observe on dynamic content changes
  const mutationObserver = new MutationObserver(() => {
    const newElements = document.querySelectorAll('.scroll-animate:not(.animate-in)')
    newElements.forEach(el => observer.observe(el))
  })

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  })

  return observer
}

// Smooth scroll to element - Zoom-safe
export const smoothScrollTo = (elementId) => {
  const element = document.getElementById(elementId)
  if (element) {
    // Zoom-safe: Use CSS custom properties instead of window.innerWidth
    // These are set in CSS and scale properly with zoom
    const navbarHeight = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--navbar-height-mobile') || '64')
    const subNavbarHeight = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--sub-navbar-height') || '48')
    
    // Use media query match instead of window.innerWidth
    const isTablet = window.matchMedia('(min-width: 768px) and (max-width: 968px)').matches
    const isDesktop = window.matchMedia('(min-width: 969px)').matches
    
    let offset = navbarHeight + subNavbarHeight
    if (isTablet) {
      offset = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--navbar-height-tablet') || '80') + subNavbarHeight
    } else if (isDesktop) {
      offset = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--navbar-height-desktop') || '120') + subNavbarHeight
    }
    
    const elementPosition = element.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.pageYOffset - offset

    window.scrollTo({
      top: Math.max(0, offsetPosition),
      behavior: 'smooth'
    })
  }
}

