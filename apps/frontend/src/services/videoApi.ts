import api from './api';
import { VideoAnalysisResult } from '../types';

export const videoApi = {
  analyzeFrame: async (imageData: string | Blob, userId: string, token: string): Promise<VideoAnalysisResult> => {
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
    formData.append('token', token);

    const response = await api.post('/analyze-video-frame', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 90000, // 90 seconds timeout for video frame analysis (first run needs model download)
    });
    
    return response.data;
  },

  // Removed analyzeContinuous - now handled by frontend frame capture

  analyzeVideo: async (videoBlob: Blob, userId: string, token: string): Promise<VideoAnalysisResult[]> => {
    const formData = new FormData();
    formData.append('video', videoBlob);
    formData.append('user_id', userId);
    formData.append('token', token);
    
    const response = await api.post('/analyze-video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // 60 seconds timeout for full video analysis
    });
    return response.data;
  },
};