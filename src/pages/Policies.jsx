import SeoHead from '../components/SeoHead'
import { getWhatsAppNumber } from '../data/contactInfo'
import './PolicyPage.css'

const Policies = () => {
  return (
    <div className="policy-page">
      <SeoHead
        title="Returns & Refund Policy"
        description="Maqers returns, exchange, and damaged-product policy."
        url="/policies"
      />

      <div className="policy-hero">
        <div className="container">
          <h1 className="policy-title">Policies</h1>
          <p className="policy-subtitle">Please read this before placing your order</p>
        </div>
      </div>

      <div className="container">
        <section className="policy-content">

          <div className="policy-section">
            <h2>Returns & Exchanges</h2>
            <p>We do not accept returns or exchanges. Every piece is handcrafted to order by an independent artisan, and once that work has gone into making your item, we're unable to resell or reuse it. We ask that you review product photos, sizing, and descriptions carefully before ordering.</p>
          </div>

          <div className="policy-section">
            <h2>Damaged, Defective, or Incorrect Orders</h2>
            <p>If your order arrives damaged, defective, or different from what you ordered, we will make it right. Here's what we need from you:</p>
            <ul>
              <li>Record a single, unedited unboxing video that starts before the package is opened and clearly shows the sealed parcel, the shipping label, and the product as it's unboxed.</li>
              <li>Share this video with our team on WhatsApp within 48 hours of delivery. We're unable to process claims without it.</li>
              <li>Our team will review the video and confirm the issue.</li>
              <li>Once confirmed, we will book a reverse pickup (RTO) for the product, and your return or replacement will be initiated.</li>
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

export default Policies
