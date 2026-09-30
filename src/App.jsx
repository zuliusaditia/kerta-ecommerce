import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import { analytics } from './lib/analytics'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import ChatWidget from './components/ChatWidget'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import About from './pages/About'
import Contact from './pages/Contact'
import Login from './pages/Login'
import AdminLogin from './pages/AdminLogin'
import VerifyOtp from './pages/VerifyOtp'
import Account from './pages/Account'
import Admin from './pages/Admin'

function Placeholder({ title }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-32 text-center">
      <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-4">{title}</h1>
      <p className="text-xs font-bold tracking-widest uppercase opacity-50">Coming soon</p>
    </div>
  )
}

function App() {
  const location = useLocation()

  // Auto-track page view setiap route berubah
  useEffect(() => {
    analytics.pageView(location.pathname + location.search)
  }, [location.pathname, location.search])

  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col bg-white">
          <Navbar />
          <CartDrawer />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Products />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order/:code" element={<OrderSuccess />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />

              {/* Customer auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />
              <Route
                path="/account"
                element={
                  <ProtectedRoute role="customer">
                    <Account />
                  </ProtectedRoute>
                }
              />

              {/* Admin auth */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute role="admin">
                    <Admin />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Placeholder title="404" />} />
            </Routes>
          </main>
          <Footer />
          <ChatWidget />
        </div>
      </CartProvider>
    </AuthProvider>
  )
}

export default App