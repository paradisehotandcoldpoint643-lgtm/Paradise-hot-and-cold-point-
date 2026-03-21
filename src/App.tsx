import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

// Components
import Navbar from './components/Navbar';
import CartPanel from './components/CartPanel';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Home from './pages/Home';
import Browse from './pages/Browse';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import Login from './pages/Login';
import ProductDetail from './pages/ProductDetail';
import MyOrders from './pages/MyOrders';

// Hooks
import { AuthProvider, useAuth } from './hooks/useAuth';
import { CartProvider } from './context/CartContext';

function AppContent() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-[#FFD700] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-[#1A1A1A] text-white selection:bg-[#FFD700] selection:text-[#1A1A1A]">
        <Toaster position="top-center" />
        <Navbar onOpenCart={() => setIsCartOpen(true)} />
        <CartPanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

        <main className="pb-20 md:pb-0">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/login" element={<Login />} />
              
              {/* Protected Routes */}
              <Route 
                path="/profile" 
                element={user ? <Profile /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/orders" 
                element={user ? <MyOrders /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/admin/*" 
                element={profile?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} 
              />
              <Route 
                path="/delivery/*" 
                element={profile?.role === 'delivery' ? <DeliveryDashboard /> : <Navigate to="/" />} 
              />
            </Routes>
          </AnimatePresence>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
