import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SeoHead from '../components/SeoHead'
import './FAQs.css'

const FAQs = () => {
  const [openIndex, setOpenIndex] = useState(null)

  const faqs = [
    {
      question: "How do I place an order?",
      answer: "Browse our catalogue, find a product you love, and click 'Add to Cart'. Once you're ready, go to checkout, fill in your details, and place your order. We'll confirm via email and follow up on WhatsApp."
    },
    {
      question: "How do I pay?",
      answer: "We accept UPI payments (GPay, PhonePe, Paytm, any UPI app). You can copy our UPI ID or scan the QR code on the checkout page. Once you place your order, we'll verify payment before dispatching."
    },
    {
      question: "Do you ship across India?",
      answer: "Yes, we ship anywhere in India. Delivery is free on orders above Rs. 1,500. For orders below that, a flat delivery fee of Rs. 60 applies."
    },
    {
      question: "How long does delivery take?",
      answer: "Typically 7 to 14 business days, depending on the seller's location and product type. Some items, especially customised ones, may take a little longer. We'll keep you posted."
    },
    {
      question: "Can I customise a product?",
      answer: "Many of our sellers offer customisation, such as personalised names, colours, or messages. Reach out to us on WhatsApp after placing your order and we'll coordinate with the seller."
    },
    {
      question: "What is your return policy?",
      answer: "We do not offer returns or exchanges at this time. If your product arrives damaged or significantly different from what was shown, please contact us on WhatsApp within 48 hours with photos and we will do our best to help."
    },
    {
      question: "Are the sellers on Maqers verified?",
      answer: "Yes. Every seller on Maqers has been personally vetted by us before listing. We've reviewed their work, checked their credibility, and ensured they're genuine Indian home businesses."
    },
    {
      question: "How can I track my order?",
      answer: "Once your order is shipped, we will share tracking details via WhatsApp. You can use the tracking link to follow your package in real time."
    },
    {
      question: "Can I buy in bulk for events or corporate gifting?",
      answer: "Absolutely. We cater to bulk orders for weddings, corporate gifting, and events. WhatsApp us with your requirements and we will put together a custom quote."
    },
    {
      question: "How do I contact you?",
      answer: "The easiest way is WhatsApp. You can also reach us by email or Instagram. All contact details are on our Contact page."
    }
  ]

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  useEffect(() => {
    const checkVisibility = () => {
      document.querySelectorAll('.scroll-animate').forEach((el) => {
        const rect = el.getBoundingClientRect()
        if (rect.top < window.innerHeight && rect.bottom > 0) el.classList.add('animate-in')
      })
    }
    checkVisibility()
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('animate-in'); observer.unobserve(e.target) } }) },
      { threshold: 0.1, rootMargin: '50px' }
    )
    document.querySelectorAll('.scroll-animate:not(.animate-in)').forEach((el) => observer.observe(el))
    const t = setTimeout(() => { document.querySelectorAll('.scroll-animate:not(.animate-in)').forEach((el) => el.classList.add('animate-in')) }, 500)
    return () => { observer.disconnect(); clearTimeout(t) }
  }, [])

  return (
    <div className="faqs">
      <SeoHead
        title="FAQs — Orders, Shipping & Payments"
        description="Common questions about ordering on Maqers — how to pay, delivery timelines, customisation options, and returns."
        url="/faqs"
      />
      <div className="faqs-hero">
        <div className="hero-overlay"></div>
        <div className="container">
          <h1 className="faqs-title scroll-animate">Frequently Asked Questions</h1>
          <p className="faqs-subtitle scroll-animate">Everything you need to know about ordering on Maqers</p>
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
            <p>We're real people. Reach out anytime.</p>
            <Link to="/contact" className="contact-link">Contact Us</Link>
          </div>
        </section>
      </div>
    </div>
  )
}

export default FAQs