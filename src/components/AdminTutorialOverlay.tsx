import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Sparkles, Layers, Plus, Users, Settings, ArrowRight, ArrowUp, ArrowDown, ArrowLeft } from 'lucide-react';

interface AdminTutorialOverlayProps {
  isLightMode: boolean;
  onClose: () => void;
  onTabChange: (tab: 'prompts' | 'results' | 'settings') => void;
}

interface TutorialStep {
  title: string;
  description: string;
  suggestion?: string;
  suggestionType?: 'info' | 'warning';
  icon: React.ReactNode;
  targetId?: string; // Single element target ID
  targetIds?: string[]; // Multiple element target IDs (to combine)
  fallbackPosition: string; // Placement of the tooltip card if target is not visible
}

export const AdminTutorialOverlay: React.FC<AdminTutorialOverlayProps> = ({ isLightMode, onClose, onTabChange }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  // Trigger tab change and smooth scrolling in the background to keep everything framed perfectly!
  useEffect(() => {
    if (currentStep === 2) {
      onTabChange('prompts');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 3) {
      onTabChange('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 4) {
      onTabChange('settings');
      window.scrollTo({ top: 60, behavior: 'smooth' });
    } else if (currentStep === 5) {
      onTabChange('settings');
      window.scrollTo({ top: 60, behavior: 'smooth' });
    } else if (currentStep === 6) {
      onTabChange('settings');
      window.scrollTo({ top: 220, behavior: 'smooth' });
    } else if (currentStep === 7) {
      onTabChange('settings');
      window.scrollTo({ top: 380, behavior: 'smooth' });
    } else if (currentStep === 8) {
      onTabChange('settings');
      window.scrollTo({ top: 540, behavior: 'smooth' });
    } else if (currentStep === 9) {
      onTabChange('settings');
      window.scrollTo({ top: 720, behavior: 'smooth' });
    }
  }, [currentStep, onTabChange]);

  const steps: TutorialStep[] = [
    {
      title: "1. THE SECURITY CONSOLE",
      description: "Welcome to the Admin Console. Use this terminal to manage typing test presets, candidate tracking, and threshold requirements.",
      suggestion: "Tip: The console supports custom persistent theme toggle modes at the top right header.",
      suggestionType: 'info',
      icon: <Sparkles className="text-[#7D52FF] animate-spin-slow" size={24} />,
      targetId: 'tutorial-admin-card',
      fallbackPosition: "top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2"
    },
    {
      title: "2. THREE STRATEGIC SECTIONS",
      description: "Switch seamlessly between control areas: Typing Prompts (edit test texts), Applicant Results (review scores & live telemetry), and Global Settings (adjust test parameters).",
      suggestion: "Select sections below the header to manage different proctor protocols.",
      suggestionType: 'info',
      icon: <Layers className="text-[#FFB659] animate-pulse" size={24} />,
      targetId: 'tutorial-tab-bar',
      fallbackPosition: "top-[235px] left-1/2 -translate-x-1/2"
    },
    {
      title: "3. MANAGE ASSESSMENT PROMPTS",
      description: "Inside the default 'Typing Prompts' section, proctors can build, edit, or remove prompts that candidates are randomized to type.",
      suggestion: "Click '+ ADD NEW PROMPT' to register new standard assessment text sets.",
      suggestionType: 'info',
      icon: <Plus className="text-[#D174FF] animate-pulse" size={24} />,
      targetId: 'tutorial-add-prompt',
      fallbackPosition: "top-[320px] right-[80px]"
    },
    {
      title: "4. TRACK CANDIDATE HISTORY",
      description: "Select 'Applicant Results' to oversee test entries, qualified indicators, errors breakdowns, and download dynamic Excel reports.",
      suggestion: "Under this tab, recruiters can safely purge faulty entries or merge multiple attempts into a consolidated protocol log.",
      suggestionType: 'info',
      icon: <Users className="text-[#F23E70] animate-pulse" size={24} />,
      targetId: 'tutorial-applicant-list',
      fallbackPosition: "top-[238px] left-[420px]"
    },
    {
      title: "5. SYSTEM CONFIGURATION Overview",
      description: "Inside 'Global Settings', proctors can configure individual testing rules, error parameters, speeds adjustments, and root access security keys.",
      suggestion: "Saving thresholds automatically updates candidate typing parameters in real time.",
      suggestionType: 'info',
      icon: <Settings className="text-[#7D52FF] animate-bounce" size={24} />,
      targetId: 'tutorial-settings-card',
      fallbackPosition: "top-[360px] left-1/2 -translate-x-1/2"
    },
    {
      title: "6. DEFAULT WPM & ACCURACY GOALS",
      description: "Define the exact metrics required to pass the test. 'Default WPM Goal' sets the speed target, while 'Precision Threshold' enforces accuracy.",
      suggestion: "Applicants meeting both goals will be automatically marked as 'Qualified' in results.",
      suggestionType: 'info',
      icon: <Settings className="text-[#FFB659] animate-pulse" size={24} />,
      targetIds: ['tutorial-settings-wpm-col', 'tutorial-settings-accuracy-col'],
      fallbackPosition: "top-[430px] left-1/2 -translate-x-1/2"
    },
    {
      title: "7. ATTEMPT LIMITS & TIMER DURATION",
      description: "'Attempt Limit' caps the maximum retries allowed per Talent Match candidate email. 'Timer Duration' defines the countdown duration of active tests.",
      suggestion: "Standard durations range from 60 seconds up to 180 seconds based on prompt size.",
      suggestionType: 'info',
      icon: <Settings className="text-[#D174FF] animate-pulse" size={24} />,
      targetIds: ['tutorial-settings-attempts-col', 'tutorial-settings-timer-col'],
      fallbackPosition: "top-[590px] left-1/2 -translate-x-1/2"
    },
    {
      title: "8. PERCENTAGE SCALER & TEST PRESETS",
      description: "'Percentage Scaler' multiplies WPM scores by a coefficient. 'Typing Test Preset' changes speed calculations between Typeracer, Monkeytype, or Harsh penalties.",
      suggestion: "Choose Monkeytype (Strict) or Typeracer (Net WPM) for industry standard benchmarks.",
      suggestionType: 'info',
      icon: <Settings className="text-[#F23E70] animate-pulse" size={24} />,
      targetIds: ['tutorial-settings-scaler-col', 'tutorial-settings-preset-col'],
      fallbackPosition: "top-[750px] left-1/2 -translate-x-1/2"
    },
    {
      title: "9. CASE SENSITIVITY & SPACE PRECISION",
      description: "Turn on 'Case Sensitivity' to enforce strict capital letter matching. Enable 'Space Precision' to register extra spaces or tab gaps as error keys.",
      suggestion: "Keep these enabled for strict professional legal or billing text entries.",
      suggestionType: 'info',
      icon: <Settings className="text-[#7D52FF] animate-pulse" size={24} />,
      targetId: 'tutorial-settings-toggles',
      fallbackPosition: "top-[905px] left-1/2 -translate-x-1/2"
    },
    {
      title: "10. SECURITY INFRASTRUCTURE KEY",
      description: "Update the root Master Admin Password used by proctors and recruiters to authenticate themselves on the console portal login.",
      suggestion: "Be sure to note this key secure. Changing this updates your login password instantly.",
      suggestionType: 'info',
      icon: <Settings className="text-[#FFB659] animate-bounce" size={24} />,
      targetId: 'tutorial-settings-security',
      fallbackPosition: "top-[1090px] left-1/2 -translate-x-1/2"
    }
  ];

  const stepData = steps[currentStep];

  // Dynamic colors for neon arrow and spotlight borders
  const getStepColor = () => {
    if (currentStep === 0 || currentStep === 4 || currentStep === 8) return '#7D52FF';
    if (currentStep === 1 || currentStep === 5 || currentStep === 9) return '#FFB659';
    if (currentStep === 2 || currentStep === 6) return '#D174FF';
    return '#F23E70';
  };

  const arrowColor = getStepColor();

  // Monitor client rect in real-time
  useEffect(() => {
    const updateRect = () => {
      if (stepData.targetIds) {
        const el1 = document.getElementById(stepData.targetIds[0]);
        const el2 = document.getElementById(stepData.targetIds[1]);
        if (el1 && el2) {
          const r1 = el1.getBoundingClientRect();
          const r2 = el2.getBoundingClientRect();
          setSpotlightRect({
            top: Math.min(r1.top, r2.top),
            left: Math.min(r1.left, r2.left),
            width: Math.max(r1.right, r2.right) - Math.min(r1.left, r2.left),
            height: Math.max(r1.bottom, r2.bottom) - Math.min(r1.top, r2.top)
          });
          return;
        }
      }

      if (stepData.targetId) {
        const el = document.getElementById(stepData.targetId);
        if (el) {
          const rect = el.getBoundingClientRect();
          setSpotlightRect({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          });
          return;
        }
      }

      setSpotlightRect(null);
    };

    updateRect();
    // Re-check after small delay for Tab transitions
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
      localStorage.setItem('cp_admin_tutorial_completed', 'true');
      onClose();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('cp_admin_tutorial_completed', 'true');
    onClose();
  };

  // Determine card placement dynamically relative to the highlighted element!
  const getCardStyles = (): React.CSSProperties => {
    const cardWidth = 384;
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

    // Center horizontally relative to spotlight
    let left = spotlightRect.left + (spotlightRect.width / 2) - (cardWidth / 2);
    // Keep inside viewport safety boundaries
    left = Math.max(16, Math.min(left, viewportWidth - cardWidth - 16));

    // Place below if spotlight is in upper half of viewport, otherwise place above
    const isUpperHalf = (spotlightRect.top + spotlightRect.height / 2) < (viewportHeight / 2);
    let top = isUpperHalf 
      ? spotlightRect.top + spotlightRect.height + 28 
      : spotlightRect.top - 280; // Card height is around 260px

    // Safety fallback bounds (never let the card go below viewportHeight - 290)
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
        @keyframes bounce-diagonal-up {
          0%, 100% { transform: translate(0, 0) rotate(45deg); }
          50% { transform: translate(5px, -5px) rotate(45deg); }
        }
        .animate-bounce-diagonal-up {
          animation: bounce-diagonal-up 1s infinite;
        }
      `}</style>

      {/* Dynamic dark tint backdrop (no blur to ensure highlighted content is 100% sharp and readable!) */}
      <div 
        className="absolute inset-0 bg-black/45 transition-colors duration-500 pointer-events-auto"
        onClick={handleSkip}
      />

      {/* Centered Relative Positioning Grid */}
      <div className="w-full max-w-5xl mx-auto h-full relative pointer-events-none z-10">
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
            className={`border p-6 shadow-2xl relative transition-all duration-300 ${
              isLightMode 
                ? 'bg-white border-slate-200 text-slate-800' 
                : 'bg-[#0f0c0b] border-white/10 text-white'
            }`}
          >
            {/* Neon side borders */}
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-[#7D52FF] via-[#D174FF] via-[#F23E70] to-[#FFB659]" />

            {/* Glowing Dynamic Pointer Arrows */}
            {spotlightRect && (
              isCardPlacedBelow ? (
                <div 
                  className="absolute top-[-34px] left-1/2 -translate-x-1/2 animate-bounce z-[10001]"
                  style={{ color: arrowColor, filter: `drop-shadow(0 0 8px ${arrowColor})` }}
                >
                  <ArrowUp size={28} className="stroke-[3.5]" />
                </div>
              ) : (
                <div 
                  className="absolute bottom-[-34px] left-1/2 -translate-x-1/2 animate-bounce z-[10001]"
                  style={{ color: arrowColor, filter: `drop-shadow(0 0 8px ${arrowColor})` }}
                >
                  <ArrowDown size={28} className="stroke-[3.5]" />
                </div>
              )
            )}

            <div className="flex items-start gap-4 mb-4">
              <div className="p-2 bg-white/5 rounded-sm border border-white/5 shadow-sm">
                {stepData.icon}
              </div>
              <div>
                <h4 className="text-xs font-black tracking-widest text-[#7D52FF] uppercase mb-1">
                  PROCTOR PROTOCOL
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
              <div className={`p-3 border text-[10px] leading-relaxed mb-6 font-bold tracking-wide flex items-center gap-2 ${
                stepData.suggestionType === 'warning'
                  ? isLightMode
                    ? 'bg-rose-50 border-rose-100 text-rose-600'
                    : 'bg-rose-950/20 border-rose-900/30 text-[#F23E70]'
                  : isLightMode 
                    ? 'bg-[#f8fafc] border-slate-100 text-[#7D52FF]' 
                    : 'bg-white/[0.02] border-white/5 text-[#FFB659]'
              }`}>
                <span>💡</span>
                <span>{stepData.suggestion}</span>
              </div>
            )}

            {/* Action Row */}
            <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
              <button 
                onClick={handleSkip}
                className={`text-[9px] uppercase tracking-widest font-black transition-colors ${
                  isLightMode ? 'text-slate-400 hover:text-black' : 'text-white/30 hover:text-white'
                }`}
              >
                SKIP GUIDE
              </button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                className="btn-primary px-4 py-2 text-[9px] uppercase tracking-widest font-black flex items-center gap-2 text-white bg-[#7D52FF] shadow-[0_4px_12px_rgba(125,82,255,0.3)] hover:shadow-[0_4px_20px_rgba(125,82,255,0.5)] transition-all duration-300"
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
                  className={`h-1.5 transition-all duration-300 ${
                    idx === currentStep 
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
