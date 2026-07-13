import SeoHead from '../components/SeoHead'
import { getWhatsAppNumber } from '../data/contactInfo'
import './ShippingReturns.css'

const ShippingReturns = () => {
  return (
    <div className="policy-page">
      <SeoHead
        title="Shipping & Returns Policy"
        description="Maqers shipping timelines and our returns, exchange, and damaged-product policy."
        url="/shipping-returns"
      />

      <div className="policy-hero">
        <div className="container">
          <h1 className="policy-title">Shipping & Returns</h1>
          <p className="policy-subtitle">Please read this before placing your order</p>
        </div>
      </div>

      <div className="container">
        <section className="policy-content">

          <div className="policy-section">
            <h2>Shipping</h2>
            <p>Every product on Maqers is handmade, and many are made specially for you only after your order is placed. Because of this, dispatch and delivery timelines vary by product and seller, the estimated delivery window is shown on each product page.</p>
            <ul>
              <li>Order prioritisation and expedited fulfilment requests are handled on a case by case basis and cannot be guaranteed for a specific date.</li>
              <li>Once a package is handed over to our courier partner, we are not liable for delays caused by the courier.</li>
              <li>You will receive tracking details on WhatsApp once your order is shipped.</li>
            </ul>
          </div>

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

export default ShippingReturns
