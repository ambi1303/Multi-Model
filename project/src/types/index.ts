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

export interface SentimentResult {
  label: string;
  confidence: number;
  scores: {
    negative: number;
    neutral: number;
    positive: number;
  };
  polarity: number;
  subjectivity: number;
  intensity: string;
}

export interface SpeechAnalysisResult {
  transcription: string;
  sentiment: SentimentResult;
  emotions: EmotionResult[];
  genAIInsights: string;
  technicalReport: string;
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

export interface SurveyLikertData {
  q1: number; // I feel happy and relaxed while doing my job.
  q2: number; // I frequently feel anxious or stressed because of my work.
  q3: number; // I feel emotionally exhausted at the end of my workday.
  q4: number; // I feel motivated and excited about my work.
  q5: number; // I feel a sense of accomplishment and purpose in my role.
  q6: number; // I find myself feeling detached or indifferent about my work.
  q7: number; // My workload is manageable within my regular working hours.
  q8: number; // I have control over how I organize and complete my tasks.
  q9: number; // My manager and team provide support when I face challenges.
  q10: number; // I feel my personal time and work–life balance are respected by the organization.
}

export interface BurnoutSurveyData {
  employee: {
    Designation: number;
    Resource_Allocation: number;
    Mental_Fatigue_Score: number;
    Company_Type: string;
    WFH_Setup_Available: string;
    Gender: string;
  };
  survey: SurveyLikertData;
  employee_id?: string;
}

export interface BurnoutResult {
  "Employee ID": string;
  "Predicted Burn Rate": number;
  "Survey Score": string;
  "Mental Health Summary": string;
  "Recommendations": string[];
  // UI mapping properties
  riskLevel?: string;
  score?: number;
  recommendations?: string[];
  breakdown?: any[];
  employeeId?: string;
  surveyScore?: string;
  mentalHealthSummary?: string;
  burnRate?: number;
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