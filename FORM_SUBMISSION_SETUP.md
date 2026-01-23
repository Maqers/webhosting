# Contact Form Submission Setup Guide

## Current Status
⚠️ **The form is currently NOT sending data anywhere** - it's just showing a success message after validation.

The form data is being validated but not actually submitted to any service. You need to configure where the form data should be sent.

## Where Form Data Currently Goes
**Nowhere!** The form currently:
1. Validates all fields ✅
2. Shows success modal ✅
3. Resets the form ✅
4. **BUT does NOT send the data anywhere** ❌

## Options to Send Form Data

### Option 1: EmailJS (Recommended - Easy Setup)
EmailJS allows you to send emails directly from the frontend without a backend.

#### Setup Steps:
1. **Sign up for EmailJS**
   - Go to https://www.emailjs.com/
   - Create a free account (100 emails/month free)

2. **Create Email Service**
   - Go to Email Services → Add New Service
   - Choose Gmail, Outlook, or any email provider
   - Connect your email account

3. **Create Email Template**
   - Go to Email Templates → Create New Template
   - Use these variables:
     ```
     {{name}}
     {{email}}
     {{phone}}
     {{message}}
     ```
   - Set recipient to: `maqers.in@gmail.com`
   - Set subject: "New Contact Form Submission"

4. **Get API Keys**
   - Go to Account → API Keys
   - Copy your Public Key

5. **Install EmailJS in Project**
   ```bash
   npm install @emailjs/browser
   ```

6. **Update Contact.jsx**
   ```javascript
   import emailjs from '@emailjs/browser'
   
   // In handleSubmit function, replace the setTimeout with:
   const serviceId = 'YOUR_SERVICE_ID'
   const templateId = 'YOUR_TEMPLATE_ID'
   const publicKey = 'YOUR_PUBLIC_KEY'
   
   await emailjs.send(serviceId, templateId, formData, publicKey)
   ```

---

### Option 2: Backend API (Most Professional)
Create a backend API endpoint to handle form submissions.

#### Setup Steps:
1. **Create API Endpoint**
   - Example: `POST /api/contact`
   - Accepts: `{ name, email, phone, message }`
   - Sends email using Node.js (Nodemailer) or Python (SMTP)

2. **Update Contact.jsx**
   ```javascript
   const response = await fetch('/api/contact', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(formData)
   })
   
   if (!response.ok) {
     throw new Error('Failed to send message')
   }
   ```

3. **Backend Example (Node.js)**
   ```javascript
   // server.js
   const express = require('express')
   const nodemailer = require('nodemailer')
   
   const app = express()
   app.use(express.json())
   
   app.post('/api/contact', async (req, res) => {
     const { name, email, phone, message } = req.body
     
     // Send email using Nodemailer
     const transporter = nodemailer.createTransport({
       service: 'gmail',
       auth: {
         user: 'your-email@gmail.com',
         pass: 'your-app-password'
       }
     })
     
     await transporter.sendMail({
       from: email,
       to: 'maqers.in@gmail.com',
       subject: 'New Contact Form Submission',
       text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`
     })
     
     res.json({ success: true })
   })
   ```

---

### Option 3: Formspree (Easiest - No Code)
Formspree is a form backend service that requires no backend code.

#### Setup Steps:
1. **Sign up for Formspree**
   - Go to https://formspree.io/
   - Create a free account (50 submissions/month free)

2. **Create Form Endpoint**
   - Create a new form
   - Copy the form endpoint URL (e.g., `https://formspree.io/f/YOUR_FORM_ID`)

3. **Update Contact.jsx**
   ```javascript
   const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(formData)
   })
   ```

---

### Option 4: Mailto Link (Simple but Limited)
Opens user's email client with pre-filled message.

#### Update Contact.jsx
```javascript
const subject = encodeURIComponent('Contact Form Submission')
const body = encodeURIComponent(
  `Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nMessage: ${formData.message}`
)
window.location.href = `mailto:maqers.in@gmail.com?subject=${subject}&body=${body}`
```

**Note:** This requires user to have email client configured and may not work on all devices.

---

## Recommended Solution

**For Quick Setup:** Use **EmailJS** (Option 1)
- ✅ No backend required
- ✅ Free tier available
- ✅ Easy to implement
- ✅ Works immediately

**For Production:** Use **Backend API** (Option 2)
- ✅ Most professional
- ✅ Full control
- ✅ Can store submissions in database
- ✅ Better security

---

## Current Code Location

The form submission handler is in:
- **File**: `src/pages/Contact.jsx`
- **Function**: `handleSubmit` (lines 99-140)
- **Current Behavior**: Simulates submission with `setTimeout`

---

## Next Steps

1. **Choose an option** from above
2. **Follow the setup steps** for your chosen option
3. **Update the `handleSubmit` function** in `Contact.jsx`
4. **Test the form** to ensure emails are being sent
5. **Check your email** (maqers.in@gmail.com) for test submissions

---

## Testing

After implementing one of the options:

1. Fill out the contact form
2. Submit it
3. Check your email inbox (maqers.in@gmail.com)
4. Verify you received the form submission

---

## Troubleshooting

### Form submits but no email received?
- Check spam folder
- Verify email service configuration
- Check API keys are correct
- Review browser console for errors

### Form shows error?
- Check network tab in browser dev tools
- Verify API endpoint is correct
- Check CORS settings if using backend API
- Ensure all required fields are filled

---

**Last Updated**: Current version
**Status**: ⚠️ Needs configuration to actually send emails

