import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Mail, Lock, ArrowRight, Sparkles, Phone, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleGoogleLogin = async () => {
    try {
      await login();
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error('Authentication failed. Please try again.');
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FFD700]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FFD700]/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md bg-[#2A2A2A] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl"
      >
        <div className="text-center space-y-4 mb-12">
          <div className="w-16 h-16 bg-[#FFD700] rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-[#FFD700]/20">
            <ShoppingBag className="text-[#1A1A1A] w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">Welcome to Paradise</h1>
            <p className="text-white/50 text-sm font-medium">Login to your Paradise account</p>
          </div>
        </div>

        <div className="space-y-6">
          <button 
            onClick={handleGoogleLogin}
            className="w-full py-4 bg-white text-[#1A1A1A] font-black rounded-xl flex items-center justify-center gap-3 hover:bg-white/90 transition-all hover:gap-5 group shadow-xl"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Continue with Google
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="flex items-center gap-3 p-4 bg-[#FFD700]/5 rounded-2xl border border-[#FFD700]/10">
            <Sparkles className="w-5 h-5 text-[#FFD700]" />
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest leading-relaxed text-left">
              Join our loyalty program and get 10% off on your first order!
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
