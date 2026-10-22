import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Shield, Sparkles, Monitor, Keyboard, CheckCircle, ArrowRight, ArrowUp, ArrowLeft, ArrowDown } from 'lucide-react';

interface TutorialOverlayProps {
  isLightMode: boolean;
  onClose: () => void;
}

interface TutorialStep {
  title: string;
  description: string;
  suggestion?: string;
  suggestionType?: 'info' | 'warning';
  icon: React.ReactNode;
  targetId: string; // Dynamic DOM ID target for spotlight
  arrowType: 'none' | 'up' | 'left' | 'down';
  arrowColor: string;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ isLightMode, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  const steps: TutorialStep[] = [
    {
      title: "1. ADAPTABLE THEME SWITCH",
      description: "Alternate between volcanic dark mode and icy light mode seamlessly at any time during your assessment.",
      suggestion: "Tip: Select a theme that offers comfortable contrast for your screen brightness.",
      suggestionType: 'info',
      icon: <Sparkles className="text-[#FFB659] animate-spin-slow" size={24} />,
      targetId: "landing-theme-toggle",
      arrowType: 'up',
      arrowColor: '#FFB659'
    },
    {
      title: "2. SECURE ADMIN ACCESS",
      description: "Proctors and recruitment administrators can access the secure control center to manage prompts, thresholds, and live applicant metrics.",
      suggestion: "Recruiters and admins only. Candidates are strictly prohibited. Accessing this could result in a forfeit of your application.",
      suggestionType: 'warning',
      icon: <Shield className="text-[#F23E70] animate-pulse" size={24} />,
      targetId: "landing-admin-entry",
      arrowType: 'up',
      arrowColor: '#F23E70'
    },
    {
      title: "3. OPTIMUM LAYOUT ZOOM",
      description: "For the absolute best typing visual fidelity and detailed charts display, we highly recommend setting your browser zoom level to 90% or 80%.",
      suggestion: "Use Ctrl + Minus (Cmd + Minus) to quickly zoom out for a high-density, professional layout.",
      suggestionType: 'info',
      icon: <Monitor className="text-[#FFB659] animate-bounce" size={24} />,
      targetId: "landing-main-card",
      arrowType: 'up',
      arrowColor: '#F23E70'
    },
    {
      title: "4. IDENTITY PROTOCOL FIELDS",
      description: "Submit your official candidate details. Your first name, last name, and Talent Match email address initialize the assessment logs.",
      icon: <Keyboard className="text-[#D174FF] animate-pulse" size={24} />,
      targetId: "landing-identity-fields",
      arrowType: 'left',
      arrowColor: '#D174FF'
    }
  ];

  const stepData = steps[currentStep];

