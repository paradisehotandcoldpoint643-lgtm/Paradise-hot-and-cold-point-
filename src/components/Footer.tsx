import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Facebook, Instagram, Twitter, Phone, MapPin, Mail } from 'lucide-react';
import { OWNER_PHONE, SHOP_ADDRESS } from '../constants';

export default function Footer() {
  return (
    <footer className="bg-[#1A1A1A] border-t border-white/5 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#FFD700] rounded-xl flex items-center justify-center">
                <ShoppingBag className="text-[#1A1A1A] w-6 h-6" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">Paradise</h1>
                <p className="text-[#FFD700] text-[10px] uppercase tracking-widest font-semibold">Hot & Cold Point</p>
              </div>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed">
              Serving the finest cakes, pastries, and treats in Agra. 
              Our mission is to bring a slice of paradise to every celebration.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/50 hover:text-[#FFD700] hover:bg-white/10 transition-all">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/50 hover:text-[#FFD700] hover:bg-white/10 transition-all">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/50 hover:text-[#FFD700] hover:bg-white/10 transition-all">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold mb-6">Quick Links</h3>
            <ul className="space-y-4">
              {['Home', 'Browse', 'About Us', 'Contact'].map((item) => (
                <li key={item}>
                  <Link 
                    to={item === 'Home' ? '/' : `/${item.toLowerCase().replace(' ', '-')}`}
                    className="text-white/50 hover:text-[#FFD700] transition-colors text-sm"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-bold mb-6">Categories</h3>
            <ul className="space-y-4">
              {['Birthday Cakes', 'Wedding Cakes', 'Anniversary Cakes', 'Custom Cakes', 'Cupcakes'].map((item) => (
                <li key={item}>
                  <Link 
                    to="/browse"
                    className="text-white/50 hover:text-[#FFD700] transition-colors text-sm"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-white/50">
                <MapPin className="w-5 h-5 text-[#FFD700] flex-shrink-0" />
                <span>{SHOP_ADDRESS}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/50">
                <Phone className="w-5 h-5 text-[#FFD700] flex-shrink-0" />
                <span>+91 {OWNER_PHONE}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/50">
                <Mail className="w-5 h-5 text-[#FFD700] flex-shrink-0" />
                <span>hello@paradisebakery.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/30 font-medium uppercase tracking-widest">
          <p>© 2026 Paradise Hot & Cold Point. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
