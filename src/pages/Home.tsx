import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Star, Clock, ShieldCheck, Sparkles, ChevronRight, Loader2, Utensils, Truck, Heart, Search, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import { CATEGORIES } from '../constants';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(4));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setFeaturedProducts(productsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching featured products:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-24 pb-24"
    >
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&q=80&w=2000" 
            alt="Bakery Hero"
            className="w-full h-full object-cover brightness-[0.3]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFD700]/10 border border-[#FFD700]/20 rounded-full text-[#FFD700] text-xs font-bold uppercase tracking-widest"
            >
              <Sparkles className="w-4 h-4" />
              Agra's Finest Bakery
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-7xl font-black text-white leading-tight"
            >
              The Perfect Cake for <span className="text-[#FFD700]">Every Moment</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-white/60 leading-relaxed"
            >
              From birthdays to weddings, we craft memories with flour, sugar, and a whole lot of love. 
              Experience the magic of Paradise Hot and Cold Point.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link 
                to="/browse"
                className="px-8 py-4 bg-[#FFD700] text-[#1A1A1A] font-black rounded-xl flex items-center justify-center gap-2 hover:bg-[#FFD700]/90 transition-all hover:gap-4 group"
              >
                Order Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-black text-white mb-2">Explore Categories</h2>
            <p className="text-white/50">Find exactly what you're looking for</p>
          </div>
          <Link to="/browse" className="text-[#FFD700] font-bold flex items-center gap-1 hover:gap-2 transition-all">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {CATEGORIES.map((category, index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Link 
                to={`/browse?category=${category}`}
                className="group flex flex-col items-center gap-4 p-6 bg-[#2A2A2A] border border-white/5 rounded-2xl hover:border-[#FFD700]/30 transition-all hover:shadow-lg hover:shadow-[#FFD700]/5"
              >
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-[#FFD700] transition-colors">
                  <Star className="w-6 h-6 text-[#FFD700] group-hover:text-[#1A1A1A] transition-colors" />
                </div>
                <span className="text-xs font-bold text-white/70 group-hover:text-white text-center">
                  {category}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>


      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-black text-white mb-2">Featured Treats</h2>
            <p className="text-white/50">Handpicked favorites from our kitchen</p>
          </div>
          <Link to="/browse" className="text-[#FFD700] font-bold flex items-center gap-1 hover:gap-2 transition-all">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-white/5 rounded-2xl animate-pulse" />
            ))
          ) : featuredProducts.length > 0 ? (
            featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-full py-12 text-center">
              <p className="text-white/30 font-black uppercase tracking-widest text-xs">No featured treats yet</p>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Clock,
              title: "Freshly Baked",
              desc: "Every order is baked fresh just hours before delivery to ensure maximum flavor."
            },
            {
              icon: ShieldCheck,
              title: "Quality Guaranteed",
              desc: "We use only the finest ingredients, from Belgian chocolate to premium dairy."
            },
            {
              icon: Star,
              title: "Custom Creations",
              desc: "Can't find what you need? Our master bakers can create any custom design you imagine."
            }
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 bg-[#2A2A2A] border border-white/5 rounded-3xl space-y-4"
            >
              <div className="w-14 h-14 bg-[#FFD700]/10 rounded-2xl flex items-center justify-center">
                <feature.icon className="w-8 h-8 text-[#FFD700]" />
              </div>
              <h3 className="text-xl font-black text-white">{feature.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
      {/* How it Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-black text-white">How it Works</h2>
          <p className="text-white/50 max-w-xl mx-auto">Getting your favorite treats is as easy as pie (or cake!).</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            {
              icon: Search,
              title: "Browse",
              desc: "Explore our wide range of delicious cakes and pastries."
            },
            {
              icon: ShoppingBag,
              title: "Order",
              desc: "Select your weight, quantity, and place your order."
            },
            {
              icon: Utensils,
              title: "Bake",
              desc: "Our master bakers start crafting your treat fresh."
            },
            {
              icon: Truck,
              title: "Enjoy",
              desc: "Get it delivered to your doorstep or pick it up."
            }
          ].map((step, index) => (
            <div key={step.title} className="relative group">
              {index < 3 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-white/10 z-0" />
              )}
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-[#FFD700]/10 rounded-2xl flex items-center justify-center group-hover:bg-[#FFD700] transition-all duration-500">
                  <step.icon className="w-8 h-8 text-[#FFD700] group-hover:text-[#1A1A1A] transition-colors" />
                </div>
                <h3 className="text-lg font-black text-white">{step.title}</h3>
                <p className="text-white/50 text-xs leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#2A2A2A] py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-black text-white">What Our Customers Say</h2>
            <p className="text-white/50 max-w-xl mx-auto">Real stories from real cake lovers in Agra.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Rahul Sharma",
                role: "Birthday Party",
                text: "The chocolate truffle cake was out of this world! Fresh, moist, and delivered right on time. Paradise is now my go-to bakery.",
                rating: 5
              },
              {
                name: "Priya Gupta",
                role: "Wedding Anniversary",
                text: "Ordered a custom 2-tier cake for my parents' anniversary. It looked exactly like the photo and tasted even better. Highly recommended!",
                rating: 5
              },
              {
                name: "Ankit Verma",
                role: "Office Celebration",
                text: "Best pastries in Agra, hands down. The red velvet is a must-try. The online ordering process was seamless and quick.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 bg-[#1A1A1A] border border-white/5 rounded-[2rem] space-y-6 relative"
              >
                <div className="flex gap-1 text-[#FFD700]">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-white/70 italic leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                  <div className="w-10 h-10 bg-[#FFD700]/10 rounded-full flex items-center justify-center font-black text-[#FFD700]">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">{testimonial.name}</h4>
                    <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-[3rem] p-12 md:p-20 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-20 h-20 border-4 border-black rounded-full" />
            <div className="absolute bottom-10 right-10 w-32 h-32 border-4 border-black rounded-full" />
            <div className="absolute top-1/2 left-1/4 w-10 h-10 bg-black rounded-full" />
          </div>
          
          <div className="relative z-10 space-y-4">
            <h2 className="text-4xl md:text-6xl font-black text-[#1A1A1A]">Join the Sweetest Club</h2>
            <p className="text-[#1A1A1A]/70 max-w-xl mx-auto font-bold">Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.</p>
          </div>

          <form className="relative z-10 max-w-md mx-auto flex flex-col sm:flex-row gap-4">
            <input 
              type="email" 
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 bg-white/20 border border-black/10 rounded-2xl text-[#1A1A1A] placeholder:text-[#1A1A1A]/50 focus:outline-none focus:bg-white/30 transition-all font-bold"
            />
            <button className="px-8 py-4 bg-[#1A1A1A] text-white font-black rounded-2xl hover:bg-black/80 transition-all">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </motion.div>
  );
}
