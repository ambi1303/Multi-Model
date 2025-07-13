import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Stack,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  PsychologyIcon,
  TrendingUpIcon,
  WarningIcon,
  CheckCircleIcon,
  TimerIcon,
  ChatIcon,
  PeopleIcon,
  HeartIcon,
} from '../../utils/icons';
import { EmoBuddyAnalyticsData } from '../../types/analytics';
import { SimpleChartFallback } from '../charts/SimpleChartFallback';
import { MetricCard } from '../dashboard/MetricCard';

interface EmoBuddyAnalyticsDashboardProps {
  data: EmoBuddyAnalyticsData;
}

export const EmoBuddyAnalyticsDashboard: React.FC<EmoBuddyAnalyticsDashboardProps> = ({ data }) => {
  const getSeverityColor = (count: number) => {
    if (count >= 5) return 'error';
    if (count >= 3) return 'warning';
    return 'success';
  };

  const getEffectivenessColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Session Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Sessions"
            value={data.sessionStats.totalSessions}
            icon={<ChatIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Sessions"
            value={data.sessionStats.activeSessions}
            icon={<PeopleIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg Session Duration"
            value={`${data.sessionStats.avgSessionDuration}min`}
            icon={<TimerIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg Messages/Session"
            value={data.sessionStats.avgMessagesPerSession.toFixed(1)}
            icon={<ChatIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Crisis Detection Alert */}
      {data.crisisDetection.crisisSessionsToday > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Alert 
            severity="warning" 
            sx={{ mb: 3 }}
            icon={<WarningIcon />}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Crisis Alert: {data.crisisDetection.crisisSessionsToday} sessions today
            </Typography>
            <Typography variant="body2">
              Total crisis flags: {data.crisisDetection.totalCrisisFlags}
            </Typography>
          </Alert>
        </motion.div>
      )}

      <Grid container spacing={3}>
        {/* Response Time Analysis */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Response Time Distribution
                </Typography>
                <SimpleChartFallback
                  data={data.responseTimeAnalysis.map(item => ({
                    name: item.timeRange,
                    value: item.count,
                    color: '#1976d2'
                  }))}
                  title="Response Times"
                  type="bar"
                  height={300}
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* User Satisfaction */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  User Satisfaction
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                    <CheckCircleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {data.userSatisfaction.avgScore.toFixed(1)}/5
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Rating
                    </Typography>
                  </Box>
                </Box>
                <SimpleChartFallback
                  data={data.userSatisfaction.distribution.map(item => ({
                    name: `${item.score} Stars`,
                    value: item.count,
                    color: `hsl(${item.score * 72}, 70%, 50%)`
                  }))}
                  title="Rating Distribution"
                  type="pie"
                  height={300}
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Therapeutic Techniques */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Therapeutic Techniques Used
                </Typography>
                <List>
                  {data.techniquesUsed.map((technique, index) => (
                    <ListItem key={index} divider>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <PsychologyIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={technique.technique}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Used {technique.count} times
                            </Typography>
                            <Chip
                              label={`${(technique.effectivenessScore * 100).toFixed(0)}% effective`}
                              size="small"
                              color={getEffectivenessColor(technique.effectivenessScore)}
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

        {/* Therapeutic Progress */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Therapeutic Progress Indicators
                </Typography>
                <Stack spacing={2}>
                  {data.therapeuticProgress.map((progress, index) => (
                    <Box key={index}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {progress.indicator}
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          +{(progress.improvement * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(progress.improvement * 100, 100)}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: 'success.main',
                          },
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {progress.sessionCount} sessions
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Crisis Trends */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Crisis Detection Trends (Last 7 Days)
                </Typography>
                <SimpleChartFallback
                  data={data.crisisDetection.crisisTrends.map(trend => ({
                    name: new Date(trend.date).toLocaleDateString(),
                    value: trend.crisisCount,
                    color: '#f44336'
                  }))}
                  title="Crisis Incidents Over Time"
                  type="line"
                  height={300}
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
}; 