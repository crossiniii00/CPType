import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Timer, Target, Keyboard, ArrowRight, Minimize2, Sun, Moon, HelpCircle, Headphones } from 'lucide-react';

interface LandingProps {
  userName: string;
  setUserName: (name: string) => void;
}


import FireEmbersBackground from '../components/FireEmbersBackground';
import { TutorialOverlay } from '../components/TutorialOverlay';
import { cleanupExpiredLocalApplicantData, ensureApplicantAttemptWindow } from '../lib/retention';
import { FunLogo } from '../components/FunLogo';

const LockoutTimer = ({ expiryIso }: { expiryIso: string }) => {
  const [timeLeft, setTimeLeft] = useState("");

  React.useEffect(() => {
    const update = () => {
      const diff = new Date(expiryIso).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("00:00:00");
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${h.toString().padStart(2, '0')}H ${m.toString().padStart(2, '0')}M ${s.toString().padStart(2, '0')}S`);
    };
    update();
    const int = setInterval(update, 1000);
    return () => clearInterval(int);
  }, [expiryIso]);

  return (
    <div className="mt-2 mb-8 flex flex-col items-center gap-2 border border-[#7D52FF]/20 bg-[#7D52FF]/[0.02] py-4 px-8 w-full max-w-[280px]">
      <span className="text-[8px] uppercase tracking-[0.3em] text-[#7D52FF] font-black">Cooldown Active</span>
      <span className="text-xl font-mono text-white font-bold tracking-widest">{timeLeft}</span>
    </div>
  );
};
const IfritEmberParticle = ({ delay }: { delay: number }) => {
  const driftX1 = Math.random() * 20 - 10;
  const driftX2 = Math.random() * 40 - 20;
  const startLeft = Math.random() * 90 + 5;
  const colors = ['#7D52FF', '#D174FF', '#F23E70', '#FFB659'];
  const particleColor = colors[Math.floor(Math.random() * colors.length)];

  return (
    <motion.span
      initial={{ y: 5, x: 0, opacity: 0, scale: 0.8 }}
      animate={{ 
        y: [-5, -60], 
        x: [0, driftX1, driftX2],
        opacity: [0, 0.9, 0.5, 0],
        scale: [0.8, 1.2, 0.4]
      }}
      transition={{
        duration: Math.random() * 1.5 + 1.5,
        repeat: Infinity,
        delay: delay,
        ease: "easeOut"
      }}
      className="absolute w-1 h-1 rounded-full pointer-events-none blur-[0.5px]"
      style={{
        left: `${startLeft}%`,
        bottom: '15%',
        backgroundColor: particleColor,
        boxShadow: `0 0 4px ${particleColor}, 0 0 8px ${particleColor}`
      }}
    />
  );
};

const IfritText: React.FC = () => {
  return (
    <span className="relative inline-block ml-1 pr-1 font-extrabold tracking-[0.25em] uppercase">
      {Array.from({ length: 8 }).map((_, i) => (
        <IfritEmberParticle key={i} delay={i * 0.25} />
      ))}

      <motion.span 
        animate={{ 
          opacity: [0.5, 0.85, 0.5],
          scale: [0.99, 1.01, 0.99],
          filter: [
            "drop-shadow(0 0 5px rgba(209, 116, 255, 0.8)) drop-shadow(0 0 12px rgba(242, 62, 112, 0.5))",
            "drop-shadow(0 0 10px rgba(209, 116, 255, 1)) drop-shadow(0 0 20px rgba(242, 62, 112, 0.8))",
            "drop-shadow(0 0 5px rgba(209, 116, 255, 0.8)) drop-shadow(0 0 12px rgba(242, 62, 112, 0.5))"
          ]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-[#7D52FF] via-[#D174FF] via-[#F23E70] to-[#FFB659] blur-[1px] select-none pointer-events-none"
      >
        TYPE!
      </motion.span>
      
      <motion.span 
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-[#7D52FF] via-[#D174FF] via-[#F23E70] to-[#FFB659] bg-[length:200%_auto] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
      >
        TYPE!
      </motion.span>
    </span>
  );
};

const Landing: React.FC<LandingProps> = ({ userName, setUserName }) => {
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

  const [showTutorial, setShowTutorial] = useState(() => {
    return localStorage.getItem('cp_tutorial_completed') !== 'true';
  });

  const [step, setStep] = useState<1 | 2>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [h2rEmail, setH2rEmail] = useState("");
  const [focusedField, setFocusedField] = useState<'firstName' | 'lastName' | 'h2rEmail' | null>('firstName');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [lockoutExpiry, setLockoutExpiry] = useState<string | null>(null);
  const [showZoomPopup, setShowZoomPopup] = useState(false);
  const [showSoundPopup, setShowSoundPopup] = useState(false);
  const [config, setConfig] = useState({
    wpmGoal: 40,
    accuracyGoal: 95,
    timerDuration: 60,
    attemptLimit: 3
  });

  const PixelHand = ({ isVisible }: { isVisible: boolean }) => {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, x: -35 }}
            animate={{ opacity: 1, x: -20 }}
            exit={{ opacity: 0, x: -35 }}
            transition={{ 
              x: { type: "spring", stiffness: 300, damping: 20 },
              opacity: { duration: 0.1 }
            }}
            className="absolute -left-16 top-1/2 -translate-y-1/2 pointer-events-none flex items-center"
          >
            <motion.div
              animate={{ x: [0, 6, 0] }}
              transition={{ duration: 0.65, repeat: Infinity, ease: "easeInOut" }}
              className="relative flex items-center"
            >
              {/* Sleek Modern Cybernetic Glowing Arrow */}
              <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-[0_0_8px_rgba(125,82,255,0.6)]">
                <path d="M6 12H34M34 12L24 4M34 12L24 20" stroke="#7D52FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M28 12L20 6M28 12L20 18" stroke="#FFB659" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
              </svg>

              {/* Glowing Light Flare Effect at Fingertip */}
              <div className="absolute left-[34px] top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center w-6 h-6">
                {/* Glowing Pulse Rings */}
                <div className="absolute w-4 h-4 rounded-full bg-white shadow-[0_0_12px_#fff,_0_0_24px_#7D52FF,_0_0_48px_#D174FF] animate-ping opacity-90" />
                <div className="absolute w-6 h-6 rounded-full bg-[#7D52FF]/20 animate-pulse" />
                {/* Intense central core */}
                <div className="absolute w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_#fff,_0_0_16px_#7D52FF]" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  React.useEffect(() => {
    cleanupExpiredLocalApplicantData();

    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'infrastructure', 'global_config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfig(docSnap.data() as any);
        }
      } catch (err) {
        console.error("Firebase fetch error:", err);
      }
    };
    fetchConfig();
  }, []);

  const handleStart = () => {
    setShowZoomPopup(true);
  };

  const handleConfirmStart = () => {
    setShowZoomPopup(false);
    setShowSoundPopup(true);
  };

  const handleConfirmSound = () => {
    setShowSoundPopup(false);

    // Persist attempt index
    const emailIdentity = (localStorage.getItem('cp_current_email') || userName).toUpperCase();
    ensureApplicantAttemptWindow(emailIdentity);
    const stored = localStorage.getItem(`cp_attempts_${emailIdentity}`);
    const nextAttempt = stored ? parseInt(stored) + 1 : 1;
    
    if (nextAttempt > config.attemptLimit) {
      setAlertMessage(`ATTEMPT LIMIT EXCEEDED. You have already utilized all ${config.attemptLimit} permitted cycles for the identity: ${userName}`);
      setLockoutExpiry(localStorage.getItem(`cp_attempts_expires_${emailIdentity}`));
      return;
    }

    localStorage.setItem(`cp_attempts_${emailIdentity}`, nextAttempt.toString());
    localStorage.setItem('cp_current_user', userName);
    navigate('/test');
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let hasError = false;
    
    if (!firstName.trim()) {
      setFirstNameError("First name is required.");
      hasError = true;
    } else {
      setFirstNameError(null);
    }
    
    if (!lastName.trim()) {
      setLastNameError("Last name is required.");
      hasError = true;
    } else {
      setLastNameError(null);
    }
    
    if (!h2rEmail.trim()) {
      setEmailError("Email address is required.");
      hasError = true;
    } else {
      const email = h2rEmail.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError("Please include an '@' and a domain in the email address.");
        hasError = true;
      } else {
        setEmailError(null);
      }
    }
    
    if (hasError) return;

    const emailIdentity = h2rEmail.trim().toUpperCase();
    const storageIdentity = emailIdentity;
    setIsValidating(true);
    
    try {
      // Query Firestore for actual completed attempts
      const q = query(
        collection(db, 'applicant_results'),
        where('applicantEmail', '==', emailIdentity)
      );
      const snapshot = await getDocs(q);
      
      let completedCount = 0;
      const deletePromises: Promise<void>[] = [];

      snapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const expiresAtRaw = data.expiresAt || data.expiresAtIso;
        let expiryTime = 0;
        
        if (expiresAtRaw) {
          if (typeof expiresAtRaw === 'string') {
            expiryTime = new Date(expiresAtRaw).getTime();
          } else if (expiresAtRaw && typeof expiresAtRaw.toDate === 'function') {
            expiryTime = expiresAtRaw.toDate().getTime();
          }
        }

        const isExpired = Boolean(expiryTime && expiryTime <= Date.now());
        if (isExpired) {
          deletePromises.push(deleteDoc(docSnapshot.ref));
        } else {
          completedCount++;
        }
      });

      if (deletePromises.length > 0) {
        await Promise.all(deletePromises).catch(err => {
          console.error("Failed to delete some expired documents:", err);
        });
      }

      ensureApplicantAttemptWindow(storageIdentity);
      // Sync local storage with the actual number of completed attempts in Firestore
      localStorage.setItem(`cp_attempts_${storageIdentity}`, completedCount.toString());

      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      setUserName(fullName);
      
      // Store in localStorage for TypingTest
      localStorage.setItem('cp_current_email', emailIdentity);
      localStorage.setItem('cp_current_fullname', fullName);
      
      if (completedCount >= config.attemptLimit) {
        setAlertMessage(`ACCESS DENIED. Identity ${emailIdentity} has exhausted all assessment protocols.`);
        setLockoutExpiry(localStorage.getItem(`cp_attempts_expires_${storageIdentity}`));
        setIsValidating(false);
        return;
      }
      
      setStep(2);
    } catch (err) {
      console.error("Firestore attempt validation error, falling back to local storage:", err);
      ensureApplicantAttemptWindow(storageIdentity);
      
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      setUserName(fullName);
      
      localStorage.setItem('cp_current_email', emailIdentity);
      localStorage.setItem('cp_current_fullname', fullName);

      const stored = localStorage.getItem(`cp_attempts_${storageIdentity}`);
      const current = stored ? parseInt(stored) : 0;
      
      if (current >= config.attemptLimit) {
        setAlertMessage(`ACCESS DENIED. Identity ${emailIdentity} has exhausted all assessment protocols.`);
        setLockoutExpiry(localStorage.getItem(`cp_attempts_expires_${storageIdentity}`));
        setIsValidating(false);
        return;
      }
      setStep(2);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden transition-colors duration-300 ${isLightMode ? 'light-mode bg-[#f3f4f6] text-slate-800' : 'bg-[#050404] text-white'}`}>
      <FireEmbersBackground isLightMode={isLightMode} />
      {isLightMode && (
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-[-20%] left-[-20%] w-[1000px] h-[1000px] bg-[#7D52FF]/10 rounded-full blur-[180px]" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[1000px] h-[1000px] bg-[#FFB659]/10 rounded-full blur-[180px]" />
        </div>
      )}
      {/* Background Volcanic Light Overlay - Very Subtle */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[15%] right-[5%] w-[600px] h-[600px] bg-[#7D52FF]/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-[10%] left-[5%] w-[500px] h-[500px] bg-[#D174FF]/3 rounded-full blur-[180px]" />
      </div>

      {/* Admin Access & Theme Controls */}
      <div className="absolute top-8 right-8 z-50 flex items-center gap-6">
        <motion.button 
          id="landing-theme-toggle"
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

        <motion.button 
          id="landing-admin-entry"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/admin/login')}
          className={`transition-colors text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 group ${
            isLightMode ? 'text-slate-400 hover:text-black' : 'text-white/20 hover:text-white'
          }`}
        >
          <Shield size={14} className="group-hover:text-[#7D52FF] transition-colors" />
          Admin Access
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            id="landing-main-card"
            key="step1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="z-10 w-full max-w-lg text-center"
          >
            <header className="mb-12">
              <div className="flex flex-col items-center justify-center gap-6 mb-6">
                <FunLogo size="lg" />
                <h1 className="text-5xl font-extrabold tracking-[0.25em] uppercase select-none relative flex justify-center items-center">
                  <span className="text-white filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    CP
                  </span>
                  <IfritText />
                </h1>
              </div>
              <p className="text-white/40 text-[9px] uppercase tracking-[0.6em] font-medium">
                Identity Verification Required
              </p>
            </header>

            <form id="landing-identity-fields" onSubmit={handleContinue} noValidate className="flex flex-col gap-6">
              <div className="flex flex-col gap-6">
                <div className="relative group">
                  <PixelHand isVisible={focusedField === 'firstName'} />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onFocus={() => setFocusedField('firstName')}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (firstNameError) setFirstNameError(null);
                    }}
                    placeholder="FIRST NAME"
                    className="w-full bg-transparent border-b border-white/10 text-white text-center text-lg py-3 focus:outline-none focus:border-[#7D52FF] focus:shadow-[0_2px_8px_rgba(125,82,255,0.12)] transition-all duration-500 placeholder:text-white/10 font-bold tracking-widest uppercase"
                    autoFocus
                  />
                  <AnimatePresence>
                    {firstNameError && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-red-500 text-[10px] uppercase tracking-wider font-bold mt-2 text-center"
                      >
                        {firstNameError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative group">
                  <PixelHand isVisible={focusedField === 'lastName'} />
                  <input
                    type="text"
                    required
                    value={lastName}
                    onFocus={() => setFocusedField('lastName')}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (lastNameError) setLastNameError(null);
                    }}
                    placeholder="LAST NAME"
                    className="w-full bg-transparent border-b border-white/10 text-white text-center text-lg py-3 focus:outline-none focus:border-[#7D52FF] focus:shadow-[0_2px_8px_rgba(125,82,255,0.12)] transition-all duration-500 placeholder:text-white/10 font-bold tracking-widest uppercase"
                  />
                  <AnimatePresence>
                    {lastNameError && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-red-500 text-[10px] uppercase tracking-wider font-bold mt-2 text-center"
                      >
                        {lastNameError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative group">
                  <PixelHand isVisible={focusedField === 'h2rEmail'} />
                  <input
                    type="email"
                    required
                    value={h2rEmail}
                    onFocus={() => setFocusedField('h2rEmail')}
                    onChange={(e) => {
                      setH2rEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    placeholder="TALENT MATCH EMAIL"
                    className="w-full bg-transparent border-b border-white/10 text-white text-center text-lg py-3 focus:outline-none focus:border-[#7D52FF] focus:shadow-[0_2px_8px_rgba(125,82,255,0.12)] transition-all duration-500 placeholder:text-white/10 font-bold tracking-widest uppercase"
                  />
                  <AnimatePresence>
                    {emailError && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-[#ff4500] text-[10px] uppercase tracking-wider font-bold mt-2 text-center"
                      >
                        {emailError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              <div className="h-14">
                <AnimatePresence>
                  {firstName.trim() && lastName.trim() && h2rEmail.trim() && (
                    <motion.button 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      whileHover={isValidating ? {} : { scale: 1.05 }}
                      whileTap={isValidating ? {} : { scale: 0.95 }}
                      type="submit"
                      disabled={isValidating}
                      className="mx-auto flex items-center justify-center gap-2 text-white/60 hover:text-[#7D52FF] transition-all text-xs uppercase tracking-[0.4em] font-black group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isValidating ? 'Validating...' : 'Take the test!'}
                      {!isValidating && <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform text-[#7D52FF]" />}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="z-10 w-full max-w-4xl"
          >
              <header className="mb-12 text-center">
                <h2 className="text-4xl font-bold tracking-widest text-white mb-2 uppercase">
                  Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7D52FF] via-[#D174FF] via-[#F23E70] to-[#FFB659] filter drop-shadow-[0_2px_4px_rgba(125,82,255,0.4)]">{userName}</span>
                </h2>
                <p className="text-white/40 text-xs tracking-[0.35em] uppercase">
                  Please review the assessment protocol
                </p>
              </header>

              <main className="glass-card p-10 border-t-4 border-[#7D52FF] relative overflow-hidden bg-[#0c0907]/95 border-[#7D52FF]/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#7D52FF]/5 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-[#7D52FF]/40" />
                <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-[#7D52FF]/40" />
                <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-[#7D52FF]/40" />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-[#7D52FF]/40" />

                 <div className="grid md:grid-cols-2 gap-8 mb-12 relative z-10">
                  {[
                    { icon: <Timer size={24} />, title: `${config.timerDuration} Second Duration`, desc: "The assessment evaluates speed under time pressure. The timer begins on the first keystroke." },
                    { icon: <Target size={24} />, title: `${config.accuracyGoal}% Minimum Accuracy`, desc: "Precision is mandatory. Falling below the accuracy threshold results in disqualification." },
                    { icon: <Shield size={24} />, title: `${config.attemptLimit} Total Attempts`, desc: "You have a maximum number of cycles. Only your highest qualified score will be recorded." },
                    { icon: <Keyboard size={24} />, title: `${config.wpmGoal} WPM Threshold`, desc: "The minimum speed required to pass the enterprise standard." }
                  ].map((rule, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      transition={{ delay: 0.2 + (idx * 0.1) }}
                      className="flex items-start gap-5 p-6 bg-white/[0.01] border border-[#7D52FF]/5 rounded-none hover:bg-white/[0.03] hover:border-[#7D52FF]/20 transition-all duration-300 group"
                    >
                      <div className="text-white/20 group-hover:text-[#7D52FF] transition-colors mt-1">{rule.icon}</div>
                      <div>
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-2">{rule.title}</h3>
                        <p className="text-white/40 text-xs leading-relaxed">{rule.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex justify-center relative z-10">
                   <motion.button 
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleStart}
                    className="py-4 px-16 text-sm font-extrabold uppercase tracking-[0.25em] flex items-center justify-center gap-3 w-full md:w-auto transition-all duration-300 border border-[#7D52FF]/40 bg-gradient-to-r from-[#7D52FF] via-[#D174FF] via-[#F23E70] to-[#FFB659] text-black hover:from-[#FFB659] hover:to-[#7D52FF] hover:shadow-[0_0_25px_rgba(125,82,255,0.4)] shadow-[0_5px_15px_rgba(125,82,255,0.15)] active:scale-95 cursor-pointer"
                  >
                    Acknowledge & Start
                    <ArrowRight size={16} className="text-black" />
                  </motion.button>
                </div>
             </main>

             <div className="mt-8 text-center">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep(1)}
                  className="text-white/20 hover:text-white/60 text-[10px] uppercase tracking-widest transition-colors"
                >
                  Go Back
                </motion.button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <footer className="absolute bottom-8 left-0 w-full text-center pointer-events-none opacity-20">
         <p className="text-[9px] uppercase tracking-[0.5em] text-white">Secure Assessment Engine</p>
      </footer>

      {/* Custom Alert Modal */}
      <AnimatePresence>
        {alertMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass-card max-w-md w-full p-8 border-t-4 border-[#ff4500] flex flex-col items-center text-center relative overflow-hidden bg-[#0c0907]/95 border-[#ff4500]/10"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff4500]/5 rounded-full blur-[40px] pointer-events-none" />
              <Shield size={48} className="text-[#ff4500] mb-6" />
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight uppercase">Access Restricted</h3>
              <p className={`text-white/60 text-xs leading-relaxed font-mono ${lockoutExpiry ? 'mb-4' : 'mb-8'}`}>{alertMessage}</p>
              
              {lockoutExpiry && <LockoutTimer expiryIso={lockoutExpiry} />}

              <button
                onClick={() => {
                  setAlertMessage(null);
                  setLockoutExpiry(null);
                }}
                className="w-full py-4 text-xs font-black uppercase tracking-widest border border-[#ff4500]/40 bg-gradient-to-r from-[#ff4500] to-[#b30000] text-white hover:from-[#ff6a00] hover:to-[#ff4500] transition-colors cursor-pointer"
              >
                Acknowledge
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoom Out Recommendation Modal */}
      <AnimatePresence>
        {showZoomPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-md p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass-card max-w-md w-full p-8 border-t-4 border-yellow-500 relative overflow-hidden text-center"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-[40px] pointer-events-none" />
              
              <div className="w-16 h-16 mx-auto mb-6 bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center relative">
                <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-yellow-500/40" />
                <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-yellow-500/40" />
                <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-yellow-500/40" />
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-yellow-500/40" />
                <Minimize2 size={24} className="text-yellow-500 animate-pulse animate-duration-1000" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3 tracking-tight uppercase">ZOOM RECOMMENDATION</h3>
              
              <p className="text-white/60 text-xs leading-relaxed uppercase tracking-wider mb-8 font-medium">
                For the best experience, we recommend <span className="text-yellow-500 font-bold">zooming out your browser (to 80% or 90%)</span> so the test screen fits perfectly on your display.
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConfirmStart}
                  className="btn-primary w-full py-4 text-xs uppercase tracking-widest bg-yellow-500 text-black border-yellow-500 hover:bg-yellow-400 font-black transition-colors"
                >
                  I have adjusted my zoom
                </button>
                <button
                  onClick={() => setShowZoomPopup(false)}
                  className="text-white/20 hover:text-white/60 text-[9px] uppercase tracking-widest transition-colors py-2"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Headset/Sound Recommendation Modal */}
      <AnimatePresence>
        {showSoundPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-md p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass-card max-w-md w-full p-8 border-t-4 border-[#7D52FF] relative overflow-hidden text-center bg-[#0c0907]/95 border-[#7D52FF]/10"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#7D52FF]/10 rounded-full blur-[40px] pointer-events-none" />
              
              <div className="w-16 h-16 mx-auto mb-6 bg-[#7D52FF]/10 border border-[#7D52FF]/30 flex items-center justify-center relative">
                <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-[#7D52FF]/40" />
                <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-[#7D52FF]/40" />
                <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-[#7D52FF]/40" />
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-[#7D52FF]/40" />
                <Headphones size={24} className="text-[#7D52FF] animate-pulse" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3 tracking-tight uppercase">HEADPHONES RECOMMENDED</h3>
              
              <p className="text-white/60 text-xs leading-relaxed uppercase tracking-wider mb-8 font-medium">
                The typing test has <span className="text-[#7D52FF] font-bold">sound effects</span>. We recommend <span className="text-[#FFB659] font-bold">wearing a headset or headphones</span> for the best experience.
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConfirmSound}
                  className="btn-primary w-full py-4 text-xs uppercase tracking-widest bg-[#7D52FF] text-white border-[#7D52FF] hover:bg-[#6836FF] font-black transition-colors"
                >
                  Start Test
                </button>
                <button
                  onClick={() => setShowSoundPopup(false)}
                  className="text-white/20 hover:text-white/60 text-[9px] uppercase tracking-widest transition-colors py-2"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Tutorial Help Button */}
      <div className="absolute bottom-8 left-8 z-50">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowTutorial(true)}
          className={`flex items-center gap-2 px-3 py-1.5 border transition-all duration-300 text-[10px] uppercase tracking-widest font-bold animate-cyber-pulse ${
            isLightMode 
              ? 'border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-black shadow-sm' 
              : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
          }`}
        >
          <HelpCircle size={12} className="text-[#7D52FF]" />
          <span>HELP TUTORIAL</span>
        </motion.button>
      </div>

      {/* Game Interactive Step-by-Step Tutorial Overlay */}
      <AnimatePresence>
        {showTutorial && (
          <TutorialOverlay 
            isLightMode={isLightMode} 
            onClose={() => setShowTutorial(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Landing;
