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

// Single message analysis (integrated backend)
export const analyzeSingleChatMessage = async (message: { text: string; person_id?: string }) => {
  const response = await api.post('/analyze-chat', message);
  return response.data;
};

// Batch message analysis (mental_state_analyzer)
export const analyzeBatchChatMessages = async (messages: { text: string; person_id?: string }[]) => {
  const response = await api.post('/analyze/multiple', messages);
  return response.data;
};

// Fetch batch analysis visualizations and summary
export const getBatchChatVisualizations = async () => {
  const [mentalStates, sentimentTrend, summary] = await Promise.all([
    api.get('/visualizations/mental-states', { responseType: 'blob' }),
    api.get('/visualizations/sentiment-trend', { responseType: 'blob' }),
    api.get('/results/latest'),
  ]);
  return {
    mentalStatesImg: URL.createObjectURL(mentalStates.data),
    sentimentTrendImg: URL.createObjectURL(sentimentTrend.data),
    summary: summary.data.summary,
  };
};