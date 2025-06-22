import api, { apiCall } from './api';
import { SpeechAnalysisResult } from '../types';

export const speechApi = {
  analyzeAudio: async (audioBlob: Blob): Promise<SpeechAnalysisResult> => {
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'audio.webm');
    const response = await api.post('/analyze-speech', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Map backend response to SpeechAnalysisResult
    const data = response.data;
    // The backend returns: text, sentiment, sentiment_score, emotion, emotion_score
    // We'll map this to the expected frontend type
    const now = Date.now();
    return {
      transcription: data.text,
      sentiment: {
        label: data.sentiment,
        score: data.sentiment_score ?? 0,
      },
      emotions: [{ emotion: data.emotion, confidence: data.emotion_score ?? 1, timestamp: now }],
      duration: 0, // Not provided by backend
      timestamp: now,
    };
  },

  transcribeAudio: async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    return apiCall(() => api.post('/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }));
  },
};