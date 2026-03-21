import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, ShoppingBag, MapPin, Calendar, Clock, 
  CreditCard, QrCode, Banknote, Upload, CheckCircle2, 
  AlertCircle, ChevronRight, Sparkles, User, XCircle, Truck, Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, addDoc, doc, updateDoc, increment, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, cn } from '../lib/utils';
import { TIME_SLOTS, SHOP_ADDRESS } from '../constants';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { Order, ShopSettings } from '../types';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, itemsCount, clearCart } = useCart();
  const { user, profile } = useAuth();
  
  const [step, setStep] = useState(1);
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [customerName, setCustomerName] = useState(profile?.name || user?.displayName || '');
  const [customerEmail, setCustomerEmail] = useState(profile?.email || user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(profile?.phone || '');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [address, setAddress] = useState(profile?.address || '');
  const [cakeInstructions, setCakeInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'COD'>('UPI');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState<ShopSettings | null>(null);

  React.useEffect(() => {
    if (itemsCount === 0 && !isSuccess) {
      navigate('/browse');
    }
  }, [itemsCount, isSuccess, navigate]);

  React.useEffect(() => {
    if (profile) {
      if (!customerName) setCustomerName(profile.name);
      if (!customerEmail) setCustomerEmail(profile.email);
      if (!customerPhone) setCustomerPhone(profile.phone);
      if (!address && orderType === 'delivery') setAddress(profile.address);
    }
  }, [profile, orderType]);

  React.useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'shop'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as ShopSettings;
        setSettings(data);
        if (data.isDeliveryAvailable === false && orderType === 'delivery') {
          setOrderType('pickup');
        }
      }
    });
    return () => unsub();
  }, [orderType]);

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }

    if (!customerName || !customerEmail || !customerPhone) {
      toast.error('Please fill in all customer details');
      return;
    }

    if (paymentMethod === 'UPI' && !screenshot) {
      toast.error('Please upload your payment screenshot');
      return;
    }

    setIsSubmitting(true);
    const orderPath = 'orders';
    const deliveryFee = orderType === 'delivery' ? (settings?.flatDeliveryFee || 0) : 0;
    
    try {
      const orderData: Omit<Order, 'id'> = {
        userId: user.uid,
        userName: customerName,
        userPhone: customerPhone,
        userEmail: customerEmail,
        orderType,
        items,
        total: total + 25 + deliveryFee, // Including tax and delivery fee
        status: 'pending',
        deliveryAddress: orderType === 'delivery' ? address : (cakeInstructions || 'Pickup from Shop'),
        customerAddress: orderType === 'delivery' ? address : 'Pickup from Shop',
        customerName: customerName,
        customerPhone: customerPhone,
        deliveryDate: deliveryDate,
        deliveryTimeSlot: timeSlot,
        deliveryFee: orderType === 'delivery' ? deliveryFee : 0,
        paymentMethod,
        paymentScreenshot: screenshot || null,
        paymentVerified: false,
        paymentStatus: 'pending',
        createdAt: Date.now(),
        notes: cakeInstructions,
      };

      if (orderType === 'pickup') {
        orderData.customerAddress = 'Pickup from Shop';
      }

      await addDoc(collection(db, orderPath), orderData);
      
      // Update user stats
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        totalOrders: increment(1),
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        address: address
      });

      setIsSuccess(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFFFFF', '#3D2B1F']
      });

      setTimeout(() => {
        clearCart();
        navigate('/profile');
      }, 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, orderPath);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (settings && !settings.isOpen && !isSuccess) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <div className="w-20 h-20 bg-red-400/10 rounded-full flex items-center justify-center mb-6">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Shop is Closed</h2>
        <p className="text-white/50 mb-8 max-w-xs">We are currently not accepting orders. Please check back later!</p>
        <Link to="/browse" className="px-8 py-3 bg-white/5 text-white font-black rounded-xl border border-white/10">
          Back to Browse
        </Link>
      </div>
    );
  }

  if (!user && !isSuccess) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <div className="w-20 h-20 bg-[#FFD700]/10 rounded-full flex items-center justify-center mb-6">
          <User className="w-10 h-10 text-[#FFD700]" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Login Required</h2>
        <p className="text-white/50 mb-8 max-w-xs">Please login with your Google account to proceed with your order.</p>
        <Link to="/login" className="px-8 py-3 bg-[#FFD700] text-[#1A1A1A] font-black rounded-xl flex items-center gap-2">
          Login to Paradise
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  if (items.length === 0 && !isSuccess) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-white/20" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Your cart is empty</h2>
        <p className="text-white/50 mb-8 max-w-xs">Add some delicious treats to your cart before checking out.</p>
        <Link to="/browse" className="px-8 py-3 bg-[#FFD700] text-[#1A1A1A] font-black rounded-xl">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center space-y-8 py-12"
          >
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-500/20">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white mb-4">Order Sent Successfully!</h1>
              <p className="text-white/50 leading-relaxed">
                Thank you for choosing Paradise Hot and Cold Point. 
                We've received your order and will start baking it soon!
              </p>
            </div>
            <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-left space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-white/30">Order ID</span>
                <span className="text-white font-bold">#PHC-{Math.floor(Math.random() * 9000) + 1000}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/30">Type</span>
                <span className="text-[#FFD700] font-bold uppercase">{orderType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/30">Delivery Date</span>
                <span className="text-white font-bold">{deliveryDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/30">Total Amount</span>
                <span className="text-[#FFD700] font-bold">{formatCurrency(total + 25 + (orderType === 'delivery' ? (settings?.flatDeliveryFee || 0) : 0))}</span>
              </div>
            </div>
            <p className="text-xs text-white/20 uppercase tracking-widest font-bold">Redirecting to your profile...</p>
          </motion.div>
        ) : (
          <div className="space-y-12">
            {/* Step Indicator */}
            <div className="max-w-3xl mx-auto flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -translate-y-1/2 z-0" />
              {[
                { id: 1, name: 'Details', icon: User },
                { id: 2, name: 'Schedule', icon: Calendar },
                { id: 3, name: 'Payment', icon: CreditCard },
              ].map((s) => (
                <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                    step >= s.id ? "bg-[#FFD700] border-[#FFD700] text-[#1A1A1A]" : "bg-[#1A1A1A] border-white/10 text-white/30"
                  )}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest transition-colors",
                    step >= s.id ? "text-[#FFD700]" : "text-white/20"
                  )}>{s.name}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Left Column: Form */}
              <div className="lg:col-span-2 space-y-8">
                <div className="flex items-center gap-4 mb-8">
                  <button 
                    onClick={() => step > 1 ? setStep(step - 1) : navigate('/browse')}
                    className="p-2 bg-white/5 text-white/50 hover:text-white rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h1 className="text-3xl font-black text-white">
                    {step === 1 && "Customer Details"}
                    {step === 2 && "Schedule"}
                    {step === 3 && "Payment"}
                  </h1>
                </div>

                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.section 
                      key="step1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-[#2A2A2A] border border-white/5 rounded-3xl p-8 space-y-8"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#FFD700] text-[#1A1A1A] rounded-lg flex items-center justify-center font-black">1</div>
                        <h2 className="text-xl font-bold text-white">How would you like your order?</h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                          disabled={settings?.isDeliveryAvailable === false}
                          onClick={() => setOrderType('delivery')}
                          className={cn(
                            "p-6 rounded-2xl border flex flex-col gap-4 transition-all text-left relative",
                            orderType === 'delivery' ? "bg-[#FFD700]/10 border-[#FFD700] text-[#FFD700]" : "bg-[#1A1A1A] border-white/5 text-white/50",
                            settings?.isDeliveryAvailable === false && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {settings?.isDeliveryAvailable === false && (
                            <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-500 text-white text-[8px] font-black rounded uppercase">
                              Unavailable
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <Truck className="w-8 h-8" />
                            {orderType === 'delivery' && <CheckCircle2 className="w-5 h-5" />}
                          </div>
                          <div>
                            <h3 className="font-bold">Home Delivery</h3>
                            <p className="text-[10px] uppercase tracking-widest font-black opacity-60">Delivered to your door</p>
                          </div>
                        </button>

                        <button 
                          onClick={() => setOrderType('pickup')}
                          className={cn(
                            "p-6 rounded-2xl border flex flex-col gap-4 transition-all text-left",
                            orderType === 'pickup' ? "bg-[#FFD700]/10 border-[#FFD700] text-[#FFD700]" : "bg-[#1A1A1A] border-white/5 text-white/50"
                          )}
                        >
                          <div className="flex justify-between items-center">
                            <Calendar className="w-8 h-8" />
                            {orderType === 'pickup' && <CheckCircle2 className="w-5 h-5" />}
                          </div>
                          <div>
                            <h3 className="font-bold">Cake Booking / Pickup</h3>
                            <p className="text-[10px] uppercase tracking-widest font-black opacity-60">Reserve your cake for pickup</p>
                          </div>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-white/30">Full Name</label>
                          <input 
                            type="text" 
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-white focus:outline-none focus:border-[#FFD700]/50"
                            placeholder="Your Name"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-white/30">Email Address</label>
                          <input 
                            type="email" 
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-white focus:outline-none focus:border-[#FFD700]/50"
                            placeholder="your@email.com"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-black uppercase tracking-widest text-white/30">Mobile Number</label>
                          <input 
                            type="tel" 
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-white focus:outline-none focus:border-[#FFD700]/50"
                            placeholder="Enter 10-digit mobile number"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (!customerName || !customerEmail || !customerPhone) {
                            toast.error('Please fill in all details');
                            return;
                          }
                          setStep(2);
                        }}
                        className="w-full py-4 bg-[#FFD700] text-[#1A1A1A] font-black rounded-xl flex items-center justify-center gap-2"
                      >
                        Next: Schedule
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </motion.section>
                  )}

                  {step === 2 && (
                    <motion.section 
                      key="step2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-[#2A2A2A] border border-white/5 rounded-3xl p-8 space-y-8"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#FFD700] text-[#1A1A1A] rounded-lg flex items-center justify-center font-black">2</div>
                        <h2 className="text-xl font-bold text-white">{orderType === 'delivery' ? 'Delivery Schedule' : 'Booking Schedule'}</h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> Select Date
                          </label>
                          <input 
                            type="date" 
                            value={deliveryDate}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-white focus:outline-none focus:border-[#FFD700]/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
                            <Clock className="w-3 h-3" /> Time Slot
                          </label>
                          <select 
                            value={timeSlot}
                            onChange={(e) => setTimeSlot(e.target.value)}
                            className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-white focus:outline-none focus:border-[#FFD700]/50"
                          >
                            {TIME_SLOTS.map(slot => (
                              <option key={slot} value={slot}>{slot}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
                          <MapPin className="w-3 h-3" /> {orderType === 'delivery' ? 'Delivery Address' : 'Pickup/Booking Details'}
                        </label>
                        {orderType === 'delivery' ? (
                          <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
                              <MapPin className="w-3 h-3" /> Delivery Address
                            </label>
                            <textarea 
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              placeholder="Enter your full delivery address..."
                              className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-white focus:outline-none focus:border-[#FFD700]/50 min-h-[100px]"
                            />
                            <div className="p-4 bg-purple-400/10 border border-purple-400/20 rounded-xl">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Delivery Fee</span>
                                <span className="text-white font-black">{formatCurrency(settings?.flatDeliveryFee || 0)}</span>
                              </div>
                              <p className="text-[8px] text-purple-400/60 font-bold uppercase tracking-widest">
                                * Flat delivery fee applied
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
                              <Sparkles className="w-3 h-3" /> Cake Customization / Message
                            </label>
                            <textarea 
                              value={cakeInstructions}
                              onChange={(e) => setCakeInstructions(e.target.value)}
                              placeholder="Tell us what you want to add to the cake (e.g., message on cake, colors, specific decorations)..."
                              className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-white focus:outline-none focus:border-[#FFD700]/50 min-h-[100px]"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={() => setStep(1)}
                          className="flex-1 py-4 bg-white/5 text-white font-black rounded-xl border border-white/10"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => {
                            if (!deliveryDate) {
                              toast.error('Please select a date');
                              return;
                            }
                            if (orderType === 'delivery' && !address) {
                              toast.error('Please enter delivery address');
                              return;
                            }
                            setStep(3);
                          }}
                          className="flex-[2] py-4 bg-[#FFD700] text-[#1A1A1A] font-black rounded-xl flex items-center justify-center gap-2"
                        >
                          Next: Payment
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.section>
                  )}

                  {step === 3 && (
                    <motion.section 
                      key="step3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-[#2A2A2A] border border-white/5 rounded-3xl p-8 space-y-8"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#FFD700] text-[#1A1A1A] rounded-lg flex items-center justify-center font-black">3</div>
                        <h2 className="text-xl font-bold text-white">Payment Method</h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                          onClick={() => setPaymentMethod('UPI')}
                          className={cn(
                            "p-6 rounded-2xl border flex flex-col gap-4 transition-all text-left",
                            paymentMethod === 'UPI' ? "bg-[#FFD700]/10 border-[#FFD700] text-[#FFD700]" : "bg-[#1A1A1A] border-white/5 text-white/50"
                          )}
                        >
                          <div className="flex justify-between items-center">
                            <QrCode className="w-8 h-8" />
                            {paymentMethod === 'UPI' && <CheckCircle2 className="w-5 h-5" />}
                          </div>
                          <div>
                            <h3 className="font-bold">UPI / QR Code</h3>
                            <p className="text-[10px] uppercase tracking-widest font-black opacity-60">Manual verification</p>
                          </div>
                        </button>

                        <button 
                          onClick={() => setPaymentMethod('COD')}
                          className={cn(
                            "p-6 rounded-2xl border flex flex-col gap-4 transition-all text-left",
                            paymentMethod === 'COD' ? "bg-[#FFD700]/10 border-[#FFD700] text-[#FFD700]" : "bg-[#1A1A1A] border-white/5 text-white/50"
                          )}
                        >
                          <div className="flex justify-between items-center">
                            <Banknote className="w-8 h-8" />
                            {paymentMethod === 'COD' && <CheckCircle2 className="w-5 h-5" />}
                          </div>
                          <div>
                            <h3 className="font-bold">Cash on Delivery</h3>
                            <p className="text-[10px] uppercase tracking-widest font-black opacity-60">Pay at your doorstep</p>
                          </div>
                        </button>
                      </div>

                      {paymentMethod === 'UPI' && (
                        <div className="space-y-6 pt-4">
                          <div className="flex flex-col md:flex-row gap-8 items-center bg-[#1A1A1A] p-8 rounded-2xl border border-white/5">
                            <div className="w-48 h-48 bg-white rounded-xl p-2 flex-shrink-0 shadow-2xl shadow-[#FFD700]/10">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=9634933663@ptsbi&pn=ParadiseBakery&am=${total + 25 + (orderType === 'delivery' ? (settings?.flatDeliveryFee || 0) : 0)}`} 
                                alt="UPI QR Code"
                                className="w-full h-full"
                              />
                            </div>
                            <div className="space-y-4 text-center md:text-left">
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFD700]/10 rounded-full border border-[#FFD700]/20">
                                <Sparkles className="w-3 h-3 text-[#FFD700]" />
                                <span className="text-[8px] font-black text-[#FFD700] uppercase tracking-widest">Owner's Official QR</span>
                              </div>
                              <h4 className="text-white font-bold text-xl">Scan to Pay</h4>
                              <p className="text-white/50 text-sm leading-relaxed">
                                Scan this QR code with any UPI app to make the payment of <span className="text-[#FFD700] font-bold">{formatCurrency(total + 25 + (orderType === 'delivery' ? (settings?.flatDeliveryFee || 0) : 0))}</span>.
                              </p>
                              <div className="flex items-center gap-2 p-3 bg-[#FFD700]/10 rounded-lg border border-[#FFD700]/20">
                                <AlertCircle className="w-4 h-4 text-[#FFD700]" />
                                <p className="text-[10px] text-[#FFD700] font-black uppercase tracking-widest">
                                  Take screenshot of payment. Admin will verify payment.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-widest text-white/30">Upload Payment Screenshot</label>
                            <div className="relative group">
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleScreenshotUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              />
                              <div className={cn(
                                "w-full py-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 transition-all",
                                screenshot ? "border-green-500/50 bg-green-500/5" : "border-white/10 bg-[#1A1A1A] group-hover:border-[#FFD700]/50 group-hover:bg-[#FFD700]/5"
                              )}>
                                {screenshot ? (
                                  <>
                                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-green-500/30">
                                      <img src={screenshot} alt="Screenshot" className="w-full h-full object-cover" />
                                    </div>
                                    <p className="text-green-400 text-sm font-bold">Screenshot Uploaded!</p>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                                      <Upload className="w-6 h-6 text-white/30" />
                                    </div>
                                    <div className="text-center">
                                      <p className="text-white font-bold">Click to upload screenshot</p>
                                      <p className="text-white/30 text-xs">PNG, JPG up to 5MB</p>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-4">
                        <button
                          onClick={() => setStep(2)}
                          className="flex-1 py-4 bg-white/5 text-white font-black rounded-xl border border-white/10"
                        >
                          Back
                        </button>
                        <button 
                          onClick={handlePlaceOrder}
                          disabled={isSubmitting || (paymentMethod === 'UPI' && !screenshot)}
                          className="flex-[2] py-4 bg-[#FFD700] text-[#1A1A1A] font-black rounded-xl flex items-center justify-center gap-2 hover:bg-[#FFD700]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Placing Order...
                            </>
                          ) : (
                            <>
                              Complete Order
                              <CheckCircle2 className="w-5 h-5" />
                            </>
                          )}
                        </button>
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>
              </div>

            {/* Right Column: Summary */}
            <div className="space-y-8">
              <section className="bg-[#2A2A2A] border border-white/5 rounded-3xl p-8 sticky top-24">
                <h2 className="text-xl font-bold text-white mb-8">Order Summary</h2>
                
                <div className="space-y-6 mb-8 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                  {items.map((item) => (
                    <div key={`${item.id}-${item.weight}`} className="flex gap-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white text-sm font-bold truncate">{item.name}</h4>
                        <p className="text-white/50 text-xs">{item.quantity} x {formatCurrency(item.price)}</p>
                      </div>
                      <span className="text-white font-bold text-sm">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-6 border-t border-white/5">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Subtotal</span>
                    <span className="text-white font-bold">{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Delivery Fee</span>
                    <span className={cn(
                      "font-bold uppercase tracking-widest text-[10px]",
                      orderType === 'delivery' ? "text-[#FFD700]" : "text-green-400"
                    )}>
                      {orderType === 'delivery' ? formatCurrency(settings?.flatDeliveryFee || 0) : 'Free'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Tax & Handling</span>
                    <span className="text-white font-bold">{formatCurrency(25)}</span>
                  </div>
                  <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-white font-black text-lg">Total Amount</span>
                    <span className="text-[#FFD700] font-black text-2xl">
                      {formatCurrency(total + 25 + (orderType === 'delivery' ? (settings?.flatDeliveryFee || 0) : 0))}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    if (step === 1) {
                      if (!customerName || !customerEmail || !customerPhone) {
                        toast.error('Please fill in all details');
                        return;
                      }
                      setStep(2);
                    } else if (step === 2) {
                      if (!deliveryDate) {
                        toast.error('Please select a date');
                        return;
                      }
                      if (orderType === 'delivery' && !address) {
                        toast.error('Please enter delivery address');
                        return;
                      }
                      setStep(3);
                    } else {
                      handlePlaceOrder();
                    }
                  }}
                  disabled={isSubmitting || (step === 3 && paymentMethod === 'UPI' && !screenshot)}
                  className="w-full mt-8 py-4 bg-[#FFD700] text-[#1A1A1A] font-black rounded-xl flex items-center justify-center gap-2 hover:bg-[#FFD700]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      {step === 1 && "Next: Schedule"}
                      {step === 2 && "Next: Payment"}
                      {step === 3 && "Complete Order"}
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <div className="mt-6 flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                  <Sparkles className="w-5 h-5 text-[#FFD700]" />
                  <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest leading-relaxed">
                    Orders are baked fresh. Please allow at least 4 hours for preparation.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
        )}
      </AnimatePresence>
    </div>
  );
}
