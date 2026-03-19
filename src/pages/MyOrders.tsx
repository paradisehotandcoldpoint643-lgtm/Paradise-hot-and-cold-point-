import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Package, Truck, CheckCircle2, 
  Clock, XCircle, ChevronRight, Search, 
  Calendar, MapPin, CreditCard, ExternalLink,
  Loader2, AlertCircle
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { Order } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'delivered' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;

    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef, 
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
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'cancelled': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'confirmed': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'preparing': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'out-for-delivery': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      default: return 'text-white/50 bg-white/5 border-white/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle2 className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <Package className="w-4 h-4" />;
      case 'preparing': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'out-for-delivery': return <Truck className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-[#FFD700] animate-spin" />
        <p className="text-white/50 font-black uppercase tracking-widest text-xs">Fetching your orders...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFD700]/10 rounded-full border border-[#FFD700]/20">
            <ShoppingBag className="w-3 h-3 text-[#FFD700]" />
            <span className="text-[8px] font-black text-[#FFD700] uppercase tracking-widest">Order History</span>
          </div>
          <h1 className="text-5xl font-black text-white">My Orders</h1>
          <p className="text-white/50 max-w-xl">Track your current orders and view your past purchases from Paradise Bakery.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-[#FFD700] transition-colors" />
            <input 
              type="text"
              placeholder="Search order ID or items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-[#2A2A2A] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#FFD700]/50 transition-all"
            />
          </div>
          <div className="flex bg-[#2A2A2A] rounded-xl p-1 border border-white/5">
            {(['all', 'pending', 'delivered'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  filter === f ? "bg-[#FFD700] text-[#1A1A1A]" : "text-white/30 hover:text-white"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#2A2A2A] border border-white/5 rounded-[3rem] p-16 text-center space-y-6"
        >
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto">
            <ShoppingBag className="w-10 h-10 text-white/20" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white">No orders found</h3>
            <p className="text-white/50 max-w-xs mx-auto">Looks like you haven't placed any orders yet. Time to treat yourself!</p>
          </div>
          <Link 
            to="/browse"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#FFD700] text-[#1A1A1A] font-black rounded-xl hover:bg-[#FFD700]/90 transition-all group"
          >
            Browse Bakery
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-[#2A2A2A] border border-white/5 rounded-3xl overflow-hidden hover:border-[#FFD700]/30 transition-all"
              >
                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                  {/* Order Meta */}
                  <div className="md:w-64 space-y-6">
                    <div className="space-y-1">
                      <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Order ID</p>
                      <p className="text-white font-mono text-sm font-bold">#{order.id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Status</p>
                      <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest",
                        getStatusColor(order.status)
                      )}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Date</p>
                      <div className="flex items-center gap-2 text-white/70 text-sm font-bold">
                        <Calendar className="w-4 h-4 text-[#FFD700]" />
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="flex-1 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex gap-4 p-3 bg-white/5 rounded-2xl border border-white/5">
                          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white text-sm font-bold truncate">{item.name}</h4>
                            <p className="text-white/50 text-[10px] font-medium">
                              {item.weight} • {item.quantity} Unit{item.quantity > 1 ? 's' : ''}
                            </p>
                            <p className="text-[#FFD700] text-xs font-black mt-1">{formatCurrency(item.price * item.quantity)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-4 pt-6 border-t border-white/5">
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                        <MapPin className="w-4 h-4 text-[#FFD700]" />
                        <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest truncate max-w-[200px]">
                          {order.deliveryAddress}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                        <CreditCard className="w-4 h-4 text-[#FFD700]" />
                        <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">
                          {order.paymentMethod} • {order.paymentStatus === 'verified' ? 'Paid' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Total & Action */}
                  <div className="md:w-48 flex flex-col justify-between items-end gap-6">
                    <div className="text-right">
                      <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Total Amount</p>
                      <p className="text-3xl font-black text-[#FFD700]">{formatCurrency(order.total)}</p>
                    </div>
                    <button className="w-full py-3 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                      View Details
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
