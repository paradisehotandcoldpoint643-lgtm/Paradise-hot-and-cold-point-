import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, ShoppingBag, Users, BarChart3, 
  Settings, Plus, FileUp, Search, MoreVertical, 
  CheckCircle2, Clock, XCircle, Trash2, Edit2, 
  ChevronRight, ArrowUpRight, ArrowDownRight, Sparkles, Loader2, Power, PowerOff, Truck
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, getDoc, limit, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Product, Order, ShopSettings } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { CATEGORIES, PRODUCT_GALLERY, CAKE_WEIGHTS } from '../constants';
import { toast } from 'react-hot-toast';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'analytics' | 'settings'>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const ordersPath = 'orders';
    const productsPath = 'products';
    const settingsPath = 'settings/shop';

    const unsubOrders = onSnapshot(query(collection(db, ordersPath), orderBy('createdAt', 'desc'), limit(50)), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[]);
    }, (err) => handleFirestoreError(err, OperationType.LIST, ordersPath));

    const unsubProducts = onSnapshot(query(collection(db, productsPath), orderBy('createdAt', 'desc')), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, productsPath));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'shop'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as ShopSettings);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, settingsPath));

    return () => {
      unsubOrders();
      unsubProducts();
      unsubSettings();
    };
  }, []);

  const toggleShopStatus = async () => {
    const newStatus = settings ? !settings.isOpen : true;
    try {
      await setDoc(doc(db, 'settings', 'shop'), {
        isOpen: newStatus
      }, { merge: true });
      toast.success(`Shop is now ${newStatus ? 'Open' : 'Closed'}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/shop');
    }
  };

  const toggleDeliveryStatus = async () => {
    const newStatus = settings ? !settings.isDeliveryAvailable : true;
    try {
      await setDoc(doc(db, 'settings', 'shop'), {
        isDeliveryAvailable: newStatus
      }, { merge: true });
      toast.success(`Delivery is now ${newStatus ? 'Available' : 'Unavailable'}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/shop');
    }
  };

  const seedProducts = async () => {
    const testProducts = [
      {
        name: "Chocolate Overload",
        price: 799,
        category: "Chocolate",
        description: "Rich dark chocolate with extra ganache.",
        image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800",
        rating: 4.8,
        reviews: 124,
        createdAt: Date.now()
      },
      {
        name: "Strawberry Dream",
        price: 699,
        category: "Fruit",
        description: "Fresh strawberries with light vanilla cream.",
        image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&q=80&w=800",
        rating: 4.5,
        reviews: 89,
        createdAt: Date.now()
      },
      {
        name: "Blueberry Cheesecake",
        price: 999,
        category: "Cheesecake",
        description: "Classic New York style with fresh blueberry compote.",
        image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=800",
        rating: 4.9,
        reviews: 56,
        createdAt: Date.now()
      }
    ];

    try {
      for (const p of testProducts) {
        await addDoc(collection(db, 'products'), p);
      }
      toast.success('Test products added successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'products');
    }
  };

  const saveAllSettings = async () => {
    if (!settings) return;
    setIsSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'shop'), settings);
      toast.success('All settings saved successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/shop');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFile(file);
      setIsExtracting(true);
      
      // Manual extraction simulation
      setTimeout(() => {
        setIsExtracting(false);
        toast.success('PDF Catalogue uploaded! Please add products manually for now.');
        setIsUploadingPdf(false);
      }, 2000);
    }
  };

  const stats = [
    { label: 'Orders Today', value: orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length.toString(), change: '+12.5%', isUp: true },
    { label: 'Revenue Today', value: formatCurrency(orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).reduce((acc, o) => acc + o.total, 0)), change: '-5%', isUp: false },
    { label: 'Total Products', value: products.length.toString(), change: '+2', isUp: true },
    { label: 'Shop Status', value: settings?.isOpen ? 'Open' : 'Closed', change: 'Live', isUp: settings?.isOpen || false },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Sidebar */}
        <aside className="w-full md:w-64 space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">Admin Panel</h1>
            <p className="text-white/30 text-xs font-bold uppercase tracking-widest">Paradise Bakery</p>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'orders', label: 'Orders', icon: ShoppingBag },
              { id: 'products', label: 'Products', icon: Plus },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                  activeTab === tab.id 
                    ? "bg-[#FFD700] text-[#1A1A1A] shadow-lg shadow-[#FFD700]/10" 
                    : "text-white/50 hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="pt-8 border-t border-white/5 space-y-4">
            <div className="p-4 bg-[#FFD700]/10 rounded-2xl border border-[#FFD700]/20">
              <div className="flex items-center gap-2 text-[#FFD700] mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Shop Status</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white font-bold text-sm">{settings?.isOpen ? 'Open Now' : 'Closed'}</span>
                <button 
                  onClick={toggleShopStatus}
                  className={cn(
                    "w-10 h-5 rounded-full relative transition-colors",
                    settings?.isOpen ? "bg-[#FFD700]" : "bg-white/10"
                  )}
                >
                  <motion.div 
                    animate={{ x: settings?.isOpen ? 20 : 4 }}
                    className="absolute top-1 w-3 h-3 bg-[#1A1A1A] rounded-full" 
                  />
                </button>
              </div>
            </div>

            <div className="p-4 bg-purple-400/10 rounded-2xl border border-purple-400/20">
              <div className="flex items-center gap-2 text-purple-400 mb-2">
                <Truck className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Delivery Status</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white font-bold text-sm">{settings?.isDeliveryAvailable ? 'Available' : 'Disabled'}</span>
                <button 
                  onClick={toggleDeliveryStatus}
                  className={cn(
                    "w-10 h-5 rounded-full relative transition-colors",
                    settings?.isDeliveryAvailable ? "bg-purple-400" : "bg-white/10"
                  )}
                >
                  <motion.div 
                    animate={{ x: settings?.isDeliveryAvailable ? 20 : 4 }}
                    className="absolute top-1 w-3 h-3 bg-[#1A1A1A] rounded-full" 
                  />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-12">
          {activeTab === 'settings' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-white">Shop Settings</h2>
                  <p className="text-white/50 font-bold">Manage your store's global configuration</p>
                </div>
                <button
                  onClick={saveAllSettings}
                  disabled={isSavingSettings}
                  className="px-6 py-3 bg-[#FFD700] text-[#1A1A1A] rounded-xl font-black flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSavingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  Save All Settings
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* General Settings */}
                <div className="p-8 bg-[#2A2A2A] border border-white/5 rounded-3xl space-y-6">
                  <div className="flex items-center gap-3 text-[#FFD700]">
                    <LayoutDashboard className="w-6 h-6" />
                    <h3 className="text-xl font-black">General Configuration</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-white/30 uppercase tracking-widest">Shop Address</label>
                      <input 
                        type="text"
                        value={settings?.defaultAddress || ''}
                        onChange={(e) => setSettings(s => s ? { ...s, defaultAddress: e.target.value } : null)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold focus:border-[#FFD700] outline-none transition-all"
                        placeholder="Enter shop full address"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-white/30 uppercase tracking-widest">Owner Phone</label>
                      <input 
                        type="text"
                        value={settings?.ownerPhone || ''}
                        onChange={(e) => setSettings(s => s ? { ...s, ownerPhone: e.target.value } : null)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold focus:border-[#FFD700] outline-none transition-all"
                        placeholder="Enter owner contact number"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Settings */}
                <div className="p-8 bg-[#2A2A2A] border border-white/5 rounded-3xl space-y-6">
                  <div className="flex items-center gap-3 text-purple-400">
                    <Truck className="w-6 h-6" />
                    <h3 className="text-xl font-black">Delivery Configuration</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-white/30 uppercase tracking-widest">Delivery Radius (KM)</label>
                      <input 
                        type="number"
                        value={settings?.deliveryRadiusKm || 0}
                        onChange={(e) => setSettings(s => s ? { ...s, deliveryRadiusKm: parseFloat(e.target.value) } : null)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold focus:border-[#FFD700] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-white/30 uppercase tracking-widest">Rate per KM (Base Rate)</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number"
                          value={settings?.deliveryRatePerKm || 0}
                          onChange={(e) => setSettings(s => s ? { ...s, deliveryRatePerKm: parseFloat(e.target.value) } : null)}
                          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold focus:border-[#FFD700] outline-none transition-all"
                        />
                        <div className="px-4 py-3 bg-purple-400/10 border border-purple-400/20 rounded-xl text-purple-400 text-xs font-black">
                          DOUBLE POLICY
                        </div>
                      </div>
                      <p className="text-[10px] text-white/30 font-bold italic">
                        * Delivery charges follow the double policy: Base Rate * 2^(distance-1)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'overview' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                  <div key={stat.label} className="p-6 bg-[#2A2A2A] border border-white/5 rounded-3xl space-y-4">
                    <p className="text-white/30 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                    <div className="flex items-end justify-between">
                      <h3 className="text-2xl font-black text-white">{stat.value}</h3>
                      <div className={cn(
                        "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full",
                        stat.isUp ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
                      )}>
                        {stat.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {stat.change}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                  onClick={() => setIsUploadingPdf(true)}
                  className="p-8 bg-[#FFD700] rounded-3xl flex flex-col items-center justify-center gap-4 text-[#1A1A1A] hover:scale-[1.02] transition-transform shadow-2xl shadow-[#FFD700]/10 group"
                >
                  <div className="w-16 h-16 bg-[#1A1A1A] text-[#FFD700] rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform">
                    <FileUp className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-black">Upload PDF Catalogue</h3>
                    <p className="text-[#1A1A1A]/60 text-sm font-bold">Upload your menu for reference</p>
                  </div>
                </button>

                <button 
                  onClick={() => setIsAddingProduct(true)}
                  className="p-8 bg-[#2A2A2A] border border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 text-white hover:bg-white/5 transition-all group"
                >
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-8 h-8 text-[#FFD700]" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-black">Add Manual Product</h3>
                    <p className="text-white/30 text-sm font-bold">Manually set name, price, and description</p>
                  </div>
                </button>

                <button 
                  onClick={seedProducts}
                  className="p-8 bg-[#2A2A2A] border border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 text-white hover:bg-white/5 transition-all group md:col-span-2"
                >
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles className="w-8 h-8 text-[#FFD700]" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-black">Seed Test Products</h3>
                    <p className="text-white/30 text-sm font-bold">Populate your store with sample cakes</p>
                  </div>
                </button>
              </div>

              {/* Recent Orders */}
              <div className="bg-[#2A2A2A] border border-white/5 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-xl font-black text-white">Recent Orders</h3>
                  <button className="text-[#FFD700] text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] font-black uppercase tracking-widest text-white/30 border-b border-white/5">
                        <th className="px-6 py-4">Order ID</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Total</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {orders.slice(0, 5).map((order) => (
                        <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-4 text-sm font-bold text-white">#{order.id.slice(-6).toUpperCase()}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-white font-bold">{order.userName}</div>
                            <div className="text-[10px] text-white/30">{order.userPhone}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                              order.orderType === 'delivery' ? "bg-purple-400/10 text-purple-400" : "bg-orange-400/10 text-orange-400"
                            )}>
                              {order.orderType}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-black text-[#FFD700]">{formatCurrency(order.total)}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                              order.status === 'pending' && "bg-yellow-400/10 text-yellow-400",
                              order.status === 'confirmed' && "bg-blue-400/10 text-blue-400",
                              order.status === 'delivered' && "bg-green-400/10 text-green-400",
                              order.status === 'cancelled' && "bg-red-400/10 text-red-400",
                            )}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => setSelectedOrder(order)}
                                className="p-2 bg-white/5 text-white/50 rounded-lg hover:bg-[#FFD700] hover:text-[#1A1A1A] transition-all"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                              {order.status === 'pending' && (
                                <button 
                                  onClick={() => updateDoc(doc(db, 'orders', order.id), { status: 'confirmed' })}
                                  className="p-2 bg-blue-400/10 text-blue-400 rounded-lg hover:bg-blue-400/20"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}
                              {['confirmed', 'preparing', 'out-for-delivery'].includes(order.status) && (
                                <button 
                                  onClick={() => updateDoc(doc(db, 'orders', order.id), { status: 'delivered' })}
                                  className="p-2 bg-green-400/10 text-green-400 rounded-lg hover:bg-green-400/20"
                                >
                                  <Truck className="w-4 h-4" />
                                </button>
                              )}
                              {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                <button 
                                  onClick={() => updateDoc(doc(db, 'orders', order.id), { status: 'cancelled' })}
                                  className="p-2 bg-red-400/10 text-red-400 rounded-lg hover:bg-red-400/20"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black text-white">All Orders</h2>
                  <p className="text-white/50 font-bold">Manage and track all customer orders</p>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                  {['all', 'pending', 'confirmed', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'].map((status) => (
                    <button
                      key={status}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                        status === 'all' 
                          ? "bg-white/5 text-white hover:bg-white/10" 
                          : status === 'pending' ? "bg-yellow-400/10 text-yellow-400"
                          : status === 'confirmed' ? "bg-blue-400/10 text-blue-400"
                          : status === 'delivered' ? "bg-green-400/10 text-green-400"
                          : "bg-red-400/10 text-red-400"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#2A2A2A] border border-white/5 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] font-black uppercase tracking-widest text-white/30 border-b border-white/5">
                        <th className="px-6 py-4">Order ID</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Total</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-4 text-sm font-bold text-white">#{order.id.slice(-6).toUpperCase()}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-white font-bold">{order.userName}</div>
                            <div className="text-[10px] text-white/30">{order.userPhone}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                              order.orderType === 'delivery' ? "bg-purple-400/10 text-purple-400" : "bg-orange-400/10 text-orange-400"
                            )}>
                              {order.orderType}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-black text-[#FFD700]">{formatCurrency(order.total)}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                              order.status === 'pending' && "bg-yellow-400/10 text-yellow-400",
                              order.status === 'confirmed' && "bg-blue-400/10 text-blue-400",
                              order.status === 'delivered' && "bg-green-400/10 text-green-400",
                              order.status === 'cancelled' && "bg-red-400/10 text-red-400",
                            )}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => setSelectedOrder(order)}
                                className="p-2 bg-white/5 text-white/50 rounded-lg hover:bg-[#FFD700] hover:text-[#1A1A1A] transition-all"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-white">Analytics</h2>
                  <p className="text-white/50 font-bold">Track your business performance and growth</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sales Trend */}
                <div className="p-8 bg-[#2A2A2A] border border-white/5 rounded-3xl space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-white">Sales Trend</h3>
                    <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs font-bold text-white outline-none">
                      <option>Last 7 Days</option>
                      <option>Last 30 Days</option>
                    </select>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={orders.slice().reverse().map(o => ({ date: new Date(o.createdAt).toLocaleDateString(), amount: o.total }))}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#FFD700" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                          itemStyle={{ color: '#FFD700', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="amount" stroke="#FFD700" fillOpacity={1} fill="url(#colorSales)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Popular Categories */}
                <div className="p-8 bg-[#2A2A2A] border border-white/5 rounded-3xl space-y-6">
                  <h3 className="text-xl font-black text-white">Popular Categories</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={CATEGORIES.map(cat => ({
                            name: cat,
                            value: orders.filter(o => o.items.some(i => i.category === cat)).length
                          })).filter(c => c.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {CATEGORIES.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={['#FFD700', '#A78BFA', '#F87171', '#34D399', '#60A5FA'][index % 5]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                          itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-white">Product Management</h2>
                <button 
                  onClick={() => {
                    setEditingProduct(null);
                    setSelectedGalleryImage(null);
                    setIsAddingProduct(true);
                  }}
                  className="px-6 py-3 bg-[#FFD700] text-[#1A1A1A] font-black rounded-xl flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Product
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.length > 0 ? (
                  products.map((product) => (
                    <div key={product.id} className="bg-[#2A2A2A] border border-white/5 rounded-3xl overflow-hidden group">
                      <div className="aspect-video relative overflow-hidden bg-black/20">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" 
                        />
                        <div className="absolute top-4 right-4 flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingProduct(product);
                              setSelectedGalleryImage(product.image);
                              setIsAddingProduct(true);
                            }}
                            className="p-2 bg-blue-400/10 text-blue-400 rounded-lg backdrop-blur-md border border-blue-400/20 hover:bg-blue-400 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteDoc(doc(db, 'products', product.id))}
                            className="p-2 bg-red-400/10 text-red-400 rounded-lg backdrop-blur-md border border-red-400/20 hover:bg-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-white font-bold">{product.name}</h4>
                            <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">{product.category}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[#FFD700] font-black block">{formatCurrency(product.price)}</span>
                            <span className="text-white/30 text-[8px] font-black uppercase tracking-widest">
                              Price (1kg)
                            </span>
                          </div>
                        </div>
                        <p className="text-white/50 text-xs line-clamp-2">{product.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full p-12 bg-white/5 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-white/20" />
                    </div>
                    <p className="text-white/30 font-bold">No products added yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </main>
      </div>

      {/* PDF Upload Modal */}
      <AnimatePresence>
        {isUploadingPdf && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUploadingPdf(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#2A2A2A] rounded-3xl p-8 border border-white/10 shadow-2xl space-y-8"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white">Upload PDF Catalogue</h3>
                  <p className="text-white/50 text-sm">We will extract product names, prices, and images from your catalogue.</p>
                </div>
                <button onClick={() => setIsUploadingPdf(false)} className="p-2 text-white/30 hover:text-white">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="relative group">
                <input 
                  type="file" 
                  accept="application/pdf"
                  onChange={handlePdfUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={cn(
                  "w-full py-16 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-6 transition-all",
                  isExtracting ? "border-[#FFD700] bg-[#FFD700]/5" : "border-white/10 bg-[#1A1A1A] group-hover:border-[#FFD700]/50"
                )}>
                  {isExtracting ? (
                    <div className="text-center space-y-4">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-12 h-12 border-4 border-[#FFD700] border-t-transparent rounded-full mx-auto"
                      />
                      <p className="text-[#FFD700] font-black uppercase tracking-widest text-xs">Uploading PDF...</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
                        <FileUp className="w-8 h-8 text-white/30" />
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold">Drop your PDF here</p>
                        <p className="text-white/30 text-xs">Maximum file size: 10MB</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] text-white/50 font-black uppercase tracking-widest leading-relaxed">
                  Products will be categorized into Birthday, Wedding, etc.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Product Modal */}
      <AnimatePresence>
        {isAddingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAddingProduct(false);
                setEditingProduct(null);
                setSelectedGalleryImage(null);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.form
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get('name') as string;
                const price = Number(formData.get('price'));
                const category = formData.get('category') as any;
                const description = formData.get('description') as string;
                const image = selectedGalleryImage || (formData.get('image') as string);

                if (!name || !price || !category || !description || !image) {
                  toast.error('Please fill all fields');
                  return;
                }

                try {
                  if (editingProduct) {
                    await updateDoc(doc(db, 'products', editingProduct.id), {
                      name,
                      price,
                      category,
                      description,
                      image,
                      updatedAt: Date.now()
                    });
                    toast.success('Product updated successfully!');
                  } else {
                    await addDoc(collection(db, 'products'), {
                      name,
                      price,
                      category,
                      description,
                      image,
                      available: true,
                      createdAt: Date.now()
                    });
                    toast.success('Product added successfully!');
                  }
                  setIsAddingProduct(false);
                  setEditingProduct(null);
                  setSelectedGalleryImage(null);
                } catch (err) {
                  handleFirestoreError(err, editingProduct ? OperationType.UPDATE : OperationType.CREATE, 'products');
                }
              }}
              className="relative w-full max-w-4xl bg-[#2A2A2A] rounded-3xl p-8 border border-white/10 shadow-2xl space-y-8 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-2xl font-black text-white">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                <button type="button" onClick={() => {
                  setIsAddingProduct(false);
                  setEditingProduct(null);
                  setSelectedGalleryImage(null);
                }} className="p-2 text-white/30 hover:text-white">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-white/30">Product Name</label>
                    <input name="name" required type="text" defaultValue={editingProduct?.name} className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-white focus:outline-none focus:border-[#FFD700]/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-white/30">Price (1kg) (₹)</label>
                    <input name="price" required type="number" defaultValue={editingProduct?.price} className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-white focus:outline-none focus:border-[#FFD700]/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-white/30">Category</label>
                    <select name="category" required defaultValue={editingProduct?.category} className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-white focus:outline-none focus:border-[#FFD700]/50">
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-white/30">Description</label>
                    <textarea name="description" required defaultValue={editingProduct?.description} className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-white focus:outline-none focus:border-[#FFD700]/50 min-h-[120px]" />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black uppercase tracking-widest text-white/30">Product Image</label>
                      <div className="relative">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setSelectedGalleryImage(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <button type="button" className="px-3 py-1 bg-white/5 text-white text-[10px] font-black rounded-lg border border-white/10 hover:bg-white/10 flex items-center gap-2">
                          <FileUp className="w-3 h-3" />
                          Upload from Phone
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {PRODUCT_GALLERY.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedGalleryImage(img)}
                          className={cn(
                            "aspect-square rounded-lg overflow-hidden border-2 transition-all",
                            selectedGalleryImage === img ? "border-[#FFD700] scale-95" : "border-transparent opacity-50 hover:opacity-100"
                          )}
                        >
                          <img src={img} alt="Gallery" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-white/30">Or Product Image URL</label>
                    <input 
                      name="image" 
                      type="url" 
                      value={selectedGalleryImage || ''}
                      onChange={(e) => setSelectedGalleryImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..." 
                      className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-white focus:outline-none focus:border-[#FFD700]/50" 
                    />
                  </div>
                  {selectedGalleryImage && (
                    <div className="aspect-video rounded-2xl overflow-hidden border border-white/10">
                      <img src={selectedGalleryImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAddingProduct(false)}
                  className="flex-1 py-4 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-[#FFD700] text-[#1A1A1A] font-black rounded-xl hover:bg-[#FFD700]/90 transition-all"
                >
                  Save Product
                </button>
              </div>
            </motion.form>
          </div>
        )}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[#2A2A2A] rounded-3xl p-8 border border-white/10 shadow-2xl space-y-8 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white">Order Details</h3>
                  <p className="text-white/50 text-sm">#{selectedOrder.id.toUpperCase()}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 text-white/30 hover:text-white">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30">Customer Info</h4>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                      <p className="text-white font-bold">{selectedOrder.userName}</p>
                      <p className="text-white/50 text-sm">{selectedOrder.userEmail}</p>
                      <p className="text-white/50 text-sm">{selectedOrder.userPhone}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30">Order Info</h4>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Type:</span>
                        <span className="text-white font-bold capitalize">{selectedOrder.orderType}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Status:</span>
                        <span className="text-[#FFD700] font-bold capitalize">{selectedOrder.status}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Payment:</span>
                        <span className="text-white font-bold">{selectedOrder.paymentMethod}</span>
                      </div>
                    </div>
                  </div>

                  {selectedOrder.orderType === 'delivery' && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30">Delivery Address</h4>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                        <p className="text-white text-sm leading-relaxed">{selectedOrder.deliveryAddress}</p>
                        {selectedOrder.deliveryDistance !== undefined && (
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/30 pt-2 border-t border-white/5">
                            <span>Distance: {selectedOrder.deliveryDistance} KM</span>
                            <span>Fee: {formatCurrency(selectedOrder.deliveryFee || 0)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30">Order Items</h4>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5">
                          <img src={item.image} className="w-12 h-12 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-xs truncate">{item.name}</p>
                            <p className="text-white/30 text-[10px]">{item.weight} • Qty: {item.quantity}</p>
                          </div>
                          <p className="text-[#FFD700] font-black text-xs">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-[#FFD700]/10 rounded-2xl border border-[#FFD700]/20 flex justify-between items-center">
                    <span className="text-[#FFD700] font-black uppercase tracking-widest text-xs">Total Amount</span>
                    <span className="text-[#FFD700] font-black text-xl">{formatCurrency(selectedOrder.total)}</span>
                  </div>

                  {selectedOrder.paymentScreenshot && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30">Payment Proof</h4>
                      </div>

                      <a 
                        href={selectedOrder.paymentScreenshot} 
                        target="_blank" 
                        rel="noreferrer"
                        className="block aspect-video rounded-2xl overflow-hidden border border-white/10 hover:border-[#FFD700]/50 transition-all"
                      >
                        <img src={selectedOrder.paymentScreenshot} className="w-full h-full object-cover" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
