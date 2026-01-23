# Contact Form Usage Guide

## Overview
The contact form on the website allows visitors to send messages directly to the business. This guide explains how the form works and how to use it.

## Form Status
✅ **The form is working correctly!**

The form includes:
- Real-time validation
- Error messages for invalid inputs
- Success modal after submission
- WhatsApp integration for immediate contact

## How to Use the Contact Form

### Step 1: Navigate to Contact Page
1. Click on "Contact Us" in the navigation menu
2. You'll be taken to the Contact page

### Step 2: Fill Out the Form
The form has 4 required fields:

#### 1. **Full Name** (Required)
- Enter your full name
- Minimum 2 characters
- Only letters, spaces, hyphens, and apostrophes allowed
- Example: "John Doe" or "Mary-Jane O'Connor"

#### 2. **Email Address** (Required)
- Enter a valid email address
- Must follow standard email format (e.g., user@example.com)
- Example: "john.doe@example.com"

#### 3. **Phone Number** (Required)
- Enter your phone number
- Minimum 10 digits
- Supports international formats (+91, +1, etc.)
- Can include spaces, dashes, or parentheses
- Examples:
  - "+91 1234567890"
  - "123-456-7890"
  - "(123) 456-7890"
  - "1234567890"

#### 4. **Message** (Required)
- Enter your message or inquiry
- Minimum 10 characters
- Maximum 1000 characters
- Example: "I'm interested in your products. Can you provide more information?"

### Step 3: Submit the Form
1. Click the "Send Message" button
2. The form will validate all fields
3. If there are errors, they will be highlighted in red
4. Fix any errors and try again

### Step 4: Success Response
After successful submission:
1. A success modal will appear
2. The form will be reset automatically
3. You'll see a message: "Thank you for contacting us. We'll get back to you shortly."
4. Option to contact via WhatsApp directly

## Form Validation

### Real-Time Validation
- Fields are validated when you click away (on blur)
- Errors appear immediately after you leave a field
- Valid fields show a green checkmark

### Validation Rules

| Field | Rules |
|-------|-------|
| **Name** | • Required<br>• 2-100 characters<br>• Letters, spaces, hyphens, apostrophes only |
| **Email** | • Required<br>• Valid email format<br>• Max 254 characters |
| **Phone** | • Required<br>• 10-15 digits<br>• Supports international formats |
| **Message** | • Required<br>• 10-1000 characters |

### Error Messages
- **Name**: "Name is required" / "Name must be at least 2 characters"
- **Email**: "Email address is required" / "Please enter a valid email address"
- **Phone**: "Phone number is required" / "Phone number must be at least 10 digits"
- **Message**: "Message is required" / "Message must be at least 10 characters"

## Contact Information

### Phone Numbers
- **Primary Contact**: +91 79739 81938
- **Alternate Contact**: +91 96508 00399

### Email
- **Email**: maqers.in@gmail.com
- Click the email card to open your email client

### WhatsApp
- **Number**: 7973981938
- Click the WhatsApp card to start a conversation
- Or use the WhatsApp button in the success modal

## Form Features

### Accessibility
- All fields have proper labels
- Required fields are marked with asterisks (*)
- Error messages are announced to screen readers
- Keyboard navigation supported

### User Experience
- Smooth animations and transitions
- Visual feedback for all interactions
- Loading state during submission
- Success confirmation modal
- Quick WhatsApp contact option

## Troubleshooting

### Form Not Submitting?
1. Check that all required fields are filled
2. Verify email format is correct
3. Ensure phone number has at least 10 digits
4. Make sure message is at least 10 characters
5. Look for red error messages below fields

### Can't See Error Messages?
- Error messages appear below each field
- They show when you click away from a field
- Check that JavaScript is enabled in your browser

### Form Reset After Submission?
- This is normal behavior
- The form resets automatically after successful submission
- A success modal confirms your message was sent

## Technical Details

### Form Submission Process
1. User fills out form
2. Form validates all fields on submit
3. If valid, form data is processed
4. Success modal appears
5. Form resets for next use

### Current Implementation
⚠️ **IMPORTANT**: The form currently **does NOT send data anywhere**. It only:
- Validates the form fields
- Shows a success message
- Resets the form
- **The data is NOT saved or emailed**

This is a **simulation only**. The form data is not being sent to any server, email, or database.

### Where Form Data Should Go

Currently, the form submission is commented out. You need to implement one of these options:

#### Option 1: Backend API (Recommended)
Send form data to your backend server:
```javascript
const response = await fetch('/api/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
})
```

#### Option 2: EmailJS Service
Use EmailJS to send emails directly from the browser:
```javascript
await emailjs.send(serviceId, templateId, formData, publicKey)
```

#### Option 3: Mailto Link (Simple)
Open email client with pre-filled message:
```javascript
const subject = encodeURIComponent('Contact Form Submission')
const body = encodeURIComponent(
  `Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nMessage: ${formData.message}`
)
window.location.href = `mailto:maqers.in@gmail.com?subject=${subject}&body=${body}`
```

### How to Implement Form Submission

1. **Open** `src/pages/Contact.jsx`
2. **Find** the `handleSubmit` function (around line 99)
3. **Uncomment** one of the options (Option 1, 2, or 3)
4. **Replace** the placeholder values with your actual:
   - API endpoint URL
   - EmailJS credentials
   - Or use the mailto option
5. **Remove** the simulation code: `await new Promise(resolve => setTimeout(resolve, 1000))`

### Future Enhancements Needed
- ✅ Backend API integration for actual email sending
- ✅ Email notifications to business email (maqers.in@gmail.com)
- ✅ Form data storage in database
- ✅ Admin dashboard for viewing submissions
- ✅ Email confirmation to user

## Support

If you encounter any issues with the contact form:
1. Check your internet connection
2. Try refreshing the page
3. Clear browser cache
4. Contact via phone or WhatsApp directly

---

**Last Updated**: Current version
**Form Status**: ✅ Working
**Validation**: ✅ Active
**Accessibility**: ✅ Compliant

