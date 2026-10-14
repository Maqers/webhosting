import { useEffect, useRef, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigationType } from 'react-router-dom'
import { readPageMemory, writePageMemory } from './utils/pageMemory'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import WhatsAppButton from './components/WhatsAppButton'
import GiftAssistant from './components/GiftAssistant'
import PageLoader from './components/PageLoader'
import CartDrawer from './components/CartDrawer'
import WishlistDrawer from './components/WishlistDrawer'
import BottomNav from './components/BottomNav'
import ChunkErrorBoundary from './components/ChunkErrorBoundary'
import LoginModal from './components/LoginModal'
import WelcomeOffer from './components/WelcomeOffer'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { initScrollAnimations, cleanupScrollAnimations } from './utils/scrollAnimations'
import { trackPageview } from './utils/analytics'
import './App.css'

import Home from './pages/Home'
const Products = lazy(() => import('./pages/Products'))
const Categories = lazy(() => import('./pages/Categories'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const AboutUs = lazy(() => import('./pages/AboutUs'))
const FAQs = lazy(() => import('./pages/FAQs'))
const Shipping = lazy(() => import('./pages/Shipping'))
const Policies = lazy(() => import('./pages/Policies'))
const Contact = lazy(() => import('./pages/Contact'))
const AdminPortal = lazy(() => import('./pages/AdminPortal'))
const SellerStorefront = lazy(() => import('./pages/SellerStorefront'))
const Checkout = lazy(() => import('./pages/Checkout'))
const ByOccasion = lazy(() => import('./pages/ByOccasion'))
const ByProduct = lazy(() => import('./pages/ByProduct'))
const OrderHistory = lazy(() => import('./pages/OrderHistory'))
const Profile = lazy(() => import('./pages/Profile'))

const RouteLoadingFallback = () => (
  <div className="route-loading">
    <div className="loader-spinner" role="status" aria-label="Loading"></div>
  </div>
)

// Restores where the shopper was when they come Back to a page; anything else
// opens at the top. Pages render late (lazy chunks, then product images), so
// the restore keeps retrying until the page is tall enough, and gives up the
// moment the shopper scrolls or taps themselves.
function useScrollMemory(location) {
  const navType = useNavigationType()
  const prevPath = useRef(location.pathname)

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
  }, [])

  // Track this entry's position as the shopper scrolls.
  useEffect(() => {
    const key = location.key
    let y = window.scrollY
    const onScroll = () => { y = window.scrollY }
    window.addEventListener('scroll', onScroll, { passive: true })
    const timer = setInterval(() => writePageMemory(key, 'scrollY', y), 250)
    return () => {
      window.removeEventListener('scroll', onScroll)
      clearInterval(timer)
      writePageMemory(key, 'scrollY', y) // last position before leaving
    }
  }, [location.key])

  useEffect(() => {
    const pathChanged = prevPath.current !== location.pathname
    prevPath.current = location.pathname
    const target = navType === 'POP' ? readPageMemory(location.key, 'scrollY') : undefined
    if (typeof target !== 'number') {
      if (pathChanged || navType !== 'POP') window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    let cancelled = false
    const stop = () => { cancelled = true }
    const events = ['wheel', 'touchstart', 'keydown', 'mousedown']
    events.forEach(e => window.addEventListener(e, stop, { passive: true, once: true }))
    const started = Date.now()
    const attempt = () => {
      if (cancelled) return
      window.scrollTo({ top: target, behavior: 'instant' })
      const reached = Math.abs(window.scrollY - target) < 2
      if (!reached && Date.now() - started < 3000) setTimeout(attempt, 50)
    }
    attempt()
    return () => { cancelled = true; events.forEach(e => window.removeEventListener(e, stop)) }
  }, [location.key])
}

function AppContent() {
  const location = useLocation()
  useScrollMemory(location)

  useEffect(() => {
    const observers = initScrollAnimations()
    trackPageview(location.pathname)
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
      <LoginModal />
      <WelcomeOffer />
      <main>
        <ChunkErrorBoundary>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/category/:name" element={<Categories />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/admin" element={<AdminPortal />} />
            <Route path="/maker/:sellerCode" element={<SellerStorefront />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/by-occasion" element={<ByOccasion />} />
            <Route path="/by-product" element={<ByProduct />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Suspense>
        </ChunkErrorBoundary>
        <Footer />
      </main>
      {location.pathname !== '/admin' && <GiftAssistant />}
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
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <div className="App">
              <AppContent />
            </div>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  )
}

export default App