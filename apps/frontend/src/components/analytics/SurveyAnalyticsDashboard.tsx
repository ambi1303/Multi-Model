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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  AssessmentIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WarningIcon,
  CheckCircleIcon,
  ScheduleIcon,
  PsychologyIcon,
  LightbulbIcon,
} from '../../utils/icons';
import { SurveyAnalyticsData } from '../../types/analytics';
import { SimpleChartFallback } from '../charts/SimpleChartFallback';
import { MetricCard } from '../dashboard/MetricCard';

interface SurveyAnalyticsDashboardProps {
  data: SurveyAnalyticsData;
}

export const SurveyAnalyticsDashboard: React.FC<SurveyAnalyticsDashboardProps> = ({ data }) => {
  const getBurnoutColor = (score: number) => {
    if (score >= 0.7) return 'error';
    if (score >= 0.5) return 'warning';
    if (score >= 0.3) return 'info';
    return 'success';
  };

  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'severe': return 'error';
      case 'high': return 'warning';
      case 'moderate': return 'info';
      default: return 'success';
    }
  };

  const getEffectivenessColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  const avgBurnoutScore = data.burnoutTrends.reduce((sum, item) => sum + item.avgBurnoutScore, 0) / data.burnoutTrends.length;
  const totalHighRisk = data.burnoutTrends.reduce((sum, item) => sum + item.highRiskCount, 0);

  return (
    <Box sx={{ p: 3 }}>
      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Average Burnout Score"
            value={`${(avgBurnoutScore * 100).toFixed(1)}%`}
            icon={<AssessmentIcon />}
            color={getBurnoutColor(avgBurnoutScore)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="High Risk Employees"
            value={totalHighRisk}
            icon={<WarningIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Prediction Accuracy"
            value={`${(data.predictionAccuracy.avgConfidence * 100).toFixed(1)}%`}
            icon={<CheckCircleIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="High Confidence Predictions"
            value={`${data.predictionAccuracy.highConfidencePredictions}/${data.predictionAccuracy.totalPredictions}`}
            icon={<PsychologyIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* High Risk Alert */}
      {totalHighRisk > 10 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            icon={<WarningIcon />}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              High Risk Alert: {totalHighRisk} employees showing burnout signs
            </Typography>
            <Typography variant="body2">
              Immediate intervention recommended for high-risk employees
            </Typography>
          </Alert>
        </motion.div>
      )}

      <Grid container spacing={3}>
        {/* Burnout Trends */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Burnout Score Trends
                </Typography>
                <SimpleChartFallback
                  data={data.burnoutTrends.map(trend => ({
                    name: new Date(trend.date).toLocaleDateString(),
                    value: trend.avgBurnoutScore * 100,
                    color: '#f44336'
                  }))}
                  title="Burnout Trends Over Time"
                  type="line"
                  height={300}
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Stress Level Distribution */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Stress Level Distribution
                </Typography>
                <SimpleChartFallback
                  data={data.stressLevelDistribution.map((item, index) => ({
                    name: item.level,
                    value: item.count,
                    color: ['#4caf50', '#ff9800', '#f44336', '#d32f2f'][index] || '#9e9e9e'
                  }))}
                  title="Stress Levels"
                  type="pie"
                  height={250}
                />
                <Box sx={{ mt: 2 }}>
                  {data.stressLevelDistribution.map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Chip
                        label={item.level}
                        size="small"
                        color={getRiskLevelColor(item.level)}
                        sx={{ mr: 1, minWidth: 80 }}
                      />
                      <Typography variant="body2">
                        {item.count} ({item.percentage}%)
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Risk Category Analysis */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Risk Category Analysis
                </Typography>
                <Stack spacing={2}>
                  {data.riskCategoryAnalysis.map((category, index) => (
                    <Box key={index}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {category.category}
                        </Typography>
                        <Typography variant="body2" color={getBurnoutColor(category.avgScore)}>
                          {(category.avgScore * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={category.avgScore * 100}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: category.avgScore >= 0.7 ? 'error.main' : 
                                   category.avgScore >= 0.5 ? 'warning.main' : 
                                   category.avgScore >= 0.3 ? 'info.main' : 'success.main',
                          },
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {category.count} responses
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Completion Time Analysis */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Survey Completion Time
                </Typography>
                <SimpleChartFallback
                  data={data.completionTimeAnalysis.map(item => ({
                    name: item.timeRange,
                    value: item.count,
                    color: '#1976d2'
                  }))}
                  title="Completion Times"
                  type="bar"
                  height={300}
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* AI Recommendations */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  AI Recommendations & Effectiveness
                </Typography>
                <List>
                  {data.recommendationStats.map((rec, index) => (
                    <ListItem key={index} divider>
                      <ListItemIcon>
                        <LightbulbIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={rec.recommendation}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Suggested {rec.frequency} times
                            </Typography>
                            <Chip
                              label={`${(rec.effectiveness * 100).toFixed(0)}% effective`}
                              size="small"
                              color={getEffectivenessColor(rec.effectiveness)}
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
      </Grid>
    </Box>
  );
}; 