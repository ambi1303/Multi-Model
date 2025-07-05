import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Alert,
} from '@mui/material';
import { SimpleBarChart, SimpleLineChart } from '../charts/SimpleCharts';
import { motion } from 'framer-motion';
import { VideoAnalyticsData } from '../../types/analytics';

interface VideoAnalyticsDashboardProps {
  data: VideoAnalyticsData;
}

export const VideoAnalyticsDashboard: React.FC<VideoAnalyticsDashboardProps> = ({ data }) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'success';
      case 'processing': return 'info';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const confidenceDistributionData = {
    labels: data.confidenceDistribution?.map(item => item.range) || [],
    datasets: [
      {
        label: 'Count',
        data: data.confidenceDistribution?.map(item => item.count) || [],
        backgroundColor: '#2563eb',
      },
    ],
  };

  const emotionAccuracyData = {
    labels: data.emotionAccuracy?.map(item => item.emotion) || [],
    datasets: [
      {
        label: 'Accuracy',
        data: data.emotionAccuracy?.map(item => item.accuracy) || [],
        backgroundColor: '#059669',
      },
    ],
  };

  const processingTimeData = {
    labels: data.processingTimeAnalysis?.map(item => `${item.processingTime}ms`) || [],
    datasets: [
      {
        label: 'Confidence',
        data: data.processingTimeAnalysis?.map(item => item.confidence) || [],
        borderColor: '#7c3aed',
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(124, 58, 237, 0.2)',
      },
    ],
  };

  const commonChartOptions = {
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Confidence Distribution */}
        <Grid item xs={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Confidence Score Distribution
                </Typography>
                <SimpleBarChart
                  data={confidenceDistributionData}
                  options={commonChartOptions}
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Emotion Accuracy */}
        <Grid item xs={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Emotion Detection Accuracy
                </Typography>
                <SimpleBarChart
                  data={emotionAccuracyData}
                  options={commonChartOptions}
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Processing Time Analysis */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Processing Time vs Confidence
                </Typography>
                <SimpleLineChart
                  data={processingTimeData}
                  options={commonChartOptions}
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Feature Importance */}
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Feature Importance
                </Typography>
                <List>
                  {data.featureImportance.map((feature) => (
                    <ListItem key={feature.feature} sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body1">
                              {feature.feature}
                            </Typography>
                            <Chip
                              label={`${(feature.importance * 100).toFixed(1)}%`}
                              size="small"
                              color={feature.importance > 0.8 ? 'primary' : 'default'}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Recent Sessions */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Recent Video Analysis Sessions
                </Typography>
                <Grid container spacing={2}>
                  {data.recentSessions.map((session) => (
                    <Grid item xs={12} sm={6} md={4} key={session.id}>
                      <Card variant="outlined">
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, mr: 2 }}>
                              {session.dominantEmotion.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Session {session.id.slice(-6)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(session.timestamp).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              Dominant Emotion: <strong>{session.dominantEmotion}</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              Processing Time: {session.processingTime}ms
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Chip
                              label={`${(session.confidence * 100).toFixed(1)}% confidence`}
                              size="small"
                              color={getConfidenceColor(session.confidence) as any}
                            />
                            <Chip
                              label={session.status}
                              size="small"
                              color={getStatusColor(session.status) as any}
                              variant="outlined"
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                
                {data.recentSessions.length === 0 && (
                  <Alert severity="info">
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