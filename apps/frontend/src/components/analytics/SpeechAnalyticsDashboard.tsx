import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Alert,
  LinearProgress,
  Tooltip,
  IconButton,
  Button,
} from '@mui/material';
import {
  MicIcon,
  TimerIcon,
  CheckCircleIcon,
  WarningIcon,
  InfoIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  BarChartIcon,
  PsychologyIcon,
  VolumeUpIcon,
  AssessmentIcon,
  DownloadIcon,
  EmojiEmotionsIcon,
} from '../../utils/icons';
import { SimpleChartFallback } from '../charts/SimpleChartFallback';
import { motion } from 'framer-motion';
import { SpeechAnalyticsData, AnalyticsFilters } from '../../types/analytics';

interface SpeechAnalyticsDashboardProps {
  data: SpeechAnalyticsData;
  filters: AnalyticsFilters;
}

export const SpeechAnalyticsDashboard: React.FC<SpeechAnalyticsDashboardProps> = ({ data, filters }) => {
  const [showDataWarnings, setShowDataWarnings] = useState(true);

  // Add null safety - provide default values if data is undefined
  const safeData = data || {
    sentimentTrends: [],
    transcriptionAccuracy: [],
    voiceStressIndicators: [],
    emotionDistribution: [],
    processingMetrics: {
      avgProcessingTime: 0,
      avgAudioLength: 0,
      successRate: 0,
      totalSessions: 0
    }
  };

  // Helper functions
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatAudioLength = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins.toFixed(1)} min`;
  };

  const getConfidenceColor = (confidence: string) => {
    if (confidence.includes('0.9') || confidence.includes('1.0')) return 'success';
    if (confidence.includes('0.8') || confidence.includes('0.7')) return 'warning';
    return 'error';
  };

  const getStressColor = (level: 'normal' | 'elevated' | 'high') => {
    switch (level) {
      case 'normal': return '#4CAF50';
      case 'elevated': return '#FF9800';
      case 'high': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStressIcon = (indicator: string) => {
    switch (indicator) {
      case 'speaking_rate': return '🗣️';
      case 'pause_frequency': return '⏸️';
      case 'voice_tremor': return '🎤';
      default: return '📊';
    }
  };

  // Calculate derived metrics
  const avgTranscriptionConfidence = safeData.transcriptionAccuracy.length > 0
    ? safeData.transcriptionAccuracy.reduce((sum, item) => {
        const midpoint = item.confidence === '0.9-1.0' ? 0.95 :
                        item.confidence === '0.8-0.9' ? 0.85 :
                        item.confidence === '0.7-0.8' ? 0.75 : 0.3;
        return sum + (midpoint * item.count);
      }, 0) / safeData.transcriptionAccuracy.reduce((sum, item) => sum + item.count, 0)
    : 0;

  // Data quality checks
  const hasProcessingTimeIssue = safeData.processingMetrics.avgProcessingTime === 0;
  const hasLowSuccessRate = safeData.processingMetrics.successRate < 0.5;
  const hasNoEmotionData = safeData.emotionDistribution.length === 0 || 
                           safeData.emotionDistribution.every(item => item.emotion === null);
  const hasSentimentIssue = safeData.sentimentTrends.every(item => 
    item.positive === 0 && item.neutral === 0 && item.negative === 0
  );

  const handleExportData = () => {
    const exportData = {
      filters,
      data: safeData,
      generatedAt: new Date().toISOString(),
      summary: {
        totalSessions: safeData.processingMetrics.totalSessions,
        avgConfidence: avgTranscriptionConfidence,
        successRate: safeData.processingMetrics.successRate,
        avgAudioLength: safeData.processingMetrics.avgAudioLength
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `speech-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Check for empty data
  if (!data || safeData.processingMetrics.totalSessions === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No speech analysis data available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start analyzing speech to see insights here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Data Quality Warnings */}
      {showDataWarnings && (hasProcessingTimeIssue || hasLowSuccessRate || hasNoEmotionData || hasSentimentIssue) && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setShowDataWarnings(false)}
            >
              ×
            </IconButton>
          }
        >
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Data Quality Issues Detected:</strong>
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {hasProcessingTimeIssue && (
              <li>⚠️ Processing time is 0.0 - might be unrecorded or system issue</li>
            )}
            {hasLowSuccessRate && (
              <li>⚠️ Low success rate ({(safeData.processingMetrics.successRate * 100).toFixed(1)}%) - system performance issue</li>
            )}
            {hasNoEmotionData && (
              <li>⚠️ No emotion detected from speech data - check audio quality or language support</li>
            )}
            {hasSentimentIssue && (
              <li>⚠️ Sentiment counts are zero - data may not be fully processed</li>
            )}
          </Box>
        </Alert>
      )}

      {/* Export Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportData}
          size="small"
        >
          Export Speech Data
        </Button>
      </Box>

      {/* Summary Cards (KPIs) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Sessions
                    </Typography>
                    <Typography variant="h4">
                      {safeData.processingMetrics.totalSessions}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      🎧 Speech sessions
                    </Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'primary.main' }}>
                    <MicIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Avg Audio Length
                    </Typography>
                    <Typography variant="h4">
                      {formatAudioLength(safeData.processingMetrics.avgAudioLength)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ⏱️ ~{Math.floor(safeData.processingMetrics.avgAudioLength / 60)} minutes
                    </Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'info.main' }}>
                    <TimerIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Success Rate
                    </Typography>
                    <Typography variant="h4" color={hasLowSuccessRate ? 'error.main' : 'success.main'}>
                      {(safeData.processingMetrics.successRate * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {hasLowSuccessRate ? '⚠️ Low success rate' : '✅ Processing success'}
                    </Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: hasLowSuccessRate ? 'error.main' : 'success.main' }}>
                    <CheckCircleIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Avg Transcription Confidence
                    </Typography>
                    <Typography variant="h4">
                      {avgTranscriptionConfidence > 0 ? `${(avgTranscriptionConfidence * 100).toFixed(1)}%` : 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ✍️ Transcription quality
                    </Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'secondary.main' }}>
                    <AssessmentIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Sentiment Trends Line Chart */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card sx={{ height: 400 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Sentiment Score Trends
                  </Typography>
                  <Tooltip title="Sentiment score normalized: 0 = neutral, 1 = very positive">
                    <IconButton size="small">
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Track sentiment changes over time
                </Typography>
                <SimpleChartFallback
                  data={safeData.sentimentTrends.map(item => ({
                    name: item.date,
                    value: item.averageScore
                  }))}
                  type="line"
                  title="Sentiment Trends"
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Transcription Confidence Distribution */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card sx={{ height: 400 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Transcription Confidence
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Distribution of confidence levels
                </Typography>
                <SimpleChartFallback
                  data={safeData.transcriptionAccuracy.map(item => ({
                    name: item.confidence,
                    value: item.count,
                    color: getConfidenceColor(item.confidence) === 'success' ? '#4CAF50' :
                           getConfidenceColor(item.confidence) === 'warning' ? '#FF9800' : '#F44336'
                  }))}
                  type="bar"
                  title="Confidence Distribution"
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Voice Stress Indicators */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card sx={{ height: 400 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Voice Stress Indicators
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Analyze speech-based stress patterns across different indicators
                </Typography>
                <Grid container spacing={3}>
                  {safeData.voiceStressIndicators.map((indicator, index) => (
                    <Grid item xs={12} md={4} key={indicator.indicator}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ mr: 1 }}>
                              {getStressIcon(indicator.indicator)}
                            </Typography>
                            <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                              {indicator.indicator.replace('_', ' ')}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">Normal</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {indicator.normal}
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={indicator.normal / (indicator.normal + indicator.elevated + indicator.high) * 100}
                              sx={{ height: 8, borderRadius: 4, backgroundColor: '#E0E0E0' }}
                              style={{ color: getStressColor('normal') }}
                            />
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">Elevated</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {indicator.elevated}
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={indicator.elevated / (indicator.normal + indicator.elevated + indicator.high) * 100}
                              sx={{ height: 8, borderRadius: 4, backgroundColor: '#E0E0E0' }}
                              style={{ color: getStressColor('elevated') }}
                            />
                          </Box>

                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">High</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {indicator.high}
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={indicator.high / (indicator.normal + indicator.elevated + indicator.high) * 100}
                              sx={{ height: 8, borderRadius: 4, backgroundColor: '#E0E0E0' }}
                              style={{ color: getStressColor('high') }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Emotion Distribution Section */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Emotion Detection from Speech
                </Typography>
                {hasNoEmotionData ? (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      🎭 No emotion detected from speech data.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      This could occur due to audio quality, language support, or lack of expressive cues in speech patterns.
                    </Typography>
                  </Alert>
                ) : (
                  <Grid container spacing={2}>
                    {safeData.emotionDistribution.map((emotion, index) => (
                      <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card variant="outlined">
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ mb: 1 }}>
                              {emotion.emotion || '❓'}
                            </Typography>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                              {emotion.count}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {emotion.percentage.toFixed(1)}%
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Processing Metrics Info */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Processing Metrics Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h5" color={hasProcessingTimeIssue ? 'warning.main' : 'text.primary'}>
                      {safeData.processingMetrics.avgProcessingTime.toFixed(1)}s
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Processing Time
                    </Typography>
                    {hasProcessingTimeIssue && (
                      <Typography variant="caption" color="warning.main">
                        ⚠️ May be unrecorded
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h5" color="info.main">
                      {formatAudioLength(safeData.processingMetrics.avgAudioLength)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Audio Length
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h5" color={hasLowSuccessRate ? 'error.main' : 'success.main'}>
                      {(safeData.processingMetrics.successRate * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Success Rate
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h5" color="primary.main">
                      {safeData.processingMetrics.totalSessions}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Sessions
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};