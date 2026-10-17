import SeoHead from '../components/SeoHead'
import { contactInfo, getWhatsAppNumber } from '../data/contactInfo'
import './PolicyPage.css'

const EMAIL = contactInfo.email.primary.address

const PrivacyPolicy = () => {
  return (
    <div className="policy-page">
      <SeoHead
        title="Privacy Policy"
        description="How Maqers collects, uses and protects your personal information, including when you sign in with Google."
        url="/privacy-policy"
      />

      <div className="policy-hero">
        <div className="container">
          <h1 className="policy-title">Privacy Policy</h1>
          <p className="policy-subtitle">Last updated: 17 October 2026</p>
        </div>
      </div>

      <div className="container">
        <section className="policy-content">

          <div className="policy-section">
            <h2>About this policy</h2>
            <p>
              Maqers (maqers.in, "we", "us") is an online marketplace in India for handmade gifts made by independent
              artisans. This policy explains what personal information we collect through www.maqers.in, why we collect
              it, who we share it with, and the choices you have. By using the site or placing an order, you agree to
              this policy. We handle your information in line with the laws that apply in India.
            </p>
          </div>

          <div className="policy-section">
            <h2>What we collect</h2>
            <ul>
              <li><strong>Account details:</strong> if you sign in with Google, your name, email address and profile picture; if you sign in with your phone number, that number. We never receive your Google password.</li>
              <li><strong>Order details:</strong> your name, phone number, email, delivery address, the items you order and any personalisation notes.</li>
              <li><strong>Cart and checkout details:</strong> what you add to your cart and enter at checkout, used to help with your order.</li>
              <li><strong>Messages and reviews:</strong> what you send us through the contact form, email or WhatsApp, and any review or photo you post.</li>
              <li><strong>Visit information:</strong> your device type, the page or ad that brought you here, and how you use the site.</li>
            </ul>
            <p>
              We do not collect or store your card, net banking or UPI PIN details. Payments are made by UPI, outside
              this website.
            </p>
          </div>

          <div className="policy-section">
            <h2>How we use it</h2>
            <ul>
              <li>To create your account and sign you in.</li>
              <li>To process, make, pack, deliver and support your orders, and send order updates.</li>
              <li>To contact you about an order or a cart you did not finish.</li>
              <li>To understand how the site is used, improve it, and measure our advertising.</li>
              <li>To prevent fraud and misuse, and to meet legal requirements.</li>
            </ul>
            <p>We do not sell your personal information.</p>
          </div>

          <div className="policy-section">
            <h2>Google user data</h2>
            <p>
              When you sign in with Google, we ask only for your basic profile: name, email address and profile picture.
              We use them only to create and identify your Maqers account, fill in your details at checkout, and contact
              you about your orders. We do not use Google user data for advertising and we do not sell it.
            </p>
            <p>
              Maqers's use and transfer of information received from Google APIs adheres to the{' '}
              <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>,
              including the Limited Use requirements. You can remove Maqers's access to your Google account any time at{' '}
              <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">myaccount.google.com/permissions</a>.
            </p>
          </div>

          <div className="policy-section">
            <h2>Who we share it with</h2>
            <ul>
              <li><strong>Sellers and delivery partners:</strong> the artisan making your order and the courier get your name, phone number and delivery address so your order can be made and delivered.</li>
              <li><strong>Service providers:</strong> Supabase (database and sign-in), Vercel (hosting) and EmailJS (contact form emails), only as needed to run the site.</li>
              <li><strong>Analytics and advertising:</strong> Google (Analytics, Tag Manager and Ads), Meta (Pixel) and PostHog, to understand site use and measure our ads.</li>
              <li><strong>Authorities:</strong> where the law requires it.</li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>Cookies</h2>
            <p>
              We use cookies and your browser's local storage to remember your cart, wishlist and sign-in, and for the
              analytics and advertising tools above. You can block or delete cookies in your browser settings; the site
              will still work, but your cart may not be remembered between visits.
            </p>
          </div>

          <div className="policy-section">
            <h2>How long we keep it</h2>
            <p>
              We keep order records as long as needed to fulfil your order, handle damage claims, and meet accounting
              and legal requirements. Account details and saved addresses stay until you ask us to delete them.
            </p>
          </div>

          <div className="policy-section">
            <h2>Security</h2>
            <p>
              Information is sent over encrypted (HTTPS) connections and stored with access controls, and only a small
              number of people at Maqers can see customer details. No online service is completely secure, so we cannot
              guarantee absolute security.
            </p>
          </div>

          <div className="policy-section">
            <h2>Children</h2>
            <p>
              Maqers is not meant for anyone under 18, and we do not knowingly collect information from children. If you
              think a child has given us information, contact us and we will delete it.
            </p>
          </div>

          <div className="policy-section">
            <h2>Your rights</h2>
            <p>You can ask us to:</p>
            <ul>
              <li>show you the personal information we hold about you;</li>
              <li>correct it, or update it from your Profile page;</li>
              <li>delete it or close your account;</li>
              <li>stop contacting you about unfinished orders.</li>
            </ul>
            <p>
              Email <a href={`mailto:${EMAIL}`}>{EMAIL}</a> or message us on{' '}
              <a href={`https://wa.me/${getWhatsAppNumber()}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>.
              We may need to keep some records, such as past orders, where the law requires it.
            </p>
          </div>

          <div className="policy-section">
            <h2>Changes to this policy</h2>
            <p>
              We may update this policy from time to time. The date at the top shows when it was last changed.
            </p>
          </div>

          <div className="policy-section">
            <h2>Contact and grievances</h2>
            <p>
              For questions, complaints or requests about your personal information, contact Maqers Support at{' '}
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a> or on WhatsApp at {contactInfo.phone.alternate.display}.
              We aim to reply within a few working days.
            </p>
          </div>

        </section>
      </div>
    </div>
  )
}

export default PrivacyPolicy
