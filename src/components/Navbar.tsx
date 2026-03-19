import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X, User, LogOut, LayoutDashboard, Truck, Home, Grid, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';

export default function Navbar({ onOpenCart }: { onOpenCart: () => void }) {
  const { user, profile, logout } = useAuth();
  const { itemsCount } = useCart();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Browse', path: '/browse', icon: Grid },
  ];

  if (user) {
    navLinks.push({ name: 'My Orders', path: '/orders', icon: History });
  }

  if (profile?.role === 'admin') {
    navLinks.push({ name: 'Admin', path: '/admin', icon: LayoutDashboard });
  } else if (profile?.role === 'delivery') {
    navLinks.push({ name: 'Delivery', path: '/delivery', icon: Truck });
  }

  return (
    <nav className="sticky top-0 z-40 w-full bg-[#1A1A1A]/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#FFD700] rounded-xl flex items-center justify-center">
              <ShoppingBag className="text-[#1A1A1A] w-6 h-6" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-white font-bold text-lg leading-tight">Paradise</h1>
              <p className="text-[#FFD700] text-[10px] uppercase tracking-widest font-semibold">Hot & Cold Point</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-[#FFD700]",
                  location.pathname === link.path ? "text-[#FFD700]" : "text-white/70"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="p-2 text-white/70 hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </button>
            
            <button 
              onClick={onOpenCart}
              className="p-2 text-white/70 hover:text-white transition-colors relative"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#FFD700] text-[#1A1A1A] text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemsCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/profile" className="p-2 text-white/70 hover:text-white transition-colors">
                  <User className="w-5 h-5" />
                </Link>
                <button 
                  onClick={logout}
                  className="hidden sm:block p-2 text-white/70 hover:text-white transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link 
                to="/login"
                className="px-4 py-2 bg-[#FFD700] text-[#1A1A1A] text-sm font-bold rounded-lg hover:bg-[#FFD700]/90 transition-colors"
              >
                Login
              </Link>
            )}

            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#1A1A1A] border-b border-white/5 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "block px-3 py-4 text-base font-medium rounded-lg",
                    location.pathname === link.path 
                      ? "bg-[#FFD700]/10 text-[#FFD700]" 
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              {user && (
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-4 text-base font-medium text-red-400 rounded-lg hover:bg-red-400/5"
                >
                  Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1A1A1A]/95 backdrop-blur-xl border-t border-white/5 px-4 py-3 z-50 flex items-center justify-around">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={cn(
              "flex flex-col items-center gap-1 transition-all",
              location.pathname === link.path ? "text-[#FFD700]" : "text-white/30"
            )}
          >
            <link.icon className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase tracking-widest">{link.name}</span>
          </Link>
        ))}
        <button 
          onClick={onOpenCart}
          className={cn(
            "flex flex-col items-center gap-1 transition-all relative",
            itemsCount > 0 ? "text-[#FFD700]" : "text-white/30"
          )}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase tracking-widest">Cart</span>
          {itemsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FFD700] text-[#1A1A1A] text-[10px] font-black rounded-full flex items-center justify-center">
              {itemsCount}
            </span>
          )}
        </button>
        <Link 
          to={user ? "/profile" : "/login"}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            location.pathname === "/profile" || location.pathname === "/login" ? "text-[#FFD700]" : "text-white/30"
          )}
        >
          <User className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase tracking-widest">{user ? "Profile" : "Login"}</span>
        </Link>
      </div>
    </nav>
  );
}
