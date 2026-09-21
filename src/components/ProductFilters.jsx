import { useState } from 'react'
import './ProductFilters.css'

/**
 * Filter rail for the products grid: a column on desktop, a bottom sheet on
 * phones. It replaces the circular category strip that used to sit above the
 * grid, which could only express one dimension and gave no way to see what
 * was currently applied.
 *
 * Three sections, chosen against the catalogue rather than copied from a
 * larger store. Of 278 products only one is personalisable and two carry a
 * discount, so those familiar filters would sit there doing nothing; price
 * splits cleanly (90 / 117 / 60 / 11) and 14 items are out of stock.
 */

export const PRICE_BANDS = [
  { id: 'under-500', label: 'Under ₹500', min: 0, max: 500 },
  { id: '500-1000', label: '₹500 to ₹1,000', min: 500, max: 1000 },
  { id: '1000-2000', label: '₹1,000 to ₹2,000', min: 1000, max: 2000 },
  { id: 'over-2000', label: 'Over ₹2,000', min: 2000, max: Infinity },
]

const Section = ({ title, count, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`pf-section${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="pf-section-head"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="pf-section-title">
          {title}
          {count > 0 && <span className="pf-count">{count}</span>}
        </span>
        <svg className="pf-chevron" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="pf-section-body">{children}</div>}
    </div>
  )
}

const Check = ({ checked, onChange, label, hint }) => (
  <label className="pf-check">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="pf-box" aria-hidden="true">
      <svg viewBox="0 0 12 12" fill="none">
        <path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
    <span className="pf-check-label">{label}</span>
    {hint != null && <span className="pf-hint">{hint}</span>}
  </label>
)

const ProductFilters = ({
  categories,
  selectedCategories,
  onToggleCategory,
  priceBands,
  onTogglePriceBand,
  inStockOnly,
  onToggleInStock,
  onReset,
  categoryCounts,
  priceCounts,
  activeCount,
}) => (
  <div className="product-filters">
    <div className="pf-head">
      <h2 className="pf-title">Filters</h2>
      {activeCount > 0 && (
        <button type="button" className="pf-reset" onClick={onReset}>
          Clear all
        </button>
      )}
    </div>

    <Section title="Category" count={selectedCategories.length}>
      <div className="pf-scroll">
        {categories.map(cat => (
          <Check
            key={cat.id}
            checked={selectedCategories.includes(cat.id)}
            onChange={() => onToggleCategory(cat.id)}
            label={cat.name}
            hint={categoryCounts.get(cat.id) ?? 0}
          />
        ))}
      </div>
    </Section>

    <Section title="Price" count={priceBands.length}>
      {PRICE_BANDS.map(band => (
        <Check
          key={band.id}
          checked={priceBands.includes(band.id)}
          onChange={() => onTogglePriceBand(band.id)}
          label={band.label}
          hint={priceCounts.get(band.id) ?? 0}
        />
      ))}
    </Section>

    <Section title="Availability" count={inStockOnly ? 1 : 0}>
      <Check checked={inStockOnly} onChange={onToggleInStock} label="In stock only" />
    </Section>
  </div>
)

export default ProductFilters
