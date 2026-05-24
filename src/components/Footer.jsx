import { Link } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="footer-cols-row">

        <div className="footer-col">
          <h4 className="footer-col-title">Maqers</h4>
          <Link to="/products"    className="footer-link">All Gifts</Link>
          <Link to="/by-occasion" className="footer-link">By Occasion</Link>
          <Link to="/by-product"  className="footer-link">By Category</Link>
          <Link to="/about"       className="footer-link">Our Story</Link>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">Quick Links</h4>
          <Link to="/faqs"    className="footer-link">FAQs</Link>
          <Link to="/contact" className="footer-link">Contact Us</Link>
        </div>

        <div className="footer-col footer-col--logo">
          <span className="footer-logo">maqers.in</span>
          <p className="footer-tagline">Curated handmade gifts<br/>from India's finest artisans.</p>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">Contact Us</h4>
          <a href="mailto:maqers.in@gmail.com"                            className="footer-link">Email: maqers.in@gmail.com</a>
          <a href="tel:+917973981938"                                      className="footer-link">Call: +91 79739 81938</a>
          <a href="https://wa.me/919289955099" target="_blank" rel="noopener noreferrer" className="footer-link">WhatsApp: +91 92899 55099</a>
          <p className="footer-link">Working Hours: Mon–Fri, 11 AM–8 PM</p>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">Follow Us</h4>
          <a href="https://www.instagram.com/maqers.in" target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="Instagram">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
            </svg>
          </a>
        </div>

      </div>

      <div className="footer-bottom">
        <p className="footer-copy">Copyright {year} © maqers.in &nbsp;|&nbsp; Handcrafted with ❤️ in India</p>
      </div>
    </footer>
  )
}

export default Footer