/**
 * FORM VALIDATION UTILITIES
 * 
 * Centralized, reusable validation logic for form fields
 * Single source of truth for all validation rules
 * 
 * Design Principles:
 * - Pure functions (no side effects)
 * - Consistent error messages
 * - Easy to extend
 * - Accessible and user-friendly
 */

/**
 * Validation configuration constants
 */
export const VALIDATION_RULES = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s'-]+$/, // Letters, spaces, hyphens, apostrophes
    invalidCharsPattern: /[^a-zA-Z\s'-]/g
  },
  email: {
    required: true,
    // RFC 5322 compliant email regex (simplified but robust)
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 254
  },
  phone: {
    required: true,
    // Supports international formats: +91, +1, etc. and local formats
    pattern: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
    minLength: 10,
    maxLength: 15
  },
  message: {
    required: true,
    minLength: 10,
    maxLength: 1000
  }
}

/**
 * Error messages for validation failures
 */
export const ERROR_MESSAGES = {
  name: {
    required: 'Name is required',
    minLength: 'Name must be at least 2 characters',
    maxLength: 'Name must be less than 100 characters',
    invalidChars: 'Name can only contain letters, spaces, hyphens, and apostrophes',
    pattern: 'Please enter a valid name'
  },
  email: {
    required: 'Email address is required',
    invalid: 'Please enter a valid email address',
    maxLength: 'Email address is too long'
  },
  phone: {
    required: 'Phone number is required',
    invalid: 'Please enter a valid phone number',
    minLength: 'Phone number must be at least 10 digits',
    maxLength: 'Phone number is too long'
  },
  message: {
    required: 'Message is required',
    minLength: 'Message must be at least 10 characters',
    maxLength: 'Message must be less than 1000 characters'
  }
}

/**
 * Validate name field
 * @param {string} value - Name value to validate
 * @returns {Object} - { isValid: boolean, error: string }
 */
export const validateName = (value) => {
  const rules = VALIDATION_RULES.name
  const trimmedValue = value.trim()

  // Required check
  if (rules.required && !trimmedValue) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.name.required
    }
  }

  // Min length check
  if (trimmedValue.length < rules.minLength) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.name.minLength
    }
  }

  // Max length check
  if (trimmedValue.length > rules.maxLength) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.name.maxLength
    }
  }

  // Pattern check for invalid characters
  if (rules.invalidCharsPattern && rules.invalidCharsPattern.test(trimmedValue)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.name.invalidChars
    }
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(trimmedValue)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.name.pattern
    }
  }

  return {
    isValid: true,
    error: null
  }
}

/**
 * Validate email field
 * @param {string} value - Email value to validate
 * @returns {Object} - { isValid: boolean, error: string }
 */
export const validateEmail = (value) => {
  const rules = VALIDATION_RULES.email
  const trimmedValue = value.trim()

  // Required check
  if (rules.required && !trimmedValue) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.email.required
    }
  }

  // Max length check
  if (trimmedValue.length > rules.maxLength) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.email.maxLength
    }
  }

  // Pattern validation
  if (trimmedValue && rules.pattern && !rules.pattern.test(trimmedValue)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.email.invalid
    }
  }

  return {
    isValid: true,
    error: null
  }
}

/**
 * Validate phone field
 * @param {string} value - Phone value to validate
 * @returns {Object} - { isValid: boolean, error: string }
 */
export const validatePhone = (value) => {
  const rules = VALIDATION_RULES.phone
  // Remove spaces, dashes, parentheses for validation but keep original for display
  const cleanedValue = value.replace(/[\s\-\(\)]/g, '')
  const trimmedValue = value.trim()

  // Required check
  if (rules.required && !trimmedValue) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.phone.required
    }
  }

  // Min length check (on cleaned value)
  if (cleanedValue.length < rules.minLength) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.phone.minLength
    }
  }

  // Max length check
  if (trimmedValue.length > rules.maxLength) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.phone.maxLength
    }
  }

  // Pattern validation
  if (trimmedValue && rules.pattern && !rules.pattern.test(trimmedValue)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.phone.invalid
    }
  }

  return {
    isValid: true,
    error: null
  }
}

/**
 * Validate message field
 * @param {string} value - Message value to validate
 * @returns {Object} - { isValid: boolean, error: string }
 */
export const validateMessage = (value) => {
  const rules = VALIDATION_RULES.message
  const trimmedValue = value.trim()

  // Required check
  if (rules.required && !trimmedValue) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.message.required
    }
  }

  // Min length check
  if (trimmedValue.length < rules.minLength) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.message.minLength
    }
  }

  // Max length check
  if (trimmedValue.length > rules.maxLength) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.message.maxLength
    }
  }

  return {
    isValid: true,
    error: null
  }
}

/**
 * Validate a field by name
 * @param {string} fieldName - Name of the field to validate
 * @param {string} value - Value to validate
 * @returns {Object} - { isValid: boolean, error: string }
 */
export const validateField = (fieldName, value) => {
  switch (fieldName) {
    case 'name':
      return validateName(value)
    case 'email':
      return validateEmail(value)
    case 'phone':
      return validatePhone(value)
    case 'message':
      return validateMessage(value)
    default:
      return {
        isValid: true,
        error: null
      }
  }
}

/**
 * Validate entire form
 * @param {Object} formData - Form data object
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
export const validateForm = (formData) => {
  const errors = {}
  let isValid = true

  // Validate each field
  Object.keys(formData).forEach((fieldName) => {
    const validation = validateField(fieldName, formData[fieldName])
    if (!validation.isValid) {
      errors[fieldName] = validation.error
      isValid = false
    }
  })

  return {
    isValid,
    errors
  }
}

/**
 * Check if a field has been touched (user has interacted with it)
 * This helps determine when to show validation errors
 */
export const hasFieldBeenTouched = (fieldName, touchedFields) => {
  return touchedFields.includes(fieldName)
}

