/**
 * CONTACT INFORMATION DATA
 * 
 * Centralized contact information for the business
 * Single source of truth for all contact details
 * 
 * To update contact information:
 * 1. Update values in this file
 * 2. Changes automatically reflect across the website
 */

export const contactInfo = {
  phone: {
    primary: {
      display: '+91 79739 81938',
      raw: '7973981938', // Without country code for WhatsApp/tel links
      full: '+917973981938', // With country code, no spaces
      label: 'Primary Contact',
      type: 'primary'
    },
    alternate: {
      display: '+91 96508 00399',
      raw: '9650800399',
      full: '+919650800399',
      label: 'Alternate Contact',
      type: 'alternate'
    }
  },
  email: {
    primary: {
      address: 'maqers.in@gmail.com',
      label: 'Email'
    }
  },
  whatsapp: {
    number: '7973981938', // Primary WhatsApp number (same as primary phone)
    label: 'WhatsApp'
  },
  instagram: {
    username: 'maqers.in', // Instagram username (without @)
    label: 'Instagram'
  },
  location: {
    text: 'Available nationwide',
    label: 'Location'
  }
}

/**
 * Get primary phone number
 */
export const getPrimaryPhone = () => contactInfo.phone.primary

/**
 * Get alternate phone number
 */
export const getAlternatePhone = () => contactInfo.phone.alternate

/**
 * Get all phone numbers
 */
export const getAllPhones = () => [contactInfo.phone.primary, contactInfo.phone.alternate]

/**
 * Get WhatsApp number
 */
export const getWhatsAppNumber = () => contactInfo.whatsapp.number

/**
 * Get email address
 */
export const getEmail = () => contactInfo.email.primary.address

/**
 * Get Instagram username
 */
export const getInstagramUsername = () => contactInfo.instagram.username

