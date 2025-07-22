import api from './api';
import { AnalyticsData, AnalyticsFilters, ExportData } from '../types/analytics';

// Data validation and normalization utilities
const validateAndNormalizeOverviewData = (data: any) => {
  if (!data) return null;
  
  return {
    totalSessions: Math.max(0, parseInt(data.totalSessions) || 0),
    totalUsers: Math.max(0, parseInt(data.totalUsers) || 0),
    averageSessionDuration: Math.max(0, parseFloat(data.averageSessionDuration) || 0),
    totalAnalyses: Math.max(0, parseInt(data.totalAnalyses) || 0),
    sessionTrends: Array.isArray(data.sessionTrends) ? data.sessionTrends.filter(item => 
      item && 
      typeof item.sessions === 'number' && 
      !isNaN(item.sessions) &&
      item.date
    ) : [],
    riskDistribution: Array.isArray(data.riskDistribution) ? data.riskDistribution.filter(item =>
      item && 
      typeof item.count === 'number' && 
      !isNaN(item.count) &&
      item.level
    ) : [],
    modalityPerformance: Array.isArray(data.modalityPerformance) ? data.modalityPerformance.filter(item =>
      item && 
      typeof item.usage === 'number' && 
      !isNaN(item.usage) &&
      typeof item.avgConfidence === 'number' && 
      !isNaN(item.avgConfidence) &&
      item.modality
    ) : [],
    mentalStateDistribution: Array.isArray(data.mentalStateDistribution) ? data.mentalStateDistribution.filter(item =>
      item && 
      typeof item.count === 'number' && 
      !isNaN(item.count) &&
      item.state
    ) : [],
    recentActivity: Array.isArray(data.recentActivity) ? data.recentActivity : [],
    fallback: Boolean(data.fallback)
  };
};

const validateAndNormalizeVideoData = (data: any) => {
  if (!data) return null;
  
  return {
    confidenceDistribution: Array.isArray(data.confidenceDistribution) ? data.confidenceDistribution.filter(item =>
      item && 
      typeof item.count === 'number' && 
      !isNaN(item.count) &&
      item.range
    ) : [],
    processingTimeAnalysis: Array.isArray(data.processingTimeAnalysis) ? data.processingTimeAnalysis.filter(item =>
      item && 
      typeof item.processingTime === 'number' && 
      !isNaN(item.processingTime) &&
      typeof item.confidence === 'number' && 
      !isNaN(item.confidence)
    ) : [],
    emotionDistribution: Array.isArray(data.emotionDistribution) ? data.emotionDistribution.filter(item =>
      item && 
      typeof item.count === 'number' && 
      !isNaN(item.count) &&
      item.emotion
    ) : [],
    faceDetectionStats: data.faceDetectionStats || {
      avgFacesDetected: 0,
      avgFaceQuality: 0,
      sessionsWithFaces: 0,
      totalSessions: 0
    },
    recentSessions: Array.isArray(data.recentSessions) ? data.recentSessions : []
  };
};

const validateAndNormalizeSpeechData = (data: any) => {
  if (!data) return null;
  
  return {
    sentimentTrends: Array.isArray(data.sentimentTrends) ? data.sentimentTrends.filter(item =>
      item && 
      typeof item.averageScore === 'number' && 
      !isNaN(item.averageScore) &&
      item.date
    ) : [],
    transcriptionAccuracy: Array.isArray(data.transcriptionAccuracy) ? data.transcriptionAccuracy.filter(item =>
      item && 
      typeof item.count === 'number' && 
      !isNaN(item.count) &&
      item.confidence
    ) : [],
    voiceStressIndicators: Array.isArray(data.voiceStressIndicators) ? data.voiceStressIndicators : [],
    emotionDistribution: Array.isArray(data.emotionDistribution) ? data.emotionDistribution.filter(item =>
      item && 
      typeof item.count === 'number' && 
      !isNaN(item.count)
    ) : [],
    processingMetrics: data.processingMetrics || {
      avgProcessingTime: 0,
      avgAudioLength: 0,
      successRate: 0,
      totalSessions: 0
    }
  };
};

