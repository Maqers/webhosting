import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import emailjs from '@emailjs/browser'
import { useCart } from '../context/CartContext'
import SeoHead from '../components/SeoHead'
import './Checkout.css'

const UPI_ID = '9650800399@pthdfc'
const WHATSAPP_NUMBER = '919289955099'
const EMAILJS_SERVICE = 'service_ckd0lmj'
const EMAILJS_TEMPLATE = 'template_e2n002e'
const EMAILJS_TEMPLATE_CUSTOMER = 'template_cp8gsrc' // ← replace with your EmailJS template ID
const EMAILJS_PUBLIC_KEY = '7HzR9jrZ1jK9NrkBD'

function getDeliveryFee(subtotal) {
  return 0
}

function generateOrderId() {
  return 'MQ' + Date.now().toString(36).toUpperCase()
}

function AppIcon({ app }) {
  const styles = {
    gpay:    { bg: '#1a73e8', label: 'G Pay' },
    phonepe: { bg: '#5f259f', label: 'Pe' },
    paytm:   { bg: '#002970', label: 'Pt' },
  }
  const s = styles[app]
  return (
    <div style={{
      width: 48, height: 48, borderRadius: 12,
      background: s.bg, display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: '#fff',
      fontWeight: 700, fontSize: app === 'gpay' ? '0.7rem' : '0.85rem',
      letterSpacing: '-0.5px', flexShrink: 0,
    }}>{s.label}</div>
  )
}

