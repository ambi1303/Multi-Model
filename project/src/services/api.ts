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
    const token = localStorage.getItem('auth-token');
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
      localStorage.removeItem('auth-token');
      window.location.href = '/login';
    }
    
    // Service unavailable - could show a service status indicator
    if (error.response?.status === 503) {
      console.error('Service unavailable:', error.config?.url);
    }
    
    // Transform error messages
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    const errorWithDetails = new Error(message);
    
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
  summary: any;
  analyzed_messages: any[];
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
  } catch (error: any) {
    console.error('Complete analysis failed:', error);
    console.error('Error details:', error.response?.data || error.message);
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

// Add new interfaces for separate burnout analysis endpoints
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

// Progressive analysis function - calls all three endpoints with progressive loading
export interface ProgressiveAnalysisResult {
  mlResult?: EmployeeAnalysisResponse;
  surveyResult?: SurveyAnalysisResponse;
  combinedResult?: CombinedAnalysisResponse;
}

export const analyzeProgressively = async (
  employeeData: EmployeeData,
  surveyData: SurveyData,
  employeeId?: string,
  onProgress?: (result: ProgressiveAnalysisResult) => void
): Promise<ProgressiveAnalysisResult> => {
  const results: ProgressiveAnalysisResult = {};

  try {
    // Step 1: Analyze employee data (ML model) - fastest
    console.log('Starting ML model analysis...');
    const mlResult = await analyzeEmployee(employeeData, employeeId);
    results.mlResult = mlResult;
    onProgress?.(results);

    // Step 2: Analyze survey questions - also fast
    console.log('Starting survey analysis...');
    const surveyResult = await analyzeSurveyQuestions(surveyData);
    results.surveyResult = surveyResult;
    onProgress?.(results);

    // Step 3: Combined analysis with AI insights - potentially slower due to Gemini API
    console.log('Starting combined AI analysis...');
    const combinedResult = await analyzeCombined(employeeData, surveyData, employeeId);
    results.combinedResult = combinedResult;
    onProgress?.(results);

    return results;
  } catch (error) {
    console.error('Progressive analysis failed:', error);
    throw error;
  }
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