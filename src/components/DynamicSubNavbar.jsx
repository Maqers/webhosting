/**
 * DYNAMIC SUB-NAVBAR COMPONENT WITH SLIDER
 * 
 * Automatically generates navigation from categories data
 * Includes slider navigation arrows for many items
 * Mobile-responsive with smooth scrolling
 */

import { Link, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { getSortedCategories } from '../data/catalog'
import './SubNavbar.css'

const DynamicSubNavbar = () => {
  const location = useLocation()
  const containerRef = useRef(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)
  
  // Get categories sorted by order
  const categories = getSortedCategories()
  
  // Check scroll position and update arrow visibility
  const checkScrollPosition = () => {
    const container = containerRef.current
    if (!container) return
    
    const { scrollLeft, scrollWidth, clientWidth } = container
    const isScrollable = scrollWidth > clientWidth
    const threshold = 5 // Smaller threshold for better UX
    
    if (isScrollable) {
      container.classList.add('scrollable')
      container.classList.remove('not-scrollable')
      // Show arrows on mobile/tablet when scrollable
      const isMobile = window.matchMedia('(max-width: 968px)').matches
      if (isMobile) {
        setShowLeftArrow(scrollLeft > threshold)
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - threshold)
      } else {
        setShowLeftArrow(scrollLeft > threshold)
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - threshold)
      }
    } else {
      container.classList.add('not-scrollable')
      container.classList.remove('scrollable')
      setShowLeftArrow(false)
      setShowRightArrow(false)
    }
  }
  
  // Enhanced scroll functions with better UX - scroll by one item at a time
  const scrollLeft = () => {
    const container = containerRef.current
    if (!container) return
    
    // Find the first visible link
    const links = container.querySelectorAll('.sub-navbar-link')
    if (links.length === 0) return
    
    let targetLink = null
    const containerRect = container.getBoundingClientRect()
    
    // Find first link that's partially or fully visible
    for (let i = 0; i < links.length; i++) {
      const linkRect = links[i].getBoundingClientRect()
      if (linkRect.left >= containerRect.left) {
        // If this is the first visible link, scroll to previous one
        if (i > 0) {
          targetLink = links[i - 1]
        } else {
          targetLink = links[i]
        }
        break
      }
    }
    
    if (targetLink) {
      targetLink.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start'
      })
    } else {
      // Fallback: scroll by 80% of visible width
      container.scrollBy({
        left: -container.clientWidth * 0.8,
        behavior: 'smooth'
      })
    }
    
    // Update arrow visibility after scroll
    setTimeout(checkScrollPosition, 350)
  }
  
  const scrollRight = () => {
    const container = containerRef.current
    if (!container) return
    
    // Find the last visible link
    const links = container.querySelectorAll('.sub-navbar-link')
    if (links.length === 0) return
    
    let targetLink = null
    const containerRect = container.getBoundingClientRect()
    
    // Find last link that's partially or fully visible
    for (let i = links.length - 1; i >= 0; i--) {
      const linkRect = links[i].getBoundingClientRect()
      if (linkRect.right <= containerRect.right) {
        // If this is the last visible link, scroll to next one
        if (i < links.length - 1) {
          targetLink = links[i + 1]
        } else {
          targetLink = links[i]
        }
        break
      }
    }
    
    if (targetLink) {
      targetLink.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start'
      })
    } else {
      // Fallback: scroll by 80% of visible width
      container.scrollBy({
        left: container.clientWidth * 0.8,
        behavior: 'smooth'
      })
    }
    
    // Update arrow visibility after scroll
    setTimeout(checkScrollPosition, 350)
  }
  
  // Enhanced: Scroll to active link on mount/route change
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    // Find active link and scroll it into view
    const activeLink = container.querySelector('.sub-navbar-link.active')
    if (activeLink) {
      setTimeout(() => {
        activeLink.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        })
        checkScrollPosition()
      }, 100)
    }
  }, [location.pathname])
  
  // Detect scrollability and position
  useEffect(() => {
    // Initial check with delay to ensure DOM is ready
    const initialCheck = () => {
      checkScrollPosition()
    }
    
    const timeoutId1 = setTimeout(initialCheck, 100)
    const timeoutId2 = setTimeout(initialCheck, 300) // Double check after render
    
    const container = containerRef.current
    if (!container) {
      clearTimeout(timeoutId1)
      clearTimeout(timeoutId2)
      return
    }
    
    // Listen to scroll events with throttling
    let scrollTimeout
    const handleScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(checkScrollPosition, 50)
    }
    
    // Listen to scroll events
    container.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', checkScrollPosition)
    
    // Also check on orientation change (mobile)
    window.addEventListener('orientationchange', () => {
      setTimeout(checkScrollPosition, 200)
    })
    
    return () => {
      clearTimeout(timeoutId1)
      clearTimeout(timeoutId2)
      clearTimeout(scrollTimeout)
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', checkScrollPosition)
      window.removeEventListener('orientationchange', checkScrollPosition)
    }
  }, [categories, location])

  /**
   * Check if a category link is active
   * Handles both category page and product pages within category
   */
  const isCategoryActive = (categorySlug) => {
    const pathname = location.pathname
    
    // Exact match: /category/home-decor
    if (pathname === `/category/${categorySlug}`) {
      return true
    }
    
    // Product pages: Check if product belongs to this category
    if (pathname.startsWith('/product/')) {
      // This would require checking product category
      // For now, we'll check if we're on categories page
      return false
    }
    
    // Categories listing page
    if (pathname === '/categories') {
      return false
    }
    
    return false
  }

  /**
   * Check if "All Products" link is active
   */
  const isAllProductsActive = () => {
    return location.pathname === '/products' || 
           location.pathname.startsWith('/product/')
  }

  return (
    <nav className="sub-navbar" aria-label="Category navigation">
      {/* Left Arrow - Show when scrollable and not at start */}
      {showLeftArrow && (
        <button
          className="sub-navbar-arrow sub-navbar-arrow-left"
          onClick={scrollLeft}
          aria-label="Scroll categories left"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      
      <div className="sub-navbar-container" ref={containerRef}>
        {/* All Products Link - Always first */}
        <Link 
          to="/products" 
          className={`sub-navbar-link ${isAllProductsActive() ? 'active' : ''}`}
        >
          All Products
        </Link>
        
        {/* Dynamically generated category links */}
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/category/${category.slug}`}
            className={`sub-navbar-link ${isCategoryActive(category.slug) ? 'active' : ''}`}
          >
            {category.name}
          </Link>
        ))}
      </div>
      
      {/* Right Arrow - Show when scrollable and not at end */}
      {showRightArrow && (
        <button
          className="sub-navbar-arrow sub-navbar-arrow-right"
          onClick={scrollRight}
          aria-label="Scroll categories right"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </nav>
  )
}

export default DynamicSubNavbar

