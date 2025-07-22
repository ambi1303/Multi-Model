import api from './api';
import { AnalyticsData, AnalyticsFilters } from '../types/analytics';

// Performance monitoring interface
interface AnalyticsPerformance {
  cached: boolean;
  query_time: number;
  endpoints_consolidated: number;
  cache_hit?: boolean;
  response_time?: number;
}

// Extended analytics data with performance metrics
interface OptimizedAnalyticsData extends AnalyticsData {
  performance?: AnalyticsPerformance;
  access_info?: {
    user_id: string;
    role: string;
    access_level: string;
    description: string;
    data_scope: string;
  };
}

class OptimizedAnalyticsService {
  private cache = new Map<string, { data: OptimizedAnalyticsData; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private requestQueue = new Map<string, Promise<OptimizedAnalyticsData>>();

  private generateCacheKey(filters: AnalyticsFilters): string {
    return JSON.stringify(filters, Object.keys(filters).sort());
  }

  private isCacheValid(cacheEntry: { timestamp: number; ttl: number }): boolean {
    return Date.now() - cacheEntry.timestamp < cacheEntry.ttl;
  }

  private getCachedData(filters: AnalyticsFilters): OptimizedAnalyticsData | null {
    const key = this.generateCacheKey(filters);
    const cached = this.cache.get(key);
    
    if (cached && this.isCacheValid(cached)) {
      console.log('📊 Analytics cache hit:', key);
      return {
        ...cached.data,
        performance: {
          ...cached.data.performance,
          cache_hit: true,
          response_time: 0
        }
      };
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  private setCachedData(filters: AnalyticsFilters, data: OptimizedAnalyticsData, ttl = this.DEFAULT_TTL): void {
    const key = this.generateCacheKey(filters);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    // Clean up old cache entries
    this.cleanupCache();
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isCacheValid(entry)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get all analytics data using the optimized unified endpoint
   * This reduces API calls from 6 to 1 and includes intelligent caching
   */
  async getOptimizedAnalyticsData(filters: AnalyticsFilters): Promise<OptimizedAnalyticsData> {
    const startTime = Date.now();
    
    // Check cache first
    const cachedData = this.getCachedData(filters);
    if (cachedData) {
      return cachedData;
    }

    // Check if there's already a request in progress for this filter set
    const cacheKey = this.generateCacheKey(filters);
    if (this.requestQueue.has(cacheKey)) {
      console.log('📊 Joining existing analytics request');
      return this.requestQueue.get(cacheKey)!;
    }

    // Create new request
    const requestPromise = this.fetchUnifiedAnalytics(filters, startTime);
    this.requestQueue.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      this.setCachedData(filters, result);
      return result;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  private async fetchUnifiedAnalytics(filters: AnalyticsFilters, startTime: number): Promise<OptimizedAnalyticsData> {
    try {
      console.log('📊 Fetching unified analytics data...');
      
      const response = await api.get('/analytics/unified', { params: filters });
      const responseTime = Date.now() - startTime;
      
      console.log(`📊 Unified analytics loaded in ${responseTime}ms`);
      
      // Transform the response to match the expected AnalyticsData structure
      const data: OptimizedAnalyticsData = {
        overview: this.validateAndNormalizeOverviewData(response.data.overview),
        video: this.validateAndNormalizeVideoData(response.data.video),
        speech: this.validateAndNormalizeSpeechData(response.data.speech),
        chat: this.validateAndNormalizeChatData(response.data.chat),
        survey: this.validateAndNormalizeSurveyData(response.data.survey),
        department: null, // Will be added later if needed
        performance: {
          ...response.data.performance,
          response_time: responseTime,
          cache_hit: false
        },
        access_info: response.data.access_info
      };

      return data;
    } catch (error) {
      console.error('📊 Failed to fetch unified analytics:', error);
      
      // Fall back to individual API calls if unified endpoint fails
      console.log('📊 Falling back to individual API calls...');
      return this.fallbackToIndividualCalls(filters, startTime);
    }
  }

  private async fallbackToIndividualCalls(filters: AnalyticsFilters, startTime: number): Promise<OptimizedAnalyticsData> {
    // Import the original analytics functions for fallback
    const { getAnalyticsData } = await import('./analyticsApi');
    
    console.log('📊 Using fallback analytics API...');
    const data = await getAnalyticsData(filters);
    const responseTime = Date.now() - startTime;
    
    return {
      ...data,
      performance: {
        cached: false,
        query_time: responseTime / 1000,
        endpoints_consolidated: 0, // Using individual endpoints
        response_time: responseTime,
        cache_hit: false
      }
    };
  }

  // Data validation functions (reused from original analyticsApi.ts)
  private validateAndNormalizeOverviewData(data: any) {
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
  }

  private validateAndNormalizeVideoData(data: any) {
    if (!data) return null;
    
    // Transform optimized response to match expected structure
    return {
      confidenceDistribution: [],
      processingTimeAnalysis: [],
      emotionDistribution: Array.isArray(data.emotion_distribution) ? data.emotion_distribution : [],
      faceDetectionStats: {
        avgFacesDetected: data.faces_detected || 0,
        avgFaceQuality: data.avg_confidence || 0,
        sessionsWithFaces: data.total_analyses || 0,
        totalSessions: data.total_analyses || 0
      },
      recentSessions: []
    };
  }

  private validateAndNormalizeSpeechData(data: any) {
    if (!data) return null;
    
    return {
      sentimentTrends: [],
      transcriptionAccuracy: [],
      voiceStressIndicators: [],
      emotionDistribution: [],
      processingMetrics: {
        avgProcessingTime: 0,
        avgAudioLength: data.avg_duration || 0,
        successRate: data.avg_confidence || 0,
        totalSessions: data.total_analyses || 0
      }
    };
  }

  private validateAndNormalizeChatData(data: any) {
    if (!data) return null;
    
    return {
      messageTrends: [],
      sentimentDistribution: [],
      emotionDistribution: [],
      mentalStateDistribution: [],
      sentimentEmotionCorrelation: [],
      confidenceAnalysis: [],
      sessionMetrics: {
        totalSessions: data.unique_sessions || 0,
        avgMessagesPerSession: data.total_messages && data.unique_sessions ? 
          data.total_messages / data.unique_sessions : 0,
        avgSentimentPerSession: data.avg_sentiment || 0,
        avgConfidencePerSession: data.avg_confidence || 0,
        avgSessionDurationMinutes: 0
      },
      analysisDurationStats: [],
      summary: {
        totalAnalyses: data.total_messages || 0,
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
  }

  private validateAndNormalizeSurveyData(data: any) {
    if (!data) return null;
    
    return {
      burnoutTrends: [],
      stressLevelDistribution: [],
      riskCategoryAnalysis: [],
      completionTimeAnalysis: [],
      recommendationStats: [],
      predictionAccuracy: {
        avgConfidence: data.avg_confidence || 0,
        highConfidencePredictions: data.high_risk_count || 0,
        totalPredictions: data.total_responses || 0,
        predictionsWithConfidence: data.total_responses || 0
      }
    };
  }

  /**
   * Clear the analytics cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('📊 Analytics cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    const validEntries = Array.from(this.cache.values()).filter(entry => this.isCacheValid(entry));
    
    return {
      totalEntries: this.cache.size,
      validEntries: validEntries.length,
      hitRatio: validEntries.length / Math.max(this.cache.size, 1),
      oldestEntry: Math.min(...validEntries.map(entry => now - entry.timestamp)),
      averageAge: validEntries.reduce((sum, entry) => sum + (now - entry.timestamp), 0) / Math.max(validEntries.length, 1)
    };
  }

  /**
   * Clear the backend analytics cache (admin only)
   */
  async clearBackendCache(): Promise<void> {
    try {
      await api.post('/analytics/cache/clear');
      console.log('📊 Backend analytics cache cleared');
    } catch (error) {
      console.error('📊 Failed to clear backend cache:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const optimizedAnalyticsService = new OptimizedAnalyticsService();

// Export for backward compatibility and gradual migration
export const getOptimizedAnalyticsData = (filters: AnalyticsFilters) => 
  optimizedAnalyticsService.getOptimizedAnalyticsData(filters);

export default optimizedAnalyticsService; 