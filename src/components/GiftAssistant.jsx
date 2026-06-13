import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './GiftAssistant.css'

const CATEGORY_NAMES = {
  'Charm-accessories': 'Charms & Bag Accessories',
  'Home-decor': 'Home Decor',
  'Handbags': 'Bags & Purses',
  'Handmade-Accessories': 'Handmade Accessories',
  'Oxidised-jewellery': 'Oxidised Jewellery',
  'Candles': 'Scented Candles',
  'Florals': 'Florals & Bouquets',
  'Wedding-Gifts': 'Wedding Gifts',
  'Kids-Accessories': 'Kids Accessories',
  'Handmade-Soaps': 'Handmade Soaps',
  'Customised-Hampers': 'Custom Gift Hampers',
  'Cosmetics': 'Cosmetics',
  'resin-products': 'Resin Art',
  'Frames&Paintings': 'Art & Frames',
}

const RECIPIENTS = [
  { label: 'Mom',        recipientKey: 'for-your-mom' },
  { label: 'Dad',        recipientKey: 'for-your-dad' },
  { label: 'Girlfriend', recipientKey: 'for-your-girlfriend' },
  { label: 'Boyfriend',  recipientKey: 'for-your-boyfriend' },
  { label: 'Friend',     recipientKey: 'for-your-best-friend' },
  { label: 'Sister',     recipientKey: 'for-your-sister' },
  { label: 'Brother',    recipientKey: 'for-your-brother' },
  { label: 'Colleague',  recipientKey: 'for-your-work-friend' },
  { label: 'Child',      recipientKey: 'for-children' },
]

const OCCASIONS = [
  { label: 'Birthday',    occasionKey: 'birthday' },
  { label: 'Anniversary', occasionKey: 'for-your-girlfriend' },
  { label: 'Wedding',     occasionKey: 'shaadi-fever' },
  { label: 'Festival',    occasionKey: 'occasion-gifts' },
  { label: 'Just Because', occasionKey: null },
  { label: 'Thank You',   occasionKey: null },
  { label: 'New Baby',    occasionKey: 'godh-bharai' },
]

const BUDGETS = [
  { label: 'Under ₹300',    min: 0,    max: 300 },
  { label: '₹300 – ₹600',  min: 300,  max: 600 },
  { label: '₹600 – ₹1,500', min: 600,  max: 1500 },
  { label: 'Above ₹1,500', min: 1500, max: 99999 },
]

export default function GiftAssistant() {
  const [isOpen, setIsOpen]       = useState(false)
  const [recipient, setRecipient] = useState(null)   // full object { label, recipientKey }
  const [occasion, setOccasion]   = useState(null)   // full object { label, occasionKey }
  const [budget, setBudget]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [results, setResults]     = useState(null)
  const [error, setError]         = useState('')
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
    setRecipient(null)
    setOccasion(null)
    setBudget(null)
  }

  const handleFind = async () => {
    if (!canFind) return
    setLoading(true)
    setError('')
    setResults(null)

    try {
      // Dynamic import to keep catalog out of the initial bundle
      const { getAllProducts, occasionProductMap } = await import('../data/catalog')
      const allProducts = getAllProducts().filter(Boolean)

      // Always use the recipient's curated list as the pool.
      // Occasion context is passed to the model via the prompt — not used to narrow the product pool,
      // since occasion lists are too small and skew the category distribution badly.
      const recipientKey = recipient.recipientKey
      const occasionKey  = occasion.occasionKey

      const curatedIds = recipientKey ? (occasionProductMap[recipientKey] || null) : null

      // Start from curated pool if available, otherwise all products
      let pool = curatedIds
        ? allProducts.filter(p => curatedIds.includes(p.id))
        : allProducts

      // Apply budget filter within the curated pool
      const budgetFiltered = pool.filter(p => p.inStock && p.price >= budget.min && p.price <= budget.max)

      // If budget filter leaves fewer than 8 products, relax it slightly (±20%)
      const relaxedMin = budget.min * 0.8
      const relaxedMax = budget.max === 99999 ? 99999 : budget.max * 1.2
      const finalPool = budgetFiltered.length >= 8
        ? budgetFiltered
        : pool.filter(p => p.inStock && p.price >= relaxedMin && p.price <= relaxedMax)

      // If still tiny, fall back to all in-stock products in budget
      const sendPool = finalPool.length >= 5
        ? finalPool
        : allProducts.filter(p => p.inStock && p.price >= budget.min && p.price <= budget.max)

      // Map to API payload — send FULL description (not truncated)
      const products = sendPool.map(p => ({
        id: p.id,
        title: p.title,
        category: CATEGORY_NAMES[p.categoryId] || p.categoryId,
        price: p.price,
        // Full description, clean up escaped newlines
        desc: (p.description || '').replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim(),
        slug: p.slug,
        image: p.images?.[0] || '',
      }))

      const res = await fetch('/api/gift-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: recipient.label,
          occasion: occasion.label,
          budget: budget.label,
          occasionKey,
          recipientKey,
          products,
        }),
      })

      let data
      try {
        data = await res.json()
      } catch {
        throw new Error('Server returned an unexpected response. Please try again.')
      }

      if (!res.ok) throw new Error(data?.error || 'Something went wrong. Please try again.')
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
    setRecipient(null)
    setOccasion(null)
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
                  Great picks for <strong>{recipient.label}</strong> — <strong>{occasion.label}</strong>
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
                        key={r.label}
                        type="button"
                        className={`gift-chip${recipient?.label === r.label ? ' selected' : ''}`}
                        onClick={() => setRecipient(r)}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="gift-question-section">
                  <p className="gift-question-label">What's the occasion?</p>
                  <div className="gift-chips">
                    {OCCASIONS.map(o => (
                      <button
                        key={o.label}
                        type="button"
                        className={`gift-chip${occasion?.label === o.label ? ' selected' : ''}`}
                        onClick={() => setOccasion(o)}
                      >
                        {o.label}
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