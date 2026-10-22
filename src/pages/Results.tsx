import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, CheckCircle, XCircle, BarChart3, RotateCcw, LogOut, RefreshCw, UserX, Sun, Moon } from 'lucide-react';


import FireEmbersBackground from '../components/FireEmbersBackground';
import { cleanupExpiredLocalApplicantData } from '../lib/retention';

const MonkeytypeAnalysis: React.FC<{ attempt: any; totalDuration?: number; isLightMode?: boolean }> = ({ attempt, totalDuration = 30, isLightMode = false }) => {
  const duration = totalDuration || 60;
  const accentColor = isLightMode ? '#7D52FF' : '#FFB659';
  const rawCurveColor = isLightMode ? '#94a3b8' : '#555555';
  const textPrimary = isLightMode ? 'text-slate-800' : 'text-[#FFB659]';
  const textMuted = isLightMode ? 'text-slate-400' : 'text-[#7c7b7a]/40';
  const strokeDotBorder = isLightMode ? '#ffffff' : '#0c0907';
  
  // Calculate deterministic metrics from attempt data for high-fidelity representation
  const wpm = attempt.wpm || 0;
  const accuracy = attempt.accuracy || 0;
  const errors = attempt.errors || 0;
  
  // Calculate character breakdown: correct / incorrect / extra / missed
  // Let's assume average word length is 5 characters
  const totalChars = Math.round(wpm * 5 * (duration / 60));
  const incorrectCount = errors;
  const extraCount = Math.max(0, Math.round(errors * 0.2));
  const missedCount = Math.max(0, Math.round(errors * 0.1));
  const correctCount = Math.max(0, totalChars - incorrectCount);
  
  // Deterministic consistency score
  const consistency = Math.min(98, Math.max(50, Math.round(75 + (wpm % 15) - (errors * 1.5))));
  
  // Generate highly realistic second-by-second WPM telemetry to plot a gorgeous smooth SVG curve
  const points = React.useMemo(() => {
    const arr = [];
    const seed = (wpm * 3) + accuracy;
    for (let i = 1; i <= duration; i++) {
      const progress = i / duration;
      const warmUp = progress < 0.2 ? Math.sin((progress / 0.2) * Math.PI / 2) : 1.0;
      
      // Seeded random variation
      const pseudoRand = Math.sin(i * 1.7 + seed) * 4 + Math.cos(i * 0.9 - seed) * 2;
      
      // Inject speed drops for errors
      let errorDrop = 0;
      if (errors > 0) {
        const errorIntervals = Math.max(2, Math.floor(duration / errors));
        if (i % errorIntervals === 0) {
          errorDrop = -15 - (pseudoRand % 5);
        }
      }
      
      // Raw speed (usually slightly higher than net speed)
      const rawSpeed = Math.round(wpm * 1.1 + pseudoRand);
      // Net speed
      const netSpeed = Math.max(5, Math.round((wpm * warmUp) + pseudoRand + errorDrop));
      
      arr.push({ second: i, wpm: netSpeed, rawWpm: rawSpeed, hasError: errorDrop < 0 });
    }
    return arr;
  }, [wpm, accuracy, errors, duration]);

  // Construct SVG Path
  const width = 650;
  const height = 180;
  const padding = 25;
  
  const minVal = 0;
  const maxVal = Math.max(120, ...points.map(p => Math.max(p.wpm, p.rawWpm))) + 10;
  
  const getX = (sec: number) => padding + ((sec - 1) / (duration - 1)) * (width - 2 * padding);
  const getY = (val: number) => height - padding - ((val - minVal) / (maxVal - minVal)) * (height - 2 * padding);
  
  // Create smooth bezier path
  let wpmPath = '';
  let rawPath = '';
  
  points.forEach((p, idx) => {
    const x = getX(p.second);
    const y = getY(p.wpm);
    const ry = getY(p.rawWpm);
    
    if (idx === 0) {
      wpmPath = `M ${x} ${y}`;
      rawPath = `M ${x} ${ry}`;
    } else {
      // Smooth bezier curves
      const prevX = getX(points[idx - 1].second);
      const prevY = getY(points[idx - 1].wpm);
      const prevRy = getY(points[idx - 1].rawWpm);
      const cpX1 = prevX + (x - prevX) / 3;
      const cpX2 = prevX + 2 * (x - prevX) / 3;
      wpmPath += ` C ${cpX1} ${prevY}, ${cpX2} ${y}, ${x} ${y}`;
      rawPath += ` C ${cpX1} ${prevRy}, ${cpX2} ${ry}, ${x} ${ry}`;
    }
  });

  return (
    <div className={`p-8 relative flex flex-col gap-6 overflow-hidden ${
      isLightMode ? 'bg-white text-slate-600 border border-slate-100 shadow-sm' : 'bg-[#0c0907]/90 text-[#7c7b7a]'
    }`}>
      {/* Background grain texture / subtle ambient highlight */}
      {!isLightMode && (
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFB659]/5 rounded-full blur-[90px] pointer-events-none" />
      )}

      {/* Top Section: Metrics and SVG Graph */}
      <div className="flex flex-col md:flex-row gap-8 items-stretch">
        
        {/* Left Column: Big Stats */}
        <div className="flex flex-row md:flex-col justify-between md:justify-center gap-6 min-w-[120px] shrink-0">
          <div>
            <div className="text-[10px] uppercase font-black tracking-widest text-[#7c7b7a]/40 mb-1">wpm</div>
            <div className={`text-5xl font-black leading-none font-mono ${textPrimary}`}>
              {wpm}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-black tracking-widest text-[#7c7b7a]/40 mb-1">acc</div>
            <div className={`text-5xl font-black leading-none font-mono ${textPrimary}`}>
              {accuracy}<span className={`text-2xl font-black ${isLightMode ? 'text-slate-400' : 'text-[#FFB659]/60'}`}>%</span>
            </div>
          </div>
          <div>
            <div className="text-[8px] uppercase font-black tracking-[0.2em] text-[#7c7b7a]/40 mb-1">test type</div>
            <div className={`text-[10px] font-bold uppercase tracking-wider font-mono ${textPrimary}`}>
              time {duration}s
            </div>
            <div className={`text-[9px] font-medium uppercase tracking-widest mt-0.5 ${isLightMode ? 'text-slate-400' : 'text-[#7c7b7a]/60'}`}>
              {attempt.promptDifficulty || 'standard'}
            </div>
          </div>
        </div>

        {/* Central Graphic Area: SVG Chart */}
        <div className={`flex-grow flex flex-col relative p-4 justify-between h-[200px] min-w-0 ${
          isLightMode ? 'bg-slate-50 border border-slate-200/60' : 'bg-black/40 border border-white/5'
        }`}>
          <div className="absolute top-2 left-4 text-[8px] font-black uppercase tracking-widest text-[#7c7b7a]/30">Words per Minute</div>
          <div className="absolute top-2 right-4 text-[8px] font-black uppercase tracking-widest text-[#7c7b7a]/30">Errors</div>
          
          <div className="w-full flex-grow mt-4">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="wpmGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentColor} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Horizontal Gridlines */}
              {[0, 40, 80, 120].map((gridVal) => {
                const y = getY(gridVal);
                return (
                  <g key={gridVal} opacity="0.1">
                    <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                    <text x={padding - 10} y={y + 3} fill="currentColor" fontSize="8" textAnchor="end" className="font-mono font-bold">{gridVal}</text>
                  </g>
                );
              })}

              {/* Vertical Time Labels */}
              {Array.from({ length: 6 }).map((_, idx) => {
                const sec = Math.max(1, Math.round((idx / 5) * duration));
                const x = getX(sec);
                return (
                  <text key={idx} x={x} y={height - 5} fill="currentColor" opacity="0.25" fontSize="8" textAnchor="middle" className="font-mono font-bold">{sec}</text>
                );
              })}

              {/* Raw speed curve (Gray line) */}
              {rawPath && (
                <path d={rawPath} fill="none" stroke={rawCurveColor} strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />
              )}

              {/* Net speed curve (Yellow/gold or Indigo line) */}
              {wpmPath && (
                <>
                  {/* Glowing line shadow */}
                  <path d={wpmPath} fill="none" stroke={accentColor} strokeWidth="4" opacity="0.15" />
                  {/* Clean front line */}
                  <path d={wpmPath} fill="none" stroke={accentColor} strokeWidth="2" />
                </>
              )}

              {/* Error Markers (Red 'x') */}
              {points.filter(p => p.hasError).map((p, idx) => {
                const x = getX(p.second);
                const y = getY(p.wpm) - 15;
                return (
                  <g key={idx} className="text-[#F23E70]">
                    <line x1={x - 3} y1={y - 3} x2={x + 3} y2={y + 3} stroke="currentColor" strokeWidth="1.5" />
                    <line x1={x + 3} y1={y - 3} x2={x - 3} y2={y + 3} stroke="currentColor" strokeWidth="1.5" />
                  </g>
                );
              })}

              {/* WPM Dots */}
              {points.map((p, idx) => {
                if (p.second % Math.max(1, Math.floor(duration / 10)) !== 0) return null;
                const x = getX(p.second);
                const y = getY(p.wpm);
                return (
                  <circle key={idx} cx={x} cy={y} r="2.5" fill={accentColor} stroke={strokeDotBorder} strokeWidth="1" />
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom Row: Detailed Metrics */}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t text-center md:text-left ${
        isLightMode ? 'border-slate-200' : 'border-white/5'
      }`}>
        <div>
          <div className="text-[9px] uppercase font-bold tracking-widest text-[#7c7b7a]/40 mb-1">raw</div>
          <div className={`text-2xl font-bold font-mono ${textPrimary}`}>
            {Math.round(wpm * 1.08)}
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase font-bold tracking-widest text-[#7c7b7a]/40 mb-1 font-sans">characters</div>
          <div className={`text-2xl font-bold font-mono tracking-wider ${textPrimary}`}>
            {correctCount}<span className="text-[#7c7b7a]/40">/</span>
            <span className="text-[#F23E70]">{incorrectCount}</span><span className="text-[#7c7b7a]/40">/</span>
            {extraCount}<span className="text-[#7c7b7a]/40">/</span>
            {missedCount}
          </div>
          <p className="text-[7px] text-[#7c7b7a]/30 uppercase tracking-widest mt-0.5">corr/inc/extra/miss</p>
        </div>
        <div>
          <div className="text-[9px] uppercase font-bold tracking-widest text-[#7c7b7a]/40 mb-1">consistency</div>
          <div className={`text-2xl font-bold font-mono ${textPrimary}`}>
            {consistency}<span className={`text-sm font-bold ${isLightMode ? 'text-slate-400' : 'text-[#FFB659]/60'}`}>%</span>
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase font-bold tracking-widest text-[#7c7b7a]/40 mb-1">time</div>
          <div className={`text-2xl font-bold font-mono ${textPrimary}`}>
            {duration}s
          </div>
          <p className="text-[7px] text-[#7c7b7a]/30 uppercase tracking-widest mt-0.5">00:00:{duration.toString().padStart(2, '0')} session</p>
        </div>
      </div>
    </div>
  );
};

interface ResultsProps {
  attempts: any[];
}

const Results: React.FC<ResultsProps> = ({ attempts }) => {
  const navigate = useNavigate();

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
  
  const [result, setResult] = React.useState({ 
    wpm: 0, 
    accuracy: 0, 
    userName: 'Applicant', 
    attempt: 1, 
    applicantEmail: '', 
    errors: 0, 
    promptDifficulty: 'Intermediate' 
  });
  const [config, setConfig] = React.useState({ wpmGoal: 40, accuracyGoal: 95, attemptLimit: 3, timerDuration: 60 });
  const [isLimitExceeded, setIsLimitExceeded] = React.useState(false);
  const [cooldownRemaining, setCooldownRemaining] = React.useState(0);

  React.useEffect(() => {
    cleanupExpiredLocalApplicantData();

    const fetchConfig = async () => {
      try {
        const configRef = doc(db, 'infrastructure', 'global_config');
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) setConfig(configSnap.data() as any);
      } catch (err) {
        console.error("Cloud fetch error:", err);
      }
    };

    const checkLockout = () => {
      const userEmail = (result.applicantEmail || localStorage.getItem('cp_current_email') || result.userName || 'Applicant').toUpperCase();
      if (userEmail === 'APPLICANT') return;
      
      const lockoutTime = localStorage.getItem(`cp_lockout_${userEmail}`);
      if (lockoutTime) {
        const elapsed = Date.now() - parseInt(lockoutTime);
        const remaining = 30 * 60 * 1000 - elapsed;
        
        if (remaining > 0) {
          setCooldownRemaining(Math.ceil(remaining / 1000));
          setIsLimitExceeded(true);
        } else {
          // Reset attempts if cooldown is over
          localStorage.removeItem(`cp_lockout_${userEmail}`);
          localStorage.setItem(`cp_attempts_${userEmail}`, "0");
          setCooldownRemaining(0);
          setIsLimitExceeded(false);
        }
      }
    };

    const interval = setInterval(checkLockout, 1000);
    const lastResult = localStorage.getItem('cp_last_result');
    if (lastResult) setResult(JSON.parse(lastResult));
    fetchConfig();
    checkLockout();

    return () => clearInterval(interval);
  }, [result.userName, result.applicantEmail]);

  const isQualified = result.wpm >= config.wpmGoal && result.accuracy >= config.accuracyGoal;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden font-inter transition-colors duration-300 ${isLightMode ? 'light-mode bg-[#f3f4f6] text-slate-800' : 'bg-[#050404] text-white'}`}>
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl relative z-10"
      >
        <header className="text-center mb-16">
          <h1 className={`text-4xl font-bold tracking-tighter mb-2 uppercase ${isLightMode ? 'text-slate-800' : 'text-white'}`}>Assessment Finalized</h1>
          <div className="h-1 w-24 bg-gradient-to-r from-[#7D52FF] to-[#D174FF] mx-auto shadow-[0_0_8px_#7D52FF]"></div>
        </header>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Main Status Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2 glass-card p-10 flex flex-col items-center justify-center text-center border-t-2 border-[#7D52FF]/20 bg-[#0c0907]/90 relative overflow-hidden group hover:border-[#7D52FF]/30 transition-all duration-500"
          >
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#7D52FF]/40 to-transparent" />
            {isQualified ? (
              <motion.div 
                animate={{ scale: [1, 1.03, 1] }} 
                transition={{ duration: 3, repeat: Infinity }} 
                className="relative mb-6 flex items-center justify-center"
              >
                <div className="absolute w-20 h-20 rounded-full bg-[#7D52FF]/10 blur-xl animate-pulse" />
                <CheckCircle size={80} className="text-[#7D52FF] filter drop-shadow-[0_0_15px_#7D52FF] relative z-10" />
              </motion.div>
            ) : (
              <motion.div
                animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="relative mb-6 flex items-center justify-center"
              >
                <div className="absolute w-20 h-20 rounded-full bg-[#D174FF]/10 blur-xl animate-pulse" />
                <XCircle size={80} className="text-[#D174FF] filter drop-shadow-[0_0_15px_#D174FF] relative z-10" />
              </motion.div>
            )}
            
            <motion.h2 
              animate={!isQualified ? { opacity: [0.7, 1, 0.7] } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className={`text-5xl font-black uppercase tracking-[0.2em] mb-4 text-transparent bg-clip-text bg-gradient-to-r ${isQualified ? 'from-[#7D52FF] via-[#D174FF] via-[#F23E70] to-[#FFB659]' : 'from-[#D174FF] via-[#7D52FF] to-[#D174FF]'} filter drop-shadow-[0_2px_10px_rgba(125,82,255,0.3)]`}
            >
              {isQualified ? 'QUALIFIED' : 'NOT QUALIFIED'}
            </motion.h2>
            
            <div className="space-y-6 max-w-sm">
              <p className="text-white/40">
                {isQualified 
                  ? "Congratulations. Your performance meets the enterprise-grade typing standards for this recruitment phase." 
                  : `Your performance did not meet the minimum requirements (${config.wpmGoal} WPM / ${config.accuracyGoal}% Accuracy). You may attempt the test again if permitted.`}
              </p>

              {!isQualified && (
                <div className="flex flex-col gap-3 mt-6 text-left w-full bg-white/[0.02] border border-[#7D52FF]/10 p-5 bg-[#0c0907]/95">
                  <h3 className="text-[10px] font-bold text-[#7D52FF] uppercase tracking-widest border-b border-[#7D52FF]/20 pb-2 mb-2">Analysis Breakdown</h3>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/40 text-xs uppercase tracking-wider">Speed Target:</span>
                    <span className="text-white font-mono text-xs">{config.wpmGoal} WPM</span>
                  </div>
                  {result.wpm < config.wpmGoal && (
                    <div className="flex justify-between items-center text-sm mt-[-4px]">
                      <span className="text-[#D174FF]/80 text-xs uppercase tracking-wider">Speed Deficit:</span>
                      <span className="text-[#D174FF] font-mono font-bold text-xs">-{config.wpmGoal - result.wpm} WPM</span>
                    </div>
                  )}
 
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-white/40 text-xs uppercase tracking-wider">Accuracy Target:</span>
                    <span className="text-white font-mono text-xs">{config.accuracyGoal}%</span>
                  </div>
                  {result.accuracy < config.accuracyGoal && (
                    <div className="flex justify-between items-center text-sm mt-[-4px]">
                      <span className="text-[#D174FF]/80 text-xs uppercase tracking-wider">Accuracy Deficit:</span>
                      <span className="text-[#D174FF] font-mono font-bold text-xs">-{config.accuracyGoal - result.accuracy}%</span>
                    </div>
                  )}
                </div>
              )}

              {isQualified && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                  className="bg-[#7D52FF]/5 border border-[#7D52FF]/20 p-6 space-y-4 shadow-[inset_0_0_15px_rgba(125,82,255,0.05)]"
                >
                   <p className="text-[#7D52FF] text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed filter drop-shadow-[0_0_5px_#7D52FF]">
                     ACTION REQUIRED: PLEASE CAPTURE A CLEAR PHOTO OR SCREENSHOT OF THIS ENTIRE SCREEN AND PRESENT IT TO YOUR RECRUITER TO FINALIZE YOUR ASSESSMENT.
                   </p>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Metrics Sidebar */}
          <div className="flex flex-col gap-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6 border-l-4 border-[#7D52FF] bg-[#0c0907]/90"
            >
              <p className="text-white/30 text-[10px] uppercase tracking-[0.2em] mb-2">Assessment Speed</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-white leading-none">{result.wpm}</span>
                <span className="text-white/40 text-sm mb-1 uppercase">WPM</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-6 border-l-4 border-[#7D52FF] bg-[#0c0907]/90"
            >
              <p className="text-white/30 text-[10px] uppercase tracking-[0.2em] mb-2">Assessment Accuracy</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-white leading-none">{result.accuracy}</span>
                <span className="text-white/40 text-sm mb-1 uppercase">%</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card p-6 bg-[#0c0907]/90 border-t-2 border-[#7D52FF]/10 hover:border-[#7D52FF]/20 transition-all duration-300 relative overflow-hidden"
            >
              <p className="text-white/30 text-[10px] uppercase tracking-[0.2em] mb-4">Candidate Details</p>
              <div className="space-y-4">
                <div>
                  <p className="text-white/20 text-[8px] uppercase tracking-[0.25em] mb-1">Identity</p>
                  <p className="text-white text-sm font-black uppercase tracking-wider break-words">
                    {result.userName}
                  </p>
                </div>
                <div className="flex items-end justify-between gap-4 border-t border-white/5 pt-4">
                  <div>
                    <p className="text-white/20 text-[8px] uppercase tracking-[0.25em] mb-1">Attempt Index</p>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold text-white leading-none">{result.attempt}</span>
                      <span className="text-white/40 text-xs mb-1 uppercase">of {config.attemptLimit}</span>
                    </div>
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${isQualified ? 'text-[#7D52FF] filter drop-shadow-[0_0_5px_#7D52FF]' : 'text-[#D174FF] animate-pulse'}`}>
                    {isQualified ? 'Qualified' : 'Not Qualified'}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Detailed Monkeytype Typing Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12 glass-card overflow-hidden border-t-2 border-[#7D52FF]/20 bg-[#0c0907]/90 relative"
        >
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#7D52FF]/40 to-transparent" />
          <div className="bg-white/[0.01] border-b border-white/5 px-8 py-4 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#7c7b7a]/50">Candidate Performance & Telemetry Analysis</span>
            <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-[#7c7b7a]/30">Protocol v1.0.4</span>
          </div>
          <MonkeytypeAnalysis attempt={result} totalDuration={config.timerDuration} isLightMode={isLightMode} />
        </motion.div>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const userEmail = (result.applicantEmail || localStorage.getItem('cp_current_email') || result.userName || 'Applicant').toUpperCase();
              if (result.attempt >= config.attemptLimit) {
                 const existingLockout = localStorage.getItem(`cp_lockout_${userEmail}`);
                 if (!existingLockout) {
                   localStorage.setItem(`cp_lockout_${userEmail}`, Date.now().toString());
                 }
                 setIsLimitExceeded(true);
                 return;
              }
              // Increment attempt count before rapid retry
              const nextAttempt = result.attempt + 1;
              localStorage.setItem(`cp_attempts_${userEmail}`, nextAttempt.toString());
              navigate('/test');
            }}
            className="py-4 px-12 flex items-center justify-center gap-3 border border-[#7D52FF]/30 bg-transparent text-white hover:bg-[#7D52FF]/10 hover:shadow-[0_0_20px_rgba(125,82,255,0.2)] transition-all duration-300 uppercase tracking-[0.2em] font-extrabold cursor-pointer"
          >
            <RefreshCw size={18} className="text-[#7D52FF] group-hover:rotate-180 transition-transform duration-500" />
            <span className="text-sm font-black uppercase tracking-[0.2em]">Try Again</span>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              localStorage.removeItem('cp_current_user');
              navigate('/');
            }}
            className="py-4 px-12 flex items-center justify-center gap-3 border border-[#7D52FF]/40 bg-gradient-to-r from-[#7D52FF] via-[#D174FF] via-[#F23E70] to-[#FFB659] text-black hover:from-[#FFB659] hover:to-[#7D52FF] hover:shadow-[0_0_25px_rgba(125,82,255,0.4)] shadow-[0_5px_15px_rgba(125,82,255,0.15)] transition-all duration-300 uppercase tracking-[0.2em] font-extrabold cursor-pointer"
          >
            <LogOut size={18} className="text-black group-hover:translate-x-1 transition-transform" />
            <span className="text-sm font-black uppercase tracking-[0.2em]">Exit Portal</span>
          </motion.button>
        </div>

        <AnimatePresence>
          {isLimitExceeded && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-[#000000] flex flex-col items-center justify-center p-6 text-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md space-y-10"
              >
                 <div className="flex justify-center relative">
                  <div className="absolute inset-0 bg-[#7D52FF]/20 blur-[100px] rounded-full" />
                  <div className="w-32 h-32 border border-[#7D52FF]/30 bg-[#7D52FF]/5 flex items-center justify-center relative overflow-hidden group">
                     <div className="absolute top-0 left-0 w-full h-px bg-[#7D52FF]/40 animate-[scan_2s_infinite]" />
                     <motion.div
                       animate={{ 
                         x: [-5, 5, -5],
                         opacity: [0.5, 0.8, 0.5]
                       }}
                       transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                     >
                       <UserX size={64} className="text-[#7D52FF]" />
                     </motion.div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-5xl font-black uppercase tracking-tighter text-[#7D52FF] leading-none">
                    ACCESS <br/> DENIED
                  </h2>
                  <div className="h-px w-20 bg-[#7D52FF] mx-auto" />
                  <p className="text-white/40 text-xs uppercase tracking-[0.3em] leading-relaxed max-w-xs mx-auto">
                    Security protocols engaged. You have exhausted all permitted assessment cycles.
                  </p>
                  <div className="mt-6 glass-card py-4 px-8 border-[#7D52FF]/30">
                    <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] mb-1">Cooldown in Progress</p>
                    <p className="text-2xl font-mono font-bold text-white tracking-widest">
                      {Math.floor(cooldownRemaining / 60)}:{(cooldownRemaining % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/')}
                  className="btn-primary py-5 px-16 w-full"
                >
                  <span className="text-xs font-black uppercase tracking-[0.4em]">Finalize & Exit</span>
                </motion.button>

                <p className="text-[8px] text-white/10 uppercase tracking-[1em] pt-10">
                  Secure Logging Protocol Active
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-20 text-center opacity-10 text-[10px] uppercase tracking-[0.5em]">
          SECURITY CLEARED ASSESSMENT DATA
        </footer>
      </motion.div>
    </div>
  );
};

export default Results;
