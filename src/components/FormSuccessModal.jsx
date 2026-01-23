import Modal from './Modal'
import './FormSuccessModal.css'

/**
 * Form Success Modal Component
 * 
 * Specialized modal for form submission success
 * Includes icon, message, and action buttons
 */
const FormSuccessModal = ({ isOpen, onClose, message, onAction }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      type="success"
      closeOnOverlayClick={true}
      closeOnEsc={true}
      className="form-success-modal"
    >
      <div className="form-success-content">
        <div className="success-icon-wrapper">
          <svg
            className="success-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12l2 2 4-4" />
          </svg>
        </div>
        <h3 className="success-title">Thank You!</h3>
        <p className="success-message">{message}</p>
        <div className="success-actions">
          {onAction && (
            <button
              className="success-action-btn primary"
              onClick={onAction}
            >
              Contact via WhatsApp
            </button>
          )}
          <button
            className="success-action-btn secondary"
            onClick={onClose}
            autoFocus
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default FormSuccessModal

