import axios, { AxiosResponse } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000',
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

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-token');
      window.location.href = '/login';
    }
    
    // Transform error messages
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
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

// Generic API function
export const apiCall = async <T>(
  request: () => Promise<AxiosResponse<ApiResponse<T>>>
): Promise<T> => {
  try {
    const response = await request();
    return response.data.data;
  } catch (error) {
    throw error instanceof Error ? error : new Error('API call failed');
  }
};

// Chat Analysis API Endpoints

// Simple chat service (single message analysis) - uses integrated backend
export const analyzeSingleChatMessage = async (message: { text: string; person_id?: string }) => {
  try {
    // Use integrated backend (port 9000) which forwards to the simple service
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

// Mental state analyzer - complete analysis (matches main.py flow exactly)
export const analyzeChatFile = async (file: File) => {
  try {
    console.log('API: Starting complete analysis for:', file.name, 'Size:', file.size);
    
    const formData = new FormData();
    formData.append('file', file);
    
    console.log('API: Sending request to http://localhost:8003/analyze-complete');
    
    const response = await axios.post('http://localhost:8003/analyze-complete', formData, {
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

// Get batch analysis visualizations (port 8003)
export const getBatchChatVisualizations = async () => {
  try {
    const [mentalStates, sentimentTrend, summary] = await Promise.all([
      axios.get('http://localhost:8003/visualizations/mental-states', { responseType: 'blob' }),
      axios.get('http://localhost:8003/visualizations/sentiment-trend', { responseType: 'blob' }),
      axios.get('http://localhost:8003/results/latest'),
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

// Legacy support - keep for backward compatibility
export const analyzeBatchChatMessages = async (messages: Array<{ text: string; person_id?: string; timestamp?: string }>) => {
  try {
    const processedMessages = messages.map(msg => ({
      text: msg.text,
      person_id: msg.person_id || 'user_api'
    }));
    
    const response = await axios.post('http://localhost:8003/analyze/multiple', processedMessages);
    return response.data;
  } catch (error) {
    console.error('Batch chat analysis failed:', error);
    throw error;
  }
};