import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { products } from '../data/products'
import ImageWithFallback from './ImageWithFallback'
import './SearchBar.css'

const SearchBar = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const navigate = useNavigate()

  const handleSearch = (query) => {
    if (query.trim()) {
      const results = products.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      )
      if (onSearch) {
        onSearch(results)
      }
      setShowSuggestions(false)
    }
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    
    if (value.trim().length > 0) {
      const filtered = products.filter(item =>
        item.title.toLowerCase().includes(value.toLowerCase()) ||
        item.category.toLowerCase().includes(value.toLowerCase()) ||
        item.description.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5)
      setSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
      if (onSearch) {
        onSearch(products)
      }
    }
  }

  const handleSuggestionClick = (item) => {
    setSearchQuery(item.title)
    setShowSuggestions(false)
    navigate(`/product/${item.id}`)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleSearch(searchQuery)
  }

  return (
    <div className="search-bar-container">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search for custom gifts..."
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => searchQuery && setShowSuggestions(true)}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search"
              onClick={() => {
                setSearchQuery('')
                setSuggestions([])
                setShowSuggestions(false)
                if (onSearch) {
                  onSearch(products)
                }
              }}
            >
              ×
            </button>
          )}
        </div>
        <button type="submit" className="search-submit-btn">Search</button>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map((item) => (
            <div
              key={item.id}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(item)}
            >
              <ImageWithFallback src={item.images[0]} alt={item.title} className="suggestion-image" />
              <div className="suggestion-info">
                <div className="suggestion-title">{item.title}</div>
                <div className="suggestion-meta">
                  <span>{item.category}</span>
                  <span>•</span>
                  <span>₹{item.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchBar

