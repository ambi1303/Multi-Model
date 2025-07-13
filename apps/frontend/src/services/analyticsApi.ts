import api from './api';
import { AnalyticsData, AnalyticsFilters, ExportData } from '../types/analytics';

// Real analytics data fetching functions
export const fetchOverviewData = async (filters: AnalyticsFilters) => {
  const response = await api.get('/analytics/overview', { params: filters });
  return response.data;
};

export const fetchVideoAnalytics = async (filters: AnalyticsFilters) => {
  const response = await api.get('/analytics/video', { params: filters });
  return response.data;
};

export const fetchSpeechAnalytics = async (filters: AnalyticsFilters) => {
  const response = await api.get('/analytics/speech', { params: filters });
  return response.data;
};

export const fetchChatAnalytics = async (filters: AnalyticsFilters) => {
  const response = await api.get('/analytics/chat', { params: filters });
  return response.data;
};

export const fetchEmoBuddyAnalytics = async (filters: AnalyticsFilters) => {
  const response = await api.get('/analytics/emobuddy', { params: filters });
  return response.data;
};

export const fetchSurveyAnalytics = async (filters: AnalyticsFilters) => {
  const response = await api.get('/analytics/survey', { params: filters });
  return response.data;
};

export const fetchDepartmentAnalytics = async (filters: AnalyticsFilters) => {
  const response = await api.get('/analytics/department', { params: filters });
  return response.data;
};

export const getAnalyticsData = async (filters: AnalyticsFilters): Promise<AnalyticsData> => {
  // Generate mock data as fallback
  const mockData = generateMockAnalyticsData(filters);

  // Fetch each analytics data type with individual error handling
  const [
    overview,
    video,
    speech,
    chat,
    emobuddy,
    survey,
    department
  ] = await Promise.all([
    fetchOverviewData(filters).catch(() => mockData.overview),
    fetchVideoAnalytics(filters).catch(() => mockData.video),
    fetchSpeechAnalytics(filters).catch(() => mockData.speech),
    fetchChatAnalytics(filters).catch(() => mockData.chat),
    fetchEmoBuddyAnalytics(filters).catch(() => mockData.emobuddy),
    fetchSurveyAnalytics(filters).catch(() => mockData.survey),
    fetchDepartmentAnalytics(filters).catch(() => mockData.department)
  ]);

  return {
    overview,
    video,
    speech,
    chat,
    emobuddy,
    survey,
    department
  };
};

export const exportAnalytics = async (filters: AnalyticsFilters): Promise<ExportData> => {
  try {
    const response = await api.post('/analytics/export', filters);
    return response.data;
  } catch (error) {
    console.error('Error exporting analytics:', error);
    // Fallback to mock export
    const data = await getAnalyticsData(filters);
    return {
      filters,
      generatedAt: new Date().toISOString(),
      data,
      summary: {
        totalDataPoints: data.overview.totalSessions,
        dateRange: `${filters.dateRange.start.toDateString()} - ${filters.dateRange.end.toDateString()}`,
        keyInsights: [
          `Total sessions: ${data.overview.totalSessions}`,
          `Session growth: ${data.overview.sessionGrowth}%`,
          `High risk sessions: ${data.overview.highRiskSessions}`,
        ],
        riskAlerts: [
          data.overview.highRiskSessions > 50 ? 'High number of risk sessions detected' : '',
          data.overview.riskChange > 20 ? 'Risk levels increasing significantly' : '',
        ].filter(Boolean),
        recommendations: [
          'Regular mental health check-ins recommended',
          'Consider implementing stress management programs',
          'Monitor high-risk employees closely',
        ],
      },
    };
  }
};

