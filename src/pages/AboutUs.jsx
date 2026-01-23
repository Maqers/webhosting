import { useEffect } from 'react'
import './AboutUs.css'

const AboutUs = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('.scroll-animate').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="about-us">
      <div className="about-hero">
        <div className="hero-overlay"></div>
        <div className="container">
          <h1 className="about-title scroll-animate">About maqers</h1>
          <p className="about-subtitle scroll-animate">Crafting Memories, One Gift at a Time</p>
        </div>
      </div>

      <div className="container">
        <section className="about-content">
          <div className="about-section scroll-animate">
            <h2>Our Story</h2>
            <p>
              Welcome to maqers, your trusted partner for custom gifts from India! We started with a simple 
              vision: to bridge the gap between authentic Indian craftsmanship and gift lovers worldwide. 
              What began as a small venture has grown into a platform that connects thousands of customers 
              with unique, handcrafted products that tell stories.
            </p>
            <p>
              We believe that every gift should be special, meaningful, and authentic. That's why we've 
              partnered with skilled artisans and trusted manufacturers across India - from traditional 
              craftsmen to modern designers - to ensure you always have access to beautiful, personalized 
              gifts that celebrate Indian artistry and culture.
            </p>
          </div>

          <div className="about-section scroll-animate">
            <h2>Our Mission</h2>
            <p>
              Our mission is to make gift-giving effortless and memorable. We're committed to providing 
              you with the best custom gift experience - from browsing our curated collection to receiving 
              your beautifully packaged order. We work closely with artisans to ensure quality, authenticity, 
              and timely delivery, because we know that great gifts deserve great service.
            </p>
            <p>
              Whether you're looking for personalized items, traditional handicrafts, or modern designs, 
              we're here to help you find the perfect gift that speaks to your heart and delights your 
              loved ones.
            </p>
          </div>

          <div className="about-section scroll-animate">
            <h2>What Sets Us Apart</h2>
            <div className="features-grid">
              <div className="feature-card scroll-animate">
                <div className="feature-icon-wrapper">
                  <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h3>Authentic Craftsmanship</h3>
                <p>Handpicked products from skilled Indian artisans, ensuring authenticity and quality in every piece</p>
              </div>
              <div className="feature-card scroll-animate">
                <div className="feature-icon-wrapper">
                  <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 7h-4M4 7h4m0 0v10m0-10a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10M6 7v10m0 0a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2M6 17h12"/>
                  </svg>
                </div>
                <h3>Personalization</h3>
                <p>Customize your gifts with names, dates, or special messages to make them truly unique</p>
              </div>
              <div className="feature-card scroll-animate">
                <div className="feature-icon-wrapper">
                  <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                </div>
                <h3>Worldwide Shipping</h3>
                <p>We deliver to customers across the globe, bringing Indian craftsmanship to your doorstep</p>
              </div>
              <div className="feature-card scroll-animate">
                <div className="feature-icon-wrapper">
                  <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <h3>Quality Assured</h3>
                <p>Every product is carefully inspected to ensure it meets our high standards of quality and authenticity</p>
              </div>
            </div>
          </div>

          <div className="get-in-touch-section scroll-animate">
            <div className="get-in-touch-content">
              <h2>Get in Touch</h2>
              <p>
                Have a question about our products? Need help choosing the perfect gift? Want to partner 
                with us? We're here to help! Reach out through our WhatsApp chat or contact our customer 
                support team. We're available to ensure you have the best gift shopping experience.
              </p>
              
              <div className="quote-section scroll-animate">
                <div className="quote-card">
                  <svg className="quote-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                  </svg>
                  <p className="quote-text">"The best gifts come from the heart, crafted with love and delivered with care."</p>
                  <p className="quote-author">— maqers</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default AboutUs
