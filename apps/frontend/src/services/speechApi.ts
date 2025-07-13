import api, { apiCall } from './api';
import { SpeechAnalysisResult } from '../types';

// Unified EmoBuddy Core Types
export interface EmoBuddySession {
  session_id: string;
  response: string;
  should_continue: boolean;
  core_session_uuid?: string;
  metadata?: {
    mode: 'standalone' | 'speech_integrated' | 'continuation';
    started_at: string;
    total_messages: number;
    techniques_used: string[];
  };
}

export interface EmoBuddyConversation {
  session_id: string;
  response: string;
  should_continue: boolean;
  core_session_uuid?: string;
  metadata?: {
    technique_used?: string;
    response_category?: string;
    response_time_ms?: number;
  };
}

export interface EmoBuddyEndSession {
  session_id: string;
  summary: string;
  total_messages: number;
  session_duration_minutes: number;
  core_session_uuid?: string;
}

export interface EmoBuddyAvailability {
  available: boolean;
  service: string;
  version: string;
  routing?: string;
  error?: string;
}

export const speechApi = {
  analyzeAudio: async (audioBlob: Blob, userId?: string): Promise<SpeechAnalysisResult> => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    
    // Add user_id to form data - required by backend
    if (userId) {
      formData.append('user_id', userId);
    } else {
      // Fallback user_id if not provided
      formData.append('user_id', 'user_api');
    }

    const response = await api.post('/analyze-speech', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000, // 30 seconds timeout for speech analysis (longer than default 10s)
    });
    
    // Map backend response to SpeechAnalysisResult
    const data = response.data;
    
    // Handle different response structures from backend
    const emotions = data.emotions || [];
    const emotionScores = Array.isArray(emotions) ? emotions : 
                         (emotions.emotion_scores || []);
    
    return {
      transcribed_text: data.transcribed_text || data.transcription || '',
      sentiment: data.sentiment || { label: 'neutral', confidence: 0 },
      emotions: emotionScores,
      genAIInsights: data.gen_ai_insights || data.genAIInsights || null,
      technicalReport: data.technical_report || data.technicalReport || null,
      audio_duration_seconds: data.audio_duration_seconds || 0,
      timestamp: Date.now(),
      // Additional fields from backend
      session_id: data.session_id,
      emoBuddyResponse: data.emo_buddy_response
    };
  },

  transcribeAudio: async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    return apiCall(() => api.post('/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }));
  },

  // Unified EmoBuddy Core API functions
  checkEmoBuddyAvailability: async (): Promise<EmoBuddyAvailability> => {
    const response = await api.get('/emo-buddy/availability');
    return response.data;
  },

  startEmoBuddySession: async (analysisReport: SpeechAnalysisResult, userId: string): Promise<EmoBuddySession> => {
    // Prepare analysis report for unified core
    const analysisData = {
      transcribed_text: analysisReport.transcribed_text || '',
      sentiment: analysisReport.sentiment || { label: 'neutral', confidence: 0 },
      emotions: analysisReport.emotions || [],
      genAIInsights: analysisReport.genAIInsights || null,
      technicalReport: analysisReport.technicalReport || null,
      audio_duration_seconds: analysisReport.audio_duration_seconds || 0,
      timestamp: analysisReport.timestamp || Date.now(),
      session_id: analysisReport.session_id
    };

    const response = await api.post('/emo-buddy/start', {
      user_id: userId,
      analysis_report: analysisData
    }, {
      headers: {
        'X-Session-Mode': 'SPEECH_INTEGRATED' // Indicate this is from speech analysis
      },
      timeout: 30000 // 30 seconds timeout for EmoBuddy session start
    });
    
    return response.data;
  },

  continueEmoBuddyConversation: async (sessionId: string, userInput: string, userId: string): Promise<EmoBuddyConversation> => {
    const response = await api.post('/emo-buddy/continue', {
      session_id: sessionId,
      user_id: userId,
      user_input: userInput
    }, {
      headers: {
        'X-Session-Mode': 'CONTINUATION' // Indicate this is a continuation
      },
      timeout: 25000 // 25 seconds timeout for EmoBuddy conversation
    });
    
    return response.data;
  },

  endEmoBuddySession: async (sessionId: string, userId: string): Promise<EmoBuddyEndSession> => {
    const response = await api.post('/emo-buddy/end', {
      session_id: sessionId,
      user_id: userId
    }, {
      headers: {
        'X-Session-Mode': 'CONTINUATION' // Indicate this is ending a session
      },
      timeout: 15000 // 15 seconds timeout for EmoBuddy session end
    });
    
    return response.data;
  },

  // Additional unified core endpoints
  getSessionStatus: async (sessionId: string): Promise<{ session_id: string; status: string; is_active: boolean }> => {
    const response = await api.get(`/emo-buddy/session/${sessionId}/status`);
    return response.data;
  },

  getUserSessions: async (userId: string): Promise<{ sessions: EmoBuddySession[]; total: number }> => {
    const response = await api.get(`/emo-buddy/user/${userId}/sessions`);
    return response.data;
  },
};