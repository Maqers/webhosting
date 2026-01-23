import './Features.css'

const Features = () => {
  const features = [
    {
      icon: "⚡",
      title: "Fast Delivery",
      description: "Get your food delivered hot and fresh in 20-30 minutes. We ensure timely delivery to satisfy your cravings."
    },
    {
      icon: "🍽️",
      title: "Fresh Ingredients",
      description: "We use only the freshest ingredients sourced from trusted suppliers. Quality is our top priority."
    },
    {
      icon: "💰",
      title: "Best Prices",
      description: "Enjoy great food at affordable prices. We offer competitive rates without compromising on quality."
    },
    {
      icon: "⭐",
      title: "Top Rated",
      description: "Rated 4.5+ by thousands of satisfied customers. Join our happy community of food lovers."
    },
    {
      icon: "🛡️",
      title: "Safe & Secure",
      description: "Your safety is our concern. We follow strict hygiene standards and ensure secure transactions."
    },
    {
      icon: "📱",
      title: "Easy Ordering",
      description: "Order with just a few clicks. Our user-friendly interface makes ordering simple and convenient."
    },
    {
      icon: "🎁",
      title: "Special Offers",
      description: "Enjoy exclusive deals and discounts. We regularly offer special promotions for our customers."
    },
    {
      icon: "🌍",
      title: "Wide Coverage",
      description: "We deliver across multiple cities. Check if we're available in your area."
    }
  ]

  return (
    <div className="features-page">
      <div className="features-hero">
        <div className="container">
          <h1 className="features-title">Why Choose maqers?</h1>
          <p className="features-subtitle">Experience the best in food delivery</p>
        </div>
      </div>

      <div className="container">
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card scroll-animate" style={{ '--i': index }}>
              <div className="feature-icon-wrapper">
                <div className="feature-icon">{feature.icon}</div>
              </div>
              <h3 className="feature-card-title">{feature.title}</h3>
              <p className="feature-card-description">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="features-cta scroll-animate">
          <h2>Ready to Order?</h2>
          <p>Browse our menu and place your order today!</p>
          <a href="/" className="cta-button">Explore Menu</a>
        </div>
      </div>
    </div>
  )
}

export default Features

