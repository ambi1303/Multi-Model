import api, { apiCall } from './api';
import { EmotionResult, VideoAnalysisResult } from '../types';

export const videoApi = {
  analyzeFrame: async (imageData: string | Blob): Promise<VideoAnalysisResult> => {
    const formData = new FormData();
    if (typeof imageData === 'string') {
      // Convert base64 to Blob
      const byteString = atob(imageData.split(',')[1]);
      const mimeString = imageData.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      formData.append('file', blob, 'frame.jpg');
    } else {
      formData.append('file', imageData, 'frame.jpg');
    }
    // Call the integrated backend
    const response = await api.post('/analyze-video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Map backend response to VideoAnalysisResult
    const { emotion } = response.data;
    // The backend returns only the dominant emotion, so wrap it in the expected structure
    const now = Date.now();
    return {
      emotions: [{ emotion, confidence: 1, timestamp: now }],
      dominantEmotion: emotion,
      averageConfidence: 1,
      timestamp: now,
    };
  },

  analyzeVideo: async (videoBlob: Blob): Promise<VideoAnalysisResult[]> => {
    const formData = new FormData();
    formData.append('video', videoBlob);
    return apiCall(() => api.post('/analyze/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }));
  },
};