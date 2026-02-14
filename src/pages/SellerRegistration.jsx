import { useState } from "react"
import "./SellerRegistration.css"
import { supabase } from "../lib/supabase"

const SellerRegistration = () => {
  const [status, setStatus] = useState("idle")
  const [formError, setFormError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus("submitting")
    setFormError("")

    const form = e.target
    const data = new FormData(form)

    const business_name = data.get("business_name")?.trim()
    const city = data.get("city")
    const phone = data.get("phone")?.trim()
    const email = data.get("email")?.trim()

    // 🔹 Validation
    if (!business_name || !city || !phone || !email) {
      setFormError("All fields are mandatory.")
      setStatus("idle")
      return
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      setFormError("Phone number must be exactly 10 digits.")
      setStatus("idle")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Please enter a valid email address.")
      setStatus("idle")
      return
    }

    try {
      const { error } = await supabase
        .from("seller_t")
        .insert([{ business_name, city, phone, email }])

      if (error) {
        console.error("Supabase error:", error)
        setFormError("Email may already exist.")
        setStatus("idle")
        return
      }

      setStatus("success")
      form.reset()

    } catch (err) {
      console.error("Unexpected error:", err)
      setFormError("Something went wrong. Please try again.")
      setStatus("idle")
    }
  }

return (
  <div className="seller-page">

    {/* HERO SECTION (like About page) */}
    <div className="seller-hero">
      <div className="hero-overlay"></div>
      <div className="seller-hero-content">
        <h1 className="seller-title">
          Become a Seller on maqers
        </h1>

        <p className="seller-subtitle">
          Grow your handmade business. Reach customers across India.
        </p>
      </div>
    </div>

    {/* FORM SECTION */}
    <div className="seller-wrapper">
        {formError && (
            <div className="top-error">
                {formError}
            </div>
            )}

      <div className="seller-form-card">
        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Business Name</label>
            <input
              type="text"
              name="business_name"
              placeholder="Enter your business name"
            />
          </div>

          <div className="form-group">
            <label>City</label>
            <select name="city">
              <option value="">Select City</option>
              <option>Delhi</option>
              <option>Mumbai</option>
              <option>Bengaluru</option>
              <option>Chennai</option>
            </select>
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              placeholder="Enter your 10-digit phone number"
              maxLength="10"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email address"
            />
          </div>

          <button className="seller-btn" type="submit">
            {status === "submitting"
              ? "Submitting..."
              : "Register as Seller"}
          </button>

          {status === "success" && (
            <p className="success-msg">
              Thank you! We will contact you soon.
            </p>
          )}

        </form>
      </div>
    </div>
  </div>
)

}

export default SellerRegistration
