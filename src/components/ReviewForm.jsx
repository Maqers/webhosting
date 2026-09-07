import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { submitReview } from '../utils/reviewsApi'
import './ReviewForm.css'

const MAX_PHOTOS = 4

export default function ReviewForm({ productId, onSubmitted }) {
  const { user, accessToken } = useAuth()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [text, setText] = useState('')
  const [photos, setPhotos] = useState([]) // { file, preview }
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleFiles = (fileList) => {
    const room = MAX_PHOTOS - photos.length
    Array.from(fileList).filter(f => f.type.startsWith('image/')).slice(0, room).forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => setPhotos(prev => prev.length >= MAX_PHOTOS ? prev : [...prev, { file, preview: ev.target.result }])
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (rating === 0) { setError('Pick a star rating.'); return }
    if (!text.trim()) { setError('Add a few words about the product.'); return }
    setSubmitting(true)
    try {
      await submitReview({
        productId,
        userId: user.id,
        accessToken,
        name: user.user_metadata?.full_name || user.user_metadata?.name || (user.email ? user.email.split('@')[0] : user.phone) || 'Customer',
        rating,
        text: text.trim(),
        photoFiles: photos.map(p => p.file),
      })
      setDone(true)
      onSubmitted?.()
    } catch (err) {
      setError(err.message || 'Could not submit your review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return <div className="review-form-card review-form-done">Thanks — your review is now live!</div>
  }

  return (
    <form className="review-form-card" onSubmit={handleSubmit}>
      <h4 className="review-form-title">Write a review</h4>

      <div className="review-form-stars" onMouseLeave={() => setHoverRating(0)}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            className="review-form-star"
            onMouseEnter={() => setHoverRating(n)}
            onClick={() => setRating(n)}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
          >
            <svg viewBox="0 0 24 24" width="26" height="26"
              fill={n <= (hoverRating || rating) ? "var(--primary-color)" : "none"}
              stroke="var(--primary-color)" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        ))}
      </div>

      <textarea
        className="review-form-textarea"
        placeholder="How was it? What did you like?"
        value={text}
        onChange={e => setText(e.target.value)}
        rows={3}
      />

      <div className="review-form-photos">
        {photos.map((p, i) => (
          <div key={i} className="review-form-photo-thumb">
            <img src={p.preview} alt="" />
            <button type="button" onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))} aria-label="Remove photo">×</button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <label className="review-form-photo-add">
            + Photo
            <input type="file" accept="image/*" multiple hidden onChange={e => handleFiles(e.target.files)} />
          </label>
        )}
      </div>

      {error && <p className="review-form-error">{error}</p>}

      <button className="review-form-submit" type="submit" disabled={submitting}>
        {submitting ? 'Posting...' : 'Post Review'}
      </button>
    </form>
  )
}
