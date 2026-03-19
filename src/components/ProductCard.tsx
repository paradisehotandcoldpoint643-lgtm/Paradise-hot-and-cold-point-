import React, { useState, useEffect } from 'react';
import { Plus, ShoppingBag, Star, Heart, ChevronRight, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { formatCurrency, cn, calculatePriceByWeight } from '../lib/utils';
import { useCart } from '../hooks/useCart';
import { CAKE_WEIGHTS } from '../constants';

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [selectedWeight, setSelectedWeight] = useState(CAKE_WEIGHTS[1]); // Default to 1kg
  const [showWeightModal, setShowWeightModal] = useState(false);

  useEffect(() => {
    if (product.weightPrices) {
      const availableWeights = CAKE_WEIGHTS.filter(w => product.weightPrices?.[w] !== undefined);
      if (availableWeights.length > 0 && !availableWeights.includes(selectedWeight)) {
        setSelectedWeight(availableWeights[0]);
      }
    }
  }, [product.weightPrices, selectedWeight]);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowWeightModal(true);
  };

  const confirmAdd = (weight: string) => {
    addItem(product, weight);
    setShowWeightModal(false);
  };

  return (
    <>
      <Link to={`/product/${product.id}`}>
        <motion.div
          whileHover={{ y: -8 }}
          className="group bg-[#2A2A2A] rounded-2xl overflow-hidden border border-white/5 hover:border-[#FFD700]/30 transition-all shadow-lg hover:shadow-[#FFD700]/5"
        >
          {/* Image Container */}
          <div className="relative aspect-square overflow-hidden bg-black/40">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {product.price > 1000 && (
                <div className="px-2 py-1 bg-[#FFD700] text-[#1A1A1A] text-[10px] font-black rounded-full flex items-center gap-1 shadow-lg">
                  <Sparkles className="w-3 h-3" />
                  TRENDING
                </div>
              )}
              <div className="px-2 py-1 bg-[#1A1A1A]/80 backdrop-blur-md text-[#FFD700] text-[10px] font-bold rounded-full flex items-center gap-1 border border-white/10">
                <Star className="w-3 h-3 fill-[#FFD700]" />
                4.8
              </div>
            </div>

            <button className="absolute top-3 right-3 p-2 bg-[#1A1A1A]/80 backdrop-blur-md text-white/50 hover:text-red-400 rounded-full border border-white/10 transition-colors">
              <Heart className="w-4 h-4" />
            </button>

            {/* Quick Add Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 gap-4">
              <button 
                onClick={handleQuickAdd}
                className="px-6 py-2 bg-[#FFD700] text-[#1A1A1A] font-bold rounded-full flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform"
              >
                <Plus className="w-4 h-4" />
                Quick Add
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="text-white font-bold text-lg leading-tight group-hover:text-[#FFD700] transition-colors truncate">
                {product.name}
              </h3>
            </div>
            <p className="text-white/50 text-xs line-clamp-2 min-h-[2rem]">
              {product.description}
            </p>
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex flex-col">
                <span className="text-[#FFD700] font-black text-xl">
                  {formatCurrency(calculatePriceByWeight(product.price, selectedWeight))}
                </span>
                <span className="text-white/30 text-[10px] uppercase tracking-widest font-bold">
                  Freshly Baked
                </span>
              </div>
              
              <button 
                onClick={handleQuickAdd}
                className="w-10 h-10 bg-[#FFD700] text-[#1A1A1A] rounded-xl flex items-center justify-center hover:bg-[#FFD700]/90 transition-colors shadow-lg shadow-[#FFD700]/10"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>
        </motion.div>
      </Link>

      {/* Weight Selection Modal */}
      <AnimatePresence>
        {showWeightModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWeightModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[#1A1A1A] border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <button 
                onClick={() => setShowWeightModal(false)}
                className="absolute top-4 right-4 p-2 text-white/30 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-[#FFD700]/10 rounded-2xl flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8 text-[#FFD700]" />
                </div>
                
                <div>
                  <h3 className="text-xl font-black text-white mb-2">Select Weight</h3>
                  <p className="text-white/50 text-sm">How much {product.name} would you like?</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {CAKE_WEIGHTS.map((w) => {
                    const displayPrice = calculatePriceByWeight(product.price, w);
                    const isAvailable = product.weightPrices === undefined || product.weightPrices[w] !== undefined;

                    return (
                      <button
                        key={w}
                        onClick={() => isAvailable && confirmAdd(w)}
                        className={cn(
                          "p-4 rounded-xl border transition-all group text-left",
                          isAvailable 
                            ? "border-white/5 bg-white/5 text-white hover:border-[#FFD700] hover:bg-[#FFD700]/10" 
                            : "border-white/5 bg-white/5 text-white/20 cursor-not-allowed opacity-50"
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <span className={cn("block font-black text-lg", isAvailable && "group-hover:text-[#FFD700]")}>{w}</span>
                          {isAvailable && (
                            <span className="text-[#FFD700] font-bold text-sm">{formatCurrency(displayPrice)}</span>
                          )}
                        </div>
                        <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
                          {isAvailable ? 'Available' : 'Not Available'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
                  Price may vary for higher weights
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
