import api, { apiCall } from './api';
import { AnalyticsData, AnalyticsFilters, ExportData } from '../types/analytics';

// Mock data generator for demonstration
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
      systemAccuracy: Math.random() * 0.1 + 0.9,
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
        { modality: 'Video', accuracy: Math.random() * 20 + 80, usage: Math.random() * 40 + 60 },
        { modality: 'Speech', accuracy: Math.random() * 20 + 80, usage: Math.random() * 40 + 60 },
        { modality: 'Chat', accuracy: Math.random() * 20 + 80, usage: Math.random() * 40 + 60 },
        { modality: 'Survey', accuracy: Math.random() * 20 + 80, usage: Math.random() * 40 + 60 },
      ],
      topEmotions: [
        { emotion: 'neutral', count: 450, percentage: 35 },
        { emotion: 'happy', count: 320, percentage: 25 },
        { emotion: 'anxious', count: 280, percentage: 22 },
        { emotion: 'sad', count: 150, percentage: 12 },
        { emotion: 'angry', count: 80, percentage: 6 },
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
      emotionAccuracy: [
        { emotion: 'Happy', accuracy: 92 },
        { emotion: 'Sad', accuracy: 88 },
        { emotion: 'Angry', accuracy: 85 },
        { emotion: 'Surprised', accuracy: 90 },
        { emotion: 'Neutral', accuracy: 95 },
        { emotion: 'Fearful', accuracy: 82 },
      ],
      processingTimeAnalysis: Array.from({ length: 100 }, () => ({
        processingTime: Math.random() * 2000 + 500,
        confidence: Math.random() * 0.4 + 0.6,
      })),
      featureImportance: [],
      recentSessions: Array.from({ length: 10 }, (_, i) => ({
        id: `session_${Date.now()}_${i}`,
        timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
        dominantEmotion: ['happy', 'sad', 'neutral', 'angry'][Math.floor(Math.random() * 4)],
        confidence: Math.random() * 0.4 + 0.6,
        processingTime: Math.floor(Math.random() * 1000) + 500,
        status: 'completed',
      })),
    },
    speech: {
      sentimentTrends: Array.from({ length: Math.min(days, 30) }, (_, i) => ({
        date: new Date(filters.dateRange.start.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        positive: Math.floor(Math.random() * 30) + 10,
        neutral: Math.floor(Math.random() * 40) + 20,
        negative: Math.floor(Math.random() * 20) + 5,
        averageScore: Math.random() * 2 - 1,
      })),
      transcriptionAccuracy: [
        { metric: 'Word Accuracy', score: 0.94 },
        { metric: 'Sentence Accuracy', score: 0.89 },
        { metric: 'Punctuation', score: 0.76 },
        { metric: 'Speaker Recognition', score: 0.92 },
      ],
      audioQualityMetrics: [
        { quality: 'Excellent', count: 120 },
        { quality: 'Good', count: 180 },
        { quality: 'Fair', count: 85 },
        { quality: 'Poor', count: 25 },
      ],
      durationAnalysis: [
        { duration: '0-30s', count: 45 },
        { duration: '30-60s', count: 120 },
        { duration: '1-2m', count: 180 },
        { duration: '2-5m', count: 95 },
        { duration: '5m+', count: 35 },
      ],
      languageDistribution: [
        { language: 'English', count: 380, percentage: 76 },
        { language: 'Spanish', count: 65, percentage: 13 },
        { language: 'French', count: 35, percentage: 7 },
        { language: 'Other', count: 20, percentage: 4 },
      ],
      emotionSpeechCorrelation: [
        { emotion: 'Happy', speechClarity: 85, speechRate: 120, confidence: 92 },
        { emotion: 'Sad', speechClarity: 70, speechRate: 80, confidence: 88 },
        { emotion: 'Angry', speechClarity: 75, speechRate: 150, confidence: 85 },
        { emotion: 'Neutral', speechClarity: 90, speechRate: 100, confidence: 95 },
      ],
    },
    chat: {
      messageVolumeTrends: Array.from({ length: Math.min(days, 30) }, (_, i) => ({
        date: new Date(filters.dateRange.start.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        messageCount: Math.floor(Math.random() * 100) + 50,
        averageSentiment: Math.random() * 2 - 1,
      })),
      mentalStateDistribution: [
        { state: 'confident', count: 180, percentage: 30 },
        { state: 'anxious', count: 150, percentage: 25 },
        { state: 'calm', count: 120, percentage: 20 },
        { state: 'stressed', count: 90, percentage: 15 },
        { state: 'excited', count: 60, percentage: 10 },
      ],
      responseTimeAnalysis: [
        { timeRange: '0-5s', count: 120 },
        { timeRange: '5-15s', count: 180 },
        { timeRange: '15-30s', count: 95 },
        { timeRange: '30s+', count: 45 },
      ],
      conversationLengthAnalysis: Array.from({ length: 50 }, () => ({
        messageCount: Math.floor(Math.random() * 20) + 1,
        averageSentiment: Math.random() * 2 - 1,
      })),
      keywordAnalysis: [
        { word: 'stressed', frequency: 45, sentiment: 'negative' },
        { word: 'happy', frequency: 38, sentiment: 'positive' },
        { word: 'worried', frequency: 32, sentiment: 'negative' },
        { word: 'excited', frequency: 28, sentiment: 'positive' },
        { word: 'tired', frequency: 25, sentiment: 'negative' },
        { word: 'confident', frequency: 22, sentiment: 'positive' },
      ],
      userEngagementMetrics: [
        { metric: 'Avg Messages/Session', value: 12, max: 20 },
        { metric: 'Session Duration', value: 8, max: 15 },
        { metric: 'Response Rate', value: 85, max: 100 },
        { metric: 'Completion Rate', value: 78, max: 100 },
      ],
    },
    burnout: {
      riskTrends: Array.from({ length: Math.min(days, 30) }, (_, i) => ({
        date: new Date(filters.dateRange.start.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        low: Math.floor(Math.random() * 20) + 40,
        moderate: Math.floor(Math.random() * 15) + 25,
        high: Math.floor(Math.random() * 10) + 15,
        severe: Math.floor(Math.random() * 5) + 5,
      })),
      currentRiskDistribution: [
        { level: 'Low', count: 180 },
        { level: 'Moderate', count: 95 },
        { level: 'High', count: 45 },
        { level: 'Severe', count: 15 },
      ],
      factorAnalysis: [
        { factor: 'Workload', averageScore: 7.2, riskThreshold: 6.0 },
        { factor: 'Work-Life Balance', averageScore: 5.8, riskThreshold: 6.0 },
        { factor: 'Job Satisfaction', averageScore: 6.5, riskThreshold: 6.0 },
        { factor: 'Stress Level', averageScore: 6.8, riskThreshold: 6.0 },
        { factor: 'Support System', averageScore: 5.2, riskThreshold: 6.0 },
        { factor: 'Sleep Quality', averageScore: 5.9, riskThreshold: 6.0 },
      ],
      departmentComparison: [
        { department: 'Engineering', averageRisk: 6.8 },
        { department: 'Sales', averageRisk: 7.2 },
        { department: 'Marketing', averageRisk: 5.9 },
        { department: 'HR', averageRisk: 5.4 },
        { department: 'Finance', averageRisk: 6.1 },
      ],
      interventionEffectiveness: Array.from({ length: 12 }, (_, i) => ({
        week: `Week ${i + 1}`,
        beforeIntervention: 7.2 - (i * 0.1),
        afterIntervention: 6.8 - (i * 0.15),
      })),
      predictiveIndicators: [
        { indicator: 'Overtime Hours', importance: 0.85 },
        { indicator: 'Sleep Quality', importance: 0.72 },
        { indicator: 'Team Communication', importance: 0.68 },
        { indicator: 'Workload Distribution', importance: 0.65 },
        { indicator: 'Manager Support', importance: 0.58 },
      ],
      recommendations: [
        {
          category: 'Workload Management',
          description: 'Implement task prioritization and delegation strategies to reduce individual workload pressure.',
          priority: 'High',
          expectedImpact: '15-20% reduction in stress levels',
        },
        {
          category: 'Team Communication',
          description: 'Establish regular check-ins and improve communication channels between team members.',
          priority: 'Medium',
          expectedImpact: '10-15% improvement in job satisfaction',
        },
        {
          category: 'Wellness Programs',
          description: 'Introduce mindfulness sessions and stress management workshops for employees.',
          priority: 'Medium',
          expectedImpact: '12-18% improvement in overall well-being',
        },
      ],
      riskAlerts: [
        {
          level: 'High',
          message: 'Engineering department showing elevated burnout risk',
          count: 12,
        },
      ],
    },
  };
};

export const analyticsApi = {
  getAnalytics: async (filters: AnalyticsFilters): Promise<AnalyticsData> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Fetch real video analytics
    let realVideoAnalytics = null;
    try {
      const response = await api.get('/api/video/analytics');
      realVideoAnalytics = response.data;
    } catch (e) {
      // fallback to mock if real API fails
      realVideoAnalytics = null;
    }

    // Get the rest of the mock analytics
    const mock = generateMockAnalyticsData(filters);
    // Replace only the video section with real data if available
    if (realVideoAnalytics) {
      mock.video.confidenceDistribution = realVideoAnalytics.confidenceDistribution || [];
      mock.video.emotionAccuracy = realVideoAnalytics.emotionAccuracy || [];
      // Add more fields as you expand the backend
    }
    return mock;
  },

  exportData: async (filters: AnalyticsFilters): Promise<ExportData> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const data = generateMockAnalyticsData(filters);
    
    return {
      filters,
      generatedAt: new Date().toISOString(),
      data,
      summary: {
        totalDataPoints: data.overview.totalSessions,
        dateRange: `${filters.dateRange.start.toISOString().split('T')[0]} to ${filters.dateRange.end.toISOString().split('T')[0]}`,
        keyInsights: [
          `${data.overview.totalSessions} total sessions analyzed`,
          `${data.overview.highRiskSessions} high-risk sessions identified`,
          `${(data.overview.systemAccuracy * 100).toFixed(1)}% overall system accuracy`,
        ],
      },
    };
  },

  getRealtimeMetrics: async (): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      activeSessions: Math.floor(Math.random() * 50) + 10,
      processingQueue: Math.floor(Math.random() * 20),
      systemLoad: Math.random() * 0.3 + 0.4,
      errorRate: Math.random() * 0.05,
    };
  },
};