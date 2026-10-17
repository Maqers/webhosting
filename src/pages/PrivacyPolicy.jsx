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
              Maqers (maqers.in) is an online marketplace for handmade gifts from independent Indian artisans.
              This policy explains, briefly, how we handle your personal information on www.maqers.in.
            </p>
          </div>

          <div className="policy-section">
            <h2>What we use and why</h2>
            <p>
              If you sign in with Google, we receive your name, email address and profile picture. We use these, along
              with the details you give us at checkout, only to run your account and to process, deliver and support
              your orders. We do not sell your personal information.
            </p>
          </div>

          <div className="policy-section">
            <h2>Google user data</h2>
            <p>
              Maqers's use and transfer of information received from Google APIs adheres to the{' '}
              <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>,
              including the Limited Use requirements. You can remove Maqers's access any time at{' '}
              <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">myaccount.google.com/permissions</a>.
            </p>
          </div>

          <div className="policy-section">
            <h2>Who we share it with</h2>
            <p>
              Only the service providers that help us run Maqers, such as Google, Supabase, Vercel and our delivery
              partners, and only as needed to do so, or where the law requires.
            </p>
          </div>

          <div className="policy-section">
            <h2>Your choices and contact</h2>
            <p>
              You can ask us to see, correct or delete your information at any time. Email{' '}
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a> or message us on{' '}
              <a href={`https://wa.me/${getWhatsAppNumber()}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>.
              We may update this policy from time to time; the date above shows the latest version.
            </p>
          </div>

        </section>
      </div>
    </div>
  )
}

export default PrivacyPolicy
