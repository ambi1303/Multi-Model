import api, { apiCall } from './api';
import {  VideoAnalysisResult } from '../types';
import { useAppStore } from '../store/useAppStore';

export const videoApi = {
  analyzeFrame: async (imageData: string | Blob, userId: string): Promise<VideoAnalysisResult> => {
    const formData = new FormData();
    if (typeof imageData === 'string') {
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
    formData.append('user_id', userId);
    
    // The integrated backend will handle token forwarding
    const response = await api.post('/analyze-video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    return response.data;
  },

  analyzeContinuous: async (userId: string, duration: number = 10): Promise<VideoAnalysisResult> => {
    // The integrated backend will handle token forwarding
    const response = await api.post(`/analyze-video-continuous?duration=${duration}&user_id=${userId}`);
    return response.data;
  },

  analyzeVideo: async (videoBlob: Blob): Promise<VideoAnalysisResult[]> => {
    const formData = new FormData();
    formData.append('video', videoBlob);
    
    // Add user_id to the form data
    const userId = useAppStore.getState().user?.id;
    if (userId) {
      formData.append('user_id', userId);
    }
    
    return apiCall(() => api.post('/analyze/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }));
  },
}; 