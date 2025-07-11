import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { Notification, User } from '../types';
import api from '../services/api'; // Import the unified api
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000';

const fetchUserProfile = async (token: string): Promise<User> => {
  const response = await api.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Create a separate axios instance for logout to avoid circular dependency
const logoutApi = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface AppState {
  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // Analysis History
  analysisHistory: {
    video: Array<unknown>;
    speech: Array<unknown>;
    chat: Array<unknown>;
    survey: Array<unknown>;
    'enhanced-survey': Array<unknown>;
  };
  addAnalysisResult: (type: 'video' | 'speech' | 'chat' | 'survey' | 'enhanced-survey', result: unknown) => void;
  clearHistory: (type?: 'video' | 'speech' | 'chat' | 'survey' | 'enhanced-survey') => void;
  
  // Welcome Modal
  showWelcomeModal: boolean;
  setShowWelcomeModal: (show: boolean) => void;

  // User Preferences
  preferences: {
    autoSave: boolean;
    showTutorials: boolean;
    defaultAnalysisMode: string;
  };
  updatePreferences: (preferences: Partial<AppState['preferences']>) => void;

  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isInitializing: boolean;
  actions: {
    login: (user: User, token: string) => void;
    logout: () => Promise<void>;
    initializeAuth: () => Promise<void>;
  };
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // UI State
        sidebarOpen: false,
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        
        // Analysis History
        analysisHistory: {
          video: [],
          speech: [],
          chat: [],
          survey: [],
          'enhanced-survey': [],
        },
        addAnalysisResult: (type, result) =>
          set((state) => ({
            analysisHistory: {
              ...state.analysisHistory,
              [type]: [result, ...(state.analysisHistory[type] || [])].slice(0, 50), // Keep last 50, handle undefined case
            },
          })),
        clearHistory: (type) =>
          set((state) => ({
            analysisHistory: type
              ? { ...state.analysisHistory, [type]: [] }
              : { video: [], speech: [], chat: [], survey: [], 'enhanced-survey': [] },
          })),
        
        // Welcome Modal
        showWelcomeModal: false,
        setShowWelcomeModal: (show) => set({ showWelcomeModal: show }),

        // User Preferences
        preferences: {
          autoSave: true,
          showTutorials: true,
          defaultAnalysisMode: 'webcam',
        },
        updatePreferences: (newPreferences) =>
          set((state) => ({
            preferences: { ...state.preferences, ...newPreferences },
          })),

        isAuthenticated: false,
        user: null,
        token: null,
        isInitializing: true,
        actions: {
          login: (user, token) => {
            sessionStorage.setItem('auth_token', token);
            set({ isAuthenticated: true, user, token, isInitializing: false, showWelcomeModal: true });
          },
          logout: async () => {
            try {
              const token = get().token;
              if (token) {
                await logoutApi.post('/auth/logout', {}, {
                  headers: { Authorization: `Bearer ${token}` }
                });
              }
            } catch (error) {
              console.error('Logout error:', error);
              // Don't throw error - we want logout to always succeed locally
            } finally {
              sessionStorage.removeItem('auth_token');
              set({ isAuthenticated: false, user: null, token: null, isInitializing: false, showWelcomeModal: false });
            }
          },
          initializeAuth: async () => {
            set({ isInitializing: true });
            const storedToken = sessionStorage.getItem('auth_token');
            if (storedToken) {
              try {
                const userProfile = await fetchUserProfile(storedToken);
                set({ isAuthenticated: true, user: userProfile, token: storedToken, isInitializing: false });
              } catch (error) {
                console.error('Failed to restore auth state:', error);
                sessionStorage.removeItem('auth_token');
                set({ isAuthenticated: false, user: null, token: null, isInitializing: false });
              }
            } else {
              set({ isInitializing: false });
            }
          },
        },
        notifications: [],
        addNotification: (notification) =>
          set((state) => ({
            notifications: [...state.notifications, { ...notification, id: Date.now() }],
          })),
      }),
      {
        name: 'app-storage',
        storage: {
          getItem: (name) => {
            const str = sessionStorage.getItem(name);
            if (!str) return null;
            const { state } = JSON.parse(str);
            return {
              state: {
                preferences: state.preferences,
                analysisHistory: state.analysisHistory,
              },
            };
          },
          setItem: (name, newValue) => {
            const str = JSON.stringify({
              state: {
                preferences: newValue.state.preferences,
                analysisHistory: newValue.state.analysisHistory,
              },
            });
            sessionStorage.setItem(name, str);
          },
          removeItem: (name) => sessionStorage.removeItem(name),
        },
      }
    )
  )
);