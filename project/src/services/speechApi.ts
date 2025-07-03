import api, { apiCall } from './api';
import { SpeechAnalysisResult } from '../types';

// Emo Buddy Types
export interface EmoBuddySession {
  session_id: string;
  response: string;
  status: string;
}

export interface EmoBuddyConversation {
  session_id: string;
  response: string;
  should_continue: boolean;
  status: string;
}

export interface EmoBuddyAvailability {
  available: boolean;
  message: string;
  features: {
    therapeutic_sessions: boolean;
    crisis_detection: boolean;
    memory_system: boolean;
    corporate_context: boolean;
  };
}

export const speechApi = {
  analyzeAudio: async (audioBlob: Blob): Promise<SpeechAnalysisResult> => {
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'audio.webm');
    const response = await api.post('/analyze-speech', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Map backend response to SpeechAnalysisResult
    const data = response.data;
    return {
      transcription: data.transcription,
      sentiment: data.sentiment,
      emotions: data.emotions,
      genAIInsights: data.genAIInsights,
      technicalReport: data.technicalReport,
      duration: 0,
      timestamp: Date.now(),
    };
  },

  transcribeAudio: async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    return apiCall(() => api.post('/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }));
  },

  // Emo Buddy API functions
  checkEmoBuddyAvailability: async (): Promise<EmoBuddyAvailability> => {
    const response = await api.get('/emo-buddy/availability');
    return response.data;
  },

  startEmoBuddySession: async (analysisReport: SpeechAnalysisResult): Promise<EmoBuddySession> => {
    const response = await api.post('/emo-buddy/start', {
      analysis_report: analysisReport
    });
    return response.data;
  },

  continueEmoBuddyConversation: async (sessionId: string, userInput: string): Promise<EmoBuddyConversation> => {
    const response = await api.post('/emo-buddy/continue', {
      session_id: sessionId,
      user_input: userInput
    });
    return response.data;
  },

  endEmoBuddySession: async (sessionId: string): Promise<{ session_id: string; summary: string; status: string }> => {
    const response = await api.post('/emo-buddy/end', {
      session_id: sessionId
    });
    return response.data;
  },
};