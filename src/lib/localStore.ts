// Local Portfolio Data Store - Replaces Firebase for a self-contained, offline-ready portfolio demo
import { getRetentionExpiry, isExpiredTime } from './retention';

export interface PromptItem {
  id: string;
  title: string;
  content: string;
  difficulty: string;
  wpm: number;
  accuracy: number;
  isActive: boolean;
}

export interface GlobalConfig {
  wpmGoal: number;
  accuracyGoal: number;
  timerDuration: number;
  difficultyScaler: number;
  strictCapitals: boolean;
  strictSpaces: boolean;
  shuffleMode: boolean;
  selectedPromptId: string;
  attemptLimit: number;
  wpmCalculationMethod: string;
}

export interface ApplicantResult {
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
  createdAt?: string;
  expiresAt?: string;
  expiresAtIso?: string;
  timerDuration?: number;
}

const DEFAULT_PROMPTS: PromptItem[] = [
  {
    id: 'prompt_1',
    title: 'Alpha Protocol — Standard Technical',
    content: 'The quick brown fox jumps over the lazy dog. Programming is the art of algorithm design and the craft of debugging code. High performance typing requires focus, rhythm, and precision. In a professional environment, speed is only as valuable as the accuracy that accompanies it. Success in recruitment often hinges on the ability to demonstrate technical competence under time constraints. Every keystroke counts when you are being evaluated for an enterprise-grade role.',
    difficulty: 'Standard',
    wpm: 40,
    accuracy: 95,
    isActive: true
  },
  {
    id: 'prompt_2',
    title: 'Nexus Data Stream — Customer Support Ops',
    content: 'Effective communication in customer support begins with empathetic listening, swift issue diagnosis, and accurate problem resolution. As service delivery models advance, omnichannel ticketing systems require prompt responses without sacrificing compliance standards or customer satisfaction metrics.',
    difficulty: 'Intermediate',
    wpm: 45,
    accuracy: 96,
    isActive: true
  },
  {
    id: 'prompt_3',
    title: 'Vanguard Systems — High Velocity Engineering',
    content: 'Scalable software architectures demand robust asynchronous design, continuous integration workflows, and fault-tolerant cloud microservices. Developers must write clean, testable code while maintaining clear documentation and proactive observability across distributed platforms.',
    difficulty: 'Advanced',
    wpm: 55,
    accuracy: 98,
    isActive: true
  }
];

const DEFAULT_CONFIG: GlobalConfig = {
  wpmGoal: 40,
  accuracyGoal: 95,
  timerDuration: 60,
  difficultyScaler: 100,
  strictCapitals: true,
  strictSpaces: true,
  shuffleMode: true,
  selectedPromptId: 'prompt_1',
  attemptLimit: 3,
  wpmCalculationMethod: 'Net'
};

const DEFAULT_DEMO_RESULTS: ApplicantResult[] = [
  {
    id: 'res_demo_1',
    userName: 'Alex Mercer',
    applicantEmail: 'alex.mercer@portfolio.dev',
    wpm: 68,
    accuracy: 98,
    errors: 2,
    attempt: 1,
    attemptNumber: 1,
    isQualified: true,
    promptTitle: 'Alpha Protocol — Standard Technical',
    promptDifficulty: 'Standard',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    expiresAtIso: new Date(Date.now() + 86400000).toISOString(),
    timerDuration: 60
  },
  {
    id: 'res_demo_2',
    userName: 'Elena Rostova',
    applicantEmail: 'elena.rostova@portfolio.dev',
    wpm: 54,
    accuracy: 96,
    errors: 4,
    attempt: 1,
    attemptNumber: 1,
    isQualified: true,
    promptTitle: 'Nexus Data Stream — Customer Support Ops',
    promptDifficulty: 'Intermediate',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    expiresAtIso: new Date(Date.now() + 86400000).toISOString(),
    timerDuration: 60
  },
  {
    id: 'res_demo_3',
    userName: 'Marcus Chen',
    applicantEmail: 'marcus.chen@portfolio.dev',
    wpm: 38,
    accuracy: 91,
    errors: 7,
    attempt: 1,
    attemptNumber: 1,
    isQualified: false,
    promptTitle: 'Vanguard Systems — High Velocity Engineering',
    promptDifficulty: 'Advanced',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    expiresAtIso: new Date(Date.now() + 86400000).toISOString(),
    timerDuration: 60
  }
];

class LocalDataStore {
  private configKey = 'cp_portfolio_config';
  private promptsKey = 'cp_portfolio_prompts';
  private resultsKey = 'cp_portfolio_results';
  private authKey = 'cp_portfolio_auth';
  private listeners: Set<(results: ApplicantResult[]) => void> = new Set();

  constructor() {
    this.initDefaults();
  }

