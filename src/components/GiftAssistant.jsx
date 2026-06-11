import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './GiftAssistant.css'

const RECIPIENTS = ['Mom', 'Dad', 'Partner', 'Friend', 'Sister', 'Brother', 'Colleague', 'Child']
const OCCASIONS = ['Birthday', 'Anniversary', 'Wedding', 'Festival', 'Just Because', 'Thank You', 'New Baby']
const BUDGETS = [
  { label: 'Under ₹300', min: 0, max: 300 },
  { label: '₹300 – ₹600', min: 300, max: 600 },
  { label: '₹600 – ₹1,500', min: 600, max: 1500 },
  { label: 'Above ₹1,500', min: 1500, max: 99999 },
]

export default function GiftAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [recipient, setRecipient] = useState('')
  const [occasion, setOccasion] = useState('')
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const modalRef = useRef(null)

  const canFind = recipient && occasion && budget

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e) => { if (e.key === 'Escape') setIsOpen(false) }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      const w = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${w}px`
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [isOpen])

  const handleOpen = () => {
    setIsOpen(true)
    setResults(null)
    setError('')
  }

  const handleClose = () => {
    setIsOpen(false)
    setResults(null)
    setError('')
    setRecipient('')
    setOccasion('')
    setBudget(null)
  }

  const handleFind = async () => {
    if (!canFind) return
    setLoading(true)
    setError('')
    setResults(null)

    try {
      // Dynamic import to keep catalog out of the initial bundle
      const { getAllProducts } = await import('../data/catalog')
      const allProducts = getAllProducts().filter(Boolean)
      const budgetMatches = allProducts.filter(p => p.inStock && p.price >= budget.min && p.price <= budget.max)
      const pool = budgetMatches.length >= 6 ? budgetMatches : allProducts.filter(p => p.inStock)

      const products = pool.map(p => ({
        id: p.id,
        title: p.title,
        category: p.categoryId,
        price: p.price,
        tags: (p.tags || []).slice(0, 4),
        slug: p.slug,
        image: p.images?.[0] || '',
      }))

      const res = await fetch('/api/gift-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient, occasion, budget: budget.label, products }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
      setResults(data.recommendations)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResults(null)
    setError('')
    setRecipient('')
    setOccasion('')
    setBudget(null)
  }

  return (
    <>
      <button className="gift-assistant-btn" onClick={handleOpen} aria-label="Find the perfect gift" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true">
          <polyline points="20 12 20 22 4 22 4 12" />
          <rect x="2" y="7" width="20" height="5" />
          <line x1="12" y1="22" x2="12" y2="7" />
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
        <span>Gift Finder</span>
      </button>

      {isOpen && (
        <div className="gift-assistant-backdrop" onClick={handleClose} aria-hidden="true" />
      )}

      {isOpen && (
        <div ref={modalRef} className="gift-assistant-modal" role="dialog" aria-modal="true" aria-label="Gift Finder">
          <div className="gift-modal-header">
            <div>
              <h2 className="gift-modal-title">Find the Perfect Gift</h2>
              <p className="gift-modal-subtitle">3 quick questions — we'll find something special</p>
            </div>
            <button className="gift-modal-close" onClick={handleClose} aria-label="Close" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="18" height="18" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="gift-modal-body">
            {loading && (
              <div className="gift-loading">
                <div className="gift-spinner" />
                <p>Finding perfect gifts for you…</p>
              </div>
            )}

            {!loading && results && (
              <div className="gift-results">
                <p className="gift-results-label">
                  Great picks for <strong>{recipient}</strong> — <strong>{occasion}</strong>
                </p>
                <div className="gift-results-list">
                  {results.map(r => (
                    <div className="gift-result-card" key={r.id}>
                      {r.image && (
                        <div className="gift-result-img">
                          <img src={r.image} alt={r.title} loading="lazy" />
                        </div>
                      )}
                      <div className="gift-result-info">
                        <span className="gift-result-title">{r.title}</span>
                        <span className="gift-result-price">₹{r.price}</span>
                        <p className="gift-result-reason">{r.reason}</p>
                        <Link to={`/product/${r.slug}`} className="gift-result-link" onClick={handleClose}>
                          View Product →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="gift-try-again" onClick={handleReset} type="button">
                  Try different options
                </button>
              </div>
            )}

            {!loading && !results && (
              <div className="gift-questions">
                {error && <p className="gift-error">{error}</p>}

                <div className="gift-question-section">
                  <p className="gift-question-label">Who is it for?</p>
                  <div className="gift-chips">
                    {RECIPIENTS.map(r => (
                      <button
                        key={r}
                        type="button"
                        className={`gift-chip${recipient === r ? ' selected' : ''}`}
                        onClick={() => setRecipient(r)}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="gift-question-section">
                  <p className="gift-question-label">What's the occasion?</p>
                  <div className="gift-chips">
                    {OCCASIONS.map(o => (
                      <button
                        key={o}
                        type="button"
                        className={`gift-chip${occasion === o ? ' selected' : ''}`}
                        onClick={() => setOccasion(o)}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="gift-question-section">
                  <p className="gift-question-label">What's your budget?</p>
                  <div className="gift-chips">
                    {BUDGETS.map(b => (
                      <button
                        key={b.label}
                        type="button"
                        className={`gift-chip${budget?.label === b.label ? ' selected' : ''}`}
                        onClick={() => setBudget(b)}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="gift-find-btn"
                  onClick={handleFind}
                  disabled={!canFind}
                  type="button"
                >
                  Find Gifts
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
