import { useEffect, useState } from 'react'
import './PageLoader.css'

const PageLoader = () => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Hide loader faster - don't wait for all resources
    const hideLoader = () => {
      setTimeout(() => {
        setIsVisible(false)
      }, 200)
    }

    // Hide immediately if DOM is already ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      hideLoader()
    } else {
      // Use DOMContentLoaded instead of window.load for faster hide
      document.addEventListener('DOMContentLoaded', hideLoader, { once: true })
      // Fallback: hide after max 1 second even if DOMContentLoaded doesn't fire
      setTimeout(hideLoader, 1000)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div className={`page-loader ${!isVisible ? 'hidden' : ''}`}>
      <div className="loader-content">
        <div className="loader-spinner"></div>
        <div className="loader-text">Loading...</div>
      </div>
    </div>
  )
}

export default PageLoader

