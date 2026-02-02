import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './FAQs.css'

const FAQs = () => {
  const [openIndex, setOpenIndex] = useState(null)

  const faqs = [
    {
      question: "How do I inquire about a product?",
      answer: "Simply click on the WhatsApp button located at the bottom right of any page. You can specify the product ID you're interested in, and our team will assist you with all your questions. We're available 24/7 to help you find the perfect custom gift."
    },
    {
      question: "Do you ship internationally?",
      answer: "No, we don't offer international shipping to customers worldwide as of now. We currently ship only within India. However, we are working on expanding our shipping options in the future. Stay tuned for updates!"
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept various payment methods including bank transfers, credit cards, debit cards, and digital payment platforms like UPI. Payment details will be discussed when you place an order through our WhatsApp chat. We ensure secure and hassle-free transactions."
    },
    {
      question: "How long does delivery take?",
      answer: "Delivery times vary depending on your location and the product customization requirements. Typically, domestic orders take 5-7 business days. We'll provide specific timelines when you place your order, and you'll receive tracking information once your order ships."
    },
    {
      question: "Can I return or exchange a product?",
      answer: "No, we don't offer returns and exchanges for now."
    },
    {
      question: "Are the products authentic?",
      answer: "Absolutely! We guarantee the authenticity of all our products. We work directly with trusted manufacturers, skilled artisans, and verified suppliers across India to ensure you receive genuine, high-quality items. Every product is carefully inspected before shipping."
    },
    {
      question: "Do you offer gift wrapping?",
      answer: "No, we don't offer separate gift wrapping services. Packaging depends on artisans, if something specific is required please mention this when placing your order through WhatsApp, and we'll try arranging it for you after coordinating with the sellers, if possible additional costs may apply"
    },
    {
      question: "How can I track my order?",
      answer: "Once your order is shipped, we'll provide you with a tracking number via WhatsApp. You can use this to track your package's journey to your doorstep in real-time. We'll also send you updates at each stage of the shipping process so you're always informed."
    },
    {
      question: "Can I customize products with personal messages?",
      answer: "Yes! Many of our products can be personalized with names, dates, special messages, or custom designs. When you contact us via WhatsApp, let us know what customization you'd like, and we'll work with you to create a truly unique gift that's perfect for your recipient."
    },
    {
      question: "What if I'm not satisfied with my order?",
      answer: "Your satisfaction is our priority! If you're not completely happy with your order, please contact us immediately via WhatsApp. We'll work with you to resolve any issues. We stand behind the quality of every product we sell."
    }
  ]

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  useEffect(() => {
    // Immediately show elements that are already in viewport
    const checkVisibility = () => {
      const elements = document.querySelectorAll('.scroll-animate')
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect()
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0
        if (isVisible) {
          el.classList.add('animate-in')
        }
      })
    }

    // Check immediately on mount
    checkVisibility()

    // Also use IntersectionObserver for elements entering viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    // Observe all scroll-animate elements
    document.querySelectorAll('.scroll-animate').forEach((el) => {
      // Only observe if not already visible
      if (!el.classList.contains('animate-in')) {
        observer.observe(el)
      }
    })

    // Fallback: Make all elements visible after a short delay
    const fallbackTimeout = setTimeout(() => {
      document.querySelectorAll('.scroll-animate:not(.animate-in)').forEach((el) => {
        el.classList.add('animate-in')
      })
    }, 500)

    return () => {
      observer.disconnect()
      clearTimeout(fallbackTimeout)
    }
  }, [])

  return (
    <div className="faqs">
      <div className="faqs-hero">
        <div className="hero-overlay"></div>
        <div className="container">
          <h1 className="faqs-title scroll-animate">Frequently Asked Questions</h1>
          <p className="faqs-subtitle scroll-animate">Everything you need to know about our custom gifts</p>
        </div>
      </div>

      <div className="container">
        <section className="faqs-content">
          <div className="faqs-list">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`faq-item scroll-animate ${openIndex === index ? 'open' : ''}`}
                style={{ '--i': index }}
              >
                <button 
                  className="faq-question"
                  onClick={() => toggleFAQ(index)}
                  aria-expanded={openIndex === index}
                >
                  <span className="faq-question-text">{faq.question}</span>
                  <span className="faq-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      {openIndex === index ? (
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      ) : (
                        <>
                          <line x1="12" y1="5" x2="12" y2="19"/>
                          <line x1="5" y1="12" x2="19" y2="12"/>
                        </>
                      )}
                    </svg>
                  </span>
                </button>
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="faqs-contact scroll-animate">
            <div className="contact-icon-wrapper">
              <svg className="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h2>Still have questions?</h2>
            <p>Don't hesitate to reach out to us. Our friendly team is always ready to assist you with any queries or help you find the perfect gift!</p>
            <Link to="/contact" className="contact-link">
              Contact Us
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

export default FAQs
