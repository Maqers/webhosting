import { useEffect, useState, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import WhatsAppButton from './components/WhatsAppButton'
import PageLoader from './components/PageLoader'
import { initScrollAnimations, cleanupScrollAnimations } from './utils/scrollAnimations'
import './App.css'

// Lazy load routes for code splitting and faster initial load
const Home = lazy(() => import('./pages/Home'))
const Products = lazy(() => import('./pages/Products'))
const Categories = lazy(() => import('./pages/Categories'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const AboutUs = lazy(() => import('./pages/AboutUs'))
const FAQs = lazy(() => import('./pages/FAQs'))
const Contact = lazy(() => import('./pages/Contact'))
const SellerRegistration = lazy(() => import('./pages/SellerRegistration'))


// Loading fallback component
const RouteLoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '50vh',
    fontSize: '1.125rem',
    color: '#666'
  }}>
    Loading...
  </div>
)

function AppContent() {
  const location = useLocation()

  useEffect(() => {
    // Initialize enhanced scroll animations
    const observers = initScrollAnimations()

    // Scroll to top on route change
    window.scrollTo({ top: 0, behavior: 'smooth' })

    return () => {
      // Cleanup observers
      cleanupScrollAnimations(observers)
    }
  }, [location.pathname])

  return (
    <>
      <PageLoader />
      <Navbar />
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/category/:name" element={<Categories />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/seller-registration" element={<SellerRegistration />} />
        </Routes>
      </Suspense>
      <Footer />
      <WhatsAppButton />
    </>
  )
}

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <div className="App">
        <AppContent />
      </div>
    </Router>
  )
}

export default App
