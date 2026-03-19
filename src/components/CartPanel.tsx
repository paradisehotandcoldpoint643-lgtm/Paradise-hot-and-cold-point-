import React from 'react';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function CartPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { items, removeItem, updateQuantity, total, itemsCount, clearCart } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[#1A1A1A] border-l border-white/10 z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBag className="text-[#FFD700] w-6 h-6" />
                <h2 className="text-xl font-bold text-white">Your Cart</h2>
                <span className="px-2 py-0.5 bg-[#FFD700]/10 text-[#FFD700] text-xs font-bold rounded-full">
                  {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button 
                    onClick={clearCart}
                    className="p-2 text-white/30 hover:text-red-400 transition-colors"
                    title="Clear Cart"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={onClose}
                  className="p-2 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Free Delivery Progress */}
            {items.length > 0 && (
              <div className="px-6 py-4 bg-[#FFD700]/5 border-b border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FFD700]">Free Delivery Unlocked!</span>
                  <Truck className="w-4 h-4 text-[#FFD700]" />
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    className="h-full bg-[#FFD700]"
                  />
                </div>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                    <ShoppingBag className="text-white/20 w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Your cart is empty</h3>
                    <p className="text-white/50 text-sm">Looks like you haven't added anything yet.</p>
                  </div>
                  <button 
                    onClick={onClose}
                    className="px-6 py-2 bg-[#FFD700] text-[#1A1A1A] font-bold rounded-lg"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={`${item.id}-${item.weight}`} className="flex gap-4 group">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-white font-bold truncate pr-4">{item.name}</h4>
                          {item.weight && (
                            <span className="text-[#FFD700] text-[10px] font-black uppercase tracking-widest">
                              Weight: {item.weight}
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={() => removeItem(item.id, item.weight)}
                          className="text-white/30 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[#FFD700] font-bold text-sm mt-1">
                        {formatCurrency(item.price)}
                      </p>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center bg-white/5 rounded-lg p-1">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.weight)}
                            className="p-1 text-white/50 hover:text-white transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center text-white text-sm font-bold">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.weight)}
                            className="p-1 text-white/50 hover:text-white transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-white font-bold text-sm">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-white/10 bg-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">Subtotal</span>
                  <span className="text-white font-bold text-lg">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">Delivery Fee</span>
                  <span className="text-green-400 font-bold text-sm uppercase tracking-wider">Free</span>
                </div>
                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-white font-bold">Total Amount</span>
                  <span className="text-[#FFD700] font-black text-2xl">{formatCurrency(total)}</span>
                </div>
                
                <Link 
                  to="/checkout"
                  onClick={onClose}
                  className="w-full py-4 bg-[#FFD700] text-[#1A1A1A] font-black rounded-xl flex items-center justify-center gap-2 hover:bg-[#FFD700]/90 transition-all hover:gap-4 group"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
