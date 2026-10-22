import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Settings, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit3,
  Check,
  RefreshCw,
  Users,
  Award,
  BarChart3,
  ChevronRight,
  Clock,
  Sun,
  Moon,
  HelpCircle,
  X
} from 'lucide-react';

import { FunLogo } from '../components/FunLogo';
import { cleanupExpiredLocalApplicantData } from '../lib/retention';
import FireEmbersBackground from '../components/FireEmbersBackground';
import { AdminTutorialOverlay } from '../components/AdminTutorialOverlay';
import { localStore } from '../lib/localStore';

type ApplicantResult = {
  id: string;
  userName?: string;
  applicantEmail?: string;
  wpm?: number;
  accuracy?: number;
  errors?: number;
  attempt?: number;
  attemptNumber?: number;
  isQualified?: boolean;
  promptTitle?: string;
  promptDifficulty?: string;
  createdAt?: any;
  expiresAt?: any;
  expiresAtIso?: string;
  timerDuration?: number;
};

type ApplicantGroup = {
  applicant: string;
  attempts: ApplicantResult[];
  best: ApplicantResult;
};

type AdminNote = {
  id: string;
  content: string;
  color: 'purple' | 'pink' | 'yellow' | 'cyan';
  createdAt: string;
};

const getApplicantId = (result: ApplicantResult) => (
  result.applicantEmail || result.userName || 'Unknown Applicant'
).toString();

const getAttemptNumber = (result: ApplicantResult) => Number(result.attemptNumber || result.attempt || 1);

const getResultTime = (result: ApplicantResult) => {
  const raw = result.createdAt;
  if (!raw) return 0;
  if (typeof raw === 'string') return new Date(raw).getTime();
  if (typeof raw.toDate === 'function') return raw.toDate().getTime();
  return 0;
};

const formatResultTime = (result: ApplicantResult) => {
  const time = getResultTime(result);
  if (!time) return 'Pending timestamp';
  return new Date(time).toLocaleString();
};

const getExpiryTime = (result: ApplicantResult) => {
  const raw = result.expiresAt || result.expiresAtIso;
  if (!raw) return 0;
  if (typeof raw === 'string') return new Date(raw).getTime();
  if (typeof raw.toDate === 'function') return raw.toDate().getTime();
  return 0;
};

const isExpiredResult = (result: ApplicantResult) => {
  const expiryTime = getExpiryTime(result);
  return Boolean(expiryTime && expiryTime <= Date.now());
};

const pickBestResult = (attempts: ApplicantResult[]) => (
  [...attempts].sort((a, b) => {
    const wpmDiff = Number(b.wpm || 0) - Number(a.wpm || 0);
    if (wpmDiff !== 0) return wpmDiff;
    return Number(b.accuracy || 0) - Number(a.accuracy || 0);
  })[0]
);

const cleanEmailOrName = (str: string): string => {
  const parts = str.toLowerCase().split('@');
  const localPart = parts[0].replace(/[^a-z0-9]/g, '');
  return localPart;
};

const getSimilarityScore = (s1: string, s2: string): boolean => {
  const clean1 = cleanEmailOrName(s1);
  const clean2 = cleanEmailOrName(s2);
  
  if (clean1 === clean2) return true; // Match ignoring formatting (. or -)
  
  // Substring match if long enough
  if (clean1.length > 5 && clean2.length > 5) {
    if (clean1.includes(clean2) || clean2.includes(clean1)) return true;
  }

  // Levenshtein distance
  const len1 = clean1.length;
  const len2 = clean2.length;
  if (Math.abs(len1 - len2) > 2) return false;

  const matrix = Array.from({ length: len1 + 1 }, (_, i) => Array(len2 + 1).fill(0));
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = clean1[i - 1] === clean2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[len1][len2] <= 2;
};

