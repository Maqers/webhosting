import { useState, useEffect, useCallback, useMemo } from 'react'
import { validateField, validateForm } from '../utils/validation'
import { copyToClipboard } from '../utils/clipboard'
import Toast from '../components/Toast'
import FormSuccessModal from '../components/FormSuccessModal'
import PhoneCard from '../components/PhoneCard'
import { getAllPhones, getWhatsAppNumber, getEmail, getInstagramUsername } from '../data/contactInfo'
import emailjs from '@emailjs/browser'
import { emailjsConfig } from '../config/emailjs.config'
import './Contact.css'

const Contact = () => {
  // Memoize contact information to prevent changes on re-render
  const contactPhones = useMemo(() => getAllPhones(), [])
  const contactEmail = useMemo(() => getEmail(), [])
  const contactWhatsApp = useMemo(() => getWhatsAppNumber(), [])
  const contactInstagram = useMemo(() => getInstagramUsername(), [])

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  const [errors, setErrors] = useState({})
  const [touchedFields, setTouchedFields] = useState([])
  const [focusedField, setFocusedField] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  /**
   * Validate a single field
   */
  const validateSingleField = useCallback((fieldName, value) => {
    const validation = validateField(fieldName, value)
    setErrors((prevErrors) => ({
      ...prevErrors,
      [fieldName]: validation.isValid ? null : validation.error
    }))
    return validation.isValid
  }, [])

  /**
   * Handle input change with real-time validation
   */
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }))

    // Real-time validation only if field has been touched
    if (touchedFields.includes(name)) {
      validateSingleField(name, value)
    }
  }

  /**
   * Handle field blur - validate on blur
   */
  const handleBlur = (e) => {
    const { name, value } = e.target
    setFocusedField(null)

    // Mark field as touched
    if (!touchedFields.includes(name)) {
      setTouchedFields((prev) => [...prev, name])
    }

    // Validate field on blur
    validateSingleField(name, value)
  }

  /**
   * Handle field focus
   */
  const handleFocus = (fieldName) => {
    setFocusedField(fieldName)
  }

  /**
   * Handle phone number copy
   */
  const handlePhoneCopy = useCallback(async (phoneNumber) => {
    const success = await copyToClipboard(phoneNumber)
    if (success) {
      setToast({ message: 'Phone number copied!', type: 'success' })
    } else {
      setToast({ message: 'Failed to copy phone number.', type: 'error' })
    }
  }, [])

  /**
   * Handle email click
   */
  const handleEmailClick = (e) => {
    // For desktop, let mailto link open client.
    // For mobile, OS handles it. No special JS needed here.
    // We prevent default if we want to show a toast, but mailto is usually fine.
  }

  /**
   * Handle form submission with full validation
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Mark all fields as touched
    const allFields = ['name', 'email', 'phone', 'message']
    setTouchedFields(allFields)

    // Validate entire form
    const validation = validateForm(formData)

    if (!validation.isValid) {
      // Set all errors
      setErrors(validation.errors)

      // Focus on first error field
      const firstErrorField = allFields.find((field) => validation.errors[field])
      if (firstErrorField) {
        const errorElement = document.getElementById(firstErrorField)
        if (errorElement) {
          errorElement.focus()
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }

      return
    }

    // Form is valid, proceed with submission
    setIsSubmitting(true)

    try {
      // Send form data to admin email and WhatsApp
      const adminEmail = contactEmail // lijons13@gmail.com
      const whatsappNumber = contactWhatsApp // 8921580213

      // Format email body for admin
      const emailSubject = encodeURIComponent('New Contact Form Submission - maqers.in')
      const emailBody = encodeURIComponent(
        `📧 NEW CONTACT FORM SUBMISSION\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `👤 Name: ${formData.name}\n` +
        `📧 Email: ${formData.email}\n` +
        `📱 Phone: ${formData.phone}\n\n` +
        `💬 Message:\n${formData.message}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Reply to: ${formData.email}\n` +
        `Call: ${formData.phone}`
      )

      // Format WhatsApp message for admin
      const whatsappMessage = encodeURIComponent(
        `*📋 New Contact Form Submission*\n\n` +
        `*Name:* ${formData.name}\n` +
        `*Email:* ${formData.email}\n` +
        `*Phone:* ${formData.phone}\n\n` +
        `*Message:*\n${formData.message}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Reply to: ${formData.email}\n` +
        `Call: ${formData.phone}`
      )

      // Initialize EmailJS with public key (only once)
      if (emailjsConfig.publicKey && emailjsConfig.publicKey !== 'YOUR_PUBLIC_KEY') {
        emailjs.init(emailjsConfig.publicKey)
      }

      // Check if EmailJS is properly configured
      const isEmailJSConfigured = 
        emailjsConfig.serviceId && 
        emailjsConfig.serviceId !== 'YOUR_SERVICE_ID' &&
        emailjsConfig.templateId && 
        emailjsConfig.templateId !== 'YOUR_TEMPLATE_ID' &&
        emailjsConfig.publicKey && 
        emailjsConfig.publicKey !== 'YOUR_PUBLIC_KEY'

      // Log configuration status for debugging
      console.log('EmailJS Configuration Check:', {
        isConfigured: isEmailJSConfigured,
        serviceId: emailjsConfig.serviceId,
        templateId: emailjsConfig.templateId,
        hasPublicKey: !!emailjsConfig.publicKey
      })

      // Prepare email template parameters with properly formatted content
      // These variables must match your EmailJS template variables
      const emailParams = {
        // Basic contact information
        from_name: formData.name,
        from_email: formData.email,
        phone: formData.phone,
        message: formData.message,
        subject: 'New Contact Form Submission - maqers.in',
        reply_to: formData.email,
        
        // Formatted sections for better email readability
        formatted_name: `Name: ${formData.name}`,
        formatted_email: `Email: ${formData.email}`,
        formatted_phone: `Phone: ${formData.phone}`,
        formatted_message: formData.message,
        
        // Complete formatted email body (HTML-friendly)
        formatted_body: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 NEW CONTACT FORM SUBMISSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 CONTACT INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 MESSAGE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${formData.message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 REPLY INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reply to: ${formData.email}
Call: ${formData.phone}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `.trim(),
        
        // Plain text version (for email clients that don't support formatting)
        plain_text: `New Contact Form Submission\n\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\n\nMessage:\n${formData.message}\n\nReply to: ${formData.email}`,
        
        whatsapp_message: whatsappMessage
      }

      // Send email using EmailJS if configured
      if (isEmailJSConfigured) {
        try {
          console.log('Sending email via EmailJS...', {
            serviceId: emailjsConfig.serviceId,
            templateId: emailjsConfig.templateId,
            params: emailParams
          })
          
          const response = await emailjs.send(
            emailjsConfig.serviceId,
            emailjsConfig.templateId,
            emailParams,
            emailjsConfig.publicKey
          )
          
          console.log('✅ Email sent successfully!', {
            status: response.status,
            text: response.text,
            response: response
          })
        } catch (emailError) {
          console.error('❌ EmailJS error:', {
            error: emailError,
            status: emailError?.status,
            text: emailError?.text,
            message: emailError?.message
          })
          // Throw error to show user feedback
          throw new Error(`Failed to send email: ${emailError?.text || emailError?.message || 'Unknown error'}`)
        }
      } else {
        // EmailJS not configured - show warning in console
        console.warn('⚠️ EmailJS not configured. Please add your credentials in src/config/emailjs.config.js')
        // Still show success to user, but email won't be sent
      }

      // Reset form
      setFormData({ name: '', email: '', phone: '', message: '' })
      setErrors({})
      setTouchedFields([])
      setIsSubmitting(false)

      // Show success modal
      setShowSuccessModal(true)
    } catch (error) {
      console.error('Form submission error:', error)
      setIsSubmitting(false)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to send message. Please try again or contact us directly.'
      
      if (error.message) {
        errorMessage = error.message
      } else if (error.text) {
        errorMessage = `Email service error: ${error.text}`
      } else if (error.status) {
        errorMessage = `Email service error (Status: ${error.status}). Please check your EmailJS configuration.`
      }
      
      setToast({
        message: errorMessage,
        type: 'error'
      })
    }
  }

  /**
   * Handle WhatsApp action from success modal
   */
  const handleWhatsAppAction = () => {
    const message = "Hello! I just submitted a contact form. Could you please get back to me?"
    //const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    const url = `https://wa.me/${contactInfo.whatsapp.number}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank')
    setShowSuccessModal(false)
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('.scroll-animate').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="contact-page">
      <div className="contact-hero">
        <div className="hero-overlay"></div>
        <div className="container">
          <h1 className="contact-title scroll-animate">Get in Touch</h1>
          <p className="contact-subtitle scroll-animate">We'd love to hear from you</p>
        </div>
      </div>

      <div className="container">
        <div className="contact-content">
          <div className="contact-info scroll-animate">
            <div className="section-header">
              <h2>Contact Information</h2>
              <p className="section-description">Reach out to us through any of these channels</p>
            </div>
            <div className="info-cards">
              <div className="phone-cards-container scroll-animate">
                <div className="phone-cards-header">
                  <div className="info-icon-wrapper">
                    <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <h3>Phone</h3>
                </div>
                <div className="phone-cards-list">
                  {contactPhones.map((phone) => (
                    <PhoneCard
                      key={phone.type}
                      phone={phone}
                      onCopy={handlePhoneCopy}
                    />
                  ))}
                </div>
              </div>
              <a href={`https://wa.me/${contactWhatsApp}`} target="_blank" rel="noopener noreferrer" className="info-card scroll-animate">
                <div className="info-icon-wrapper">
                  <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </div>
                <h3>WhatsApp</h3>
                <p>Text us anytime</p>
              </a>
              <a
                href={`mailto:${contactEmail}`}
                onClick={handleEmailClick}
                className="info-card info-card-clickable scroll-animate"
                aria-label={`Send email to ${contactEmail}`}
              >
                <div className="info-icon-wrapper">
                  <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <h3>Email</h3>
                <p className="info-card-value">{contactEmail}</p>
                <span className="info-card-hint">Click to email</span>
              </a>
              <a
                href={`https://www.instagram.com/${contactInstagram}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="info-card info-card-clickable info-card-instagram scroll-animate"
                aria-label={`Follow us on Instagram @${contactInstagram}`}
              >
                <div className="info-icon-wrapper">
                  <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </div>
                <h3>Instagram</h3>
                <p className="info-card-value">@{contactInstagram}</p>
                <span className="info-card-hint">Follow us</span>
              </a>
            </div>
          </div>

          <div className="contact-form-wrapper scroll-animate">
            <div className="section-header">
              <h2>Send us a Message</h2>
              <p className="section-description">Fill out the form below and we'll get back to you</p>
            </div>
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">
                  Full Name
                  <span className="required-indicator" aria-label="required">*</span>
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={() => handleFocus('name')}
                    onBlur={handleBlur}
                    placeholder="John Doe"
                    aria-required="true"
                    aria-invalid={errors.name ? 'true' : 'false'}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    className={`${focusedField === 'name' ? 'focused' : ''} ${errors.name ? 'error' : ''} ${touchedFields.includes('name') && !errors.name ? 'valid' : ''}`}
                  />
                  <span className="input-border"></span>
                  {errors.name && (
                    <div className="error-message" id="name-error" role="alert" aria-live="polite">
                      <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {errors.name}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="email">
                  Email Address
                  <span className="required-indicator" aria-label="required">*</span>
                </label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => handleFocus('email')}
                    onBlur={handleBlur}
                    placeholder="john.doe@example.com"
                    aria-required="true"
                    aria-invalid={errors.email ? 'true' : 'false'}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className={`${focusedField === 'email' ? 'focused' : ''} ${errors.email ? 'error' : ''} ${touchedFields.includes('email') && !errors.email ? 'valid' : ''}`}
                  />
                  <span className="input-border"></span>
                  {errors.email && (
                    <div className="error-message" id="email-error" role="alert" aria-live="polite">
                      <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {errors.email}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="phone">
                  Phone Number
                  <span className="required-indicator" aria-label="required">*</span>
                </label>
                <div className="input-wrapper">
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onFocus={() => handleFocus('phone')}
                    onBlur={handleBlur}
                    placeholder="+91 1234567890"
                    aria-required="true"
                    aria-invalid={errors.phone ? 'true' : 'false'}
                    aria-describedby={errors.phone ? 'phone-error' : undefined}
                    className={`${focusedField === 'phone' ? 'focused' : ''} ${errors.phone ? 'error' : ''} ${touchedFields.includes('phone') && !errors.phone ? 'valid' : ''}`}
                  />
                  <span className="input-border"></span>
                  {errors.phone && (
                    <div className="error-message" id="phone-error" role="alert" aria-live="polite">
                      <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {errors.phone}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="message">
                  Message
                  <span className="required-indicator" aria-label="required">*</span>
                </label>
                <div className="input-wrapper">
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    onFocus={() => handleFocus('message')}
                    onBlur={handleBlur}
                    placeholder="Tell us how we can help you..."
                    rows="5"
                    aria-required="true"
                    aria-invalid={errors.message ? 'true' : 'false'}
                    aria-describedby={errors.message ? 'message-error' : undefined}
                    className={`${focusedField === 'message' ? 'focused' : ''} ${errors.message ? 'error' : ''} ${touchedFields.includes('message') && !errors.message ? 'valid' : ''}`}
                  ></textarea>
                  <span className="input-border"></span>
                  {errors.message && (
                    <div className="error-message" id="message-error" role="alert" aria-live="polite">
                      <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {errors.message}
                    </div>
                  )}
                </div>
              </div>
              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="btn-spinner"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <FormSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message="Thank you for contacting us! Your message has been sent to our admin email and WhatsApp. We'll get back to you shortly."
        onAction={handleWhatsAppAction}
      />
    </div>
  )
}

export default Contact
