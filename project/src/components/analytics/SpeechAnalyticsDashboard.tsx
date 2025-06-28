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
  ListItemIcon,
  LinearProgress,
} from '@mui/material';
import { SimpleChartFallback } from '../charts/SimpleChartFallback';
import { motion } from 'framer-motion';
import { SpeechAnalyticsData, AnalyticsFilters } from '../../types/analytics';

interface SpeechAnalyticsDashboardProps {
  data: SpeechAnalyticsData;
  filters: AnalyticsFilters;
}

export const SpeechAnalyticsDashboard: React.FC<SpeechAnalyticsDashboardProps> = ({ data, filters }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Sentiment Trends */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Sentiment Trends Over Time
                </Typography>
                <SimpleChartFallback
                  data={data.sentimentTrends?.map(item => ({
                    name: item.date,
                    value: item.averageScore,
                    color: '#2563eb'
                  })) || []}
                  type="line"
                  height={300}
                  title=""
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Transcription Accuracy */}
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Transcription Accuracy
                </Typography>
                <List>
                  {data.transcriptionAccuracy.map((metric, index) => (
                    <ListItem key={metric.metric} sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body1">
                              {metric.metric}
                            </Typography>
                            <Chip
                              label={`${metric.score.toFixed(1)}%`}
                              size="small"
                              color={metric.score > 80 ? 'success' : metric.score > 60 ? 'warning' : 'error'}
                            />
                          </Box>
                        }
                        secondary={
                          <LinearProgress
                            variant="determinate"
                            value={metric.score}
                            sx={{
                              mt: 1,
                              height: 6,
                              borderRadius: 3,
                            }}
                          />
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Audio Quality Metrics */}
        <Grid item xs={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Audio Quality Distribution
                </Typography>
                <SimpleChartFallback
                  data={data.audioQualityMetrics?.map(item => ({
                    name: item.quality,
                    value: item.count,
                    color: '#7c3aed'
                  })) || []}
                  type="bar"
                  height={300}
                  title=""
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Duration Analysis */}
        <Grid item xs={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Session Duration Analysis
                </Typography>
                <SimpleChartFallback
                  data={data.durationAnalysis?.map(item => ({
                    name: item.duration,
                    value: item.count,
                    color: '#059669'
                  })) || []}
                  type="bar"
                  height={300}
                  title=""
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Language Distribution */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Language Distribution
                </Typography>
                <Grid container spacing={2}>
                  {data.languageDistribution.map((lang, index) => (
                    <Grid item xs={12} sm={6} md={4} key={lang.language}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          {lang.language}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {lang.count} sessions
                        </Typography>
                        <Chip
                          label={`${lang.percentage.toFixed(1)}%`}
                          size="small"
                          color="primary"
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Emotion-Speech Correlation */}
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Emotion-Speech Correlation
                </Typography>
                <SimpleChartFallback
                  data={data.emotionSpeechCorrelation?.map(item => ({
                    name: item.emotion,
                    value: item.confidence,
                    color: '#dc2626'
                  })) || []}
                  type="bar"
                  height={300}
                  title=""
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};