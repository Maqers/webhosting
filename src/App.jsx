import { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import WhatsAppButton from './components/WhatsAppButton'
import PageLoader from './components/PageLoader'
import CartDrawer from './components/CartDrawer'
import WishlistDrawer from './components/WishlistDrawer'
import BottomNav from './components/BottomNav'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { initScrollAnimations, cleanupScrollAnimations } from './utils/scrollAnimations'
import './App.css'

const Home = lazy(() => import('./pages/Home'))
const Products = lazy(() => import('./pages/Products'))
const Categories = lazy(() => import('./pages/Categories'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const AboutUs = lazy(() => import('./pages/AboutUs'))
const FAQs = lazy(() => import('./pages/FAQs'))
const Contact = lazy(() => import('./pages/Contact'))
const AdminPortal = lazy(() => import('./pages/AdminPortal'))
const SellerPage = lazy(() => import('./pages/SellerPage'))
const Checkout = lazy(() => import('./pages/Checkout'))

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
    const observers = initScrollAnimations()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return () => {
      cleanupScrollAnimations(observers)
    }
  }, [location.pathname])

  return (
    <>
      <PageLoader />
      <Navbar />
      <CartDrawer />
      <WishlistDrawer />
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
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="/maker/:sellerCode" element={<SellerPage />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </Suspense>
      <Footer />
      <WhatsAppButton />
      <BottomNav />
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
      <CartProvider>
        <WishlistProvider>
          <div className="App">
            <AppContent />
          </div>
        </WishlistProvider>
      </CartProvider>
    </Router>
  )
}

export default App