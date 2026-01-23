/**
 * EmailJS Configuration
 * 
 * 📧 SETUP INSTRUCTIONS:
 * 
 * Follow the step-by-step guide in: EMAILJS_SETUP_GUIDE.md
 * 
 * QUICK STEPS:
 * 1. Go to https://www.emailjs.com/ and create account
 * 2. Get Public Key: Dashboard → Account → API Keys (or Personal Settings → API Keys)
 * 3. Create Service: Dashboard → Email Services → Add New Service
 * 4. Get Service ID: From your service page (top of page)
 * 5. Create Template: Dashboard → Email Templates → Create New Template
 * 6. Get Template ID: From your template page (top of page)
 * 7. Replace the values below with your actual credentials
 * 
 * For detailed instructions, see: EMAILJS_SETUP_GUIDE.md
 */

export const emailjsConfig = {
  // Your EmailJS Service ID (from Email Services)
  serviceId: 'service_ckd0lmj',
  
  // Your EmailJS Template ID (from Email Templates)
  templateId: 'template_cp8gsrc',
  
  // Your EmailJS Public Key (from Account > API Keys)
  publicKey: '7HzR9jrZ1jK9NrkBD'
}

/**
 * EmailJS Template Variables:
 * 
 * Your EmailJS template should include these variables:
 * - {{from_name}} - Sender's name
 * - {{from_email}} - Sender's email
 * - {{phone}} - Sender's phone number
 * - {{message}} - Message content
 * - {{subject}} - Email subject
 * - {{reply_to}} - Reply-to email address
 * 
 * Example template:
 * 
 * Subject: {{subject}}
 * 
 * From: {{from_name}} ({{from_email}})
 * Phone: {{phone}}
 * 
 * Message:
 * {{message}}
 * 
 * ---
 * Reply to: {{reply_to}}
 */

