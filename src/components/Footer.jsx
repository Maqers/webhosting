import './Footer.css'

/**
 * Footer Component
 * 
 * Displays copyright notice with dynamically updated year.
 * Brand name: maqers.in
 */
const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-container">
        <p className="footer-copyright">
          © {currentYear} maqers.in. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer

