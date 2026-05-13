import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import emailjs from '@emailjs/browser'
import { useCart } from '../context/CartContext'
import './Checkout.css'

const UPI_ID = '9650800399@pthdfc' // e.g. maqers@okaxis
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
  const [pendingOrderId, setPendingOrderId] = useState('')

  // Mobile UPI modal: null | 'choose' | 'qr' | 'apps'
  const [mobileUPIStep, setMobileUPIStep] = useState(null)
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false)
  const [appNotFound, setAppNotFound] = useState(false)

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

  const handlePlaceOrder = async () => {
    setSubmitAttempted(true)
    if (!validate()) return
    if (items.length === 0) return

    setSubmitting(true)
    const oid = generateOrderId()
    setOrderId(oid)
    setPendingOrderId(oid)

    try {
      await sendEmail(oid,
        paymentMethod === 'upi'
          ? 'UPI App — VERIFY PAYMENT IN YOUR UPI APP BEFORE DISPATCHING'
          : 'QR Code — VERIFY PAYMENT IN YOUR UPI APP BEFORE DISPATCHING'
      )
    } catch (err) {
      console.error('Email 1 failed:', err)
    }

    if (paymentMethod === 'upi') {
      setSubmitting(false)
      if (isMobile) {
        setMobileUPIStep('apps') // go straight to app chooser
      } else {
        clearCart()
        setOrderPlaced(true)
      }
      return
    }

    if (paymentMethod === 'qr') {
      setSubmitting(false)
      if (isMobile) {
        setMobileUPIStep('qr') // go straight to QR modal
      } else {
        clearCart()
        setOrderPlaced(true)
      }
      return
    }

    clearCart()
    setOrderPlaced(true)
    setSubmitting(false)
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
      <div className="checkout-container">
        <div className="checkout-header">
          <h1 className="checkout-title">Checkout</h1>
          <span className="checkout-secure">🔒 Secure Checkout</span>
        </div>

        <div className="checkout-grid">
          <div className="checkout-left">

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

            <div className="checkout-section">
              <h2 className="checkout-section-title">PAYMENT METHOD</h2>
              <div className="checkout-payment-options">
                <label className={`checkout-payment-option ${paymentMethod === 'upi' ? 'selected' : ''}`}>
                  <input type="radio" name="payment" value="upi" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} />
                  <div className="checkout-payment-icon">📲</div>
                  <div>
                    <strong>Pay via UPI App</strong>
                    <span>GPay · PhonePe · Paytm</span>
                  </div>
                </label>
                <label className={`checkout-payment-option ${paymentMethod === 'qr' ? 'selected' : ''}`}>
                  <input type="radio" name="payment" value="qr" checked={paymentMethod === 'qr'} onChange={() => setPaymentMethod('qr')} />
                  <div className="checkout-payment-icon">📷</div>
                  <div>
                    <strong>Scan QR Code</strong>
                    <span>Open any UPI app and scan</span>
                  </div>
                </label>
              </div>
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

              {/* Desktop only: QR in sidebar for both options */}
              {(paymentMethod === 'upi' || paymentMethod === 'qr') && !isMobile && (
                <div className="checkout-upi-box">
                  <p className="checkout-upi-label">
                    {paymentMethod === 'qr' ? 'Scan & Pay' : 'Or scan to pay'} ₹{grandTotal.toLocaleString('en-IN')}
                  </p>
                  <div className="checkout-qr-placeholder">
                    <img src="/images/upi-qr.png" alt="UPI QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6 }} />
                  </div>
                  <p className="checkout-upi-note">
                    Scan with any UPI app, fill in your details below, then click Place Order.
                  </p>
                </div>
              )}

              {paymentMethod === 'upi' && isMobile && (
                <p className="checkout-fill-info">
                  After clicking Place Order, your UPI app will open with the amount prefilled.
                </p>
              )}

              {paymentMethod === 'qr' && isMobile && (
                <p className="checkout-fill-info">
                  After clicking Place Order, a QR code will appear for you to scan.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile: QR code ───────────────────────────────────────────── */}
      {mobileUPIStep === 'qr' && (
        <div className="upi-chooser-overlay">
          <div className="upi-chooser-modal">
            <h2>Scan & Pay ₹{grandTotal.toLocaleString('en-IN')}</h2>
            <p>Open any UPI app and scan this code</p>
            <div className="checkout-qr-placeholder" style={{ margin: '1rem auto', width: 180, height: 180 }}>
              <img src="/images/upi-qr.png" alt="UPI QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6 }} />
            </div>
            <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1rem' }}>
              After paying, tap below to confirm your order.
            </p>
            <button onClick={confirmPaymentDone} className="checkout-place-btn" style={{ margin: '0 0 0.75rem' }}>
              ✓ I've paid — Confirm Order
            </button>
            <button className="upi-chooser-cancel" onClick={() => setMobileUPIStep(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Mobile: UPI App chooser ───────────────────────────────────── */}
      {mobileUPIStep === 'apps' && (
        <div className="upi-chooser-overlay">
          <div className="upi-chooser-modal">
            <h2>Pay ₹{grandTotal.toLocaleString('en-IN')}</h2>
            <p>Choose your UPI app</p>
            {appNotFound && (
              <div className="upi-app-error">
                ⚠️ That app doesn't seem to be installed. Try another or scan the QR code instead.
              </div>
            )}
            <div className="upi-redirect-notice">
              📲 You'll be redirected to your payment app. After paying, <strong>come back here</strong> to confirm your order.
            </div>
            <div className="upi-chooser-buttons">
              <button onClick={() => openUPIApp('gpay')} className="upi-app-btn">
                <AppIcon app="gpay" />
                <span>Google Pay</span>
              </button>
              <button onClick={() => openUPIApp('phonepe')} className="upi-app-btn">
                <AppIcon app="phonepe" />
                <span>PhonePe</span>
              </button>
              <button onClick={() => openUPIApp('paytm')} className="upi-app-btn">
                <AppIcon app="paytm" />
                <span>Paytm</span>
              </button>
            </div>
            <button className="upi-chooser-cancel" onClick={() => setMobileUPIStep(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Payment confirmation (after returning from UPI app) ───────── */}
      {showPaymentConfirm && (
        <div className="upi-chooser-overlay">
          <div className="upi-chooser-modal">
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💳</div>
            <h2>Payment Complete?</h2>
            <p>Did you successfully pay ₹{grandTotal.toLocaleString('en-IN')} via UPI?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button onClick={confirmPaymentDone} className="checkout-place-btn" style={{ margin: 0 }}>
                ✓ Yes, I've paid
              </button>
              <button
                onClick={() => { setShowPaymentConfirm(false); setMobileUPIStep('apps') }}
                className="upi-app-btn"
                style={{ flexDirection: 'row', gap: '0.5rem', justifyContent: 'center' }}
              >
                ↩ No, try again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}