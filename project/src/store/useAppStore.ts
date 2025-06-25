import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // Analysis History
  analysisHistory: {
    video: any[];
    speech: any[];
    chat: any[];
    survey: any[];
    'enhanced-survey': any[];
  };
  addAnalysisResult: (type: 'video' | 'speech' | 'chat' | 'survey' | 'enhanced-survey', result: any) => void;
  clearHistory: (type?: 'video' | 'speech' | 'chat' | 'survey' | 'enhanced-survey') => void;
  
  // User Preferences
  preferences: {
    autoSave: boolean;
    showTutorials: boolean;
    defaultAnalysisMode: string;
  };
  updatePreferences: (preferences: Partial<AppState['preferences']>) => void;
}

export const useAppStore = create<AppState>()(
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
    }),
    {
      name: 'emotion-analysis-app',
      partialize: (state) => ({
        analysisHistory: state.analysisHistory,
        preferences: state.preferences,
      }),
    }
  )
);