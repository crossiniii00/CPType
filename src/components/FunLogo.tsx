import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Sparkles } from 'lucide-react';

interface FunLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showGlow?: boolean;
}

export const FunLogo: React.FC<FunLogoProps> = ({ 
  size = 'md', 
  className = '',
  showGlow = true
}) => {
  const sizeConfig = {
    sm: { box: 'w-9 h-9', icon: 16, spark: 10, radius: 'rounded-xl', text: 'text-xs' },
    md: { box: 'w-16 h-16', icon: 28, spark: 14, radius: 'rounded-2xl', text: 'text-sm' },
    lg: { box: 'w-20 h-20', icon: 36, spark: 18, radius: 'rounded-3xl', text: 'text-base' }
  }[size];

  return (
    <motion.div 
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      whileHover={{ scale: 1.08, rotate: [0, -3, 3, 0] }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {/* Background Animated Glow */}
      {showGlow && (
        <motion.div 
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.35, 0.65, 0.35],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute inset-0 bg-gradient-to-tr from-[#7D52FF] via-[#F23E70] to-[#FFB659] blur-xl rounded-full"
        />
      )}

      {/* Main Arcade Keyboard Keycap Badge */}
      <div className={`relative ${sizeConfig.box} ${sizeConfig.radius} p-[2px] bg-gradient-to-br from-[#FFB659] via-[#F23E70] to-[#7D52FF] shadow-2xl`}>
        <div className={`w-full h-full ${sizeConfig.radius} bg-[#0d0915] flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-md`}>
          
          {/* Subtle Cyber Grid / Radial shimmer */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-60" />
          
          {/* Dynamic Floating Flame / Lightning typing combo */}
          <motion.div
            animate={{ 
              y: [-1, 2, -1],
              scale: [1, 1.06, 1],
              filter: [
                'drop-shadow(0 0 4px #FFB659)',
                'drop-shadow(0 0 9px #F23E70)',
                'drop-shadow(0 0 4px #7D52FF)'
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="relative z-10 flex items-center justify-center"
          >
            <Flame 
              size={sizeConfig.icon} 
              className="text-[#FFB659] fill-[#FFB659]/80 stroke-[#FFD59E]"
            />
          </motion.div>

          {/* Micro Sparkle Accent */}
          <motion.div
            animate={{
              rotate: 360,
              scale: [0.8, 1.2, 0.8],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'linear'
            }}
            className="absolute top-1 right-1 z-10 text-[#D174FF]"
          >
            <Sparkles size={sizeConfig.spark} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
