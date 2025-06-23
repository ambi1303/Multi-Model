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
};