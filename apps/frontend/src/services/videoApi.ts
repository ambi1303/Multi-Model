import api, { apiCall } from './api';
import {  VideoAnalysisResult } from '../types';

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
    
    // Try the dedicated video emotion API first
    try {
      const response = await fetch('http://localhost:8001/analyze-video', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        // Fall back to integrated backend if video API is not available
        const fallbackResponse = await api.post('/analyze-video', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        // Map backend response to VideoAnalysisResult
        const { emotion } = fallbackResponse.data;
        const now = Date.now();
        return {
          emotions: [{ emotion, confidence: 1, timestamp: now }],
          dominantEmotion: emotion,
          averageConfidence: 1,
          timestamp: now,
        };
      }
    } catch (error) {
      console.warn('Video API not available, falling back to integrated backend:', error);
      // Fall back to integrated backend
      const response = await api.post('/analyze-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Map backend response to VideoAnalysisResult
      const { emotion } = response.data;
      const now = Date.now();
      return {
        emotions: [{ emotion, confidence: 1, timestamp: now }],
        dominantEmotion: emotion,
        averageConfidence: 1,
        timestamp: now,
      };
    }
  },

  analyzeContinuous: async (duration: number = 10): Promise<VideoAnalysisResult> => {
    try {
      const response = await fetch(`http://localhost:8001/analyze-video-continuous?duration=${duration}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data;
    } catch (error) {
      console.error('Error in continuous video analysis:', error);
      throw error;
    }
  },

  analyzeVideo: async (videoBlob: Blob): Promise<VideoAnalysisResult[]> => {
    const formData = new FormData();
    formData.append('video', videoBlob);
    return apiCall(() => api.post('/analyze/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }));
  },
};