  useEffect(() => {
    const updateRect = () => {
      const el = document.getElementById(stepData.targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setSpotlightRect({
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
          });
          return;
        }
      }
      setSpotlightRect(null);
    };

    updateRect();
    const timer = setTimeout(updateRect, 100);

    window.addEventListener('scroll', updateRect);
    window.addEventListener('resize', updateRect);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', updateRect);
      window.removeEventListener('resize', updateRect);
    };
  }, [currentStep, stepData]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      localStorage.setItem('cp_tutorial_completed', 'true');
      onClose();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('cp_tutorial_completed', 'true');
    onClose();
  };

  // Centering & Adaptive Placement Styles
  const getCardStyles = (): React.CSSProperties => {
    const cardWidth = 380;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    if (!spotlightRect) {
      return {
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: `${cardWidth}px`,
      };
    }

    let left = spotlightRect.left + (spotlightRect.width / 2) - (cardWidth / 2);
    left = Math.max(16, Math.min(left, viewportWidth - cardWidth - 16));

    const isUpperHalf = (spotlightRect.top + spotlightRect.height / 2) < (viewportHeight / 2);
    let top = isUpperHalf 
      ? spotlightRect.top + spotlightRect.height + 24 
      : spotlightRect.top - 280;

    // Viewport boundaries safety bounds
    if (top < 16) top = 16;
    if (top > viewportHeight - 290) top = viewportHeight - 290;

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${cardWidth}px`,
    };
  };

  const isCardPlacedBelow = spotlightRect 
    ? (spotlightRect.top + spotlightRect.height / 2) < (window.innerHeight / 2)
    : true;

  const arrowColor = stepData.arrowColor;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center">
      {/* Self-contained bounce keyframe styles */}
      <style>{`
        @keyframes bounce-horizontal {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-8px); }
        }
        .animate-bounce-horizontal {
          animation: bounce-horizontal 1s infinite;
        }
      `}</style>

      {/* Dynamic dark tint backdrop (no blur to ensure highlighted content is 100% sharp and readable!) */}
      <div
        className="absolute inset-0 bg-black/45 transition-colors duration-500 pointer-events-auto"
        onClick={handleSkip}
      />

      {/* Centered Relative Positioning Grid */}
      <div className="w-full max-w-6xl mx-auto h-full relative pointer-events-none z-10">
        {/* Render Dynamic Spotlight Highlight */}
        {spotlightRect && (
          <motion.div
            key={`highlight-${currentStep}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            style={{
              position: 'fixed',
              top: `${spotlightRect.top - 8}px`,
              left: `${spotlightRect.left - 8}px`,
              width: `${spotlightRect.width + 16}px`,
              height: `${spotlightRect.height + 16}px`,
              borderColor: arrowColor,
              boxShadow: `0 0 18px ${arrowColor}44, inset 0 0 10px ${arrowColor}22`,
              borderWidth: '2px',
              borderStyle: 'solid',
              borderRadius: '0.25rem',
            }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            className="animate-pulse pointer-events-none z-50"
          />
        )}

        {/* Floating Tutorial Card */}
        <div 
          style={getCardStyles()}
          className="z-[10000] px-4 pointer-events-auto transition-all duration-300"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`border p-6 shadow-2xl relative transition-all duration-300 ${isLightMode
                ? 'bg-white border-slate-200 text-slate-800'
                : 'bg-[#0f0c0b] border-white/10 text-white'
              }`}
          >
            {/* Neon side borders */}
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-[#7D52FF] via-[#D174FF] via-[#F23E70] to-[#FFB659]" />

            {/* Glowing Pointer Arrows (Only rendered if spotlight is active!) */}
            {spotlightRect && stepData.arrowType === 'up' && isCardPlacedBelow && (
              <div
                className="absolute top-[-34px] left-1/2 -translate-x-1/2 animate-bounce z-[10001]"
                style={{ color: arrowColor, filter: `drop-shadow(0 0 8px ${arrowColor})` }}
              >
                <ArrowUp size={28} className="stroke-[3.5]" />
              </div>
            )}

            {spotlightRect && stepData.arrowType === 'up' && !isCardPlacedBelow && (
              <div
                className="absolute bottom-[-34px] left-1/2 -translate-x-1/2 animate-bounce z-[10001]"
                style={{ color: arrowColor, filter: `drop-shadow(0 0 8px ${arrowColor})` }}
              >
                <ArrowDown size={28} className="stroke-[3.5]" />
              </div>
            )}

            {spotlightRect && stepData.arrowType === 'left' && (
              <div
                className="absolute left-[-38px] top-[40px] animate-bounce-horizontal z-[10001]"
                style={{ color: arrowColor, filter: `drop-shadow(0 0 8px ${arrowColor})` }}
              >
                <ArrowLeft size={28} className="stroke-[3.5]" />
              </div>
            )}

            <div className="flex items-start gap-4 mb-4">
              <div className="p-2 bg-white/5 rounded-sm border border-white/5 shadow-sm animate-pulse">
                {stepData.icon}
              </div>
              <div>
                <h4 className="text-xs font-black tracking-widest text-[#7D52FF] uppercase mb-1">
                  SYSTEM INTERACTION
                </h4>
                <h3 className="text-md font-extrabold tracking-wider uppercase">
                  {stepData.title}
                </h3>
              </div>
            </div>

            <p className={`text-xs leading-relaxed mb-4 ${isLightMode ? 'text-slate-600' : 'text-white/70'}`}>
              {stepData.description}
            </p>

            {stepData.suggestion && (
              <div className={`p-3 border text-[10px] leading-relaxed mb-6 font-bold tracking-wide flex items-center gap-2 ${stepData.suggestionType === 'warning'
                  ? isLightMode
                    ? 'bg-rose-50 border-rose-100 text-rose-600'
                    : 'bg-rose-950/20 border-rose-900/30 text-[#F23E70]'
                  : isLightMode
                    ? 'bg-[#f8fafc] border-slate-100 text-[#7D52FF]'
                    : 'bg-white/[0.02] border-white/5 text-[#FFB659]'
                }`}>
                <span>{stepData.suggestionType === 'warning' ? '⚠️' : '💡'}</span>
                <span>{stepData.suggestion}</span>
              </div>
            )}

            {/* Action Row */}
            <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
              <button
                onClick={handleSkip}
                className={`text-[9px] uppercase tracking-widest font-black transition-colors ${isLightMode ? 'text-slate-400 hover:text-black' : 'text-white/30 hover:text-white'
                  }`}
              >
                SKIP TUTORIAL
              </button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                className="btn-primary px-4 py-2 text-[9px] uppercase tracking-widest font-black flex items-center gap-2 text-white bg-[#7D52FF] shadow-[0_4px_12px_rgba(125,82,255,0.3)] hover:shadow-[0_4px_20px_rgba(125,82,255,0.5)] transition-all duration-300 cursor-pointer"
              >
                <span>{currentStep === steps.length - 1 ? "FINISH" : "NEXT STEP"}</span>
                <ArrowRight size={12} />
              </motion.button>
            </div>

            {/* Step dots */}
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-1.5 transition-all duration-300 ${idx === currentStep
                      ? 'w-5 bg-[#7D52FF]'
                      : `w-1.5 ${isLightMode ? 'bg-slate-200 hover:bg-slate-300' : 'bg-white/10 hover:bg-white/20'}`
                    }`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
