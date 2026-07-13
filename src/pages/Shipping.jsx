import SeoHead from '../components/SeoHead'
import { getWhatsAppNumber } from '../data/contactInfo'
import './PolicyPage.css'

const Shipping = () => {
  return (
    <div className="policy-page">
      <SeoHead
        title="Shipping Policy"
        description="Maqers shipping timelines and delivery information."
        url="/shipping"
      />

      <div className="policy-hero">
        <div className="container">
          <h1 className="policy-title">Shipping</h1>
          <p className="policy-subtitle">Please read this before placing your order</p>
        </div>
      </div>

      <div className="container">
        <section className="policy-content">

          <div className="policy-section">
            <h2>Shipping</h2>
            <p>Every product on Maqers is handmade, and many are made specially for you only after your order is placed. Because of this, dispatch and delivery timelines vary by product and seller, the estimated delivery window is shown on each product page.</p>
            <ul>
              <li>Once a package is handed over to our courier partner, we are not liable for delays caused by the courier.</li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>Questions?</h2>
            <p>
              Message us on{' '}
              <a href={`https://wa.me/${getWhatsAppNumber()}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
              {' '}and our team will help you out.
            </p>
          </div>

        </section>
      </div>
    </div>
  )
}

export default Shipping
