import { useState } from 'react'
import ImageWithFallback from '../components/ImageWithFallback'
import './Testimonials.css'

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const testimonials = [
    {
      id: 1,
      name: "Priya Sharma",
      location: "Mumbai",
      rating: 5,
      text: "Amazing food quality and super fast delivery! The butter chicken was absolutely delicious. Highly recommended!",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&auto=format"
    },
    {
      id: 2,
      name: "Rahul Kumar",
      location: "Delhi",
      rating: 5,
      text: "Best biryani I've ever had! The flavors were authentic and the portion size was generous. Will definitely order again.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&auto=format"
    },
    {
      id: 3,
      name: "Anjali Patel",
      location: "Bangalore",
      rating: 5,
      text: "The pizza was fresh and crispy, exactly as shown in the pictures. Delivery was on time and packaging was excellent.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&auto=format"
    },
    {
      id: 4,
      name: "Vikram Singh",
      location: "Pune",
      rating: 5,
      text: "Outstanding service! The masala dosa reminded me of home. Great taste and reasonable prices. Keep it up!",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&auto=format"
    },
    {
      id: 5,
      name: "Sneha Reddy",
      location: "Hyderabad",
      rating: 5,
      text: "The sushi platter was fresh and beautifully presented. Worth every rupee! The service team was very helpful.",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&auto=format"
    },
    {
      id: 6,
      name: "Amit Verma",
      location: "Kolkata",
      rating: 5,
      text: "Fast delivery and delicious food! The paneer tikka was perfectly spiced. Great experience overall.",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&auto=format"
    }
  ]

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <div className="testimonials-page">
      <div className="testimonials-hero">
        <div className="container">
          <h1 className="testimonials-title">What Our Customers Say</h1>
          <p className="testimonials-subtitle">Real reviews from real customers</p>
        </div>
      </div>

      <div className="container">
        <div className="testimonials-content">
          <div className="testimonial-main scroll-animate">
            <div className="testimonial-card">
              <div className="testimonial-header">
                <ImageWithFallback
                  src={testimonials[currentIndex].image}
                  alt={testimonials[currentIndex].name}
                  className="testimonial-avatar"
                />
                <div className="testimonial-info">
                  <h3>{testimonials[currentIndex].name}</h3>
                  <p className="testimonial-location">{testimonials[currentIndex].location}</p>
                  <div className="testimonial-rating">
                    {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                      <span key={i}>⭐</span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="testimonial-text">"{testimonials[currentIndex].text}"</p>
            </div>
            <div className="testimonial-controls">
              <button onClick={prevTestimonial} className="control-btn">←</button>
              <div className="testimonial-dots">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    className={`dot ${index === currentIndex ? 'active' : ''}`}
                    onClick={() => setCurrentIndex(index)}
                  />
                ))}
              </div>
              <button onClick={nextTestimonial} className="control-btn">→</button>
            </div>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={testimonial.id} className="testimonial-item scroll-animate" style={{ '--i': index }}>
                <div className="testimonial-rating-small">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i}>⭐</span>
                  ))}
                </div>
                <p className="testimonial-text-small">"{testimonial.text}"</p>
                <div className="testimonial-author">
                  <ImageWithFallback
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="testimonial-avatar-small"
                  />
                  <div>
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Testimonials