// Mock data generator for development/fallback (simplified)
const generateMockAnalyticsData = (filters: AnalyticsFilters): AnalyticsData => {
  const days = Math.ceil((filters.dateRange.end.getTime() - filters.dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    overview: {
      totalSessions: Math.floor(Math.random() * 1000) + 500,
      sessionGrowth: Math.floor(Math.random() * 30) - 10,
      averageConfidence: Math.random() * 0.3 + 0.7,
      confidenceChange: Math.floor(Math.random() * 10) - 5,
      highRiskSessions: Math.floor(Math.random() * 50) + 10,
      riskChange: Math.floor(Math.random() * 20) - 10,
      sessionTrends: Array.from({ length: Math.min(days, 30) }, (_, i) => ({
        date: new Date(filters.dateRange.start.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sessions: Math.floor(Math.random() * 50) + 10,
        highRisk: Math.floor(Math.random() * 10) + 1,
      })),
      riskDistribution: [
        { level: 'Low', count: Math.floor(Math.random() * 200) + 100 },
        { level: 'Moderate', count: Math.floor(Math.random() * 100) + 50 },
        { level: 'High', count: Math.floor(Math.random() * 50) + 20 },
        { level: 'Severe', count: Math.floor(Math.random() * 20) + 5 },
      ],
      modalityPerformance: [
        { modality: 'Video', avgConfidence: Math.random() * 20 + 80, usage: Math.random() * 40 + 60 },
        { modality: 'Speech', avgConfidence: Math.random() * 20 + 80, usage: Math.random() * 40 + 60 },
        { modality: 'Chat', avgConfidence: Math.random() * 20 + 80, usage: Math.random() * 40 + 60 },
        { modality: 'Survey', avgConfidence: Math.random() * 20 + 80, usage: Math.random() * 40 + 60 },
      ],
      topEmotions: [
        { emotion: 'neutral', count: 450, percentage: 35 },
        { emotion: 'happy', count: 320, percentage: 25 },
        { emotion: 'sad', count: 280, percentage: 22 },
        { emotion: 'angry', count: 150, percentage: 12 },
        { emotion: 'fear', count: 80, percentage: 6 },
      ],
      mentalStateDistribution: [
        { state: 'calm', count: 350, percentage: 30 },
        { state: 'stressed', count: 280, percentage: 24 },
        { state: 'anxious', count: 200, percentage: 17 },
        { state: 'focused', count: 180, percentage: 15 },
        { state: 'depressed', count: 120, percentage: 10 },
        { state: 'excited', count: 50, percentage: 4 },
      ],
    },
    video: {
      confidenceDistribution: [
        { range: '0-20%', count: 15 },
        { range: '20-40%', count: 35 },
        { range: '40-60%', count: 85 },
        { range: '60-80%', count: 150 },
        { range: '80-100%', count: 200 },
      ],
      processingTimeAnalysis: Array.from({ length: 20 }, (_, i) => ({
        processingTime: i * 100 + Math.random() * 100,
        confidence: Math.random() * 0.3 + 0.7,
      })),
      emotionDistribution: [
        { emotion: 'neutral', count: 120, percentage: 35 },
        { emotion: 'happy', count: 80, percentage: 23 },
        { emotion: 'sad', count: 60, percentage: 17 },
        { emotion: 'angry', count: 40, percentage: 12 },
        { emotion: 'surprise', count: 30, percentage: 9 },
        { emotion: 'fear', count: 15, percentage: 4 },
      ],
      faceDetectionStats: {
        avgFacesDetected: 1.2,
        avgFaceQuality: 0.85,
        sessionsWithFaces: 320,
        totalSessions: 345,
      },
      recentSessions: Array.from({ length: 10 }, (_, i) => ({
        id: `session_${i}`,
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        dominantEmotion: ['happy', 'sad', 'neutral', 'angry'][Math.floor(Math.random() * 4)],
        confidence: Math.random() * 0.3 + 0.7,
        processingTime: Math.floor(Math.random() * 2000) + 500,
        facesDetected: Math.floor(Math.random() * 3) + 1,
        duration: Math.floor(Math.random() * 120) + 30,
      })),
    },
    speech: {
      sentimentTrends: Array.from({ length: Math.min(days, 30) }, (_, i) => ({
        date: new Date(filters.dateRange.start.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        positive: Math.floor(Math.random() * 30) + 20,
        neutral: Math.floor(Math.random() * 40) + 30,
        negative: Math.floor(Math.random() * 20) + 10,
        averageScore: Math.random() * 0.6 + 0.2,
      })),
      durationAnalysis: [
        { duration: '0-30s', count: 45 },
        { duration: '30-60s', count: 80 },
        { duration: '1-2min', count: 120 },
        { duration: '2-5min', count: 150 },
        { duration: '5+ min', count: 85 },
      ],
      languageDistribution: [
        { language: 'en', count: 420, percentage: 85 },
        { language: 'es', count: 35, percentage: 7 },
        { language: 'fr', count: 25, percentage: 5 },
        { language: 'de', count: 15, percentage: 3 },
      ],
      speakingRateAnalysis: [
        { range: '0-100 wpm', count: 20, avgPauses: 15 },
        { range: '100-150 wpm', count: 80, avgPauses: 12 },
        { range: '150-200 wpm', count: 120, avgPauses: 8 },
        { range: '200+ wpm', count: 60, avgPauses: 5 },
      ],
      emotionSpeechCorrelation: [
        { emotion: 'happy', avgSpeakingRate: 165, avgPauseCount: 8, confidence: 0.85 },
        { emotion: 'sad', avgSpeakingRate: 120, avgPauseCount: 15, confidence: 0.78 },
        { emotion: 'angry', avgSpeakingRate: 180, avgPauseCount: 6, confidence: 0.82 },
        { emotion: 'neutral', avgSpeakingRate: 145, avgPauseCount: 10, confidence: 0.75 },
      ],
      processingTimeStats: {
        avgProcessingTime: 1250,
        minProcessingTime: 450,
        maxProcessingTime: 3200,
      },
    },
    chat: {
      messageVolumeTrends: Array.from({ length: Math.min(days, 30) }, (_, i) => ({
        date: new Date(filters.dateRange.start.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        messageCount: Math.floor(Math.random() * 100) + 50,
        averageSentiment: Math.random() * 0.6 + 0.2,
      })),
      mentalStateDistribution: [
        { state: 'calm', count: 180, percentage: 35 },
        { state: 'stressed', count: 120, percentage: 23 },
        { state: 'anxious', count: 100, percentage: 19 },
        { state: 'focused', count: 80, percentage: 15 },
        { state: 'depressed', count: 40, percentage: 8 },
      ],
      sentimentDistribution: [
        { sentiment: 'positive', count: 200, percentage: 40 },
        { sentiment: 'neutral', count: 180, percentage: 36 },
        { sentiment: 'negative', count: 120, percentage: 24 },
      ],
      sessionLengthAnalysis: [
        { messageCount: 5, sessionCount: 45, avgSentiment: 0.6 },
        { messageCount: 10, sessionCount: 80, avgSentiment: 0.5 },
        { messageCount: 15, sessionCount: 120, avgSentiment: 0.4 },
        { messageCount: 20, sessionCount: 90, avgSentiment: 0.3 },
      ],
      confidenceAnalysis: [
        { range: '0-0.5', count: 25 },
        { range: '0.5-0.7', count: 60 },
        { range: '0.7-0.85', count: 120 },
        { range: '0.85-1.0', count: 95 },
      ],
    },
    emobuddy: {
      sessionStats: {
        totalSessions: 450,
        activeSessions: 25,
        avgSessionDuration: 18.5,
        avgMessagesPerSession: 12.3,
      },
      responseTimeAnalysis: [
        { timeRange: '0-1s', count: 180 },
        { timeRange: '1-2s', count: 120 },
        { timeRange: '2-3s', count: 80 },
        { timeRange: '3-5s', count: 50 },
        { timeRange: '5+s', count: 20 },
      ],
      techniquesUsed: [
        { technique: 'Active Listening', count: 220, effectivenessScore: 0.85 },
        { technique: 'CBT', count: 180, effectivenessScore: 0.78 },
        { technique: 'Mindfulness', count: 150, effectivenessScore: 0.82 },
        { technique: 'Validation', count: 130, effectivenessScore: 0.88 },
      ],
      crisisDetection: {
        totalCrisisFlags: 15,
        crisisSessionsToday: 2,
        crisisTrends: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          crisisCount: Math.floor(Math.random() * 5),
        })),
      },
      userSatisfaction: {
        avgScore: 4.2,
        distribution: [
          { score: 1, count: 5 },
          { score: 2, count: 15 },
          { score: 3, count: 45 },
          { score: 4, count: 120 },
          { score: 5, count: 165 },
        ],
      },
      therapeuticProgress: [
        { indicator: 'Mood Improvement', improvement: 0.15, sessionCount: 85 },
        { indicator: 'Stress Reduction', improvement: 0.22, sessionCount: 120 },
        { indicator: 'Communication Skills', improvement: 0.18, sessionCount: 65 },
        { indicator: 'Coping Strategies', improvement: 0.28, sessionCount: 95 },
      ],
    },
    survey: {
      burnoutTrends: Array.from({ length: Math.min(days, 30) }, (_, i) => ({
        date: new Date(filters.dateRange.start.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        avgBurnoutScore: Math.random() * 0.4 + 0.3,
        highRiskCount: Math.floor(Math.random() * 10) + 2,
      })),
      stressLevelDistribution: [
        { level: 'Low', count: 120, percentage: 40 },
        { level: 'Moderate', count: 100, percentage: 33 },
        { level: 'High', count: 60, percentage: 20 },
        { level: 'Severe', count: 20, percentage: 7 },
      ],
      riskCategoryAnalysis: [
        { category: 'Workload', count: 85, avgScore: 0.65 },
        { category: 'Work-Life Balance', count: 78, avgScore: 0.58 },
        { category: 'Support System', count: 65, avgScore: 0.45 },
        { category: 'Recognition', count: 55, avgScore: 0.52 },
      ],
      completionTimeAnalysis: [
        { timeRange: '0-5min', count: 180 },
        { timeRange: '5-10min', count: 85 },
        { timeRange: '10-15min', count: 25 },
        { timeRange: '15+min', count: 10 },
      ],
      predictionAccuracy: {
        avgConfidence: 0.82,
        highConfidencePredictions: 240,
        totalPredictions: 300,
      },
      recommendationStats: [
        { recommendation: 'Take Regular Breaks', frequency: 120, effectiveness: 0.75 },
        { recommendation: 'Stress Management Training', frequency: 95, effectiveness: 0.68 },
        { recommendation: 'Workload Adjustment', frequency: 80, effectiveness: 0.82 },
        { recommendation: 'Team Support', frequency: 65, effectiveness: 0.71 },
      ],
    },
    department: {
      departmentMetrics: [
        { departmentId: 1, departmentName: 'Engineering', totalEmployees: 45, avgBurnoutScore: 0.42, riskLevel: 'Moderate', engagementRate: 0.78 },
        { departmentId: 2, departmentName: 'Marketing', totalEmployees: 32, avgBurnoutScore: 0.35, riskLevel: 'Low', engagementRate: 0.82 },
        { departmentId: 3, departmentName: 'Sales', totalEmployees: 28, avgBurnoutScore: 0.58, riskLevel: 'High', engagementRate: 0.65 },
        { departmentId: 4, departmentName: 'HR', totalEmployees: 12, avgBurnoutScore: 0.31, riskLevel: 'Low', engagementRate: 0.88 },
      ],
      aggregatedTrends: Array.from({ length: Math.min(days, 30) }, (_, i) => ({
        date: new Date(filters.dateRange.start.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        departmentId: Math.floor(Math.random() * 4) + 1,
        metricType: ['burnout', 'stress', 'engagement'][Math.floor(Math.random() * 3)],
        value: Math.random(),
      })),
      crossDepartmentComparison: [
        {
          metric: 'Burnout Score',
          departments: [
            { name: 'Engineering', value: 0.42 },
            { name: 'Marketing', value: 0.35 },
            { name: 'Sales', value: 0.58 },
            { name: 'HR', value: 0.31 },
          ],
        },
        {
          metric: 'Engagement Rate',
          departments: [
            { name: 'Engineering', value: 0.78 },
            { name: 'Marketing', value: 0.82 },
            { name: 'Sales', value: 0.65 },
            { name: 'HR', value: 0.88 },
          ],
        },
      ],
    },
  };
};