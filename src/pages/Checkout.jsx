import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import emailjs from '@emailjs/browser'
import { useCart } from '../context/CartContext'
import './Checkout.css'

const UPI_ID = 'PASTE_YOUR_UPI_ID_HERE' // e.g. maqers@okaxis
const WHATSAPP_NUMBER = '919289955099'
const EMAILJS_SERVICE = 'service_ckd0lmj'
const EMAILJS_TEMPLATE = 'template_e2n002e'
const EMAILJS_PUBLIC_KEY = '7HzR9jrZ1jK9NrkBD'

function getDeliveryFee(subtotal) {
  if (subtotal >= 4000) return 0
  if (subtotal >= 3000) return 79
  if (subtotal >= 1500) return 89
  return 99
}

function generateOrderId() {
  return 'MQ' + Date.now().toString(36).toUpperCase()
}

export default function Checkout() {
  const { items, total, clearCart } = useCart()
  const navigate = useNavigate()
  const deliveryFee = getDeliveryFee(total)
  const grandTotal = total + deliveryFee

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    address: '', city: '', pincode: '', state: '',
  })
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Valid 10-digit number required'
    if (!form.address.trim()) e.address = 'Required'
    if (!form.city.trim()) e.city = 'Required'
    if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode)) e.pincode = 'Valid 6-digit PIN required'
    if (!form.state.trim()) e.state = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const buildItemsText = () =>
    items.map(i => `• ${i.title} (ID ${i.id}) x${i.qty}${i.selectedColor ? ` [${i.selectedColor}]` : ''}${i.selectedSize ? ` [${i.selectedSize}]` : ''} — ₹${(i.price * i.qty).toLocaleString('en-IN')}`).join('\n')

  const buildSellersText = () => {
    const sellers = [...new Set(items.filter(i => i.sellerCode).map(i => i.sellerCode))]
    return sellers.length > 0 ? sellers.join(', ') : 'Not assigned'
  }

  const handlePlaceOrder = async () => {
    if (!validate()) return
    if (items.length === 0) return

    setSubmitting(true)
    const oid = generateOrderId()
    setOrderId(oid)

    const itemsText = buildItemsText()
    const sellersText = buildSellersText()
    const totalText = `₹${grandTotal.toLocaleString('en-IN')} (incl. ₹${deliveryFee} delivery)`
    const address = `${form.address}, ${form.city}, ${form.state} - ${form.pincode}`

    try {
      // Send email via EmailJS
      await emailjs.send(
        EMAILJS_SERVICE,
        EMAILJS_TEMPLATE,
        {
          order_id: oid,
          customer_name: form.name,
          customer_email: form.email || 'Not provided',
          customer_phone: form.phone,
          shipping_address: address,
          items: itemsText,
          total: totalText,
          sellers: sellersText,
          payment_method: paymentMethod === 'upi' ? 'UPI Direct' : 'Pay via WhatsApp',
        },
        EMAILJS_PUBLIC_KEY
      )
    } catch (err) {
      console.error('Email failed:', err)
    }

    clearCart()
    setOrderPlaced(true)
    setSubmitting(false)
  }

  if (orderPlaced) return (
    <div className="checkout-success">
      <div className="checkout-success-inner">
        <div className="checkout-success-icon">✓</div>
        <h1>Order Received!</h1>
        <p className="checkout-success-id">Order ID: <strong>{orderId}</strong></p>
        <p>Thank you, {form.name}. We've received your order and will confirm it shortly via email or WhatsApp.</p>
        <p className="checkout-success-note">Our team will reach out to you at <strong>{form.phone}</strong> to confirm payment and delivery details.</p>
        <button className="checkout-success-btn" onClick={() => navigate('/products')}>Continue Shopping</button>
      </div>
    </div>
  )

  if (items.length === 0) return (
    <div className="checkout-empty">
      <h2>Your cart is empty</h2>
      <button onClick={() => navigate('/products')} className="checkout-success-btn">Browse Products</button>
    </div>
  )

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <h1 className="checkout-title">Checkout</h1>
          <span className="checkout-secure">🔒 Secure Checkout</span>
        </div>

        <div className="checkout-grid">
          {/* Left: Form */}
          <div className="checkout-left">
            {/* Contact */}
            <div className="checkout-section">
              <h2 className="checkout-section-title">CONTACT INFORMATION</h2>
              <div className="checkout-row-2">
                <div className="checkout-field">
                  <label>FULL NAME *</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Priya Sharma" />
                  {errors.name && <span className="checkout-error">{errors.name}</span>}
                </div>
                <div className="checkout-field">
                  <label>EMAIL ADDRESS</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="priya@email.com" />
                </div>
              </div>
              <div className="checkout-field">
                <label>PHONE NUMBER *</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="9876543210" />
                {errors.phone && <span className="checkout-error">{errors.phone}</span>}
              </div>
            </div>

            {/* Shipping */}
            <div className="checkout-section">
              <h2 className="checkout-section-title">SHIPPING ADDRESS</h2>
              <div className="checkout-field">
                <label>STREET ADDRESS *</label>
                <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="House no, Street, Area" />
                {errors.address && <span className="checkout-error">{errors.address}</span>}
              </div>
              <div className="checkout-row-2">
                <div className="checkout-field">
                  <label>CITY *</label>
                  <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Mumbai" />
                  {errors.city && <span className="checkout-error">{errors.city}</span>}
                </div>
                <div className="checkout-field">
                  <label>PIN CODE *</label>
                  <input value={form.pincode} onChange={e => set('pincode', e.target.value)} placeholder="400001" maxLength={6} />
                  {errors.pincode && <span className="checkout-error">{errors.pincode}</span>}
                </div>
              </div>
              <div className="checkout-field">
                <label>STATE *</label>
                <input value={form.state} onChange={e => set('state', e.target.value)} placeholder="Maharashtra" />
                {errors.state && <span className="checkout-error">{errors.state}</span>}
              </div>
            </div>

            {/* Payment */}
            <div className="checkout-section">
              <h2 className="checkout-section-title">PAYMENT METHOD</h2>
              <div className="checkout-payment-options">
                <label className={`checkout-payment-option ${paymentMethod === 'upi' ? 'selected' : ''}`}>
                  <input type="radio" name="payment" value="upi" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} />
                  <div className="checkout-payment-icon">📱</div>
                  <div>
                    <strong>UPI Direct</strong>
                    <span>GPay · PhonePe · Paytm</span>
                  </div>
                </label>
                <label className={`checkout-payment-option ${paymentMethod === 'whatsapp' ? 'selected' : ''}`}>
                  <input type="radio" name="payment" value="whatsapp" checked={paymentMethod === 'whatsapp'} onChange={() => setPaymentMethod('whatsapp')} />
                  <div className="checkout-payment-icon">💬</div>
                  <div>
                    <strong>Pay via WhatsApp</strong>
                    <span>We'll confirm your order on WhatsApp</span>
                  </div>
                </label>
              </div>

              {paymentMethod === 'upi' && (
                <div className="checkout-upi-box">
                  <p className="checkout-upi-label">Scan to pay</p>
                  <div className="checkout-qr-placeholder">
                    <img src="/images/upi-qr.png" alt="UPI QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6 }} />
                  </div>
                  <p className="checkout-upi-note">
                    Scan the QR code with GPay, PhonePe, or Paytm to pay ₹{grandTotal.toLocaleString('en-IN')}. We'll confirm your order via email soon.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Order summary */}
          <div className="checkout-right">
            <div className="checkout-summary">
              <h2 className="checkout-summary-title">ORDER ({items.length} {items.length === 1 ? 'ITEM' : 'ITEMS'})</h2>
              <div className="checkout-summary-items">
                {items.map(item => (
                  <div key={item.key} className="checkout-summary-item">
                    <div className="checkout-summary-img">
                      {item.image && <img src={item.image} alt={item.title} />}
                      <span className="checkout-summary-qty">{item.qty}</span>
                    </div>
                    <div className="checkout-summary-info">
                      <p className="checkout-summary-name">{item.title}</p>
                      {item.selectedColor && <p className="checkout-summary-variant">{item.selectedColor}</p>}
                      {item.selectedSize && <p className="checkout-summary-variant">{item.selectedSize}</p>}
                    </div>
                    <p className="checkout-summary-price">₹{(item.price * item.qty).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
              <div className="checkout-summary-breakdown">
                <div className="checkout-summary-row">
                  <span>Subtotal</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
                <div className="checkout-summary-row">
                  <span>Delivery</span>
                  <span className={deliveryFee === 0 ? 'checkout-free-delivery' : ''}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>
                {deliveryFee === 0 && (
                  <p className="checkout-free-msg">🎉 You qualify for free delivery!</p>
                )}
                <div className="checkout-summary-row checkout-grand-total">
                  <span>Total</span>
                  <span className="checkout-total-val">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <button className="checkout-place-btn" onClick={handlePlaceOrder} disabled={submitting}>
                {submitting ? 'PLACING ORDER...' : 'PLACE ORDER'}
              </button>
              <p className="checkout-terms">By placing your order you agree to our terms</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}