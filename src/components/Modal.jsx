import { useEffect, useRef, useCallback } from 'react'
import './Modal.css'

/**
 * Reusable Modal Component
 * 
 * Features:
 * - Focus trap when open
 * - Keyboard support (Esc to close)
 * - Click outside to close (optional)
 * - Screen reader friendly
 * - Responsive (mobile bottom-sheet, desktop centered)
 * - Smooth animations
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  type = 'default', // 'default', 'success', 'error', 'loading'
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className = ''
}) => {
  const modalRef = useRef(null)
  const previousActiveElementRef = useRef(null)
  const firstFocusableElementRef = useRef(null)
  const lastFocusableElementRef = useRef(null)

  /**
   * Handle Escape key press
   */
  const handleEscKey = useCallback(
    (e) => {
      if (closeOnEsc && e.key === 'Escape' && isOpen) {
        onClose()
      }
    },
    [closeOnEsc, isOpen, onClose]
  )

  /**
   * Handle overlay click
   */
  const handleOverlayClick = useCallback(
    (e) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onClose()
      }
    },
    [closeOnOverlayClick, onClose]
  )

  /**
   * Trap focus within modal
   */
  const trapFocus = useCallback((e) => {
    if (!isOpen || !modalRef.current) return

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }, [isOpen])

  /**
   * Set up focus trap and keyboard listeners
   */
  useEffect(() => {
    if (isOpen) {
      // Store the previously active element
      previousActiveElementRef.current = document.activeElement

      // Focus the modal
      const timer = setTimeout(() => {
        if (modalRef.current) {
          const firstFocusable = modalRef.current.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          if (firstFocusable) {
            firstFocusable.focus()
          } else {
            modalRef.current.focus()
          }
        }
      }, 100)

      // Prevent body scroll
      document.body.style.overflow = 'hidden'

      // Add keyboard listeners
      document.addEventListener('keydown', handleEscKey)
      document.addEventListener('keydown', trapFocus)

      return () => {
        clearTimeout(timer)
        document.body.style.overflow = ''
        document.removeEventListener('keydown', handleEscKey)
        document.removeEventListener('keydown', trapFocus)

        // Return focus to previous element
        if (previousActiveElementRef.current) {
          previousActiveElementRef.current.focus()
        }
      }
    }
  }, [isOpen, handleEscKey, trapFocus])

  if (!isOpen) return null

  return (
    <div
      className={`modal-overlay ${className}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={modalRef}
        className={`modal-content modal-${type}`}
        tabIndex={-1}
      >
        {title && (
          <div className="modal-header">
            <h2 id="modal-title" className="modal-title">
              {title}
            </h2>
            {showCloseButton && (
              <button
                className="modal-close-btn"
                onClick={onClose}
                aria-label="Close modal"
                ref={firstFocusableElementRef}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal

