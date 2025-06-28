import axios, { AxiosResponse } from 'axios';

// Base URLs from environment variables with fallbacks
const INTEGRATED_API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000';
const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8003';

const api = axios.create({
  baseURL: INTEGRATED_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Try to get token from cookies first, fallback to localStorage for migration
    let token = null;
    
    // Import cookie manager dynamically to avoid SSR issues
    try {
      const { EmotiAnalyzeCookies } = require('../utils/cookies');
      token = EmotiAnalyzeCookies.getAuth()?.token;
    } catch (error) {
      console.warn('Cookie manager not available, falling back to localStorage');
    }
    
    // Fallback to localStorage if no cookie token found
    if (!token) {
      token = localStorage.getItem('auth-token');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with enhanced error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Authentication errors
    if (error.response?.status === 401) {
      // Clear both cookies and localStorage for migration compatibility
      try {
        const { EmotiAnalyzeCookies } = require('../utils/cookies');
        EmotiAnalyzeCookies.clearAuth();
      } catch (error) {
        console.warn('Cookie manager not available during auth clear');
      }
      localStorage.removeItem('auth-token');
      window.location.href = '/login';
    }
    
    // Service unavailable - could show a service status indicator
    if (error.response?.status === 503) {
      console.error('Service unavailable:', error.config?.url);
    }
    
    // Transform error messages
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    const errorWithDetails = new Error(message) as Error & {
      statusCode?: number;
      endpoint?: string;
      timestamp?: string;
    };
    
    // Add additional context to the error
    errorWithDetails.statusCode = error.response?.status;
    errorWithDetails.endpoint = error.config?.url;
    errorWithDetails.timestamp = new Date().toISOString();
    
    return Promise.reject(errorWithDetails);
  }
);

export default api;

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Chart data types
export interface MentalStatesData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface SentimentTrendData {
  timestamp: string;
  fullTimestamp: string;
  sentiment: number;
  rawSentiment: number;
  text: string;
}

export interface CompleteAnalysisResponse {
  summary: {
    total_messages: number;
    analysis_duration: number;
    dominant_mental_state: string;
    average_sentiment: number;
  };
  analyzed_messages: Array<{
    text: string;
    sentiment: number;
    mental_state: string;
    timestamp: string;
  }>;
  mental_states_data: MentalStatesData[];
  sentiment_trend_data: SentimentTrendData[];
  success: boolean;
  message: string;
}

// Health check interface
export interface HealthCheckResponse {
  status: string;
  version: string;
  services: {
    [key: string]: {
      status: string;
      latency?: number;
    }
  }
}

// Generic API function with better error handling
export const apiCall = async <T>(
  request: () => Promise<AxiosResponse<ApiResponse<T>>>
): Promise<T> => {
  try {
    const response = await request();
    return response.data.data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error instanceof Error ? error : new Error('API call failed');
  }
};

// Health check function
export const checkApiHealth = async (): Promise<HealthCheckResponse> => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      status: 'unhealthy',
      version: 'unknown',
      services: {
        integrated: { status: 'down' }
      }
    };
  }
};

// Chat Analysis API Endpoints

// Simple chat service (single message analysis) - uses integrated backend
export const analyzeSingleChatMessage = async (message: { text: string; person_id?: string }) => {
  try {
    // Use integrated backend which forwards to the simple service
    const response = await api.post('/analyze-chat', {
      text: message.text,
      person_id: message.person_id || 'user_api'
    });
    return response.data;
  } catch (error) {
    console.error('Simple chat analysis failed:', error);
    throw error;
  }
};

// Mental state analyzer - single message
export const analyzeSingleMessageAdvanced = async (message: { text: string; person_id?: string }) => {
  const response = await axios.post('http://localhost:8000/analyze/single', {
    text: message.text,
    person_id: message.person_id || 'user_api'
  });
  return response.data;
};

// Mental state analyzer - complete analysis
export const analyzeChatFile = async (file: File) => {
  try {
    console.log('API: Starting complete analysis for:', file.name, 'Size:', file.size);
    
    const formData = new FormData();
    formData.append('file', file);
    
    console.log(`API: Sending request to ${CHAT_API_URL}/analyze-complete`);
    
    const response = await axios.post(`${CHAT_API_URL}/analyze-complete`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minute timeout for complete analysis
    });
    
    console.log('API: Complete analysis response received:', response.status);
    console.log('API: Summary:', response.data.summary);
    console.log('API: Messages count:', response.data.analyzed_messages?.length);
    console.log('API: Has chart data:', !!response.data.mental_states_data && !!response.data.sentiment_trend_data);
    
    return response.data;
  } catch (error: unknown) {
    console.error('Complete analysis failed:', error);
    const axiosError = error as { response?: { data?: unknown }; message?: string };
    console.error('Error details:', axiosError.response?.data || axiosError.message);
    throw error;
  }
};

// Get batch analysis visualizations
export const getBatchChatVisualizations = async () => {
  try {
    const [mentalStates, sentimentTrend, summary] = await Promise.all([
      axios.get(`${CHAT_API_URL}/visualizations/mental-states`, { responseType: 'blob' }),
      axios.get(`${CHAT_API_URL}/visualizations/sentiment-trend`, { responseType: 'blob' }),
      axios.get(`${CHAT_API_URL}/results/latest`),
    ]);
    
    return {
      mentalStatesImg: URL.createObjectURL(mentalStates.data),
      sentimentTrendImg: URL.createObjectURL(sentimentTrend.data),
      summary: summary.data.summary,
    };
  } catch (error) {
    console.error('Error fetching visualizations:', error);
    throw error;
  }
};

// Analyze multiple chat messages
// Note: This function is reserved for future use with batch processing features
export const analyzeBatchChatMessages = async (messages: Array<{ text: string; person_id?: string; timestamp?: string }>) => {
  try {
    const processedMessages = messages.map(msg => ({
      text: msg.text,
      person_id: msg.person_id || 'user_api'
    }));
    
    const response = await axios.post(`${CHAT_API_URL}/analyze/multiple`, processedMessages);
    return response.data;
  } catch (error) {
    console.error('Batch chat analysis failed:', error);
    throw error;
  }
};

// Survey Backend URL (survey service on port 8004)
const SURVEY_API_URL = import.meta.env.VITE_SURVEY_API_URL || 'http://localhost:8004';

// Survey Analysis API functions

// Analyze employee data only (ML model prediction)
export const analyzeEmployee = async (employeeData: EmployeeData, employeeId?: string): Promise<EmployeeAnalysisResponse> => {
  try {
    const payload = employeeId ? { ...employeeData, employee_id: employeeId } : employeeData;
    const response = await axios.post(`${SURVEY_API_URL}/analyze-employee`, payload, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (error) {
    console.error('Employee analysis failed:', error);
    throw error;
  }
};

// Analyze survey questions only (Likert scale assessment)
export const analyzeSurveyQuestions = async (surveyData: SurveyData): Promise<SurveyAnalysisResponse> => {
  try {
    const response = await axios.post(`${SURVEY_API_URL}/analyze-survey-questions`, surveyData, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (error) {
    console.error('Survey questions analysis failed:', error);
    throw error;
  }
};

// Combined analysis for personalized insights (uses both employee and survey data)
export const analyzeCombined = async (
  employeeData: EmployeeData, 
  surveyData: SurveyData, 
  employeeId?: string
): Promise<CombinedAnalysisResponse> => {
  try {
    const payload = {
      employee: employeeData,
      survey: surveyData,
      employee_id: employeeId || `emp_${Date.now()}`
    };
    const response = await axios.post(`${SURVEY_API_URL}/analyze-combined`, payload, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (error) {
    console.error('Combined analysis failed:', error);
    throw error;
  }
};

// --- Enhanced Burnout Survey Types ---
export interface EmployeeData {
  designation: number;
  resource_allocation: number;
  mental_fatigue_score: number;
  company_type: 'Service' | 'Product';
  wfh_setup_available: 'Yes' | 'No';
  gender: 'Male' | 'Female';
}

export interface SurveyData {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  q6: number;
  q7: number;
  q8: number;
  q9: number;
  q10: number;
}

export interface EmployeeAnalysisResponse {
  burnout_score: number;
  burnout_label: string;
  model_used: string;
  prediction_confidence: string;
  employee_id?: string;
  analysis_timestamp: string;
}

export interface SurveyAnalysisResponse {
  risk_level: string;
  assessment_method: string;
  total_questions: number;
  analysis_timestamp: string;
}

export interface CombinedAnalysisResponse {
  mental_health_summary: string;
  recommendations: string[];
  source: string;
  employee_id?: string;
  analysis_timestamp: string;
}

export interface ProgressiveAnalysisResult {
  mlResult?: EmployeeAnalysisResponse;
  surveyResult?: SurveyAnalysisResponse;
  combinedResult?: CombinedAnalysisResponse;
}

// Simulated progressive analysis function for EnhancedBurnoutSurvey
export const analyzeProgressively = async (
  _employeeData: EmployeeData,
  _surveyData: SurveyData,
  employeeId?: string,
  onProgress?: (result: ProgressiveAnalysisResult) => void
): Promise<ProgressiveAnalysisResult> => {
  // Simulate ML analysis
  await new Promise(res => setTimeout(res, 800));
  const mlResult: EmployeeAnalysisResponse = {
    burnout_score: Math.floor(Math.random() * 100),
    burnout_label: ['Low Stress', 'Medium Stress', 'High Stress', 'Very High Stress'][Math.floor(Math.random() * 4)],
    model_used: 'BERT-MLP',
    prediction_confidence: `${Math.floor(Math.random() * 20) + 80}%`,
    employee_id: employeeId,
    analysis_timestamp: new Date().toISOString(),
  };
  onProgress?.({ mlResult });

  // Simulate survey analysis
  await new Promise(res => setTimeout(res, 800));
  const surveyResult: SurveyAnalysisResponse = {
    risk_level: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
    assessment_method: 'Likert-10',
    total_questions: 10,
    analysis_timestamp: new Date().toISOString(),
  };
  onProgress?.({ mlResult, surveyResult });

  // Simulate combined analysis
  await new Promise(res => setTimeout(res, 800));
  const combinedResult: CombinedAnalysisResponse = {
    mental_health_summary: 'Personalized summary based on ML and survey results.',
    recommendations: [
      'Take regular breaks',
      'Practice mindfulness',
      'Maintain work-life balance',
      'Communicate with your team',
    ],
    source: 'AI Model v2.1',
    employee_id: employeeId,
    analysis_timestamp: new Date().toISOString(),
  };
  onProgress?.({ mlResult, surveyResult, combinedResult });

  return { mlResult, surveyResult, combinedResult };
};

// Health check function for survey service
export const checkSurveyApiHealth = async (): Promise<{ status: string; message: string }> => {
  try {
    const response = await axios.get(`${SURVEY_API_URL}/health`, { timeout: 10000 });
    return response.data;
  } catch (error) {
    console.error('Survey API health check failed:', error);
    return { status: 'unhealthy', message: 'Survey service unavailable' };
  }
};