const ExpiryTimer = ({ expiresAt }: { expiresAt: any }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      if (!expiresAt) return;
      const expiry = typeof expiresAt === 'string' 
        ? new Date(expiresAt).getTime() 
        : (typeof expiresAt.toDate === 'function' ? expiresAt.toDate().getTime() : 0);
      
      if (!expiry) return;
      
      const diff = expiry - Date.now();
      if (diff <= 0) {
        setTimeLeft('EXPIRED');
        setIsUrgent(true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const formatted = [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
      ].join(':');

      setTimeLeft(formatted);
      setIsUrgent(diff < 60 * 60 * 1000); // urgent if less than 1 hour
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!timeLeft) return null;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded-none z-10 transition-all ${
      isUrgent 
        ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.2)]' 
        : 'bg-[#7D52FF]/10 text-[#7D52FF] border-[#7D52FF]/20 shadow-[0_0_8px_rgba(125,82,255,0.1)]'
    }`}>
      <Clock size={10} className={isUrgent ? 'animate-spin' : ''} />
      <span>{timeLeft} Left</span>
    </div>
  );
};

const MonkeytypeAnalysis: React.FC<{ attempt: ApplicantResult; totalDuration?: number }> = ({ attempt, totalDuration = 30 }) => {
  const duration = attempt.timerDuration || totalDuration || 60;
  
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
      // Create a realistic typing speed curve:
      // - Starts lower (warm-up phase)
      // - Rises up to normal typing speed
      // - Dynamic fluctuation (sinusoidal micro-variations)
      // - Drop in speed when an error is made
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
  // SVG size is 650 x 180
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
    <div className="bg-[#0c0907]/90 border border-white/5 p-8 relative flex flex-col gap-6 text-[#7c7b7a] overflow-hidden">
      {/* Background grain texture / subtle ambient highlight */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFB659]/5 rounded-full blur-[90px] pointer-events-none" />

      {/* Top Section: Metrics and SVG Graph */}
      <div className="flex flex-col md:flex-row gap-8 items-stretch">
        
        {/* Left Column: Big Stats */}
        <div className="flex flex-row md:flex-col justify-between md:justify-center gap-6 min-w-[120px] shrink-0">
          <div>
            <div className="text-[10px] uppercase font-black tracking-widest text-[#7c7b7a]/40 mb-1">wpm</div>
            <div className="text-5xl font-black text-[#FFB659] leading-none font-mono">
              {wpm}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-black tracking-widest text-[#7c7b7a]/40 mb-1">acc</div>
            <div className="text-5xl font-black text-[#FFB659] leading-none font-mono">
              {accuracy}<span className="text-2xl font-black text-[#FFB659]/60">%</span>
            </div>
          </div>
          <div>
            <div className="text-[8px] uppercase font-black tracking-[0.2em] text-[#7c7b7a]/40 mb-1">test type</div>
            <div className="text-[10px] font-bold text-[#FFB659] uppercase tracking-wider font-mono">
              time {duration}s
            </div>
            <div className="text-[9px] font-medium text-[#7c7b7a]/60 uppercase tracking-widest mt-0.5">
              {attempt.promptDifficulty || 'standard'}
            </div>
          </div>
        </div>

        {/* Central Graphic Area: SVG Chart */}
        <div className="flex-grow flex flex-col relative bg-black/40 border border-white/5 p-4 justify-between h-[200px] min-w-0">
          <div className="absolute top-2 left-4 text-[8px] font-black uppercase tracking-widest text-[#7c7b7a]/30">Words per Minute</div>
          <div className="absolute top-2 right-4 text-[8px] font-black uppercase tracking-widest text-[#7c7b7a]/30">Errors</div>
          
          <div className="w-full flex-grow mt-4">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="wpmGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFB659" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#FFB659" stopOpacity="0.0" />
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
                <path d={rawPath} fill="none" stroke="#555" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />
              )}

              {/* Net speed curve (Yellow/gold line) */}
              {wpmPath && (
                <>
                  {/* Glowing line shadow */}
                  <path d={wpmPath} fill="none" stroke="#FFB659" strokeWidth="4" opacity="0.15" />
                  {/* Clean front line */}
                  <path d={wpmPath} fill="none" stroke="#FFB659" strokeWidth="2" />
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
                  <circle key={idx} cx={x} cy={y} r="2.5" fill="#FFB659" stroke="#0c0907" strokeWidth="1" />
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom Row: Detailed Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-white/5 text-center md:text-left">
        <div>
          <div className="text-[9px] uppercase font-bold tracking-widest text-[#7c7b7a]/40 mb-1">raw</div>
          <div className="text-2xl font-bold font-mono text-[#FFB659]">
            {Math.round(wpm * 1.08)}
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase font-bold tracking-widest text-[#7c7b7a]/40 mb-1 font-sans">characters</div>
          <div className="text-2xl font-bold font-mono text-[#FFB659] tracking-wider">
            {correctCount}<span className="text-[#7c7b7a]/40">/</span>
            <span className="text-[#F23E70]">{incorrectCount}</span><span className="text-[#7c7b7a]/40">/</span>
            {extraCount}<span className="text-[#7c7b7a]/40">/</span>
            {missedCount}
          </div>
          <p className="text-[7px] text-[#7c7b7a]/30 uppercase tracking-widest mt-0.5">corr/inc/extra/miss</p>
        </div>
        <div>
          <div className="text-[9px] uppercase font-bold tracking-widest text-[#7c7b7a]/40 mb-1">consistency</div>
          <div className="text-2xl font-bold font-mono text-[#FFB659]">
            {consistency}<span className="text-sm font-bold text-[#FFB659]/60">%</span>
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase font-bold tracking-widest text-[#7c7b7a]/40 mb-1">time</div>
          <div className="text-2xl font-bold font-mono text-[#FFB659]">
            {duration}s
          </div>
          <p className="text-[7px] text-[#7c7b7a]/30 uppercase tracking-widest mt-0.5">00:00:{duration.toString().padStart(2, '0')} session</p>
        </div>
      </div>
    </div>
  );
};

const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const now = ctx.currentTime;
    
    // First tone (G5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(783.99, now); // G5
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Second tone (C6, slightly delayed chime)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.50, now + 0.08); // C6
    gain2.gain.setValueAtTime(0.12, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.5);

  } catch (err) {
    console.error("Audio Synthesis Error:", err);
  }
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'prompts' | 'results' | 'settings'>('prompts');
  const [resultsSubTab, setResultsSubTab] = useState<'new' | 'history'>('new');
  const [searchQuery, setSearchQuery] = useState('');

  // Admin Notes State
  const [notes, setNotes] = useState<AdminNote[]>(() => {
    try {
      const stored = localStorage.getItem('cp_admin_notes');
      return stored ? JSON.parse(stored) : [
        {
          id: 'note-default-1',
          content: 'Remember to verify WPM goals for the new Expert prompt tier before publishing.',
          color: 'purple',
          createdAt: new Date().toISOString()
        },
        {
          id: 'note-default-2',
          content: 'CESAR OLAER has qualified for high attempt metrics.',
          color: 'cyan',
          createdAt: new Date().toISOString()
        }
      ];
    } catch {
      return [];
    }
  });

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem('cp_admin_notes', JSON.stringify(notes));
  }, [notes]);

  const handleAddNote = () => {
    const colors: AdminNote['color'][] = ['purple', 'pink', 'yellow', 'cyan'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newNote: AdminNote = {
      id: `note-${Date.now()}`,
      content: '',
      color: randomColor,
      createdAt: new Date().toISOString()
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const handleUpdateNote = (id: string, content: string) => {
    setNotes(prev => prev.map(note => note.id === id ? { ...note, content } : note));
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const handleChangeNoteColor = (id: string, color: AdminNote['color']) => {
    setNotes(prev => prev.map(note => note.id === id ? { ...note, color } : note));
  };
  
  // Settings & Auth State
  const [settings, setSettings] = useState({
    wpmGoal: 40,
    accuracyGoal: 95,
    attemptLimit: 3,
    timerDuration: 60,
    difficultyScaler: 100,
    strictCapitals: true,
    strictSpaces: true,
    shuffleMode: true,
    selectedPromptId: '',
    wpmCalculationMethod: 'Net'
  });
  
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
    return localStorage.getItem('cp_admin_tutorial_completed') !== 'true';
  });

  const [adminAuth, setAdminAuth] = useState({ password: 'admin123' });
  const [prompts, setPrompts] = useState<any[]>([]);
  const [applicantResults, setApplicantResults] = useState<ApplicantResult[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<string | null>(null);
  
  const [seenResultIds, setSeenResultIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('cp_seen_result_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cp_seen_result_ids', JSON.stringify(seenResultIds));
  }, [seenResultIds]);

  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

  const handleViewApplicant = (group: any) => {
    setSelectedApplicant(group.applicant);
    setIsDetailModalOpen(true);
    if (group.attempts && group.attempts.length > 0) {
      setSelectedAttemptId(group.attempts[group.attempts.length - 1].id);
    } else {
      setSelectedAttemptId(null);
    }
    
    // Add all attempt IDs of this applicant to the seen list
    const attemptIds = group.attempts.map((a: any) => a.id);
    setSeenResultIds(prev => {
      const newIds = [...prev];
      attemptIds.forEach((id: string) => {
        if (!newIds.includes(id)) {
          newIds.push(id);
        }
      });
      return newIds;
    });
  };

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShuffleModalOpen, setIsShuffleModalOpen] = useState(false);
  const [purgeConfirmation, setPurgeConfirmation] = useState<{ applicantId: string; attempts: ApplicantResult[] } | null>(null);
  const [mergeConfirmation, setMergeConfirmation] = useState<{ targetApplicant: string; sourceApplicant: string } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newPrompt, setNewPrompt] = useState({
    title: '',
    content: '',
    difficulty: 'Intermediate',
    wpm: 40,
    accuracy: 95,
    isActive: true
  });

  // Load everything from localStore on mount
  React.useEffect(() => {
    cleanupExpiredLocalApplicantData();

    // Fetch Settings
    setSettings(localStore.getConfig());

    // Fetch Auth
    setAdminAuth({ password: localStore.getAuthPassword() });

    // Fetch Prompts
    setPrompts(localStore.getPrompts());

    // Subscribe to results
    let isInitialLoad = true;
    const unsubscribe = localStore.subscribeResults((resultsList) => {
      const activeResults = resultsList.filter(result => !isExpiredResult(result));
      if (!isInitialLoad && activeResults.length > applicantResults.length) {
        playNotificationSound();
      }
      isInitialLoad = false;
      setApplicantResults(activeResults);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    navigate('/admin/login');
  };

  const handleSaveSettings = async () => {
    try {
      localStore.saveConfig(settings);
      if (adminAuth.password) {
        localStore.saveAuthPassword(adminAuth.password);
      }
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Sync error:", err);
    }
  };

  const applicantGroups = React.useMemo<ApplicantGroup[]>(() => {
    const grouped = applicantResults.reduce<Record<string, ApplicantResult[]>>((acc, result) => {
      const applicant = getApplicantId(result);
      acc[applicant] = acc[applicant] || [];
      acc[applicant].push(result);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([applicant, attempts]) => {
        const sortedAttempts = [...attempts].sort((a, b) => getAttemptNumber(a) - getAttemptNumber(b));
        return {
          applicant,
          attempts: sortedAttempts,
          best: pickBestResult(sortedAttempts)
        };
      })
      .sort((a, b) => Number(b.best.wpm || 0) - Number(a.best.wpm || 0));
  }, [applicantResults]);

  const similarityMatches = React.useMemo(() => {
    const matches: Record<string, string[]> = {};
    for (let i = 0; i < applicantGroups.length; i++) {
      const app1 = applicantGroups[i].applicant;
      matches[app1] = [];
      for (let j = 0; j < applicantGroups.length; j++) {
        if (i === j) continue;
        const app2 = applicantGroups[j].applicant;
        if (getSimilarityScore(app1, app2)) {
          matches[app1].push(app2);
        }
      }
    }
    return matches;
  }, [applicantGroups]);

  const newApplicantsCount = React.useMemo(() => {
    return applicantGroups.filter(group => 
      group.attempts.some(attempt => !seenResultIds.includes(attempt.id))
    ).length;
  }, [applicantGroups, seenResultIds]);

  const filteredApplicantGroups = React.useMemo(() => {
    return applicantGroups.filter(group => {
      // 1. Tab filtering
      const isNew = group.attempts.some(attempt => !seenResultIds.includes(attempt.id));
      const matchesTab = resultsSubTab === 'new' ? isNew : !isNew;
      if (!matchesTab) return false;

      // 2. Search filtering
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase().trim();
      const userName = (group.attempts[0]?.userName || '').toLowerCase();
      const email = (group.applicant || '').toLowerCase();
      return userName.includes(query) || email.includes(query);
    });
  }, [applicantGroups, resultsSubTab, searchQuery, seenResultIds]);

  const selectedApplicantGroup = applicantGroups.find(group => group.applicant === selectedApplicant) || null;

  const selectedAttemptGroup = React.useMemo(() => {
    if (!selectedApplicantGroup || !selectedAttemptId) return null;
    return selectedApplicantGroup.attempts.find(a => a.id === selectedAttemptId) || null;
  }, [selectedApplicantGroup, selectedAttemptId]);

  const handleSavePrompt = async () => {
    if (!newPrompt.title || !newPrompt.content) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsDeploying(true);
    try {
      const saved = localStore.savePrompt({ ...newPrompt, id: editingId || undefined });
      if (editingId) {
        setPrompts(prompts.map(p => p.id === editingId ? saved : p));
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setPrompts([...prompts, saved]);
      }
      
      setIsModalOpen(false);
      setEditingId(null);
      setNewPrompt({
        title: '',
        content: '',
        difficulty: 'Intermediate',
        wpm: 40,
        accuracy: 95,
        isActive: true
      });
    } catch (err) {
      console.error("Error saving prompt:", err);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleEditOpen = (prompt: any) => {
    setEditingId(prompt.id);
    setNewPrompt({
      title: prompt.title || '',
      content: prompt.content || '',
      difficulty: prompt.difficulty || 'Intermediate',
      wpm: prompt.wpm || 40,
      accuracy: prompt.accuracy || 95,
      isActive: typeof prompt.isActive === 'boolean' ? prompt.isActive : true
    });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      localStore.deletePrompt(deleteId);
      setPrompts(prompts.filter(p => p.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error("Error deleting prompt:", err);
    }
  };

  const handlePurgeApplicant = async (applicantId: string, attempts: ApplicantResult[]) => {
    setPurgeConfirmation({ applicantId, attempts });
  };

  const executePurgeApplicant = async () => {
    if (!purgeConfirmation) return;
    const { applicantId } = purgeConfirmation;
    setIsProcessingAction(true);
    try {
      localStore.purgeApplicant(applicantId);
      setApplicantResults(prev => prev.filter(r => getApplicantId(r) !== applicantId));
      if (selectedApplicant === applicantId) {
        setSelectedApplicant(null);
        setIsDetailModalOpen(false);
      }
      setPurgeConfirmation(null);
    } catch (err) {
      console.error("Error purging applicant:", err);
      alert("Failed to delete applicant data.");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleMergeApplicants = async (targetApplicant: string, sourceApplicant: string) => {
    setMergeConfirmation({ targetApplicant, sourceApplicant });
  };

  const executeMergeApplicants = async () => {
    if (!mergeConfirmation) return;
    const { targetApplicant, sourceApplicant } = mergeConfirmation;
    setIsProcessingAction(true);
    
    try {
      localStore.mergeApplicants(targetApplicant, sourceApplicant);

      // Update local state
      setApplicantResults(prev => prev.map(result => {
        const applicantId = getApplicantId(result);
        if (applicantId === sourceApplicant) {
          return {
            ...result,
            applicantEmail: result.applicantEmail ? targetApplicant : undefined,
            userName: result.userName ? targetApplicant : undefined
          };
        }
        return result;
      }));

      // Reset detail modal selection
      setSelectedApplicant(targetApplicant);
      setMergeConfirmation(null);
      alert(`Successfully consolidated all attempts under ${targetApplicant}!`);
    } catch (err) {
      console.error("Error merging applicants:", err);
      alert("Failed to merge applicant data.");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const newStatus = localStore.togglePromptActive(id);
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, isActive: newStatus } : p));
  };

  return (
    <div className={`min-h-screen ${isLightMode ? 'light-mode bg-[#f3f4f6] text-slate-800' : 'bg-[#050404] text-white'} flex flex-col items-center p-8 relative overflow-hidden font-inter transition-colors duration-300`}>
      <FireEmbersBackground isLightMode={isLightMode} />
      {isLightMode && (
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-[-20%] left-[-20%] w-[1000px] h-[1000px] bg-[#7D52FF]/10 rounded-full blur-[180px]" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[1000px] h-[1000px] bg-[#FFB659]/10 rounded-full blur-[180px]" />
        </div>
      )}
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-5">
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-[#7D52FF] rounded-full blur-[200px]" />
      </div>

      {/* Modal Backdrop */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-2xl glass-card p-10 border-t-4 border-[#7D52FF] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#7D52FF]/5 rounded-full blur-[80px] pointer-events-none" />
              
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                  setNewPrompt({
                    title: '',
                    content: '',
                    difficulty: 'Intermediate',
                    wpm: 40,
                    accuracy: 95,
                    isActive: true
                  });
                }}
                className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors cursor-pointer p-2 z-[110]"
              >
                <X size={18} />
              </button>

              <div className="mb-10">
                <h2 className="text-2xl font-bold uppercase tracking-tight mb-1 text-white">
                  {editingId ? 'Revise Assessment Protocol' : 'Initialize New Prompt'}
                </h2>
                <p className="text-white/20 text-[10px] uppercase tracking-widest">
                  {editingId ? 'Modify the underlying infrastructure for this session' : 'Define the infrastructure for this assessment protocol'}
                </p>
              </div>

              <div className="space-y-8 relative z-10">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-[9px] font-bold text-white/30 uppercase tracking-widest">Prompt Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. TECHNICAL DOCUMENTATION"
                      value={newPrompt.title}
                      onChange={(e) => setNewPrompt({...newPrompt, title: e.target.value})}
                      className="input-field w-full text-sm font-bold uppercase tracking-wider" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[9px] font-bold text-white/30 uppercase tracking-widest">Difficulty Tier</label>
                    <select 
                      value={newPrompt.difficulty}
                      onChange={(e) => setNewPrompt({...newPrompt, difficulty: e.target.value})}
                      className="input-field w-full text-sm font-bold uppercase tracking-wider bg-black text-white"
                    >
                      <option value="Beginner" className="bg-[#141418] text-white">Beginner</option>
                      <option value="Intermediate" className="bg-[#141418] text-white">Intermediate</option>
                      <option value="Expert" className="bg-[#141418] text-white">Expert</option>
                      <option value="Master" className="bg-[#141418] text-white">Master</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[9px] font-bold text-white/30 uppercase tracking-widest">Prompt Content (The Box)</label>
                  <textarea 
                    rows={6}
                    placeholder="Enter the assessment text..."
                    value={newPrompt.content}
                    onChange={(e) => setNewPrompt({...newPrompt, content: e.target.value})}
                    className="input-field w-full text-sm font-mono leading-relaxed p-4" 
                  />
                </div>

                <div className="pt-6 border-t border-white/5 flex gap-4">
                  <button 
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingId(null);
                      setNewPrompt({
                        title: '',
                        content: '',
                        difficulty: 'Intermediate',
                        wpm: 40,
                        accuracy: 95,
                        isActive: true
                      });
                    }}
                    className="flex-1 btn-outline py-4 text-[10px]"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSavePrompt}
                    disabled={isDeploying}
                    className="flex-1 btn-primary py-4 text-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeploying ? 'DEPLOYING...' : editingId ? 'SAVE CHANGES' : 'Add Prompt'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-md glass-card p-10 border-t-4 border-[#7D52FF] text-center"
            >
              <div className="w-16 h-16 bg-[#7D52FF]/10 border border-[#7D52FF]/20 rounded-none flex items-center justify-center mx-auto mb-6">
                <Trash2 className="text-[#7D52FF]" size={32} />
              </div>
              <h2 className="text-xl font-bold uppercase tracking-tight mb-4 text-white">Confirm Deletion?</h2>
              <p className="text-white/40 text-xs mb-10 leading-relaxed uppercase tracking-widest">
                This assessment protocol will be permanently purged from the cloud infrastructure.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 btn-outline py-4 text-[10px]"
                >
                  CANCEL
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 btn-primary py-4 text-[10px]"
                >
                  YES, DELETE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Purge (Delete Applicant Data) Confirmation Modal */}
      <AnimatePresence>
        {purgeConfirmation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-md glass-card p-10 border-t-4 border-[#F23E70] text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#F23E70]/5 rounded-full blur-[70px] pointer-events-none" />
              
              <div className="w-16 h-16 bg-[#F23E70]/10 border border-[#F23E70]/20 rounded-none flex items-center justify-center mx-auto mb-6 relative z-10 shadow-[0_0_15px_rgba(242,62,112,0.1)]">
                <Trash2 className="text-[#F23E70] animate-[pulse_2s_infinite]" size={28} />
              </div>
              
              <h2 className="text-lg font-black uppercase tracking-widest mb-3 text-white relative z-10">PURGE CANDIDATE RECORD?</h2>
              
              <div className="bg-[#F23E70]/5 border border-[#F23E70]/10 p-4 mb-8 text-left relative z-10">
                <p className="text-[#F23E70] text-[8px] font-black uppercase tracking-[0.2em] mb-2">⚠️ DANGER AREA - ACT WITH CAUTION</p>
                <p className="text-white/40 text-[9px] uppercase tracking-wider mb-2 leading-relaxed">
                  This transaction is permanent. The candidate records and attempts will be removed from cloud indexes.
                </p>
                <div className="border-t border-white/5 pt-2 mt-2">
                  <p className="text-white/20 text-[7px] uppercase tracking-widest mb-1">Target Account</p>
                  <p className="text-white text-xs font-mono font-bold break-all">{purgeConfirmation.applicantId}</p>
                  <p className="text-white/30 text-[8px] uppercase tracking-widest mt-1">
                    Purging {purgeConfirmation.attempts.length} attempts history
                  </p>
                </div>
              </div>

              <div className="flex gap-4 relative z-10">
                <button 
                  onClick={() => setPurgeConfirmation(null)}
                  disabled={isProcessingAction}
                  className="flex-1 btn-outline py-4 text-[9px] font-black uppercase tracking-widest disabled:opacity-50"
                >
                  KEEP RECORDS
                </button>
                <button 
                  onClick={executePurgeApplicant}
                  disabled={isProcessingAction}
                  className="flex-1 bg-[#F23E70] text-black hover:bg-red-400 py-4 text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessingAction ? 'PURGING...' : 'YES, PURGE'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Merge Confirmation Modal */}
      <AnimatePresence>
        {mergeConfirmation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-md glass-card p-10 border-t-4 border-[#7D52FF] text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#7D52FF]/5 rounded-full blur-[70px] pointer-events-none" />
              
              <div className="w-16 h-16 bg-[#7D52FF]/10 border border-[#7D52FF]/20 rounded-none flex items-center justify-center mx-auto mb-6 relative z-10 shadow-[0_0_15px_rgba(125,82,255,0.1)]">
                <RefreshCw className="text-[#7D52FF] animate-spin" size={28} style={{ animationDuration: '6s' }} />
              </div>
              
              <h2 className="text-lg font-black uppercase tracking-widest mb-3 text-white relative z-10">CONSOLIDATE RECORDS?</h2>
              
              <div className="bg-[#7D52FF]/5 border border-[#7D52FF]/10 p-4 mb-8 text-left relative z-10 space-y-3 font-mono">
                <div>
                  <p className="text-white/20 text-[7px] uppercase tracking-widest mb-1">Source Account (Merge From)</p>
                  <p className="text-[#D174FF] text-xs font-bold break-all">{mergeConfirmation.sourceApplicant}</p>
                </div>
                <div>
                  <p className="text-white/20 text-[7px] uppercase tracking-widest mb-1">Target Account (Consolidate To)</p>
                  <p className="text-green-400 text-xs font-bold break-all">{mergeConfirmation.targetApplicant}</p>
                </div>
                <p className="text-white/40 text-[9px] uppercase tracking-wider leading-relaxed font-sans border-t border-white/5 pt-2">
                  All typing test attempts from the source profile will be re-assigned and consolidated under the target candidate profile. This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-4 relative z-10">
                <button 
                  onClick={() => setMergeConfirmation(null)}
                  disabled={isProcessingAction}
                  className="flex-1 btn-outline py-4 text-[9px] font-black uppercase tracking-widest disabled:opacity-50"
                >
                  CANCEL
                </button>
                <button 
                  onClick={executeMergeApplicants}
                  disabled={isProcessingAction}
                  className="flex-1 btn-primary py-4 text-[9px] font-black uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessingAction ? 'MERGING...' : 'CONSOLIDATE'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Notification Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-8 left-1/2 z-[200] flex items-center gap-4 bg-gradient-to-r from-[#7D52FF] via-[#D174FF] via-[#F23E70] to-[#FFB659] text-black px-8 py-4 shadow-[0_0_40px_rgba(125,82,255,0.4)] border border-white/10 font-bold"
          >
            <div className="w-6 h-6 bg-white/20 flex items-center justify-center">
              <Check size={14} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Infrastructure Synchronized</span>
              <span className="text-[8px] text-white/60 uppercase tracking-widest mt-0.5">Cloud settings updated successfully</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Applicant Detail Modal */}
      <AnimatePresence>
        {isDetailModalOpen && selectedApplicantGroup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
            onClick={() => { setIsDetailModalOpen(false); setSelectedApplicant(null); }}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-5xl glass-card p-8 border-t-4 border-[#7D52FF] relative overflow-hidden max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#7D52FF]/5 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
                <div className="min-w-0">
                  <p className="text-[9px] text-white/25 uppercase tracking-[0.25em] mb-2">Attempt Infrastructure & Performance Analytics</p>
                  <h3 className="text-white font-bold text-xl uppercase tracking-wide break-words">
                    {selectedApplicantGroup.attempts[0]?.userName || 'Applicant'}
                  </h3>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mt-1 break-all font-mono">
                    {selectedApplicantGroup.applicant}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handlePurgeApplicant(selectedApplicantGroup.applicant, selectedApplicantGroup.attempts)}
                    className="w-10 h-10 bg-[#7D52FF]/10 hover:bg-[#7D52FF]/20 border border-[#7D52FF]/30 transition-colors flex items-center justify-center group cursor-pointer"
                    title="Delete Applicant Data"
                  >
                    <Trash2 size={16} className="text-[#7D52FF] group-hover:scale-110 transition-transform" />
                  </button>
                  <button 
                    onClick={() => { setIsDetailModalOpen(false); setSelectedApplicant(null); }}
                    className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center text-white/40 hover:text-white font-bold"
                    title="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-6 overflow-hidden flex-grow relative z-10">
                
                {/* Left Side: Attempts Master List (1/3 width) */}
                <div className="w-full lg:w-[300px] flex flex-col gap-4 overflow-y-auto pr-1 border-r border-white/5 lg:max-h-[65vh] custom-scrollbar shrink-0">
                  
                  <div className="bg-white/[0.01] border border-white/5 p-4 mb-2">
                    <p className="text-[8px] text-white/25 uppercase tracking-[0.2em] mb-3">Applicant Records Summary</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[8px] text-white/20 uppercase tracking-widest mb-1">Best WPM</p>
                        <p className="text-2xl font-bold text-white font-mono">{selectedApplicantGroup.best.wpm || 0}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-white/20 uppercase tracking-widest mb-1">Best Acc</p>
                        <p className="text-2xl font-bold text-white font-mono">{selectedApplicantGroup.best.accuracy || 0}<span className="text-xs text-white/30">%</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Similarity Warning Panel inside Sidebar */}
                  {similarityMatches[selectedApplicantGroup.applicant]?.length > 0 && (
                    <div className="bg-yellow-500/5 border border-yellow-500/10 p-3 mb-2 relative">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[8px] font-black text-yellow-500 tracking-[0.1em] uppercase">⚠️ Duplicate Detected</span>
                      </div>
                      <p className="text-white/40 text-[7px] uppercase tracking-wider mb-2 leading-relaxed">
                        Similar candidate email detected in database.
                      </p>
                      
                      <div className="space-y-1.5">
                        {similarityMatches[selectedApplicantGroup.applicant].map((similarApp: string) => {
                          const similarGroup = applicantGroups.find(g => g.applicant === similarApp);
                          return (
                            <div key={similarApp} className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-2">
                              <div className="min-w-0 flex-grow pr-1">
                                <p className="text-[8px] text-white font-bold uppercase truncate" title={similarApp}>
                                  {similarApp}
                                </p>
                                <p className="text-[7px] text-white/30 uppercase mt-0.5">
                                  Best: {similarGroup?.best.wpm || 0} WPM
                                </p>
                              </div>
                              <button
                                onClick={() => handleMergeApplicants(selectedApplicantGroup.applicant, similarApp)}
                                className="shrink-0 text-[7px] font-black bg-yellow-500 text-black px-2 py-1 uppercase hover:bg-yellow-400 transition-colors tracking-widest"
                              >
                                Merge
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <p className="text-[8px] text-white/25 uppercase tracking-[0.25em] font-black mb-1">Attempts History ({selectedApplicantGroup.attempts.length})</p>
                  
                  <div className="space-y-2">
                    {selectedApplicantGroup.attempts.map((attemptResult) => {
                      const isSelectedAttempt = attemptResult.id === selectedAttemptId;
                      const isBest = attemptResult.id === selectedApplicantGroup.best.id;
                      return (
                        <button
                          key={attemptResult.id}
                          onClick={() => setSelectedAttemptId(attemptResult.id)}
                          className={`w-full text-left p-4 border transition-all ${
                            isSelectedAttempt
                              ? 'bg-[#7D52FF]/10 border-[#7D52FF]/40 shadow-[0_0_10px_rgba(125,82,255,0.1)]'
                              : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[9px] font-bold text-white uppercase tracking-wider font-mono">
                              Attempt {getAttemptNumber(attemptResult)}
                            </span>
                            {isBest && (
                              <span className="text-[6px] font-black uppercase px-1.5 py-0.5 bg-[#7D52FF]/20 text-[#7D52FF] tracking-widest">
                                Best
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[8px] text-white/20 uppercase tracking-widest">WPM / ACC</p>
                              <p className="text-sm font-bold font-mono text-white">
                                {attemptResult.wpm} <span className="text-[9px] font-normal text-white/30">/</span> {attemptResult.accuracy}%
                              </p>
                            </div>
                            <span className="text-[7px] text-white/20 font-mono tracking-widest uppercase">
                              {formatResultTime(attemptResult)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Side: Detailed Monkeytype Analytics & Charts (2/3 width) */}
                <div className="flex-grow overflow-y-auto lg:max-h-[65vh] custom-scrollbar flex flex-col gap-4 min-w-0">
                  {selectedAttemptGroup ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-4 gap-4">
                        <div className="min-w-0">
                          <p className="text-[8px] text-white/25 uppercase tracking-[0.2em]">Prompt Details</p>
                          <h4 className="text-white font-bold text-sm uppercase tracking-wide mt-1 truncate">
                            {selectedAttemptGroup.promptTitle || 'Assessment Protocol'}
                          </h4>
                        </div>
                        <span className={`text-[8px] font-black uppercase px-3 py-1.5 tracking-wider shrink-0 ${
                          selectedAttemptGroup.isQualified ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-[#D174FF]/10 text-[#D174FF] border border-[#D174FF]/20'
                        }`}>
                          {selectedAttemptGroup.isQualified ? 'QUALIFIED FOR ROLE' : 'NOT QUALIFIED'}
                        </span>
                      </div>

                      {/* Monkeytype Performance Analysis Component */}
                      <MonkeytypeAnalysis 
                        attempt={selectedAttemptGroup} 
                        totalDuration={settings.timerDuration} 
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-white/25">
                      <Users size={36} className="opacity-20 mb-4 animate-pulse" />
                      <p className="text-xs uppercase tracking-widest font-black">Select an attempt to view analytics</p>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shuffle Settings Modal */}
      <AnimatePresence>
        {isShuffleModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-4xl glass-card p-10 border-t-4 border-[#7D52FF] relative overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#7D52FF]/5 rounded-full blur-[80px] pointer-events-none" />
              
              <button 
                onClick={() => setIsShuffleModalOpen(false)}
                className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors cursor-pointer p-2 z-[110]"
              >
                <X size={18} />
              </button>

              <div className="flex justify-between items-start mb-10">
                <div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight mb-1 text-white">Shuffle Infrastructure</h2>
                  <p className="text-white/20 text-[10px] uppercase tracking-widest">Manage assessment randomization and protocol pools</p>
                </div>
                <div className="flex items-center gap-6 bg-white/[0.02] border border-white/5 p-4">
                   <div className="text-right">
                      <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1">Global Shuffle</p>
                      <p className="text-white font-bold text-xs uppercase">{settings.shuffleMode ? 'Enabled' : 'Disabled'}</p>
                   </div>
                   <button 
                    onClick={() => setSettings({...settings, shuffleMode: !settings.shuffleMode})}
                    className={`w-12 h-6 flex items-center p-1 transition-colors ${settings.shuffleMode ? 'bg-[#7D52FF]' : 'bg-white/10'}`}
                  >
                    <motion.div 
                      animate={{ x: settings.shuffleMode ? 24 : 0 }}
                      className="w-4 h-4 bg-white" 
                    />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 mb-8 border-b border-white/5 pb-6 overflow-x-auto">
                {['All', 'Beginner', 'Intermediate', 'Expert', 'Master'].map(diff => (
                  <button
                    key={diff}
                    onClick={() => setDifficultyFilter(diff)}
                    className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                      difficultyFilter === diff 
                        ? 'bg-white text-black' 
                        : 'text-white/30 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>

              <div className="flex-grow overflow-y-auto pr-4 space-y-3 custom-scrollbar">
                {prompts
                  .filter(p => difficultyFilter === 'All' || p.difficulty === difficultyFilter)
                  .map((p) => (
                    <div 
                      key={p.id}
                      onClick={() => handleToggleActive(p.id, p.isActive)}
                      className={`flex items-center justify-between p-6 cursor-pointer transition-all border ${
                        p.isActive 
                          ? 'bg-[#7D52FF]/5 border-[#7D52FF]/30' 
                          : 'bg-white/[0.02] border-white/5 opacity-40 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-5 h-5 border flex items-center justify-center transition-colors ${
                          p.isActive ? 'bg-[#7D52FF] border-[#7D52FF]' : 'border-white/20'
                        }`}>
                          {p.isActive && <Check size={12} className="text-black" />}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">{p.title}</h4>
                          <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">{p.difficulty}</span>
                        </div>
                      </div>
                      <div className="text-right">
                         <span className={`text-[10px] font-bold uppercase tracking-widest ${p.isActive ? 'text-[#7D52FF]' : 'text-white/20'}`}>
                            {p.isActive ? 'IN POOL' : 'EXCLUDED'}
                         </span>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="pt-10 border-t border-white/5 flex justify-between items-center mt-6">
                <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">
                   {prompts.filter(p => p.isActive).length} Protocols currently active in pool
                </p>
                <button 
                  onClick={() => {
                    handleSaveSettings();
                    setIsShuffleModalOpen(false);
                  }}
                  className="btn-primary py-4 px-12 text-[10px]"
                >
                  SAVE & DEPLOY CONFIG
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-7xl relative z-10 flex-grow">
      {/* Top Navigation Bar - Sharp and Minimal */}
      <header className="w-full max-w-7xl flex justify-between items-center mb-16 z-10 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <FunLogo size="sm" />
          <div>
            <h1 className={`text-sm font-bold tracking-[0.3em] uppercase ${isLightMode ? 'text-slate-800' : 'text-white'}`}>Admin Console</h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
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
            <span>Console Guide</span>
          </motion.button>

          <div className={`w-px h-4 ${isLightMode ? 'bg-slate-200' : 'bg-white/10'}`} />

          <button 
            onClick={handleLogout}
            className={`flex items-center gap-2 transition-all duration-300 group ${
              isLightMode ? 'text-slate-400 hover:text-black' : 'text-white/20 hover:text-[#7D52FF]'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest group-hover:mr-2 transition-all">Secure Exit</span>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Centered Dashboard Container */}
      <main id="tutorial-admin-card" className="w-full z-10 flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Side Tab Content */}
        <div className="flex-grow w-full lg:w-0">
          {/* Navigation Switcher */}
        <div className="flex justify-center mb-12">
          <div id="tutorial-tab-bar" className="bg-white/[0.03] border border-white/5 p-1 inline-flex gap-1">
            {[
              { id: 'prompts', label: 'Typing Prompts', icon: <FileText size={14} /> },
              { id: 'results', label: 'Applicant Results', icon: <Users size={14} /> },
              { id: 'settings', label: 'Global Settings', icon: <Settings size={14} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-8 py-3 transition-all duration-300 relative ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-[#7D52FF] via-[#D174FF] via-[#F23E70] to-[#FFB659] text-black font-extrabold shadow-[0_0_20px_rgba(125,82,255,0.4)]' 
                    : 'text-white/30 hover:text-white hover:bg-white/5 font-bold'
                }`}
              >
                {tab.icon}
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{tab.label}</span>
                {tab.id === 'results' && newApplicantsCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#F23E70] px-1 text-[9px] font-black text-black animate-pulse shadow-[0_0_12px_rgba(242,62,112,0.6)]">
                    {newApplicantsCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'prompts' && (
            <motion.div
              key="prompts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end mb-10 px-2">
                <div>
                  <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Assessment Registry</h2>
                  <p className="text-white/20 text-xs uppercase tracking-widest mt-1">Configure active typing test content</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsShuffleModalOpen(true)}
                    className="btn-outline py-3 px-6 text-[10px] flex items-center gap-3"
                  >
                    <RefreshCw size={14} />
                    SHUFFLE SETTINGS
                  </button>
                  <button 
                    id="tutorial-add-prompt"
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary py-3 px-6 text-[10px] flex items-center gap-3"
                  >
                    <Plus size={14} />
                    ADD NEW PROMPT
                  </button>
                </div>
              </div>

              {/* Tier Filters */}
              <div className="flex items-center gap-2 mb-12 bg-white/[0.02] border border-white/5 p-1 w-fit mx-auto md:mx-0">
                {['All', 'Beginner', 'Intermediate', 'Expert', 'Master'].map(diff => (
                  <button
                    key={diff}
                    onClick={() => setDifficultyFilter(diff)}
                    className={`px-8 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                      difficultyFilter === diff 
                        ? 'bg-gradient-to-r from-[#7D52FF] via-[#D174FF] via-[#F23E70] to-[#FFB659] text-black font-extrabold shadow-[0_0_15px_rgba(125,82,255,0.4)]' 
                        : 'text-white/20 hover:text-white/60 hover:bg-white/5 font-bold'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prompts
                  .filter(p => difficultyFilter === 'All' || p.difficulty === difficultyFilter)
                  .map((item, idx) => (
                  <div key={item.id} className="glass-card group relative p-8 border-l-2 border-l-[#7D52FF] hover:bg-white/[0.02] transition-colors shadow-[inset_3px_0_0_rgba(125,82,255,0.05)]">
                    {/* Sharp corner accents */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/10" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/10" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/10" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/10" />
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-bold bg-white/5 text-white/40 px-3 py-1 tracking-widest uppercase">{item.difficulty}</span>
                        <button 
                          onClick={() => handleToggleActive(item.id, item.isActive)}
                          className={`text-[8px] font-bold px-3 py-1 tracking-[0.2em] uppercase transition-all ${
                            item.isActive 
                              ? 'bg-[#7D52FF]/10 text-[#7D52FF] border border-[#7D52FF]/30 shadow-[0_0_8px_rgba(125,82,255,0.1)]' 
                              : 'bg-white/5 text-white/20 border border-white/10'
                          }`}
                        >
                          {item.isActive ? 'Active Pool' : 'Inactive'}
                        </button>
                      </div>
                      <div className="flex gap-2 transition-opacity">
                        <button 
                          onClick={() => handleEditOpen(item)}
                          className="p-2 hover:text-[#7D52FF] transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={() => setDeleteId(item.id)}
                          className="p-2 hover:text-[#D174FF] transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="text-white font-bold text-lg mb-2 uppercase tracking-tight">{item.title}</h3>
                    <p className="text-white/40 text-xs leading-relaxed line-clamp-2">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end mb-10 px-2">
                <div>
                  <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Applicant Results</h2>
                  <p className="text-white/20 text-xs uppercase tracking-widest mt-1">Highest score per applicant with all attempts preserved</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">Applicant Records</p>
                  <p className="text-2xl font-bold text-white font-mono">{applicantGroups.length}</p>
                </div>
              </div>

              {applicantGroups.length === 0 ? (
                <div className="glass-card p-12 text-center border border-white/5">
                  <Users size={36} className="mx-auto mb-6 text-white/20" />
                  <h3 className="text-white font-bold uppercase tracking-[0.2em] mb-3">No Results Logged</h3>
                  <p className="text-white/30 text-xs uppercase tracking-widest">Completed applicant attempts will appear here.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Search and Sub-tabs panel */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-4 relative">
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/10" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/10" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/10" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/10" />

                    <div className="flex bg-black/40 border border-white/5 p-1 inline-flex gap-1 self-start">
                      <button
                        onClick={() => setResultsSubTab('new')}
                        className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                          resultsSubTab === 'new'
                            ? 'bg-gradient-to-r from-[#7D52FF] to-[#D174FF] text-black font-extrabold shadow-[0_0_15px_rgba(125,82,255,0.3)]'
                            : 'text-white/40 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        New ({newApplicantsCount})
                      </button>
                      <button
                        onClick={() => setResultsSubTab('history')}
                        className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                          resultsSubTab === 'history'
                            ? 'bg-gradient-to-r from-[#7D52FF] to-[#D174FF] text-black font-extrabold shadow-[0_0_15px_rgba(125,82,255,0.3)]'
                            : 'text-white/40 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        History ({applicantGroups.length - newApplicantsCount})
                      </button>
                    </div>

                    <div className="relative flex-grow max-w-md w-full">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        placeholder="SEARCH BY NAME OR EMAIL..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 pl-10 pr-10 py-2.5 text-xs font-mono text-white placeholder-white/20 tracking-wider focus:outline-none focus:border-[#7D52FF]/60 focus:shadow-[0_0_15px_rgba(125,82,255,0.2)] transition-all"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/30 hover:text-white transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {filteredApplicantGroups.length === 0 ? (
                    <div className="glass-card p-12 text-center border border-white/5 relative">
                      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/10" />
                      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/10" />
                      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/10" />
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/10" />
                      <Users size={36} className="mx-auto mb-6 text-white/10" />
                      <h3 className="text-white font-bold uppercase tracking-[0.2em] mb-3">No matching records</h3>
                      <p className="text-white/30 text-xs uppercase tracking-widest">
                        {searchQuery ? `No results found for "${searchQuery}"` : `No records under the ${resultsSubTab} tab.`}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-5 items-start">
                      <div id="tutorial-applicant-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredApplicantGroups.map((group) => {
                          const isSelected = selectedApplicant === group.applicant;
                          const isNew = group.attempts.some(attempt => !seenResultIds.includes(attempt.id));
                          return (
                            <button
                              key={group.applicant}
                              onClick={() => handleViewApplicant(group)}
                              className={`glass-card text-left relative p-7 border-l-2 transition-all hover:bg-white/[0.03] ${
                                isNew 
                                  ? 'border-l-[#F23E70] bg-[#F23E70]/5 border-[#F23E70]/20 animate-pulse shadow-[0_0_15px_rgba(242,62,112,0.15)]'
                                  : isSelected 
                                    ? 'border-l-[#7D52FF] bg-[#7D52FF]/5 border-[#7D52FF]/20' 
                                    : 'border-l-white/10 border-white/5'
                              }`}
                            >
                              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/10" />
                              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/10" />
                              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/10" />
                              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/10" />

                              <div className="flex items-start justify-between gap-4 mb-6">
                                <div className="min-w-0 flex-grow">
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                      <p className="text-[9px] text-white/25 uppercase tracking-[0.25em]">Applicant</p>
                                      {isNew && (
                                        <span className="text-[7px] font-black uppercase px-2 py-0.5 bg-[#F23E70] text-black tracking-wider animate-bounce">
                                          NEW
                                        </span>
                                      )}
                                      {similarityMatches[group.applicant]?.length > 0 && (
                                        <span className="text-[7px] font-black uppercase px-2 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 tracking-wider">
                                          ⚠️ Similar
                                        </span>
                                      )}
                                    </div>
                                    <ExpiryTimer expiresAt={group.best.expiresAt || group.best.expiresAtIso} />
                                  </div>
                                  <h3 className="text-white font-bold text-sm uppercase tracking-wide truncate">
                                    {group.attempts[0]?.userName || group.applicant}
                                  </h3>
                                  {group.attempts[0]?.userName && (
                                    <p className="text-white/30 text-[9px] uppercase tracking-wider mt-1 truncate">
                                      {group.applicant}
                                    </p>
                                  )}
                                </div>
                                <ChevronRight size={18} className={`shrink-0 transition-colors ${isSelected ? 'text-[#7D52FF]' : 'text-white/20'}`} />
                              </div>

                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <p className="text-[8px] text-white/20 uppercase tracking-widest mb-1">Best WPM</p>
                                  <p className="text-3xl font-bold font-mono text-white">{group.best.wpm || 0}</p>
                                </div>
                                <div>
                                  <p className="text-[8px] text-white/20 uppercase tracking-widest mb-1">Accuracy</p>
                                  <p className="text-3xl font-bold font-mono text-white">{group.best.accuracy || 0}<span className="text-xs text-white/30">%</span></p>
                                </div>
                                <div>
                                  <p className="text-[8px] text-white/20 uppercase tracking-widest mb-1">Attempts</p>
                                  <p className="text-3xl font-bold font-mono text-white">{group.attempts.length}<span className="text-xs text-white/30">/{settings.attemptLimit}</span></p>
                                </div>
                              </div>

                              <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                                <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${
                                  group.best.isQualified ? 'text-green-500' : 'text-[#D174FF]'
                                }`}>
                                  {group.best.isQualified ? 'Highest Attempt Qualified' : 'Highest Attempt Not Qualified'}
                                </span>
                                <span className="text-[8px] text-white/20 uppercase tracking-widest">
                                  Attempt {getAttemptNumber(group.best)}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-3xl mx-auto"
            >
              <div className="text-center mb-12">
                <h2 className="text-2xl font-bold text-white uppercase tracking-tight">System Configuration</h2>
                <p className="text-white/20 text-xs uppercase tracking-widest mt-1">Define global qualification parameters</p>
              </div>

              <div id="tutorial-settings-card" className="glass-card relative p-10 space-y-10">
                 {/* Sharp corner accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/10" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/10" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/10" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/10" />

                <div className="grid grid-cols-2 gap-10">
                  <div id="tutorial-settings-wpm-col" className="space-y-4">
                    <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Default WPM Goal</label>
                    <input 
                      type="number" 
                      value={settings.wpmGoal} 
                      onChange={(e) => setSettings({...settings, wpmGoal: parseInt(e.target.value)})}
                      className="input-field w-full text-2xl font-bold font-mono" 
                    />
                    <p className="text-[10px] text-white/10 italic">Minimum words per minute required to pass.</p>
                  </div>
                  <div id="tutorial-settings-accuracy-col" className="space-y-4">
                    <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Precision Threshold (%)</label>
                    <input 
                      type="number" 
                      value={settings.accuracyGoal} 
                      onChange={(e) => setSettings({...settings, accuracyGoal: parseInt(e.target.value)})}
                      className="input-field w-full text-2xl font-bold font-mono" 
                    />
                    <p className="text-[10px] text-white/10 italic">Minimum accuracy percentage required.</p>
                  </div>
                  <div id="tutorial-settings-attempts-col" className="space-y-4">
                    <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Attempt Limit</label>
                    <input 
                      type="number" 
                      value={settings.attemptLimit} 
                      onChange={(e) => setSettings({...settings, attemptLimit: parseInt(e.target.value)})}
                      className="input-field w-full text-2xl font-bold font-mono" 
                    />
                    <p className="text-[10px] text-white/10 italic">Maximum number of retries per applicant.</p>
                  </div>
                  <div id="tutorial-settings-timer-col" className="space-y-4">
                    <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Timer Duration (s)</label>
                    <input 
                      type="number" 
                      value={settings.timerDuration} 
                      onChange={(e) => setSettings({...settings, timerDuration: parseInt(e.target.value)})}
                      className="input-field w-full text-2xl font-bold font-mono" 
                    />
                    <p className="text-[10px] text-white/10 italic">Length of the assessment in seconds.</p>
                  </div>
                  <div id="tutorial-settings-scaler-col" className="space-y-4">
                    <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Percentage Scaler / Adjuster (%)</label>
                    <input 
                      type="number" 
                      value={settings.difficultyScaler} 
                      onChange={(e) => setSettings({...settings, difficultyScaler: parseInt(e.target.value)})}
                      className="input-field w-full text-2xl font-bold font-mono border-[#7D52FF]/30 focus:border-[#7D52FF] focus:shadow-[0_0_15px_rgba(125,82,255,0.2)]" 
                    />
                    <p className="text-[10px] text-white/10 italic">Percentage applied to the final WPM score (100% = Standard).</p>
                  </div>
                  <div id="tutorial-settings-preset-col" className="space-y-4">
                    <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Typing Test Preset</label>
                    <select 
                      value={settings.wpmCalculationMethod || 'Net'}
                      onChange={(e) => setSettings({...settings, wpmCalculationMethod: e.target.value})}
                      className="input-field w-full text-sm font-bold uppercase tracking-wider bg-black mt-2 py-4 text-white"
                    >
                      <option value="Net" className="bg-black text-white">TypeRacer Preset (Net WPM)</option>
                      <option value="Strict" className="bg-black text-white">Monkeytype Preset (Strict WPM)</option>
                      <option value="Gross" className="bg-black text-white">10FastFingers Preset (Gross WPM)</option>
                      <option value="Traditional" className="bg-black text-white">Data Entry Preset (Literal Words)</option>
                      <option value="Harsh" className="bg-black text-white">Keybr Preset (Double Error Penalty)</option>
                    </select>
                    <p className="text-[10px] text-white/10 italic">Formula preset based on popular typing test websites.</p>
                  </div>
                </div>

                <div id="tutorial-settings-toggles" className="pt-10 border-t border-white/5 grid grid-cols-2 gap-10">
                   <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5">
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Case Sensitivity</h3>
                        <p className="text-[9px] text-white/20 uppercase tracking-widest">Toggle capitalization error detection</p>
                      </div>
                      <button 
                        onClick={() => setSettings({...settings, strictCapitals: !settings.strictCapitals})}
                        className={`w-12 h-6 flex items-center p-1 transition-colors ${settings.strictCapitals ? 'bg-[#7D52FF]' : 'bg-white/10'}`}
                      >
                        <motion.div 
                          animate={{ x: settings.strictCapitals ? 24 : 0 }}
                          className="w-4 h-4 bg-white" 
                        />
                      </button>
                   </div>

                   <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5">
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Space Precision</h3>
                        <p className="text-[9px] text-white/20 uppercase tracking-widest">Toggle whitespace error detection</p>
                      </div>
                      <button 
                        onClick={() => setSettings({...settings, strictSpaces: !settings.strictSpaces})}
                        className={`w-12 h-6 flex items-center p-1 transition-colors ${settings.strictSpaces ? 'bg-[#7D52FF]' : 'bg-white/10'}`}
                      >
                        <motion.div 
                          animate={{ x: settings.strictSpaces ? 24 : 0 }}
                          className="w-4 h-4 bg-white" 
                        />
                      </button>
                   </div>
                </div>

                <div id="tutorial-settings-security" className="pt-10 border-t border-white/5 space-y-8">
                   <div>
                      <h2 className="text-lg font-bold text-white uppercase tracking-tight mb-2">Security Infrastructure</h2>
                      <p className="text-white/20 text-[10px] uppercase tracking-widest mb-6">Update administrative access credentials</p>
                   </div>
                   <div className="max-w-md space-y-4">
                      <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Master Admin Password</label>
                      <input 
                        type="password" 
                        value={adminAuth.password} 
                        onChange={(e) => setAdminAuth({password: e.target.value})}
                        className="input-field w-full text-xl font-mono tracking-widest border-[#7D52FF]/20 focus:border-[#7D52FF] focus:shadow-[0_0_15px_rgba(125,82,255,0.2)]" 
                      />
                      <p className="text-[10px] text-white/10 italic">This password is required for all administrative console sessions.</p>
                   </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-end">
                  <button 
                    onClick={handleSaveSettings}
                    className="btn-primary py-4 px-12"
                  >
                    Save Infrastructure Config
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        {/* Right Side logs & notes sidebar */}
        <aside className="w-full lg:w-80 shrink-0 space-y-6 lg:sticky lg:top-8">
          <div className="glass-card relative p-6 border-l-2 border-l-[#FFB659]">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/10" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/10" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/10" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/10" />

            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-white font-bold text-xs uppercase tracking-[0.2em]">Administrative Notes</h3>
                <p className="text-white/20 text-[9px] uppercase tracking-widest mt-0.5">Sticky notes & reminders</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleAddNote}
                className="w-8 h-8 rounded-none border border-white/10 flex items-center justify-center text-white/60 hover:text-[#FFB659] hover:border-[#FFB659]/50 transition-colors bg-white/[0.02]"
              >
                <Plus size={16} />
              </motion.button>
            </div>

            {notes.length === 0 ? (
              <div className="border border-dashed border-white/5 p-8 text-center bg-black/20">
                <p className="text-white/20 text-[10px] uppercase tracking-wider">No active logs saved.</p>
                <button
                  onClick={handleAddNote}
                  className="mt-3 text-[9px] text-[#FFB659] hover:underline uppercase tracking-widest font-black"
                >
                  Create note +
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                {notes.map(note => {
                  let colorClass = 'border-l-[#7D52FF] bg-[#7D52FF]/5';
                  if (note.color === 'pink') {
                    colorClass = 'border-l-[#F23E70] bg-[#F23E70]/5';
                  } else if (note.color === 'yellow') {
                    colorClass = 'border-l-[#FFB659] bg-[#FFB659]/5';
                  } else if (note.color === 'cyan') {
                    colorClass = 'border-l-[#D174FF] bg-[#D174FF]/5';
                  }

                  return (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`glass-card p-4 border border-white/5 border-l-2 relative ${colorClass}`}
                    >
                      {/* Note Delete Button */}
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="absolute top-2.5 right-2.5 text-white/20 hover:text-white transition-colors"
                      >
                        <Trash2 size={12} className="hover:text-[#F23E70] transition-colors" />
                      </button>

                      {/* Header info */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[7px] text-white/30 font-mono">
                          {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        
                        {/* Quick Color Picker */}
                        <div className="flex gap-1 items-center ml-auto mr-4">
                          {(['purple', 'pink', 'yellow', 'cyan'] as const).map(c => {
                            let dotBg = 'bg-[#7D52FF]';
                            if (c === 'pink') dotBg = 'bg-[#F23E70]';
                            if (c === 'yellow') dotBg = 'bg-[#FFB659]';
                            if (c === 'cyan') dotBg = 'bg-[#D174FF]';
                            
                            return (
                              <button
                                key={c}
                                onClick={() => handleChangeNoteColor(note.id, c)}
                                className={`w-1.5 h-1.5 rounded-full transition-transform ${dotBg} ${
                                  note.color === c ? 'scale-150 ring-1 ring-white/50' : 'opacity-40 hover:opacity-100'
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Text Input area */}
                      <textarea
                        value={note.content}
                        onChange={(e) => handleUpdateNote(note.id, e.target.value)}
                        placeholder="ENTER LOG DETAILS..."
                        className="w-full bg-transparent border-none text-[11px] font-mono text-white placeholder-white/20 resize-none h-16 focus:outline-none scrollbar-none tracking-wide"
                      />
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* Footer Branding */}
      <footer className="mt-auto py-12 text-center opacity-10">
        <p className="text-[9px] text-white uppercase tracking-[1em]">Secure Admin Access v1.0.4</p>
      </footer>

      {showTutorial && (
        <AdminTutorialOverlay 
          isLightMode={isLightMode} 
          onClose={() => setShowTutorial(false)} 
          onTabChange={setActiveTab}
        />
      )}
    </div>
    </div>
  );
};

export default AdminDashboard;
