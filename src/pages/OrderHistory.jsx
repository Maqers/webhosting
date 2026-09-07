import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabaseRest } from '../config/supabaseConfig'
import { getProductById } from '../data/catalog'
import { fetchUserReviews, submitQuickRating } from '../utils/reviewsApi'
import SeoHead from '../components/SeoHead'
import './OrderHistory.css'

function ItemRating({ product, review, onRated }) {
  const [hover, setHover] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleClick = async (n) => {
    setError('')
    setSaving(true)
    try {
      await onRated(product.id, n)
    } catch (err) {
      setError('Could not save your rating.')
    } finally {
      setSaving(false)
    }
  }

  const activeRating = hover || review?.rating || 0

  return (
    <div className="order-card-rate-row">
      <span className="order-card-rate-label">
        {review?.rating ? 'You rated this' : 'Rate your product'}
      </span>
      <div className="order-card-rate-stars" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            disabled={saving}
            onMouseEnter={() => setHover(n)}
            onClick={() => handleClick(n)}
            aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
          >
            <svg viewBox="0 0 24 24" width="20" height="20"
              fill={n <= activeRating ? "var(--primary-color)" : "none"}
              stroke="var(--primary-color)" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        ))}
      </div>
      {review?.rating && !review.text && (
        <Link to={`/product/${product.slug}`} className="order-card-review-link">Add details →</Link>
      )}
      {review?.rating && review.text && (
        <Link to={`/product/${product.slug}`} className="order-card-review-link">Edit review →</Link>
      )}
      {error && <span className="order-card-rate-error">{error}</span>}
    </div>
  )
}

export default function OrderHistory() {
  const { isLoggedIn, user, accessToken, openLoginModal } = useAuth()
  const [orders, setOrders] = useState([])
  const [userReviews, setUserReviews] = useState({}) // { [productId]: review }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoggedIn || !user?.id) { setLoading(false); return }
    Promise.all([
      supabaseRest(`orders?user_id=eq.${user.id}&order=created_at.desc`, { accessToken }),
      fetchUserReviews(user.id, accessToken),
    ])
      .then(([rows, reviews]) => { setOrders(rows || []); setUserReviews(reviews) })
      .catch(() => setError('Could not load your orders right now.'))
      .finally(() => setLoading(false))
  }, [isLoggedIn, user?.id, accessToken])

  const handleRated = async (productId, rating) => {
    const name = user.user_metadata?.full_name || user.user_metadata?.name || (user.email ? user.email.split('@')[0] : user.phone) || 'Customer'
    const updated = await submitQuickRating({
      existingReview: userReviews[productId],
      productId, userId: user.id, accessToken, name, rating,
    })
    setUserReviews(prev => ({ ...prev, [productId]: updated }))
  }

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
                  {(order.items || []).map((item, i) => {
                    const linkedProduct = getProductById(item.id)
                    return (
                    <div className="order-card-item-block" key={i}>
                      <div className="order-card-item">
                        {item.image && (
                          linkedProduct
                            ? <Link to={`/product/${linkedProduct.slug}`}><img src={item.image} alt={item.title} /></Link>
                            : <img src={item.image} alt={item.title} />
                        )}
                        <div className="order-card-item-info">
                          {linkedProduct
                            ? <Link to={`/product/${linkedProduct.slug}`} className="order-card-item-title-link"><p className="order-card-item-title">{item.title}</p></Link>
                            : <p className="order-card-item-title">{item.title}</p>
                          }
                          <p className="order-card-item-meta">x{item.qty}{item.selectedColor ? ` · ${item.selectedColor}` : ''}{item.selectedSize ? ` · ${item.selectedSize}` : ''}</p>
                        </div>
                        <p className="order-card-item-price">₹{(item.price * item.qty).toLocaleString('en-IN')}</p>
                      </div>
                      {linkedProduct && (
                        <ItemRating product={linkedProduct} review={userReviews[linkedProduct.id]} onRated={handleRated} />
                      )}
                    </div>
                    )
                  })}
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
