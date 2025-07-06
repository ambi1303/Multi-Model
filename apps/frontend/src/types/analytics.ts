export interface AnalyticsFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  modality: 'all' | 'video' | 'speech' | 'chat' | 'survey';
  sessionType: 'all' | 'individual' | 'group';
  riskLevel: 'all' | 'low' | 'moderate' | 'high' | 'severe';
}

export interface OverviewData {
  totalSessions: number;
  sessionGrowth: number;
  averageConfidence: number;
  confidenceChange: number;
  highRiskSessions: number;
  riskChange: number;
  systemAccuracy: number;
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
    accuracy: number;
    usage: number;
  }>;
  topEmotions: Array<{
    emotion: string;
    count: number;
    percentage: number;
  }>;
}

export interface VideoAnalyticsData {
  confidenceDistribution: Array<{
    range: string;
    count: number;
  }>;
  emotionAccuracy: Array<{
    emotion: string;
    accuracy: number;
  }>;
  processingTimeAnalysis: Array<{
    processingTime: number;
    confidence: number;
  }>;
  featureImportance: Array<{
    feature: string;
    importance: number;
  }>;
  recentSessions: Array<{
    id: string;
    timestamp: string;
    dominantEmotion: string;
    confidence: number;
    processingTime: number;
    status: string;
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
    metric: string;
    score: number;
  }>;
  audioQualityMetrics: Array<{
    quality: string;
    count: number;
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
  emotionSpeechCorrelation: Array<{
    emotion: string;
    speechClarity: number;
    speechRate: number;
    confidence: number;
  }>;
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
  responseTimeAnalysis: Array<{
    timeRange: string;
    count: number;
  }>;
  conversationLengthAnalysis: Array<{
    messageCount: number;
    averageSentiment: number;
  }>;
  keywordAnalysis: Array<{
    word: string;
    frequency: number;
    sentiment: string;
  }>;
  userEngagementMetrics: Array<{
    metric: string;
    value: number;
    max: number;
  }>;
}

export interface AnalyticsData {
  overview: OverviewData;
  video: VideoAnalyticsData;
  speech: SpeechAnalyticsData;
  chat: ChatAnalyticsData;
}

export interface ExportData {
  filters: AnalyticsFilters;
  generatedAt: string;
  data: AnalyticsData;
  summary: {
    totalDataPoints: number;
    dateRange: string;
    keyInsights: string[];
  };
}