export interface EmotionResult {
  emotion: string;
  confidence: number;
  timestamp: number;
}

export interface VideoAnalysisResult {
  emotions: EmotionResult[];
  dominantEmotion: string;
  averageConfidence: number;
  timestamp: number;
}

export interface SpeechAnalysisResult {
  transcription: string;
  sentiment: {
    label: string;
    score: number;
  };
  emotions: EmotionResult[];
  duration: number;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  timestamp: number;
  analysis: {
    sentiment: {
      label: string;
      score: number;
    };
    emotions: EmotionResult[];
    mentalState: string;
  };
}

export interface BurnoutSurveyData {
  workload: number;
  workLifeBalance: number;
  jobSatisfaction: number;
  stressLevel: number;
  supportSystem: number;
  sleepQuality: number;
  energyLevel: number;
  motivation: number;
  additionalComments?: string;
}

export interface BurnoutResult {
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
  score: number;
  recommendations: string[];
  breakdown: {
    category: string;
    score: number;
    impact: string;
  }[];
}

// API Types
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Form Types
export interface FormField {
  id: string;
  type: 'text' | 'number' | 'slider' | 'radio' | 'checkbox' | 'textarea';
  label: string;
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

export interface SurveySchema {
  title: string;
  description: string;
  fields: FormField[];
}