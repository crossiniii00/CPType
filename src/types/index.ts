export interface User {
  id: string;
  name: string;
  created_at: string;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Expert';
  time_limit: number;
  min_wpm: number;
  min_accuracy: number;
  created_at: string;
}

export interface Attempt {
  id: string;
  user_name: string;
  wpm: number;
  accuracy: number;
  errors: number;
  attempt_number: number;
  is_qualified: boolean;
  prompt_id: string;
  created_at: string;
}

export interface SystemSettings {
  min_wpm: number;
  min_accuracy: number;
  max_attempts: number;
  time_limit: number;
}