export default function Checkout() {
  const { items, total, clearCart } = useCart()
  const navigate = useNavigate()
  const deliveryFee = getDeliveryFee(total)
  const grandTotal = total + deliveryFee

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    address: '', city: '', pincode: '', state: '',
  })
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [errors, setErrors] = useState({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [upiCopied, setUpiCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)

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

  const sendEmail = async (oid, paymentNote) => {
    await emailjs.send(
      EMAILJS_SERVICE,
      EMAILJS_TEMPLATE,
      {
        order_id: oid,
        customer_name: form.name,
        customer_email: form.email || 'Not provided',
        customer_phone: form.phone,
        shipping_address: `${form.address}, ${form.city}, ${form.state} - ${form.pincode}`,
        items: buildItemsText(),
        total: `₹${grandTotal.toLocaleString('en-IN')} (incl. ₹${deliveryFee} delivery)`,
        sellers: buildSellersText(),
        payment_method: paymentNote,
      },
      EMAILJS_PUBLIC_KEY
    )
  }

  const sendCustomerConfirmation = async (oid) => {
    if (!form.email || !form.email.includes('@')) return
    try {
      await emailjs.send(
        EMAILJS_SERVICE,
        EMAILJS_TEMPLATE_CUSTOMER,
        {
          order_id: oid,
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone,
          shipping_address: `${form.address}, ${form.city}, ${form.state} - ${form.pincode}`,
          items_list: buildItemsText(),
          subtotal: `₹${total.toLocaleString('en-IN')}`,
          delivery_fee: 'FREE',
          grand_total: `₹${grandTotal.toLocaleString('en-IN')}`,
          upi_id: UPI_ID,
        },
        EMAILJS_PUBLIC_KEY
      )
    } catch (err) {
      console.error('Customer confirmation email failed:', err)
    }
  }

  const handlePlaceOrder = async () => {
    setSubmitAttempted(true)
    if (!validate()) return
    if (items.length === 0) return

    setSubmitting(true)
    const oid = generateOrderId()
    setOrderId(oid)

    try {
      await sendEmail(oid, 'UPI — Customer will pay via UPI ID or QR scan. Verify before dispatching.')
    } catch (err) {
      console.error('Email failed:', err)
    }

    await sendCustomerConfirmation(oid)

    clearCart()
    setOrderPlaced(true)
    setSubmitting(false)
  }

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(UPI_ID)
      .then(() => {
        setUpiCopied(true)
        setTimeout(() => setUpiCopied(false), 4000)
      })
      .catch(() => {
        setUpiCopied(true)
        setTimeout(() => setUpiCopied(false), 4000)
      })
  }

  const openUPIApp = (app) => {
    const note = encodeURIComponent(`Maqers Order ${pendingOrderId}`)
    const params = `pa=${UPI_ID}&pn=Maqers&am=${grandTotal}&cu=INR&tn=${note}`
    const links = {
      gpay:    `tez://upi/pay?${params}`,
      phonepe: `phonepe://pay?${params}`,
      paytm:   `paytmmp://pay?${params}`,
    }

    setMobileUPIStep(null)
    setAppNotFound(false)

    let appOpened = false
    const onHide = () => { if (document.visibilityState === 'hidden') appOpened = true }
    const onReturn = () => {
      if (document.visibilityState === 'visible') {
        document.removeEventListener('visibilitychange', onHide)
        document.removeEventListener('visibilitychange', onReturn)
        setShowPaymentConfirm(true)
      }
    }
    document.addEventListener('visibilitychange', onHide)
    document.addEventListener('visibilitychange', onReturn)

    setTimeout(() => {
      if (!appOpened) {
        document.removeEventListener('visibilitychange', onHide)
        document.removeEventListener('visibilitychange', onReturn)
        setAppNotFound(true)
        setMobileUPIStep('apps')
      }
    }, 3000)

    window.location.href = links[app]
  }

  const confirmPaymentDone = async () => {
    try {
      await sendEmail(pendingOrderId, `UPI — CUSTOMER CONFIRMED PAYMENT. Verify ₹${grandTotal} received before dispatching.`)
    } catch (err) {
      console.error('Email 2 failed:', err)
    }
    await sendCustomerConfirmation(pendingOrderId)
    clearCart()
    setShowPaymentConfirm(false)
    setMobileUPIStep(null)
    setOrderPlaced(true)
  }

  // ── Screens ───────────────────────────────────────────────────────────────

  if (orderPlaced) return (
    <div className="checkout-success">
      <div className="checkout-success-inner">
        <div className="checkout-success-icon">✓</div>
        <h1>Order Received!</h1>
        <p className="checkout-success-id">Order ID: <strong>{orderId || pendingOrderId}</strong></p>
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

  const hasErrors = submitAttempted && Object.keys(errors).length > 0

  return (
    <div className="checkout-page">
      <SeoHead title="Checkout" noIndex={true} />
      <div className="checkout-container">
        <div className="checkout-header">
          <h1 className="checkout-title">Checkout</h1>
          <span className="checkout-secure">🔒 Secure Checkout</span>
        </div>

        <div className="checkout-grid">
          <div className="checkout-left">

            <div className="checkout-section">
              <h2 className="checkout-section-title">CONTACT INFORMATION</h2>
              <div className="checkout-field">
                <label>FULL NAME *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Enter your full name" />
                {errors.name && <span className="checkout-error">{errors.name}</span>}
              </div>
              <div className="checkout-field">
                <label>EMAIL ADDRESS</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="Enter your email address" />
              </div>
              <div className="checkout-field" style={{ marginBottom: 0 }}>
                <label>PHONE NUMBER *</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Enter your phone number" />
                {errors.phone && <span className="checkout-error">{errors.phone}</span>}
              </div>
            </div>

            <div className="checkout-section">
              <h2 className="checkout-section-title">SHIPPING ADDRESS</h2>
              <div className="checkout-field">
                <label>STREET ADDRESS *</label>
                <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="House no, Street, Area" />
                {errors.address && <span className="checkout-error">{errors.address}</span>}
              </div>
              <div className="checkout-field">
                <label>CITY *</label>
                <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Enter your city" />
                {errors.city && <span className="checkout-error">{errors.city}</span>}
              </div>
              <div className="checkout-field">
                <label>PIN CODE *</label>
                <input value={form.pincode} onChange={e => set('pincode', e.target.value)} placeholder="Enter your pin code" maxLength={6} />
                {errors.pincode && <span className="checkout-error">{errors.pincode}</span>}
              </div>
              <div className="checkout-field" style={{ marginBottom: 0 }}>
                <label>STATE *</label>
                <input value={form.state} onChange={e => set('state', e.target.value)} placeholder="Enter your state" />
                {errors.state && <span className="checkout-error">{errors.state}</span>}
              </div>
            </div>

            <div className="checkout-section">
              <h2 className="checkout-section-title">PAYMENT METHOD</h2>

              {isMobile && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleCopyUPI}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      padding: '0.85rem 1.25rem', borderRadius: 10, cursor: 'pointer',
                      background: upiCopied ? '#2a7a2a' : '#1a1714', color: '#c8a96e',
                      border: 'none', fontSize: '0.9rem', fontFamily: 'var(--font-primary)', fontWeight: 600,
                      transition: 'background 0.2s'
                    }}
                  >
                    {upiCopied ? '✓ Copied!' : '📋 Copy UPI ID'}
                  </button>
                  {upiCopied && (
                    <div style={{
                      background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8,
                      padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#166534', textAlign: 'center'
                    }}>
                      UPI ID copied! Paste it in your UPI app to pay ₹{grandTotal.toLocaleString('en-IN')}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowQR(q => !q)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      padding: '0.85rem 1.25rem', borderRadius: 10, cursor: 'pointer',
                      background: 'transparent', color: '#1a1714',
                      border: '1.5px solid #d0c9bf', fontSize: '0.9rem',
                      fontFamily: 'var(--font-primary)', fontWeight: 600
                    }}
                  >
                    📷 {showQR ? 'Hide QR Code' : 'Scan QR Code'}
                  </button>
                  {showQR && (
                    <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                      <img
                        src="/images/upi-qr.png"
                        alt="UPI QR Code"
                        style={{ width: 180, height: 180, objectFit: 'contain', borderRadius: 8, border: '1px solid #eee' }}
                      />
                      <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.5rem' }}>
                        Scan with any UPI app · UPI ID: <strong style={{ color: '#1a1714' }}>{UPI_ID}</strong>
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = '/images/upi-qr.png';
                          a.download = 'maqers-upi-qr.png';
                          a.click();
                        }}
                        style={{
                          marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #d0c9bf',
                          background: 'transparent', color: '#666', fontSize: '0.78rem',
                          fontFamily: 'var(--font-primary)', cursor: 'pointer'
                        }}
                      >
                        ⬇ Download QR
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!isMobile && (
                <div className="checkout-payment-options">
                  <label className="checkout-payment-option selected">
                    <input type="radio" name="payment" value="upi" checked={true} onChange={() => {}} />
                    <div className="checkout-payment-icon">💳</div>
                    <div>
                      <strong>Pay via UPI</strong>
                      <span>Scan the QR code in the order summary →</span>
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div className="checkout-section checkout-place-section">
              <button className="checkout-place-btn" onClick={handlePlaceOrder} disabled={submitting}>
                {submitting ? 'PLACING ORDER...' : 'PLACE ORDER'}
              </button>
              {hasErrors && (
                <p className="checkout-form-error-summary">
                  ⚠️ Please fill in all required fields marked above before placing your order.
                </p>
              )}
              <p className="checkout-terms">By placing your order you agree to our terms</p>
            </div>
          </div>

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
                  <span className='checkout-free-delivery'>FREE</span>
                </div>
                <p className="checkout-free-msg">🎉 Free delivery!</p>
                <div className="checkout-summary-row checkout-grand-total">
                  <span>Total</span>
                  <span className="checkout-total-val">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {!isMobile && (
                <div className="checkout-upi-box">
                  <p className="checkout-upi-label">Scan & Pay ₹{grandTotal.toLocaleString('en-IN')}</p>
                  <div className="checkout-qr-placeholder">
                    <img src="/images/upi-qr.png" alt="UPI QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6 }} />
                  </div>
                  <p className="checkout-upi-note">
                    Scan with any UPI app, then click Place Order.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}