import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Truck, MapPin, Phone, CheckCircle2, 
  Clock, Navigation, ChevronRight, Search, 
  Filter, MoreVertical, XCircle, Package, 
  ArrowLeft, Sparkles, Loader2 
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, cn } from '../lib/utils';
import { Order } from '../types';
import { toast } from 'react-hot-toast';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'completed'>('pending');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const handleFirestoreError = (error: any, operation: OperationType, path: string) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      operationType: operation,
      path,
    };
    console.error('Firestore Error:', JSON.stringify(errInfo));
    toast.error(`Error: ${errInfo.error}`);
  };

  useEffect(() => {
    if (!user) return;

    const ordersPath = 'orders';
    const q = query(
      collection(db, ordersPath),
      where('status', 'in', ['confirmed', 'preparing', 'out-for-delivery', 'delivered']),
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

  const handleUpdateStatus = async (id: string, status: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status });
      toast.success(`Order status updated to ${status}!`);
      if (selectedOrder?.id === id) {
        setSelectedOrder(prev => prev ? { ...prev, status } : null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${id}`);
    }
  };

  const filteredOrders = orders.filter(d => {
    if (activeTab === 'pending') return d.status === 'confirmed' || d.status === 'preparing';
    if (activeTab === 'active') return d.status === 'out-for-delivery';
    return d.status === 'delivered';
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#FFD700] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FFD700]/20">
            <Truck className="text-[#1A1A1A] w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Delivery Dashboard</h1>
            <p className="text-white/30 text-xs font-bold uppercase tracking-widest">Staff Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#2A2A2A] p-1 rounded-xl border border-white/5">
          {['pending', 'active', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-widest",
                activeTab === tab 
                  ? "bg-[#FFD700] text-[#1A1A1A]" 
                  : "text-white/50 hover:text-white"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Delivery List */}
        <div className="space-y-6">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
              <p className="text-white/30 font-bold">Loading deliveries...</p>
            </div>
          ) : filteredOrders.map((delivery) => (
            <motion.div
              key={delivery.id}
              layoutId={delivery.id}
              onClick={() => setSelectedOrder(delivery)}
              className={cn(
                "p-6 bg-[#2A2A2A] border rounded-3xl cursor-pointer transition-all group",
                selectedOrder?.id === delivery.id ? "border-[#FFD700] shadow-2xl shadow-[#FFD700]/5" : "border-white/5 hover:border-white/10"
              )}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-white/30" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">#{delivery.id.slice(-6).toUpperCase()}</h4>
                    <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">
                      {new Date(delivery.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                  (delivery.status === 'confirmed' || delivery.status === 'preparing') && "bg-yellow-400/10 text-yellow-400",
                  delivery.status === 'out-for-delivery' && "bg-blue-400/10 text-blue-400",
                  delivery.status === 'delivered' && "bg-green-400/10 text-green-400",
                )}>
                  {delivery.status.replace('-', ' ')}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#FFD700] flex-shrink-0 mt-1" />
                  <p className="text-white/70 text-sm leading-relaxed line-clamp-2">{delivery.customerAddress}</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-white/5 rounded-full flex items-center justify-center">
                      <Phone className="w-3 h-3 text-white/30" />
                    </div>
                    <span className="text-white/50 text-xs font-bold">{delivery.customerPhone}</span>
                  </div>
                  <p className="text-white font-black">{formatCurrency(delivery.total)}</p>
                </div>
              </div>
            </motion.div>
          ))}

          {!loading && filteredOrders.length === 0 && (
            <div className="py-24 flex flex-col items-center justify-center text-center space-y-4 bg-white/5 border border-dashed border-white/10 rounded-3xl">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-white/10" />
              </div>
              <p className="text-white/30 font-bold">No {activeTab} deliveries.</p>
            </div>
          )}
        </div>

        {/* Selected Order Detail */}
        <div className="hidden lg:block">
          <AnimatePresence mode="wait">
            {selectedOrder ? (
              <motion.div
                key={selectedOrder.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="sticky top-24 bg-[#2A2A2A] border border-white/10 rounded-3xl p-8 space-y-8 shadow-2xl"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white">Order Details</h3>
                    <p className="text-[#FFD700] font-black text-xs uppercase tracking-widest">#{selectedOrder.id.slice(-6).toUpperCase()}</p>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 text-white/30 hover:text-white transition-colors">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-[#1A1A1A] rounded-2xl border border-white/5 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#FFD700] rounded-xl flex items-center justify-center">
                        <MapPin className="text-[#1A1A1A] w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Delivery Address</p>
                        <p className="text-white font-bold leading-relaxed">{selectedOrder.customerAddress}</p>
                      </div>
                    </div>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrder.customerAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-white/5 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                    >
                      <Navigation className="w-4 h-4 text-[#FFD700]" />
                      Open in Maps
                    </a>
                  </div>

                  <div className="p-6 bg-[#1A1A1A] rounded-2xl border border-white/5 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-400/10 rounded-xl flex items-center justify-center">
                        <Phone className="text-blue-400 w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Customer Contact</p>
                        <p className="text-white font-bold">{selectedOrder.customerName}</p>
                        <p className="text-white/50 text-sm">{selectedOrder.customerPhone}</p>
                      </div>
                    </div>
                    <a 
                      href={`tel:${selectedOrder.customerPhone}`}
                      className="w-full py-3 bg-blue-400/10 text-blue-400 text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-400/20 transition-all"
                    >
                      Call Customer
                    </a>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center">
                      <span className="text-white/50 text-sm">Total Amount to Collect</span>
                      <span className="text-[#FFD700] font-black text-xl">{formatCurrency(selectedOrder.total)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/50 text-sm">Payment Status</span>
                      <span className="px-3 py-1 bg-green-400/10 text-green-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                        {selectedOrder.paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {selectedOrder.status === 'confirmed' && (
                      <button 
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'preparing')}
                        className="w-full py-4 bg-white/5 text-white font-black rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                      >
                        Start Preparing
                      </button>
                    )}
                    {selectedOrder.status === 'preparing' && (
                      <button 
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'out-for-delivery')}
                        className="w-full py-4 bg-blue-400 text-white font-black rounded-xl flex items-center justify-center gap-2 hover:bg-blue-400/90 transition-all"
                      >
                        <Truck className="w-5 h-5" />
                        Out for Delivery
                      </button>
                    )}
                    {selectedOrder.status === 'out-for-delivery' && (
                      <button 
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')}
                        className="w-full py-4 bg-[#FFD700] text-[#1A1A1A] font-black rounded-xl flex items-center justify-center gap-2 hover:bg-[#FFD700]/90 transition-all shadow-xl shadow-[#FFD700]/10"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        Mark as Delivered
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 p-12 bg-white/5 border border-dashed border-white/10 rounded-3xl">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
                  <Navigation className="w-10 h-10 text-white/10" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">No Order Selected</h3>
                  <p className="text-white/30 text-sm max-w-xs mx-auto mt-2">
                    Select an order from the list to view delivery details and customer contact.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
