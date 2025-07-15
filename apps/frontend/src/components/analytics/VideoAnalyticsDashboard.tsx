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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  VideoCallIcon,
  EyeIcon,
  FaceIcon,
  TimerIcon,
  TrendingUpIcon,
  InfoIcon,
  WarningIcon,
  EmojiEmotionsIcon,
  AssessmentIcon,
  BarChartIcon,
  SortIcon,
} from '../../utils/icons';
import { SimpleChartFallback } from '../charts/SimpleChartFallback';
import { motion } from 'framer-motion';
import { VideoAnalyticsData } from '../../types/analytics';

interface VideoAnalyticsDashboardProps {
  data: VideoAnalyticsData;
}

export const VideoAnalyticsDashboard: React.FC<VideoAnalyticsDashboardProps> = ({ data }) => {
  const [sortBy, setSortBy] = useState<'timestamp' | 'confidence' | 'duration'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Add null safety - provide default values if data is undefined
  const safeData = data || {
    confidenceDistribution: [],
    processingTimeAnalysis: [],
    emotionDistribution: [],
    faceDetectionStats: {
      avgFacesDetected: 0,
      avgFaceQuality: 0,
      sessionsWithFaces: 0,
      totalSessions: 0
    },
    recentSessions: []
  };

  // Calculate derived metrics
  const topEmotion = safeData.emotionDistribution.length > 0 
    ? safeData.emotionDistribution.reduce((prev, current) => 
        prev.count > current.count ? prev : current
      ).emotion
    : 'N/A';

  const lowFaceDetectionWarning = safeData.faceDetectionStats.avgFacesDetected < 0.1;

  // Helper functions
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Sort recent sessions
  const sortedSessions = [...safeData.recentSessions].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'confidence':
        aValue = a.confidence;
        bValue = b.confidence;
        break;
      case 'duration':
        aValue = a.duration;
        bValue = b.duration;
        break;
      case 'timestamp':
      default:
        aValue = new Date(a.timestamp).getTime();
        bValue = new Date(b.timestamp).getTime();
        break;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (column: 'timestamp' | 'confidence' | 'duration') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Check for empty data
  if (!data || safeData.recentSessions.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No video analysis data available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start analyzing videos to see insights here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Face Detection Warning */}
      {lowFaceDetectionWarning && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
          <Typography variant="body2">
            ⚠️ {safeData.faceDetectionStats.avgFacesDetected.toFixed(3)} avg faces detected — may impact emotion reliability. 
            Consider checking camera angle and lighting conditions.
          </Typography>
        </Alert>
      )}

      {/* Top Summary Cards (KPIs) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
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
                      {safeData.faceDetectionStats.totalSessions}
                    </Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'primary.main' }}>
                    <VideoCallIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
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
                      Sessions w/ Faces
                    </Typography>
                    <Typography variant="h4" color={lowFaceDetectionWarning ? 'warning.main' : 'text.primary'}>
                      {safeData.faceDetectionStats.sessionsWithFaces}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {lowFaceDetectionWarning && '⚠️ Low detection'}
                    </Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: lowFaceDetectionWarning ? 'warning.main' : 'success.main' }}>
                    <EyeIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
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
                      Avg Faces/Session
                    </Typography>
                    <Typography variant="h4">
                      {safeData.faceDetectionStats.avgFacesDetected.toFixed(3)}
                    </Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'info.main' }}>
                    <AssessmentIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
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
                      Avg Face Quality
                    </Typography>
                    <Typography variant="h4">
                      {(safeData.faceDetectionStats.avgFaceQuality * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'success.main' }}>
                    <TrendingUpIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
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
                      Top Emotion
                    </Typography>
                    <Typography variant="h4">
                      {getEmotionEmoji(topEmotion)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {topEmotion}
                    </Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: getEmotionColor(topEmotion) }}>
                    <EmojiEmotionsIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Emotion Distribution Pie Chart */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
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
                  type="pie"
                  title="Emotion Distribution"
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Confidence Distribution Bar Chart */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card sx={{ height: 400 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Confidence Score Distribution
                </Typography>
                <SimpleChartFallback
                  data={safeData.confidenceDistribution.map(item => ({
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

        {/* Processing Time vs Confidence Scatter Plot */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card sx={{ height: 400 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Processing Time vs Confidence Analysis
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Analyze the relationship between processing time and prediction confidence
                </Typography>
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {safeData.processingTimeAnalysis.length > 0 ? (
                    <Box sx={{ width: '100%' }}>
                      {safeData.processingTimeAnalysis.map((item, index) => (
                        <Box key={index} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">
                              {item.processingTime.toFixed(1)}s processing time
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {(item.confidence * 100).toFixed(1)}% confidence
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={item.confidence * 100} 
                            sx={{ height: 8, borderRadius: 4 }}
                            color={getConfidenceColor(item.confidence)}
                          />
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No processing time data available
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Face Detection Insights */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Face Detection Insights
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" color="primary.main">
                        {safeData.faceDetectionStats.sessionsWithFaces}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Sessions with faces
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        out of {safeData.faceDetectionStats.totalSessions} total
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" color="info.main">
                        {safeData.faceDetectionStats.avgFacesDetected.toFixed(3)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg faces per session
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" color="success.main">
                        {(safeData.faceDetectionStats.avgFaceQuality * 100).toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Average face quality
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" color={lowFaceDetectionWarning ? 'warning.main' : 'success.main'}>
                        {((safeData.faceDetectionStats.sessionsWithFaces / safeData.faceDetectionStats.totalSessions) * 100).toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Face detection rate
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Recent Sessions Table */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Video Analysis Sessions
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Session ID</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                               onClick={() => handleSort('timestamp')}>
                            Timestamp
                            <IconButton size="small">
                              <SortIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell>Dominant Emotion</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                               onClick={() => handleSort('confidence')}>
                            Confidence
                            <IconButton size="small">
                              <SortIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                               onClick={() => handleSort('duration')}>
                            Duration
                            <IconButton size="small">
                              <SortIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell>Faces Detected</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedSessions.slice(0, 10).map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>{session.id}</TableCell>
                          <TableCell>
                            <Tooltip title={formatTimestamp(session.timestamp)}>
                              <Typography variant="body2">
                                {formatTimestamp(session.timestamp)}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">
                                {getEmotionEmoji(session.dominantEmotion)}
                              </Typography>
                              <Chip
                                label={session.dominantEmotion}
                                size="small"
                                sx={{ 
                                  backgroundColor: getEmotionColor(session.dominantEmotion),
                                  color: 'white',
                                  fontSize: '0.75rem'
                                }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`${(session.confidence * 100).toFixed(1)}%`}
                              size="small"
                              color={getConfidenceColor(session.confidence)}
                              variant={session.confidence < 0.6 ? 'outlined' : 'filled'}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDuration(session.duration)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {session.facesDetected}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {sortedSessions.length === 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No recent video analysis sessions found.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};