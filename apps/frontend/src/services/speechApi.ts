/**
 * Speech Analysis API - Simplified EmoBuddy Integration
 * ===================================================
 * 
 * This service handles speech analysis and EmoBuddy integration using a 
 * simplified in-memory approach without database dependencies.
 * 
 * Flow:
 * 1. analyzeAudio() - Performs speech analysis (no EmoBuddy by default)
 * 2. User sees results and decides to engage with EmoBuddy
 * 3. startEmoBuddyFromAnalysis() - Starts EmoBuddy with transcribed text
 * 4. continueEmoBuddyConversation() - Continues the conversation in-memory
 * 5. endEmoBuddySession() - Cleans up in-memory session
 * 
 * EmoBuddy sessions are now purely in-memory without database storage.
 */

import api, { apiCall } from './api';
import { SpeechAnalysisResult } from '../types';
import { useAppStore } from '../store/useAppStore';

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
  metadata?: {
    response_time_ms?: number;
  };
}

export interface EmoBuddyEndSession {
  session_id: string;
  summary: string;
  total_messages: number;
  timestamp: string;
}

export interface EmoBuddyAvailability {
  available: boolean;
  message: string;
  estimated_wait_time?: number;
}

// Helper function to get current user token
const getCurrentToken = (): string => {
  const token = useAppStore.getState().token;
  if (!token) {
    throw new Error('User not authenticated - token not available');
  }
  return token;
};

export const speechApi = {
  analyzeAudio: async (audioBlob: Blob, userId?: string, startEmoBuddy: boolean = false) : Promise<SpeechAnalysisResult> => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('user_id', userId ?? 'user_api');
    formData.append('token', getCurrentToken());
    formData.append('start_emo_buddy', startEmoBuddy.toString()); // NEW: Control EmoBuddy integration

    const response = await api.post('/analyze-speech', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000, // Reduced timeout since we're not doing EmoBuddy by default
    });

    const data = response.data;
    const emotionsRaw = data.emotions || [];
    const emotionScores = Array.isArray(emotionsRaw)
      ? emotionsRaw
      : emotionsRaw.emotion_scores || [];

    return {
      transcribed_text: data.transcribed_text || data.transcription || '',
      sentiment: data.sentiment || { label: 'neutral', confidence: 0 },
      emotions: emotionScores,
      genAIInsights: data.gen_ai_insights || data.genAIInsights || null,
      technicalReport: data.technical_report || data.technicalReport || null,
      audio_duration_seconds: data.audio_duration_seconds || 0,
      timestamp: Date.now(),
      session_id: data.session_id,
      emoBuddyResponse: data.emo_buddy_response,
    };
  },

  // NEW: Separate method to start EmoBuddy from analysis results
  startEmoBuddyFromAnalysis: async (
    analysisResult: SpeechAnalysisResult,
    userId: string
  ): Promise<EmoBuddySession> => {
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('token', getCurrentToken());
    formData.append('session_id', analysisResult.session_id || '');
    formData.append('transcribed_text', analysisResult.transcribed_text || '');
    formData.append('sentiment_label', analysisResult.sentiment?.label || 'neutral');
    formData.append('sentiment_confidence', (analysisResult.sentiment?.confidence || 0).toString());
    formData.append('emotions', JSON.stringify(analysisResult.emotions || []));

    const response = await api.post('/start-emobuddy-from-analysis', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });

    const data = response.data;
    return {
      session_id: data.session_id,
      response: data.emo_buddy_response,
      should_continue: data.should_continue ?? true,
      metadata: {
        mode: 'speech_integrated',
        started_at: data.timestamp,
        total_messages: 1,
        techniques_used: [],
      },
    };
  },

  transcribeAudio: async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    return apiCall(() =>
      api.post('/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },

  checkEmoBuddyAvailability: async (): Promise<EmoBuddyAvailability> => {
    const response = await api.get('/emo-buddy/availability');
    return response.data;
  },

  // DEPRECATED: Keep for backward compatibility but mark as deprecated
  startEmoBuddySession: async (
    analysisReport: SpeechAnalysisResult,
    userId: string
  ): Promise<EmoBuddySession> => {
    console.warn('startEmoBuddySession is deprecated. Use startEmoBuddyFromAnalysis instead.');
    return speechApi.startEmoBuddyFromAnalysis(analysisReport, userId);
  },

  // Continue EmoBuddy conversation (now works with in-memory sessions)
  continueEmoBuddyConversation: async (
    sessionId: string,
    userInput: string,
    userId: string
  ): Promise<EmoBuddyConversation> => {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('user_input', userInput);
    formData.append('user_id', userId);
    formData.append('token', getCurrentToken());

    const response = await api.post('/continue-emo-buddy-stt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });

    const data = response.data;
    return {
      session_id: data.session_id,
      response: data.response,
      should_continue: data.should_continue,
      metadata: {
        response_time_ms: undefined, // Not tracked in simplified mode
      },
    };
  },

  // End EmoBuddy session (now works with in-memory cleanup)
  endEmoBuddySession: async (
    sessionId: string,
    userId: string,
    sessionSummary?: string
  ): Promise<{ success: boolean; message: string }> => {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('user_id', userId);
    formData.append('token', getCurrentToken());
    if (sessionSummary) {
      formData.append('session_summary', sessionSummary);
    }

    const response = await api.post('/end-emo-buddy-stt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });

    return response.data;
  },

  getSessionStatus: async (
    sessionId: string
  ): Promise<{ session_id: string; status: string; is_active: boolean }> => {
    const response = await api.get(`/emo-buddy/session/${sessionId}/status`);
    return response.data;
  },

  getUserSessions: async (
    userId: string
  ): Promise<{ sessions: EmoBuddySession[]; total: number }> => {
    const response = await api.get(`/emo-buddy/user/${userId}/sessions`);
    return response.data;
  },
};
