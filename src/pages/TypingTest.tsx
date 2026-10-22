import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Sun, Moon } from 'lucide-react';
import FireEmbersBackground from '../components/FireEmbersBackground';
import { getRetentionExpiry } from '../lib/retention';
import { localStore } from '../lib/localStore';

interface TypingTestProps {
  userName: string;
  attempt: number;
}

const SAMPLE_TEXT = "The quick brown fox jumps over the lazy dog. Programming is the art of algorithm design and the craft of debugging code. High performance typing requires focus, rhythm, and precision. In a professional environment, speed is only as valuable as the accuracy that accompanies it. Success in recruitment often hinges on the ability to demonstrate technical competence under time constraints. Every keystroke counts when you are being evaluated for an enterprise-grade role.";

const TypingTest: React.FC<TypingTestProps> = ({ userName: propUserName, attempt: propAttempt }) => {
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

  // Persist identity from session
  const userName = localStorage.getItem('cp_current_fullname') || localStorage.getItem('cp_current_user') || propUserName || 'Applicant';
  const userEmail = localStorage.getItem('cp_current_email') || userName;
  const attempt = localStorage.getItem(`cp_attempts_${userEmail.toUpperCase()}`) || propAttempt || 1;

  const [text, setText] = useState(SAMPLE_TEXT);
  const [userInput, setUserInput] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isFinished, setIsFinished] = useState(false);
  const [metrics, setMetrics] = useState({ wpm: 0, accuracy: 100, errors: 0 });
  const [selectedPrompt, setSelectedPrompt] = useState({ id: '', title: 'Assessment Protocol', difficulty: 'Standard' });
  const [config, setConfig] = useState({
    wpmGoal: 40,
    accuracyGoal: 95,
    timerDuration: 60,
    difficultyScaler: 100,
    strictCapitals: true,
    strictSpaces: true,
    shuffleMode: true,
    selectedPromptId: '',
    attemptLimit: 3,
    wpmCalculationMethod: 'Net'
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const isInitialized = useRef(false);
  const hasSavedResult = useRef(false);

  // Load config and prompts from localStore
  useEffect(() => {
    const fetchInfrastructure = () => {
      if (isInitialized.current) return;
      try {
        const storedConfig = localStore.getConfig();
        const currentConfig = { ...config, ...storedConfig };
        setConfig(currentConfig);
        setTimeLeft(currentConfig.timerDuration);

        const activePrompts = localStore.getPrompts().filter(p => p.isActive);

        if (activePrompts.length > 0) {
          let selected: any;
          if (currentConfig.shuffleMode) {
            selected = activePrompts[Math.floor(Math.random() * activePrompts.length)];
          } else {
            selected = activePrompts.find(p => p.id === currentConfig.selectedPromptId) || activePrompts[0];
          }
          setText(selected.content);
          setSelectedPrompt({
            id: selected.id || '',
            title: selected.title || 'Assessment Protocol',
            difficulty: selected.difficulty || 'Standard'
          });
          isInitialized.current = true;
        }
      } catch (err) {
        console.error("Infrastructure fetch error:", err);
      }
    };
    fetchInfrastructure();
  }, []);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const calculateMetrics = useCallback((input: string, timeElapsed: number) => {
    const minutes = timeElapsed / 60;

    let errors = 0;
    let correctChars = 0;
    const targetChars = text.split('');
    const inputChars = input.split('');

    inputChars.forEach((char, i) => {
      let targetChar = targetChars[i];
      let inputChar = char;
      if (!config.strictSpaces && targetChar === ' ') {
        correctChars++;
        return;
      }
      if (!config.strictCapitals) {
        targetChar = targetChar.toLowerCase();
        inputChar = inputChar.toLowerCase();
      }
      if (inputChar !== targetChar) {
        errors++;
      } else {
        correctChars++;
      }
    });

    const accuracy = input.length > 0 ? Math.max(0, Math.round(((input.length - errors) / input.length) * 100)) : 100;

    let rawWpm = 0;
    const grossWpm = minutes > 0 ? (input.length / 5) / minutes : 0;
    
    if (config.wpmCalculationMethod === 'Gross') {
      rawWpm = grossWpm;
    } else if (config.wpmCalculationMethod === 'Strict') {
      rawWpm = minutes > 0 ? (correctChars / 5) / minutes : 0;
    } else if (config.wpmCalculationMethod === 'Traditional') {
      const literalWords = input.trim().split(/\s+/).filter(w => w.length > 0).length;
      rawWpm = minutes > 0 ? (literalWords / minutes) : 0;
    } else if (config.wpmCalculationMethod === 'Harsh') {
      const netWpm = grossWpm - (minutes > 0 ? (errors * 2) / minutes : 0);
      rawWpm = Math.max(0, netWpm);
    } else {
      // Default to Net
      const netWpm = grossWpm - (minutes > 0 ? errors / minutes : 0);
      rawWpm = Math.max(0, netWpm);
    }

    const currentWpm = Math.round(rawWpm * (config.difficultyScaler / 100));

    return { wpm: currentWpm, accuracy, errors };
  }, [text, config.difficultyScaler, config.strictCapitals, config.strictSpaces, config.wpmCalculationMethod]);

  const userInputRef = useRef(userInput);
  useEffect(() => { userInputRef.current = userInput; }, [userInput]);

  useEffect(() => {
    let interval: any;
    if (startTime && !isFinished) {
      interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const newTimeLeft = Math.max(0, config.timerDuration - Math.floor(elapsed));
        setTimeLeft(newTimeLeft);
        setMetrics(calculateMetrics(userInputRef.current, elapsed));
        if (newTimeLeft === 0) setIsFinished(true);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [startTime, isFinished, config.timerDuration, calculateMetrics]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isFinished) return;
    if (!startTime && e.key === 'Enter') {
      e.preventDefault();
      setStartTime(Date.now());
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      window.location.reload();
    }
  };

  // Audio Synthesis for Typing Feedback
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playPop = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFinished) return;
    const value = e.target.value;
    if (value.length !== userInput.length) playPop();
    if (value.length > text.length) return;
    if (!startTime) return;
    setUserInput(value);
    const elapsed = startTime ? (Date.now() - startTime) / 1000 : 0.001;
    setMetrics(calculateMetrics(value, elapsed));
    if (value.length === text.length) setIsFinished(true);
  };

  const words = text.split(' ');
  let charIndexTracker = 0;

  const renderWords = () => {
    charIndexTracker = 0;
    return words.map((word, wordIdx) => {
      const isLastWord = wordIdx === words.length - 1;
      const wordChars = (word + (isLastWord ? '' : ' ')).split('');
      const wordRender = wordChars.map((char, charIdx) => {
        const globalCharIdx = charIndexTracker++;
        let charClass = "text-white/20 transition-colors duration-150";
        let isCorrect = true;
        if (globalCharIdx < userInput.length) {
          let targetChar = char;
          let inputChar = userInput[globalCharIdx];
          isCorrect = inputChar === targetChar;
          if (!config.strictCapitals) isCorrect = inputChar.toLowerCase() === targetChar.toLowerCase();
          if (!config.strictSpaces && targetChar === ' ') isCorrect = true;
          charClass = isCorrect ? "text-white" : "text-red-500 border-b border-red-500 bg-red-500/20";
        }

        const isCurrent = globalCharIdx === userInput.length;
        const isError = globalCharIdx < userInput.length && !isCorrect;

        return (
          <motion.span 
            key={globalCharIdx} 
            animate={isError ? { x: [-2, 2, -2, 2, 0] } : {}}
            transition={{ duration: 0.15, repeat: isError ? Infinity : 0 }}
            className={`relative inline-block ${charClass}`}
          >
            {char === ' ' ? '\u00A0' : char}
            {isCurrent && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-[1.15em] bg-[#7D52FF] shadow-[0_0_12px_rgba(125,82,255,0.9),_0_0_4px_rgba(125,82,255,0.5)] animate-caret-blink" />
            )}
          </motion.span>
        );
      });
      return <div key={wordIdx} className="inline-block mr-[0.35em] mb-1.5">{wordRender}</div>;
    });
  };

  useEffect(() => {
    if (isFinished) {
      if (hasSavedResult.current) return;
      hasSavedResult.current = true;

      const attemptNumber = Number(attempt);
      const isQualified = metrics.wpm >= config.wpmGoal && metrics.accuracy >= config.accuracyGoal;
      const expiresAt = getRetentionExpiry();
      const resultPayload = {
        wpm: metrics.wpm,
        accuracy: metrics.accuracy,
        errors: metrics.errors,
        userName,
        applicantEmail: userEmail,
        attempt: attemptNumber,
        attemptNumber,
        isQualified,
        promptId: selectedPrompt.id,
        promptTitle: selectedPrompt.title,
        promptDifficulty: selectedPrompt.difficulty,
        createdAt: new Date().toISOString(),
        expiresAtIso: expiresAt.toISOString()
      };

      localStorage.setItem('cp_last_result', JSON.stringify(resultPayload));
      localStore.addResult(resultPayload);

      setTimeout(() => navigate('/results'), 1500);
    }
  }, [isFinished, navigate, metrics, userName, attempt, config.wpmGoal, config.accuracyGoal, selectedPrompt]);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden font-inter transition-colors duration-300 ${isLightMode ? 'light-mode bg-[#f3f4f6] text-slate-800' : 'bg-[#050404] text-white'}`}>
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
        className="w-full max-w-6xl flex flex-col items-center z-10"
      >
        <div className="w-full max-w-4xl glass-card px-12 py-6 mb-12 flex items-center justify-between relative overflow-hidden group border-t-2 border-[#7D52FF]/20 bg-[#0c0907]/90">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#7D52FF]/40 to-transparent" />
          
          <div className="flex gap-10 items-center">
            <div className="flex flex-col">
              <span className="text-white/20 text-[8px] uppercase tracking-[0.4em] font-black mb-1">Candidate</span>
              <span className="text-white text-xs font-black tracking-widest uppercase truncate max-w-[150px]">{userName}</span>
            </div>
            
            <div className="w-px h-8 bg-white/5" />

            <div className="flex flex-col">
              <span className="text-white/20 text-[8px] uppercase tracking-[0.4em] font-black mb-1">Status</span>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#7D52FF] animate-pulse shadow-[0_0_8px_#7D52FF]" />
                <span className="text-white text-xs font-bold tracking-widest uppercase">Protocol Active</span>
              </div>
            </div>
          </div>

          <div className="flex gap-12 items-center">
            <div className="text-center">
              <span className="text-white/20 text-[8px] uppercase tracking-[0.3em] font-bold block mb-1">Timer</span>
              <span className={`text-2xl font-mono font-bold transition-colors ${timeLeft <= 10 ? 'text-[#FFB659] shadow-[0_0_8px_rgba(255,182,89,0.2)]' : 'text-white'}`}>
                {timeLeft.toString().padStart(2, '0')}<span className="text-[10px] ml-0.5 opacity-40">s</span>
              </span>
            </div>
            <div className="w-px h-8 bg-white/5" />
            <div className="text-center">
              <span className="text-white/20 text-[8px] uppercase tracking-[0.3em] font-bold block mb-1">Velocity</span>
              <span className="text-2xl font-mono font-bold text-white">
                {metrics.wpm}<span className="text-[10px] ml-0.5 opacity-40">WPM</span>
              </span>
            </div>
            <div className="w-px h-8 bg-white/5" />
            <div className="text-center">
              <span className="text-white/20 text-[8px] uppercase tracking-[0.3em] font-bold block mb-1">Precision</span>
              <span className="text-2xl font-mono font-bold text-white">
                {metrics.accuracy}<span className="text-[10px] ml-0.5 opacity-40">%</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-white/20 text-[8px] uppercase tracking-[0.4em] font-black mb-1">Sequence</span>
            <span className="text-[#7D52FF] text-xs font-black tracking-widest">{attempt} / {config.attemptLimit}</span>
          </div>
        </div>

        <div
          className={`relative w-full glass-card p-16 min-h-[400px] flex items-center justify-center cursor-text transition-all duration-700 bg-[#0c0907]/90 ${isFinished ? 'opacity-20 blur-xl scale-95 pointer-events-none' : 'hover:border-[#7D52FF]/20'}`}
          onClick={handleContainerClick}
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-white/5 overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#7D52FF] via-[#D174FF] via-[#F23E70] to-[#FFB659] shadow-[0_0_10px_#7D52FF]"
              initial={{ width: 0 }}
              animate={{ width: `${(userInput.length / text.length) * 100}%` }}
              transition={{ ease: "linear" }}
            />
          </div>

          <input
            ref={inputRef}
            type="text"
            className="absolute opacity-0 pointer-events-none"
            value={userInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />

          <div className="text-3xl leading-[1.5] text-center max-w-[950px] select-none font-medium tracking-tight text-white/10">
            {renderWords()}
          </div>

          <AnimatePresence>
            {!startTime && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`absolute inset-0 flex items-center justify-center ${
                  isLightMode ? 'bg-white/35 backdrop-blur-md' : 'bg-black/60 backdrop-blur-sm'
                } z-20 pointer-events-none transition-colors duration-300`}
              >
                <div className="flex flex-col items-center gap-6">
                  <motion.div
                    animate={{
                      scale: [1, 1.04, 1],
                      borderColor: isLightMode 
                        ? ["rgba(125, 82, 255, 0.3)", "rgba(125, 82, 255, 0.6)", "rgba(125, 82, 255, 0.3)"]
                        : ["rgba(255, 255, 255, 0.1)", "rgba(125, 82, 255, 0.4)", "rgba(255, 255, 255, 0.1)"]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className={`px-14 py-7 border uppercase tracking-[0.5em] text-[13px] font-black transition-all ${
                      isLightMode 
                        ? 'bg-white/90 text-slate-800 shadow-lg' 
                        : 'bg-white/[0.02] text-white shadow-[0_0_20px_rgba(125,82,255,0.05)]'
                    }`}
                  >
                    Press Enter to Begin
                  </motion.div>
                  <p className={`text-[8px] uppercase tracking-[0.3em] font-bold ${
                    isLightMode ? 'text-slate-400' : 'text-white/20'
                  }`}>
                    Identity: {userName}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-16 flex flex-col items-center gap-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="flex items-center gap-3 text-white/10 hover:text-white transition-all uppercase text-[8px] tracking-[0.4em] font-black group"
            tabIndex={-1}
          >
            <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-700" />
            Reset Sequence
          </motion.button>
          
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          
          <p className="text-white/[0.03] text-[9px] uppercase tracking-[1em] font-bold">
            CP TYPE // ASSESSMENT ENGINE // V4.0
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default TypingTest;
