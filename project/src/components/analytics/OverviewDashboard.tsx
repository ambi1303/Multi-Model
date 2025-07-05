import React from 'react';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
} from '@mui/material';
import {
  TrendingUpIcon,
  TrendingDownIcon,
  PeopleIcon,
  AssignmentIcon,
  CheckCircleIcon,
} from '../../utils/icons';
import { SimpleChartFallback } from '../charts/SimpleChartFallback';
import { motion } from 'framer-motion';
import { OverviewData, AnalyticsFilters } from '../../types/analytics';

interface OverviewDashboardProps {
  data: OverviewData;
  filters: AnalyticsFilters;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ data}) => {
  const getTrendIcon = (trend: 'positive' | 'negative' | 'neutral') => {
    switch (trend) {
      case 'positive': return <Box sx={{ color: 'success.main' }}><TrendingUpIcon /></Box>;
      case 'negative': return <Box sx={{ color: 'error.main' }}><TrendingDownIcon /></Box>;
      default: return <Box sx={{ color: 'warning.main' }}><TrendingUpIcon /></Box>;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Key Metrics Cards */}
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
                      {data.totalSessions.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {getTrendIcon('positive')}
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {data.sessionGrowth}% from last period
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'primary.main' }}>
                    <PeopleIcon />
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
                      Avg Confidence
                    </Typography>
                    <Typography variant="h4">
                      {(data.averageConfidence * 100).toFixed(1)}%
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {getTrendIcon('positive')}
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {data.confidenceChange}% from last period
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'success.main' }}>
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
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      High Risk Sessions
                    </Typography>
                    <Typography variant="h4">
                      {data.highRiskSessions}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {getTrendIcon('negative')}
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {data.riskChange}% from last period
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'info.main' }}>
                    <AssignmentIcon />
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
                      System Accuracy
                    </Typography>
                    <Typography variant="h4">
                      {(data.systemAccuracy * 100).toFixed(1)}%
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {getTrendIcon('positive')}
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        +2.3% from last period
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'warning.main' }}>
                    <TrendingUpIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Session Trends Over Time
            </Typography>
            <SimpleChartFallback
              data={data.sessionTrends?.map(item => ({
                name: item.date,
                value: item.sessions,
                color: '#8884d8'
              })) || []}
              type="line"
              height={300}
            />
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Risk Level Distribution
            </Typography>
            <SimpleChartFallback
              data={data.riskDistribution?.map(item => ({
                name: item.level,
                value: item.count,
                color: '#8884d8'
              })) || []}
              type="pie"
              height={300}
            />
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Performance by Modality
            </Typography>
            <SimpleChartFallback
              data={data.modalityPerformance?.map(item => ({
                name: item.modality,
                value: item.accuracy,
                color: '#82ca9d'
              })) || []}
              type="bar"
              height={300}
            />
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};