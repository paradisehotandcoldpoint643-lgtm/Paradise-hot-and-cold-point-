import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, SlidersHorizontal, ChevronDown, X, Loader2 } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import { CATEGORIES } from '../constants';
import ProductCard from '../components/ProductCard';
import { cn } from '../lib/utils';

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');

  const selectedCategory = searchParams.get('category') || 'All';

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return b.createdAt - a.createdAt;
    });
  }, [products, selectedCategory, searchQuery, sortBy]);

  const handleCategoryChange = (category: string) => {
    if (category === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-[#FFD700] animate-spin" />
        <p className="text-white/50 font-black uppercase tracking-widest text-xs">Loading Paradise...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white mb-2">Our Creations</h1>
          <p className="text-white/50">Browse our full collection of freshly baked treats</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input 
              type="text" 
              placeholder="Search cakes, pastries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#2A2A2A] border border-white/5 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#FFD700]/50 transition-all"
            />
          </div>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={cn(
              "p-3 rounded-xl border transition-all",
              isFilterOpen ? "bg-[#FFD700] border-[#FFD700] text-[#1A1A1A]" : "bg-[#2A2A2A] border-white/5 text-white/70 hover:text-white"
            )}
          >
            <SlidersHorizontal className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
        {['All', ...CATEGORIES].map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryChange(category)}
            className={cn(
              "px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all",
              selectedCategory === category 
                ? "bg-[#FFD700] text-[#1A1A1A] shadow-lg shadow-[#FFD700]/10" 
                : "bg-[#2A2A2A] text-white/50 hover:text-white border border-white/5"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Filters & Sorting */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-[#2A2A2A] border border-white/5 rounded-2xl flex flex-wrap gap-8">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-white/30">Sort By</label>
                <div className="flex gap-2">
                  {[
                    { id: 'newest', label: 'Newest First' },
                    { id: 'price-low', label: 'Price: Low to High' },
                    { id: 'price-high', label: 'Price: High to Low' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSortBy(option.id as any)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                        sortBy === option.id 
                          ? "bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30" 
                          : "bg-white/5 text-white/50 hover:text-white border border-transparent"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-24 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center">
            <Search className="w-10 h-10 text-white/10" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white">No products found</h3>
            <p className="text-white/50 max-w-sm mx-auto mt-2">
              We couldn't find anything matching your search. Try different keywords or categories.
            </p>
          </div>
          <button 
            onClick={() => {
              setSearchQuery('');
              handleCategoryChange('All');
            }}
            className="px-8 py-3 bg-[#FFD700] text-[#1A1A1A] font-black rounded-xl"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </motion.div>
  );
}
