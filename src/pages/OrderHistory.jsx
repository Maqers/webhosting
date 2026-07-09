import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabaseRest } from '../config/supabaseConfig'
import SeoHead from '../components/SeoHead'
import './OrderHistory.css'

export default function OrderHistory() {
  const { isLoggedIn, user, accessToken, openLoginModal } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoggedIn || !user?.id) { setLoading(false); return }
    supabaseRest(`orders?user_id=eq.${user.id}&order=created_at.desc`, { accessToken })
      .then(rows => setOrders(rows || []))
      .catch(() => setError('Could not load your orders right now.'))
      .finally(() => setLoading(false))
  }, [isLoggedIn, user?.id, accessToken])

  return (
    <div className="order-history-page">
      <SeoHead title="My Orders" noIndex={true} />
      <div className="order-history-container">
        <h1 className="order-history-title">My Orders</h1>

        {!isLoggedIn && (
          <div className="order-history-empty">
            <p>Log in with your phone number to see your past orders.</p>
            <button className="order-history-login-btn" onClick={openLoginModal} type="button">Log In</button>
          </div>
        )}

        {isLoggedIn && loading && <p className="order-history-loading">Loading your orders...</p>}
        {isLoggedIn && error && <p className="order-history-error">{error}</p>}

        {isLoggedIn && !loading && !error && orders.length === 0 && (
          <div className="order-history-empty">
            <p>You haven't placed any orders yet.</p>
          </div>
        )}

        {isLoggedIn && !loading && orders.length > 0 && (
          <div className="order-history-list">
            {orders.map(order => (
              <div className="order-card" key={order.id}>
                <div className="order-card-header">
                  <div>
                    <p className="order-card-ref">Order {order.order_ref}</p>
                    <p className="order-card-date">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span className={`order-card-status order-card-status--${order.status}`}>{order.status}</span>
                </div>
                <div className="order-card-items">
                  {(order.items || []).map((item, i) => (
                    <div className="order-card-item" key={i}>
                      {item.image && <img src={item.image} alt={item.title} />}
                      <div className="order-card-item-info">
                        <p className="order-card-item-title">{item.title}</p>
                        <p className="order-card-item-meta">x{item.qty}{item.selectedColor ? ` · ${item.selectedColor}` : ''}{item.selectedSize ? ` · ${item.selectedSize}` : ''}</p>
                      </div>
                      <p className="order-card-item-price">₹{(item.price * item.qty).toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>
                <div className="order-card-total">
                  <span>Total</span>
                  <span>₹{Number(order.total).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
