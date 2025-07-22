export interface AnalyticsFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  modality: 'all' | 'video' | 'speech' | 'chat' | 'survey';
  sessionType: 'all' | 'individual' | 'group';
  riskLevel: 'all' | 'low' | 'moderate' | 'high' | 'severe';
  departmentId?: number;
  userId?: string;
}

export interface OverviewData {
  totalSessions: number;
  totalUsers: number;
  averageSessionDuration: number;
  totalAnalyses: number;
  sessionTrends: Array<{
    date: string;
    sessions: number;
    highRisk: number;
  }>;
  riskDistribution: Array<{
    level: string;
    count: number;
  }>;
  modalityPerformance: Array<{
    modality: string;
    usage: number;
    avgConfidence: number;
  }>;
  mentalStateDistribution: Array<{
    state: string;
    count: number;
  }>;
  recentActivity: Array<{
    id?: string;
    timestamp?: string;
    action?: string;
    user?: string;
    riskLevel?: string;
  }>;
  fallback: boolean;
}

export interface VideoAnalyticsData {
  confidenceDistribution: Array<{
    range: string;
    count: number;
  }>;
  processingTimeAnalysis: Array<{
    processingTime: number;
    confidence: number;
  }>;
  emotionDistribution: Array<{
    emotion: string;
    count: number;
    percentage: number;
  }>;
  faceDetectionStats: {
    avgFacesDetected: number;
    avgFaceQuality: number;
    sessionsWithFaces: number;
    totalSessions: number;
  };
  recentSessions: Array<{
    id: string;
    timestamp: string;
    dominantEmotion: string;
    confidence: number;
    processingTime: number;
    facesDetected: number;
    duration: number;
  }>;
}

export interface SpeechAnalyticsData {
  sentimentTrends: Array<{
    date: string;
    positive: number;
    neutral: number;
    negative: number;
    averageScore: number;
  }>;
  transcriptionAccuracy: Array<{
    confidence: string;
    count: number;
    percentage: number;
  }>;
  voiceStressIndicators: Array<{
    indicator: string;
    normal: number;
    elevated: number;
    high: number;
  }>;
  emotionDistribution: Array<{
    emotion: string | null;
    count: number;
    percentage: number;
  }>;
  processingMetrics: {
    avgProcessingTime: number;
    avgAudioLength: number;
    successRate: number;
    totalSessions: number;
  };
}

export interface ChatAnalyticsData {
  messageTrends: Array<{
    date: string;
    total: number;
    positive: number;
    neutral: number;
    negative: number;
    avgSentimentScore: number;
    avgConfidence: number;
  }>;
  sentimentDistribution: Array<{
    sentiment: string;
    count: number;
    percentage: number;
    avgScore: number;
  }>;
  emotionDistribution: Array<{
    emotion: string;
    count: number;
    percentage: number;
  }>;
  mentalStateDistribution: Array<{
    mentalState: string;
    count: number;
    percentage: number;
    avgConfidence: number;
  }>;
  sentimentEmotionCorrelation: Array<{
    sentiment: string;
    emotion: string;
    count: number;
    avgSentimentScore: number;
  }>;
  confidenceAnalysis: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  sessionMetrics: {
    totalSessions: number;
    avgMessagesPerSession: number;
    avgSentimentPerSession: number;
    avgConfidencePerSession: number;
    avgSessionDurationMinutes: number;
  };
  analysisDurationStats: Array<unknown>;
  summary: {
    totalAnalyses: number;
    dateRange: {
      start: string;
      end: string;
    };
    filters: {
      departmentId: string | null;
      userId: string | null;
      modality: string;
      sessionType: string;
      riskLevel: string;
    };
  };
}

export interface SurveyAnalyticsData {
  burnoutTrends: Array<{
    date: string;
    avgBurnoutScore: number;
    highRiskCount: number;
    totalResponses: number;
  }>;
  stressLevelDistribution: Array<{
    level: string;
    count: number;
    percentage: number;
  }>;
  riskCategoryAnalysis: Array<{
    category: string;
    count: number;
    avgScore: number;
  }>;
  completionTimeAnalysis: Array<{
    timeRange: string;
    count: number;
    avgTimeSeconds: number;
  }>;
  recommendationStats: Array<{
    recommendation: string;
    frequency: number;
    avgBurnoutScore: number;
    followUpSuggested: number;
  }>;
  predictionAccuracy: {
    avgConfidence: number;
    highConfidencePredictions: number;
    totalPredictions: number;
    predictionsWithConfidence: number;
  };
}

export interface DepartmentAnalyticsData {
  departmentMetrics: Array<{
    departmentId: number;
    departmentName: string;
    totalEmployees: number;
    avgBurnoutScore: number;
    riskLevel: string;
    engagementRate: number;
  }>;
  aggregatedTrends: Array<{
    date: string;
    departmentId: number;
    metricType: string;
    value: number;
  }>;
  crossDepartmentComparison: Array<{
    metric: string;
    departments: Array<{
      name: string;
      value: number;
    }>;
  }>;
}

export interface AnalyticsData {
  overview: OverviewData;
  video: VideoAnalyticsData;
  speech: SpeechAnalyticsData;
  chat: ChatAnalyticsData;
  survey: SurveyAnalyticsData;
  department: DepartmentAnalyticsData;
}

export interface ExportData {
  filters: AnalyticsFilters;
  generatedAt: string;
  data: AnalyticsData;
  summary: {
    totalDataPoints: number;
    dateRange: string;
    keyInsights: string[];
    riskAlerts: string[];
    recommendations: string[];
  };
}