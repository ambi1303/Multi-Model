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
  Button,
  Tooltip,
  IconButton,

  Divider,
} from '@mui/material';
import {
  ChatIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  RemoveIcon,
  WarningIcon,
  DownloadIcon,
  EmojiEmotionsIcon,
  AssessmentIcon,
  TimerIcon,
  BarChartIcon,
} from '../../utils/icons';
import { SimpleChartFallback } from '../charts/SimpleChartFallback';
import { motion } from 'framer-motion';
import { ChatAnalyticsData, AnalyticsFilters } from '../../types/analytics';

interface ChatAnalyticsDashboardProps {
  data: ChatAnalyticsData;
  filters: AnalyticsFilters;
}

export const ChatAnalyticsDashboard: React.FC<ChatAnalyticsDashboardProps> = ({ data, filters }) => {
  const [showDataWarnings, setShowDataWarnings] = useState(true);
  // eslint-disable-next-line no-empty-pattern
  const [] = useState<string[]>([]);

  // Add null safety - provide default values if data is undefined
  const safeData = data || {
    messageTrends: [],
    sentimentDistribution: [],
    emotionDistribution: [],
    mentalStateDistribution: [],
    sentimentEmotionCorrelation: [],
    confidenceAnalysis: [],
    sessionMetrics: {
      totalSessions: 0,
      avgMessagesPerSession: 0,
      avgSentimentPerSession: 0,
      avgConfidencePerSession: 0,
      avgSessionDurationMinutes: 0
    },
    analysisDurationStats: [],
    summary: {
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

  // Helper functions
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment.toUpperCase()) {
      case 'POSITIVE': return <TrendingUpIcon />;
      case 'NEGATIVE': return <TrendingDownIcon />;
      default: return <RemoveIcon />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toUpperCase()) {
      case 'POSITIVE': return '#4CAF50';
      case 'NEGATIVE': return '#F44336';
      default: return '#FF9800';
    }
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion.toUpperCase()) {
      case 'HAPPY': return '#4CAF50';
      case 'SAD': return '#2196F3';
      case 'ANGRY': return '#F44336';
      case 'FEAR': return '#FF9800';
      case 'SURPRISE': return '#9C27B0';
      case 'DISGUST': return '#795548';
      case 'NEUTRAL': return '#607D8B';
      default: return '#9E9E9E';
    }
  };

  const getEmotionEmoji = (emotion: string) => {
    switch (emotion.toUpperCase()) {
      case 'HAPPY': return '😄';
      case 'SAD': return '😢';
      case 'ANGRY': return '😠';
      case 'FEAR': return '😨';
      case 'SURPRISE': return '😲';
      case 'DISGUST': return '🤢';
      case 'NEUTRAL': return '😐';
      default: return '🤔';
    }
  };

  const getMentalStateColor = (state: string) => {
    switch (state.toUpperCase()) {
      case 'CALM': return '#4CAF50';
      case 'STRESSED': return '#F44336';
      case 'EXCITED': return '#FF9800';
      case 'ANXIOUS': return '#9C27B0';
      default: return '#607D8B';
    }
  };

  const getMentalStateEmoji = (state: string) => {
    switch (state.toUpperCase()) {
      case 'CALM': return '😌';
      case 'STRESSED': return '😰';
      case 'EXCITED': return '🤩';
      case 'ANXIOUS': return '😟';
      default: return '🤔';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDateRange = (start: string, end: string) => {
    if (!start || !end) return 'N/A';
    const startDate = new Date(start).toLocaleDateString();
    const endDate = new Date(end).toLocaleDateString();
    return `${startDate} – ${endDate}`;
  };

  // Data quality checks
  const hasConfidenceIssue = safeData.confidenceAnalysis.length === 1 && 
                            safeData.confidenceAnalysis[0].percentage === 100.0;
  const hasZeroConfidence = safeData.messageTrends.every(item => item.avgConfidence === 0.0);
  const hasLongSessionDuration = safeData.sessionMetrics.avgSessionDurationMinutes > 1000; // > 16 hours
  const hasNarrowConfidenceRange = safeData.confidenceAnalysis.length === 1;

  const handleExportData = () => {
    const exportData = {
      filters,
      data: safeData,
      generatedAt: new Date().toISOString(),
      insights: {
        totalAnalyses: safeData.summary.totalAnalyses,
        dateRange: safeData.summary.dateRange,
        avgSentiment: safeData.sessionMetrics.avgSentimentPerSession,
        confidenceIssues: hasConfidenceIssue || hasZeroConfidence
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Check for empty data
  if (!data || safeData.summary.totalAnalyses === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No chat analysis data available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start chatting to see insights here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Data Quality Warnings */}
      {showDataWarnings && (hasConfidenceIssue || hasZeroConfidence || hasLongSessionDuration) && (
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
            {hasConfidenceIssue && (
              <li>⚠️ Confidence range may be incomplete or poorly calibrated (all data in single range)</li>
            )}
            {hasZeroConfidence && (
              <li>⚠️ All confidence scores are 0.0 - confidence data may be missing</li>
            )}
            {hasLongSessionDuration && (
              <li>⚠️ Average session duration ({formatDuration(safeData.sessionMetrics.avgSessionDurationMinutes)}) seems unusually long</li>
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
          Export Chat Data
        </Button>
      </Box>

      {/* Overview KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
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
                      Total Analyses
                    </Typography>
                    <Typography variant="h4">
                      {safeData.summary.totalAnalyses}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      🧪 Chat analyses
                    </Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'primary.main' }}>
                    <AssessmentIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
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
                      Date Range
                    </Typography>
                    <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                      {formatDateRange(safeData.summary.dateRange.start, safeData.summary.dateRange.end)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      🗓️ Analysis period
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

        <Grid item xs={12} sm={6} md={2}>
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
                      Avg Messages/Session
                    </Typography>
                    <Typography variant="h4">
                      {safeData.sessionMetrics.avgMessagesPerSession.toFixed(1)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      💬 Message count
                    </Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'success.main' }}>
                    <ChatIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
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
                      Avg Sentiment
                    </Typography>
                    <Typography variant="h4">
                      {safeData.sessionMetrics.avgSentimentPerSession.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      🧠 Sentiment score
                    </Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'warning.main' }}>
                    <EmojiEmotionsIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Avg Session Duration
                    </Typography>
                    <Typography variant="h6" sx={{ fontSize: '1rem' }} color={hasLongSessionDuration ? 'warning.main' : 'text.primary'}>
                      {formatDuration(safeData.sessionMetrics.avgSessionDurationMinutes)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {hasLongSessionDuration ? '⚠️ Very long' : '🕒 Duration'}
                    </Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: hasLongSessionDuration ? 'warning.main' : 'secondary.main' }}>
                    <TimerIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Confidence Range
                    </Typography>
                    <Typography variant="h6" sx={{ fontSize: '1rem' }} color={hasNarrowConfidenceRange ? 'warning.main' : 'text.primary'}>
                      {safeData.confidenceAnalysis.length > 0 ? safeData.confidenceAnalysis[0].range : 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {hasNarrowConfidenceRange ? '⚠️ Narrow range' : '🔎 Confidence'}
                    </Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: hasNarrowConfidenceRange ? 'warning.main' : 'info.main' }}>
                    <BarChartIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Message Sentiment Trends */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card sx={{ height: 400 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Message Sentiment Trends
                  </Typography>
                  {hasZeroConfidence && (
                    <Tooltip title="Confidence data appears to be missing or not recorded">
                      <IconButton size="small">
                        <WarningIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Daily message volume and sentiment score trends
                </Typography>
                <SimpleChartFallback
                  data={safeData.messageTrends.map(item => ({
                    name: item.date,
                    value: item.avgSentimentScore
                  }))}
                  type="line"
                  title="Sentiment Score Trends"
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Sentiment Distribution */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card sx={{ height: 400 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Sentiment Distribution
                </Typography>
                <SimpleChartFallback
                  data={safeData.sentimentDistribution.map(item => ({
                    name: item.sentiment,
                    value: item.count,
                    color: getSentimentColor(item.sentiment)
                  }))}
                  type="pie"
                  title="Sentiment Distribution"
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Emotion Distribution */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Card sx={{ height: 400 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Emotion Distribution
                </Typography>
                <SimpleChartFallback
                  data={safeData.emotionDistribution.map(item => ({
                    name: `${getEmotionEmoji(item.emotion)} ${item.emotion}`,
                    value: item.count,
                    color: getEmotionColor(item.emotion)
                  }))}
                  type="bar"
                  title="Emotion Distribution"
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Mental State Distribution */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <Card sx={{ height: 400 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Mental State Distribution
                </Typography>
                <SimpleChartFallback
                  data={safeData.mentalStateDistribution.map(item => ({
                    name: `${getMentalStateEmoji(item.mentalState)} ${item.mentalState}`,
                    value: item.count,
                    color: getMentalStateColor(item.mentalState)
                  }))}
                  type="pie"
                  title="Mental State Distribution"
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Sentiment-Emotion Correlation */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sentiment-Emotion Correlation Matrix
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Explore how different sentiments correlate with emotional states
                </Typography>
                <Grid container spacing={2}>
                  {safeData.sentimentEmotionCorrelation.map((item, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                      <Card variant="outlined">
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Chip
                              icon={getSentimentIcon(item.sentiment)}
                              label={item.sentiment}
                              size="small"
                              sx={{ 
                                backgroundColor: getSentimentColor(item.sentiment),
                                color: 'white',
                                mr: 1
                              }}
                            />
                            <Typography variant="body2">
                              {getEmotionEmoji(item.emotion)} {item.emotion}
                            </Typography>
                          </Box>
                          <Typography variant="h6" sx={{ mb: 1 }}>
                            {item.count}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Avg Score: {item.avgSentimentScore.toFixed(2)}
                          </Typography>
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

      {/* Confidence Analysis */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.1 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Confidence Analysis
                </Typography>
                {hasConfidenceIssue && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      ⚠️ Confidence range may be incomplete or poorly calibrated - all data falls within a single range
                    </Typography>
                  </Alert>
                )}
                <SimpleChartFallback
                  data={safeData.confidenceAnalysis.map(item => ({
                    name: item.range,
                    value: item.count
                  }))}
                  type="bar"
                  title="Confidence Distribution"
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Session Metrics Detail */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Session Metrics Summary
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Sessions
                    </Typography>
                    <Typography variant="h5">
                      {safeData.sessionMetrics.totalSessions}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Avg Messages per Session
                    </Typography>
                    <Typography variant="h5">
                      {safeData.sessionMetrics.avgMessagesPerSession.toFixed(1)}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Avg Sentiment Score
                    </Typography>
                    <Typography variant="h5">
                      {safeData.sessionMetrics.avgSentimentPerSession.toFixed(2)}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Avg Confidence Score
                    </Typography>
                    <Typography variant="h5" color={hasZeroConfidence ? 'warning.main' : 'text.primary'}>
                      {safeData.sessionMetrics.avgConfidencePerSession.toFixed(2)}
                    </Typography>
                    {hasZeroConfidence && (
                      <Typography variant="caption" color="warning.main">
                        ⚠️ May be missing
                      </Typography>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};