const validateAndNormalizeChatData = (data: any) => {
  if (!data) return null;
  
  return {
    messageTrends: Array.isArray(data.messageTrends) ? data.messageTrends.filter(item =>
      item && 
      typeof item.total === 'number' && 
      !isNaN(item.total) &&
      item.date
    ) : [],
    sentimentDistribution: Array.isArray(data.sentimentDistribution) ? data.sentimentDistribution.filter(item =>
      item && 
      typeof item.count === 'number' && 
      !isNaN(item.count) &&
      item.sentiment
    ) : [],
    emotionDistribution: Array.isArray(data.emotionDistribution) ? data.emotionDistribution.filter(item =>
      item && 
      typeof item.count === 'number' && 
      !isNaN(item.count) &&
      item.emotion
    ) : [],
    mentalStateDistribution: Array.isArray(data.mentalStateDistribution) ? data.mentalStateDistribution.filter(item =>
      item && 
      typeof item.count === 'number' && 
      !isNaN(item.count) &&
      item.mentalState
    ) : [],
    sentimentEmotionCorrelation: Array.isArray(data.sentimentEmotionCorrelation) ? data.sentimentEmotionCorrelation : [],
    confidenceAnalysis: Array.isArray(data.confidenceAnalysis) ? data.confidenceAnalysis : [],
    sessionMetrics: data.sessionMetrics || {
      totalSessions: 0,
      avgMessagesPerSession: 0,
      avgSentimentPerSession: 0,
      avgConfidencePerSession: 0,
      avgSessionDurationMinutes: 0
    },
    analysisDurationStats: Array.isArray(data.analysisDurationStats) ? data.analysisDurationStats : [],
    summary: data.summary || {
      totalAnalyses: 0,
      dateRange: { start: '', end: '' },
      filters: {
        departmentId: null,
        userId: null,
        modality: 'all',
        sessionType: 'all',
        riskLevel: 'all'
      }
    }
  };
};

const validateAndNormalizeSurveyData = (data: any) => {
  if (!data) return null;
  
  return {
    burnoutTrends: Array.isArray(data.burnoutTrends) ? data.burnoutTrends.filter(item =>
      item && 
      typeof item.avgBurnoutScore === 'number' && 
      !isNaN(item.avgBurnoutScore) &&
      item.date
    ) : [],
    stressLevelDistribution: Array.isArray(data.stressLevelDistribution) ? data.stressLevelDistribution.filter(item =>
      item && 
      typeof item.count === 'number' && 
      !isNaN(item.count) &&
      item.level
    ) : [],
    riskCategoryAnalysis: Array.isArray(data.riskCategoryAnalysis) ? data.riskCategoryAnalysis.filter(item =>
      item && 
      typeof item.count === 'number' && 
      !isNaN(item.count) &&
      item.category
    ) : [],
    completionTimeAnalysis: Array.isArray(data.completionTimeAnalysis) ? data.completionTimeAnalysis : [],
    recommendationStats: Array.isArray(data.recommendationStats) ? data.recommendationStats : [],
    predictionAccuracy: data.predictionAccuracy || {
      avgConfidence: 0,
      highConfidencePredictions: 0,
      totalPredictions: 0,
      predictionsWithConfidence: 0
    }
  };
};

// Real analytics data fetching functions with validation
export const fetchOverviewData = async (filters: AnalyticsFilters) => {
  try {
    const response = await api.get('/analytics/overview', { params: filters });
    return validateAndNormalizeOverviewData(response.data);
  } catch (error) {
    console.warn('Failed to fetch overview data:', error);
    return null;
  }
};

export const fetchVideoAnalytics = async (filters: AnalyticsFilters) => {
  try {
    const response = await api.get('/analytics/video', { params: filters });
    return validateAndNormalizeVideoData(response.data);
  } catch (error) {
    console.warn('Failed to fetch video analytics:', error);
    return null;
  }
};

export const fetchSpeechAnalytics = async (filters: AnalyticsFilters) => {
  try {
    const response = await api.get('/analytics/speech', { params: filters });
    return validateAndNormalizeSpeechData(response.data);
  } catch (error) {
    console.warn('Failed to fetch speech analytics:', error);
    return null;
  }
};

export const fetchChatAnalytics = async (filters: AnalyticsFilters) => {
  try {
    const response = await api.get('/analytics/chat', { params: filters });
    return validateAndNormalizeChatData(response.data);
  } catch (error) {
    console.warn('Failed to fetch chat analytics:', error);
    return null;
  }
};

export const fetchSurveyAnalytics = async (filters: AnalyticsFilters) => {
  try {
    const response = await api.get('/analytics/survey', { params: filters });
    return validateAndNormalizeSurveyData(response.data);
  } catch (error) {
    console.warn('Failed to fetch survey analytics:', error);
    return null;
  }
};

export const fetchDepartmentAnalytics = async (filters: AnalyticsFilters) => {
  try {
    const response = await api.get('/analytics/department', { params: filters });
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch department analytics:', error);
    return null;
  }
};

export const getAnalyticsData = async (filters: AnalyticsFilters): Promise<AnalyticsData> => {
  const results = await Promise.allSettled([
    fetchOverviewData(filters),
    fetchVideoAnalytics(filters),
    fetchSpeechAnalytics(filters),
    fetchChatAnalytics(filters),
    fetchSurveyAnalytics(filters),
    fetchDepartmentAnalytics(filters)
  ]);

  const [
    overview,
    video,
    speech,
    chat,
    survey,
    department
  ] = results.map(result => (result.status === 'fulfilled' ? result.value : null));

  return {
    overview,
    video,
    speech,
    chat,
    survey,
    department
  };
};

export const exportAnalytics = async (filters: AnalyticsFilters): Promise<ExportData> => {
  try {
    const response = await api.post('/analytics/export', filters);
    return response.data;
  } catch (error) {
    console.warn('Failed to export analytics:', error);
    throw error;
  }
};