  private initDefaults() {
    if (!localStorage.getItem(this.configKey)) {
      localStorage.setItem(this.configKey, JSON.stringify(DEFAULT_CONFIG));
    }
    if (!localStorage.getItem(this.promptsKey)) {
      localStorage.setItem(this.promptsKey, JSON.stringify(DEFAULT_PROMPTS));
    }
    if (!localStorage.getItem(this.resultsKey)) {
      localStorage.setItem(this.resultsKey, JSON.stringify(DEFAULT_DEMO_RESULTS));
    }
    if (!localStorage.getItem(this.authKey)) {
      localStorage.setItem(this.authKey, JSON.stringify({ password: 'admin' }));
    }
  }

  // Config
  getConfig(): GlobalConfig {
    try {
      const data = localStorage.getItem(this.configKey);
      return data ? { ...DEFAULT_CONFIG, ...JSON.parse(data) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  saveConfig(config: Partial<GlobalConfig>): GlobalConfig {
    const updated = { ...this.getConfig(), ...config };
    localStorage.setItem(this.configKey, JSON.stringify(updated));
    return updated;
  }

  // Auth
  getAuthPassword(): string {
    try {
      const data = localStorage.getItem(this.authKey);
      return data ? JSON.parse(data).password || 'admin' : 'admin';
    } catch {
      return 'admin';
    }
  }

  saveAuthPassword(password: string) {
    localStorage.setItem(this.authKey, JSON.stringify({ password }));
  }

  // Prompts
  getPrompts(): PromptItem[] {
    try {
      const data = localStorage.getItem(this.promptsKey);
      return data ? JSON.parse(data) : DEFAULT_PROMPTS;
    } catch {
      return DEFAULT_PROMPTS;
    }
  }

  savePrompt(prompt: Partial<PromptItem> & { id?: string }): PromptItem {
    const prompts = this.getPrompts();
    if (prompt.id) {
      const idx = prompts.findIndex(p => p.id === prompt.id);
      if (idx !== -1) {
        prompts[idx] = { ...prompts[idx], ...prompt } as PromptItem;
        localStorage.setItem(this.promptsKey, JSON.stringify(prompts));
        return prompts[idx];
      }
    }
    const newPrompt: PromptItem = {
      id: prompt.id || `prompt_${Date.now()}`,
      title: prompt.title || 'Custom Protocol',
      content: prompt.content || '',
      difficulty: prompt.difficulty || 'Standard',
      wpm: prompt.wpm || 40,
      accuracy: prompt.accuracy || 95,
      isActive: typeof prompt.isActive === 'boolean' ? prompt.isActive : true
    };
    prompts.push(newPrompt);
    localStorage.setItem(this.promptsKey, JSON.stringify(prompts));
    return newPrompt;
  }

  deletePrompt(id: string) {
    const prompts = this.getPrompts().filter(p => p.id !== id);
    localStorage.setItem(this.promptsKey, JSON.stringify(prompts));
  }

  togglePromptActive(id: string): boolean {
    const prompts = this.getPrompts();
    const target = prompts.find(p => p.id === id);
    if (target) {
      target.isActive = !target.isActive;
      localStorage.setItem(this.promptsKey, JSON.stringify(prompts));
      return target.isActive;
    }
    return false;
  }

  // Applicant Results
  getResults(): ApplicantResult[] {
    try {
      const data = localStorage.getItem(this.resultsKey);
      const list: ApplicantResult[] = data ? JSON.parse(data) : [];
      return list.filter(r => !isExpiredTime(r.expiresAt || r.expiresAtIso));
    } catch {
      return [];
    }
  }

  addResult(result: Partial<ApplicantResult>): ApplicantResult {
    const expiresAt = getRetentionExpiry();
    const newResult: ApplicantResult = {
      id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      expiresAtIso: expiresAt.toISOString(),
      ...result
    };
    const results = [newResult, ...this.getResults()];
    localStorage.setItem(this.resultsKey, JSON.stringify(results));
    this.notifyListeners(results);
    return newResult;
  }

  deleteResult(id: string) {
    const results = this.getResults().filter(r => r.id !== id);
    localStorage.setItem(this.resultsKey, JSON.stringify(results));
    this.notifyListeners(results);
  }

  purgeApplicant(applicantId: string) {
    const results = this.getResults().filter(r => {
      const id = r.applicantEmail || r.userName || '';
      return id !== applicantId;
    });
    localStorage.setItem(this.resultsKey, JSON.stringify(results));
    this.notifyListeners(results);
  }

  mergeApplicants(targetApplicant: string, sourceApplicant: string) {
    const results = this.getResults().map(r => {
      const id = r.applicantEmail || r.userName || '';
      if (id === sourceApplicant) {
        return {
          ...r,
          applicantEmail: r.applicantEmail ? targetApplicant : undefined,
          userName: r.userName ? targetApplicant : undefined
        };
      }
      return r;
    });
    localStorage.setItem(this.resultsKey, JSON.stringify(results));
    this.notifyListeners(results);
  }

  // Real-time subscription mock
  subscribeResults(listener: (results: ApplicantResult[]) => void) {
    this.listeners.add(listener);
    listener(this.getResults());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(results: ApplicantResult[]) {
    this.listeners.forEach(fn => fn(results));
  }
}

export const localStore = new LocalDataStore();
