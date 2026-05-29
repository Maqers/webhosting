import { useEffect } from 'react'
import SeoHead from '../components/SeoHead'
import './AboutUs.css'

const AboutUs = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('animate-in') }) },
      { threshold: 0.1 }
    )
    document.querySelectorAll('.scroll-animate').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="about-us">
      <SeoHead
        title="About Maqers — India's Curated Handmade Gifting Platform"
        description="Maqers connects gift buyers with India's finest independent artisans. Discover the story behind India's most thoughtful gifting destination."
        url="/about"
      />
      <div className="about-hero">
        <div className="hero-overlay"></div>
        <div className="container">
          <h1 className="about-title scroll-animate">About Maqers</h1>
          <p className="about-subtitle scroll-animate">Instagram's best finds, now on your doorstep</p>
        </div>
      </div>

      <div className="container">
        <section className="about-content">

          {/* ── STAT BOXES ─────────────────────────────────────── */}
          <div className="about-section scroll-animate">
            <div className="about-stats-grid">
              <div className="about-stat-card">
                <div className="about-stat-num">100%</div>
                <div className="about-stat-label">Verified sellers</div>
                <div className="about-stat-sub">Every business personally vetted before listing</div>
              </div>
              <div className="about-stat-card">
                <div className="about-stat-num">₹89+</div>
                <div className="about-stat-label">Starting price</div>
                <div className="about-stat-sub">Gifts for every budget, from small surprises to big ones</div>
              </div>
              <div className="about-stat-card">
                <div className="about-stat-num about-stat-emoji" role="img" aria-label="handshake">🤝</div>
                <div className="about-stat-label">WhatsApp ordering</div>
                <div className="about-stat-sub">Talk to us directly. No confusing checkout flows.</div>
              </div>
              <div className="about-stat-card">
                <div className="about-stat-num about-stat-emoji" role="img" aria-label="India">🇮🇳</div>
                <div className="about-stat-label">Indian home businesses</div>
                <div className="about-stat-sub">Every purchase supports a real person's livelihood</div>
              </div>
            </div>
          </div>

          {/* ── OUR STORY ────────────────────────────────────── */}
          <div className="about-section scroll-animate">
            <h2>Saw it on Instagram? Buy it here.</h2>
            <p>
              You've been there. You're scrolling Instagram at midnight and you see it — a stunning hand-poured candle,
              a crochet bouquet that looks like it's from a movie set, a custom name frame that would be perfect for
              your best friend's birthday. You hit save. You DM the seller. And then you wait. And wait. And maybe
              get a reply three days later asking for your address in a DM chain that somehow never leads to an actual purchase.
            </p>
            <p>
              That's the gap Maqers fills. We spent months finding the best independent home businesses on Instagram —
              the ones who actually make great things — and built the infrastructure around them that Instagram never had.
              Verified sellers. Real products. A proper checkout. No DM anxiety.
            </p>
            <p>
              Every seller on Maqers has been personally vetted by us. We've ordered from them, verified their identity,
              and confirmed their products match what they show online. What you see is what you get.
            </p>
          </div>

          {/* ── OUR MISSION ──────────────────────────────────── */}
          <div className="about-section scroll-animate">
            <h2>We're on both sides of this.</h2>
            <p>
              Most sellers on Maqers are one or two-person operations — someone who turned a skill into a side hustle,
              a student funding their own education through craft, a parent building something of their own from home.
              They make genuinely beautiful things. The problem was never the product — it was discoverability and trust.
            </p>
            <p>
              Maqers gives buyers a reason to trust them, and gives sellers the reach they couldn't build alone.
              When you buy on Maqers, you're not choosing between quality and supporting small. You get both.
            </p>
          </div>

          {/* ── WHAT SETS US APART ────────────────────────────── */}
          <div className="about-section scroll-animate">
            <h2>What Sets Us Apart</h2>
            <div className="features-grid">
              <div className="feature-card scroll-animate">
                <div className="feature-icon-wrapper">
                  <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                </div>
                <h3>Personally Vetted Sellers</h3>
                <p>Every seller reviewed and verified by us before listing. Not a form, a real check.</p>
              </div>
              <div className="feature-card scroll-animate">
                <div className="feature-icon-wrapper">
                  <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <path d="M8 21h8m-4-4v4"/>
                  </svg>
                </div>
                <h3>Instagram's Best, Here</h3>
                <p>We bring hidden Instagram gems to one trusted place — no DM required.</p>
              </div>
              <div className="feature-card scroll-animate">
                <div className="feature-icon-wrapper">
                  <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                </div>
                <h3>Nation-wide Delivery</h3>
                <p>India's best home businesses, delivered anywhere in the country.</p>
              </div>
              <div className="feature-card scroll-animate">
                <div className="feature-icon-wrapper">
                  <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <h3>Curated, Not Random</h3>
                <p>Every product on Maqers is handpicked. We review what sellers make before anything goes live.</p>
              </div>
            </div>
          </div>

          {/* ── SELL ON MAQERS ────────────────────────────────── */}
          <div className="about-section scroll-animate">
            <div className="seller-cta-block">
              <div className="seller-cta-text">
                <h2>Have a home business? Start selling today.</h2>
                <p>
                  If you make something — jewellery, candles, baked goods, skincare, art, accessories — and you've
                  been selling (or thinking about selling) through Instagram DMs, Maqers is built for you.
                </p>
                <p>
                  You don't need a website. You don't need a GST number to start. You don't need to figure out
                  logistics, payment gateways, or how to write product descriptions. We handle all of that.
                  You just make the thing.
                </p>
                <p>
                  Whether you're a solo creator working from your bedroom or a small team with big ideas —
                  list on Maqers and reach buyers who are already looking for exactly what you make.
                </p>
                <a href="/contact" className="seller-cta-btn">Apply to sell on Maqers →</a>
              </div>
            </div>
          </div>

          {/* ── GET IN TOUCH ──────────────────────────────────── */}
          <div className="get-in-touch-section scroll-animate">
            <div className="get-in-touch-content">
              <h2>Get in Touch</h2>
              <p>
                Question about an order? Want to list your business on Maqers? We're real people —
                reach us on WhatsApp or email and we'll actually respond.
              </p>
              <div className="quote-section scroll-animate">
                <div className="quote-card">
                  <svg className="quote-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                  </svg>
                  <p className="quote-text">"Saw it on Instagram? Buy it here."</p>
                  <p className="quote-author">— Maqers</p>
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