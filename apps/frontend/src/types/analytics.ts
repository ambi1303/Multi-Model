export interface AnalyticsFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  modality: 'all' | 'video' | 'speech' | 'chat' | 'survey' | 'emobuddy';
  sessionType: 'all' | 'individual' | 'group';
  riskLevel: 'all' | 'low' | 'moderate' | 'high' | 'severe';
  departmentId?: number;
  userId?: string;
}

export interface OverviewData {
  totalSessions: number;
  sessionGrowth: number;
  averageConfidence: number;
  confidenceChange: number;
  highRiskSessions: number;
  riskChange: number;
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
  topEmotions: Array<{
    emotion: string;
    count: number;
    percentage: number;
  }>;
  mentalStateDistribution: Array<{
    state: string;
    count: number;
    percentage: number;
  }>;
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
  durationAnalysis: Array<{
    duration: string;
    count: number;
  }>;
  languageDistribution: Array<{
    language: string;
    count: number;
    percentage: number;
  }>;
  speakingRateAnalysis: Array<{
    range: string;
    count: number;
    avgPauses: number;
  }>;
  emotionSpeechCorrelation: Array<{
    emotion: string;
    avgSpeakingRate: number;
    avgPauseCount: number;
    confidence: number;
  }>;
  processingTimeStats: {
    avgProcessingTime: number;
    minProcessingTime: number;
    maxProcessingTime: number;
  };
}

export interface ChatAnalyticsData {
  messageVolumeTrends: Array<{
    date: string;
    messageCount: number;
    averageSentiment: number;
  }>;
  mentalStateDistribution: Array<{
    state: string;
    count: number;
    percentage: number;
  }>;
  sentimentDistribution: Array<{
    sentiment: string;
    count: number;
    percentage: number;
  }>;
  sessionLengthAnalysis: Array<{
    messageCount: number;
    sessionCount: number;
    avgSentiment: number;
  }>;
  confidenceAnalysis: Array<{
    range: string;
    count: number;
  }>;
}

export interface EmoBuddyAnalyticsData {
  sessionStats: {
    totalSessions: number;
    activeSessions: number;
    avgSessionDuration: number;
    avgMessagesPerSession: number;
  };
  responseTimeAnalysis: Array<{
    timeRange: string;
    count: number;
  }>;
  techniquesUsed: Array<{
    technique: string;
    count: number;
    effectivenessScore: number;
  }>;
  crisisDetection: {
    totalCrisisFlags: number;
    crisisSessionsToday: number;
    crisisTrends: Array<{
      date: string;
      crisisCount: number;
    }>;
  };
  userSatisfaction: {
    avgScore: number;
    distribution: Array<{
      score: number;
      count: number;
    }>;
  };
  therapeuticProgress: Array<{
    indicator: string;
    improvement: number;
    sessionCount: number;
  }>;
}

export interface SurveyAnalyticsData {
  burnoutTrends: Array<{
    date: string;
    avgBurnoutScore: number;
    highRiskCount: number;
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
  }>;
  predictionAccuracy: {
    avgConfidence: number;
    highConfidencePredictions: number;
    totalPredictions: number;
  };
  recommendationStats: Array<{
    recommendation: string;
    frequency: number;
    effectiveness: number;
  }>;
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
  emobuddy: EmoBuddyAnalyticsData;
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