import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, ShoppingBag, MapPin, Phone, Mail, 
  Star, ChevronRight, Clock, CheckCircle2, 
  Package, Truck, LogOut, Edit2, Loader2, XCircle, AlertCircle, LayoutDashboard,
  MessageSquare, ThumbsUp
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, cn } from '../lib/utils';
import { Order } from '../types';
import { toast } from 'react-hot-toast';

export default function Profile() {
  const { user, profile, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Active' | 'Completed'>('All');
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  useEffect(() => {
    if (!user) return;

    const ordersPath = 'orders';
    const q = query(
      collection(db, ordersPath),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, ordersPath);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !ratingOrder) return;

    setIsSubmittingRating(true);
    try {
      // Add review
      await addDoc(collection(db, 'reviews'), {
        userId: user.uid,
        userName: profile?.name || user.displayName,
        orderId: ratingOrder.id,
        rating,
        comment,
        createdAt: Date.now()
      });

      // Update order to mark as rated
      await updateDoc(doc(db, 'orders', ratingOrder.id), {
        isRated: true
      });

      // Update user stats
      await updateDoc(doc(db, 'users', user.uid), {
        totalReviews: increment(1)
      });

      toast.success('Thank you for your rating!');
      setRatingOrder(null);
      setRating(5);
      setComment('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reviews');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'All') return true;
    if (filter === 'Active') return ['pending', 'confirmed', 'preparing', 'out-for-delivery'].includes(order.status);
    if (filter === 'Completed') return order.status === 'delivered';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: User Info */}
        <div className="space-y-8">
          <section className="bg-[#2A2A2A] border border-white/5 rounded-3xl p-8 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD700]/5 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative group">
                <div className="w-24 h-24 bg-[#FFD700] rounded-3xl flex items-center justify-center shadow-2xl shadow-[#FFD700]/20 rotate-3 group-hover:rotate-0 transition-transform">
                  <User className="text-[#1A1A1A] w-12 h-12" />
                </div>
                <button className="absolute -bottom-2 -right-2 p-2 bg-[#1A1A1A] border border-white/10 text-[#FFD700] rounded-xl shadow-xl hover:scale-110 transition-transform">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">{profile.name}</h1>
                <p className="text-[#FFD700] text-[10px] font-black uppercase tracking-widest">
                  {profile.role} Member
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-8 border-t border-white/5">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <Mail className="w-5 h-5 text-white/30" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Email</p>
                  <p className="text-sm text-white font-bold truncate">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <Phone className="w-5 h-5 text-white/30" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Phone</p>
                  <p className="text-sm text-white font-bold truncate">+91 {profile.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <MapPin className="w-5 h-5 text-white/30" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Address</p>
                  <p className="text-sm text-white font-bold truncate">{profile.address}</p>
                </div>
              </div>
            </div>

            {profile.role === 'admin' && (
              <Link 
                to="/admin"
                className="w-full py-4 bg-[#FFD700] text-[#1A1A1A] font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#FFD700]/90 transition-all shadow-lg shadow-[#FFD700]/20"
              >
                <LayoutDashboard className="w-5 h-5" />
                Admin Dashboard
              </Link>
            )}

            <button 
              onClick={logout}
              className="w-full py-4 bg-red-400/10 text-red-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-400/20 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </section>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-[#2A2A2A] border border-white/5 rounded-3xl text-center space-y-2">
              <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Total Orders</p>
              <h3 className="text-2xl font-black text-white">{profile.totalOrders}</h3>
            </div>
            <div className="p-6 bg-[#2A2A2A] border border-white/5 rounded-3xl text-center space-y-2">
              <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Reviews</p>
              <h3 className="text-2xl font-black text-white">{profile.totalReviews}</h3>
            </div>
          </div>
        </div>

        {/* Right Column: Orders */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-black text-white">Order History</h2>
            <div className="flex gap-2">
              {(['All', 'Active', 'Completed'] as const).map((f) => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                    filter === f ? "bg-[#FFD700] text-[#1A1A1A]" : "bg-white/5 text-white/50 hover:text-white"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
                <p className="text-white/30 font-bold uppercase tracking-widest text-xs">Loading your history...</p>
              </div>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <motion.div
                  key={order.id}
                  whileHover={{ x: 8 }}
                  className="bg-[#2A2A2A] border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group cursor-pointer"
                >
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center",
                      order.status === 'delivered' ? "bg-green-400/10 text-green-400" : 
                      order.status === 'cancelled' ? "bg-red-400/10 text-red-400" :
                      "bg-yellow-400/10 text-yellow-400"
                    )}>
                      {order.status === 'delivered' ? <CheckCircle2 className="w-8 h-8" /> : 
                       order.status === 'cancelled' ? <XCircle className="w-8 h-8" /> :
                       <Clock className="w-8 h-8" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-bold">#{order.id.slice(-6).toUpperCase()}</h4>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                          order.status === 'delivered' ? "bg-green-400/10 text-green-400" : 
                          order.status === 'cancelled' ? "bg-red-400/10 text-red-400" :
                          "bg-yellow-400/10 text-yellow-400"
                        )}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-white/30 text-xs font-medium">
                        {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-8">
                    <div className="text-right">
                      <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">Total Amount</p>
                      <p className="text-[#FFD700] font-black text-xl">{formatCurrency(order.total)}</p>
                    </div>
                    {order.status === 'delivered' && !(order as any).isRated && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setRatingOrder(order);
                        }}
                        className="px-4 py-2 bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#FFD700] hover:text-[#1A1A1A] transition-all"
                      >
                        Rate Order
                      </button>
                    )}
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/30 group-hover:bg-[#FFD700] group-hover:text-[#1A1A1A] transition-all">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-12 bg-white/5 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-white/30 font-bold">No orders found</p>
                <Link to="/browse" className="text-[#FFD700] font-black uppercase tracking-widest text-xs hover:underline">
                  Start your first order
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      <AnimatePresence>
        {ratingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRatingOrder(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.form
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onSubmit={handleRateOrder}
              className="relative w-full max-w-md bg-[#2A2A2A] rounded-3xl p-8 border border-white/10 shadow-2xl space-y-8"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white">Rate Your Order</h3>
                  <p className="text-white/50 text-sm">How was your experience with Paradise?</p>
                </div>
                <button type="button" onClick={() => setRatingOrder(null)} className="p-2 text-white/30 hover:text-white">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={cn(
                        "p-2 transition-all",
                        rating >= star ? "text-[#FFD700] scale-110" : "text-white/10"
                      )}
                    >
                      <Star className={cn("w-8 h-8", rating >= star && "fill-current")} />
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-white/30">Your Review</label>
                  <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    placeholder="Tell us about the taste, delivery, and quality..."
                    className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-white focus:outline-none focus:border-[#FFD700]/50 min-h-[100px]"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmittingRating}
                className="w-full py-4 bg-[#FFD700] text-[#1A1A1A] font-black rounded-xl flex items-center justify-center gap-2 hover:bg-[#FFD700]/90 transition-all disabled:opacity-50"
              >
                {isSubmittingRating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ThumbsUp className="w-5 h-5" />}
                Submit Review
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
