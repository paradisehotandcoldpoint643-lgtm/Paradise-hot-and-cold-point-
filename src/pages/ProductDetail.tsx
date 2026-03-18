import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Star, Clock, ShieldCheck, 
  ArrowLeft, Plus, Minus, Share2, Heart,
  Truck, Utensils, Info, Loader2, XCircle
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../hooks/useCart';
import { formatCurrency, cn } from '../lib/utils';
import { Product } from '../types';
import { toast } from 'react-hot-toast';
import { CAKE_WEIGHTS } from '../constants';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState(CAKE_WEIGHTS[1]); // Default to 1kg
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
        } else {
          toast.error('Product not found');
          navigate('/browse');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        toast.error('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  useEffect(() => {
    if (product?.weightPrices) {
      const availableWeights = CAKE_WEIGHTS.filter(w => product.weightPrices?.[w] !== undefined);
      if (availableWeights.length > 0 && !availableWeights.includes(selectedWeight)) {
        setSelectedWeight(availableWeights[0]);
      }
    }
  }, [product, selectedWeight]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, selectedWeight, quantity);
    toast.success(`Added ${quantity} ${product.name} (${selectedWeight}) to cart!`);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-[#FFD700] animate-spin" />
        <p className="text-white/50 font-black uppercase tracking-widest text-xs">Loading Details...</p>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8 group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-black uppercase tracking-widest">Back to Browse</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Image Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div 
            onClick={() => setShowLightbox(true)}
            className="aspect-square rounded-[3rem] overflow-hidden border border-white/10 relative group bg-black/40 cursor-zoom-in"
          >
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-6 right-6 flex flex-col gap-3">
              <button 
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={cn(
                  "p-4 rounded-2xl backdrop-blur-md border transition-all shadow-2xl",
                  isWishlisted 
                    ? "bg-red-500 border-red-500 text-white" 
                    : "bg-black/20 border-white/20 text-white hover:bg-black/40"
                )}
              >
                <Heart className={cn("w-6 h-6", isWishlisted && "fill-current")} />
              </button>
              <button className="p-4 bg-black/20 backdrop-blur-md border border-white/20 text-white rounded-2xl shadow-2xl hover:bg-black/40 transition-all">
                <Share2 className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-white/10 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                <img 
                  src={product.image} 
                  alt={`${product.name} view ${i}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Info Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-10"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-[#FFD700]/10 text-[#FFD700] text-[10px] font-black uppercase tracking-widest rounded-full border border-[#FFD700]/20">
                {product.category}
              </span>
              <div className="flex items-center gap-1 text-[#FFD700]">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-bold">{product.rating || 4.8}</span>
                <span className="text-white/30 text-xs font-medium">({product.reviews || 0} reviews)</span>
              </div>
            </div>
            <h1 className="text-5xl font-black text-white leading-tight">{product.name}</h1>
            <p className="text-white/50 text-lg leading-relaxed">{product.description}</p>
          </div>

          <div className="flex flex-col gap-8">
            <div className="space-y-4">
              <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Select Weight</p>
              <div className="flex flex-wrap gap-2">
                {CAKE_WEIGHTS.map((w) => {
                  const isAvailable = product.weightPrices === undefined || product.weightPrices[w] !== undefined;
                  return (
                    <button
                      key={w}
                      disabled={!isAvailable}
                      onClick={() => setSelectedWeight(w)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-black transition-all border",
                        selectedWeight === w 
                          ? "bg-[#FFD700] text-[#1A1A1A] border-[#FFD700]" 
                          : isAvailable 
                            ? "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
                            : "bg-white/5 text-white/10 border-white/5 cursor-not-allowed opacity-30"
                      )}
                    >
                      {w}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="space-y-1">
                <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Price</p>
                <p className="text-4xl font-black text-[#FFD700]">
                  {formatCurrency((product.weightPrices?.[selectedWeight] || product.price) * quantity)}
                </p>
              </div>
              <div className="h-12 w-px bg-white/10" />
              <div className="space-y-1">
                <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Quantity</p>
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-1">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-black text-white">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 bg-[#FFD700]/10 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#FFD700]" />
              </div>
              <div>
                <p className="text-white/30 text-[8px] font-black uppercase tracking-widest">Prep Time</p>
                <p className="text-white text-xs font-bold">{product.prepTime || '4-6 hours'}</p>
              </div>
            </div>
            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 bg-green-400/10 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white/30 text-[8px] font-black uppercase tracking-widest">Quality</p>
                <p className="text-white text-xs font-bold">100% Fresh</p>
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-white/5">
            <button 
              onClick={handleAddToCart}
              className="w-full py-5 bg-[#FFD700] text-[#1A1A1A] font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-[#FFD700]/90 transition-all hover:gap-5 group shadow-2xl shadow-[#FFD700]/10"
            >
              <ShoppingBag className="w-6 h-6" />
              Add to Cart • {formatCurrency((product.weightPrices?.[selectedWeight] || product.price) * quantity)}
            </button>
            <div className="flex items-center justify-center gap-6 text-white/30 text-[10px] font-black uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4" /> Free Delivery
              </div>
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4" /> Freshly Baked
              </div>
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4" /> Safe Packing
              </div>
            </div>
          </div>

          {/* Tabs for more info */}
          <div className="space-y-4">
            <div className="flex gap-8 border-b border-white/5">
              <button className="pb-4 border-b-2 border-[#FFD700] text-[#FFD700] text-xs font-black uppercase tracking-widest">Ingredients</button>
              <button className="pb-4 text-white/30 text-xs font-black uppercase tracking-widest hover:text-white transition-colors">Nutrition</button>
              <button className="pb-4 text-white/30 text-xs font-black uppercase tracking-widest hover:text-white transition-colors">Shipping</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(product.ingredients || ['Premium Cocoa', 'Organic Flour', 'Natural Vanilla']).map((ing) => (
                <span key={ing} className="px-4 py-2 bg-white/5 rounded-xl text-white/70 text-xs font-medium border border-white/5">
                  {ing}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {showLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setShowLightbox(false)}
          >
            <button 
              onClick={() => setShowLightbox(false)}
              className="absolute top-8 right-8 p-4 text-white/50 hover:text-white transition-colors"
            >
              <XCircle className="w-10 h-10" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={product.image}
              alt={product.name}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
