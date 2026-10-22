import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ShieldCheck, ArrowRight, Loader2, Sun, Moon } from 'lucide-react';

import FireEmbersBackground from '../components/FireEmbersBackground';
import { FunLogo } from '../components/FunLogo';
import { localStore } from '../lib/localStore';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('cp_admin_theme') !== 'dark';
  });

  const toggleTheme = () => {
    setIsLightMode(prev => {
      const next = !prev;
      localStorage.setItem('cp_admin_theme', next ? 'light' : 'dark');
      return next;
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Artificial delay for 'security scan' feel
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const storedPassword = localStore.getAuthPassword();

      // Accepts either custom configured password, or default 'admin' / 'admin123'
      if (password === storedPassword || password === 'admin' || password === 'admin123') {
        localStorage.setItem('isAdmin', 'true');
        navigate('/admin/dashboard');
      } else {
        setError('UNAUTHORIZED_ACCESS_DETECTED');
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(`ENCRYPTION_LAYER_FAILURE: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-6 transition-colors duration-300 relative overflow-hidden ${
      isLightMode ? 'light-mode bg-[#f3f4f6] text-slate-800' : 'bg-[#050404] text-white'
    }`}>
      <FireEmbersBackground isLightMode={isLightMode} />
      {isLightMode ? (
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-[-20%] left-[-20%] w-[1000px] h-[1000px] bg-[#7D52FF]/10 rounded-full blur-[180px]" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[1000px] h-[1000px] bg-[#FFB659]/10 rounded-full blur-[180px]" />
        </div>
      ) : (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-[#7D52FF]/5 blur-[120px] pointer-events-none" />
      )}

      {/* Theme Toggle Button */}
      <div className="absolute top-8 right-8 z-50">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className={`flex items-center gap-2 px-3 py-1.5 border transition-all duration-300 text-[10px] uppercase tracking-widest font-bold ${
            isLightMode 
              ? 'border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-black shadow-sm' 
              : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
          }`}
        >
          {isLightMode ? <Moon size={12} className="text-[#7D52FF]" /> : <Sun size={12} className="text-[#FFB659]" />}
          <span>{isLightMode ? 'DARK' : 'LIGHT'}</span>
        </motion.button>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className={`relative p-12 transition-colors duration-300 border ${
          isLightMode ? 'bg-white border-slate-200/80 shadow-xl text-slate-800' : 'bg-[#080808] border-white/5 shadow-2xl'
        }`}>
          <div className="flex flex-col items-center mb-12">
            <div className="mb-8 relative group flex flex-col items-center gap-4">
               <FunLogo size="md" />
               <h1 className={`text-2xl font-black tracking-widest uppercase relative z-10 ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                 CP <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7D52FF] via-[#D174FF] via-[#F23E70] to-[#FFB659]">TYPE!</span>
               </h1>
            </div>
            
            <div className="text-center space-y-1">
              <h2 className={`text-[9px] font-black uppercase tracking-[0.8em] ${isLightMode ? 'text-slate-400' : 'text-white/40'}`}>Root Access</h2>
              <p className={`text-[7px] uppercase tracking-[0.4em] ${isLightMode ? 'text-slate-300' : 'text-white/10'}`}>Administrative Terminal v4.0</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="text-[9px] font-black text-[#7D52FF] uppercase tracking-[0.3em]">Security Key</label>
                <div className="flex gap-1">
                   <div className="w-1 h-1 bg-[#7D52FF]/20 rounded-full" />
                   <div className="w-1 h-1 bg-[#D174FF]/40 rounded-full" />
                   <div className="w-1 h-1 bg-[#FFB659]/60 rounded-full" />
                </div>
              </div>
              
              <div className="relative group">
                <div className={`absolute inset-0 border transition-all ${
                  isLightMode 
                    ? 'bg-slate-50 border-slate-200 group-focus-within:border-[#7D52FF]/50' 
                    : 'bg-white/[0.02] border-white/5 group-focus-within:border-[#7D52FF]/50'
                }`} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full bg-transparent px-12 py-5 focus:outline-none text-sm tracking-[0.5em] relative z-10 ${
                    isLightMode 
                      ? 'text-slate-800 placeholder:text-slate-300' 
                      : 'text-white placeholder:text-white/5'
                  }`}
                  autoFocus
                />
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors z-20 ${
                  isLightMode ? 'text-slate-300 group-focus-within:text-[#7D52FF]' : 'text-white/10 group-focus-within:text-[#7D52FF]'
                }`} size={16} />
              </div>
              
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-[#7D52FF] text-[9px] font-bold uppercase tracking-wider px-1"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#7D52FF] animate-pulse shadow-[0_0_8px_#7D52FF]" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="relative w-full group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#7D52FF] via-[#D174FF] via-[#F23E70] to-[#FFB659] transition-transform group-hover:scale-105" />
              <div className="relative py-5 flex items-center justify-center gap-3 text-black text-[10px] font-black uppercase tracking-[0.4em] font-extrabold cursor-pointer">
                {isLoading ? (
                  <Loader2 className="animate-spin text-black" size={16} />
                ) : (
                  <>
                    Log In
                    <ArrowRight size={14} className="text-black group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-white/[0.03] flex justify-center">
            <button 
              onClick={() => navigate('/')}
              className={`text-[8px] uppercase tracking-[0.4em] transition-all font-bold ${
                isLightMode ? 'text-slate-400 hover:text-slate-800' : 'text-white/10 hover:text-white/40'
              }`}
            >
              Exit Terminal
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
