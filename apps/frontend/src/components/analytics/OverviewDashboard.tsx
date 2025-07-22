import React from 'react';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  PeopleIcon,
  AssignmentIcon,
  CheckCircleIcon,
  TimelineIcon,
  BarChartIcon,
  SecurityIcon,
} from '../../utils/icons';
import { SimpleChartFallback } from '../charts/SimpleChartFallback';
import { motion } from 'framer-motion';
import { OverviewData, AnalyticsFilters } from '../../types/analytics';

interface OverviewDashboardProps {
  data: OverviewData;
  filters: AnalyticsFilters;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ data }) => {
  // Add null safety - provide default values if data is undefined
  const safeData = data || {
    totalSessions: 0,
    totalUsers: 0,
    averageSessionDuration: 0,
    totalAnalyses: 0,
    sessionTrends: [],
    riskDistribution: [],
    modalityPerformance: [],
    mentalStateDistribution: [],
    recentActivity: [],
    fallback: false
  };

  // Calculate high risk count from risk distribution
  const highRiskCount = safeData.riskDistribution.find(item => item.level === 'high')?.count || 0;

  // Calculate overall average confidence from modality performance
  const overallAvgConfidence = safeData.modalityPerformance.length > 0 
    ? safeData.modalityPerformance.reduce((sum, item) => sum + item.avgConfidence, 0) / safeData.modalityPerformance.length
    : 0;

  // Check for empty data and show appropriate message
  if (!data || safeData.totalSessions === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No analytics data available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start using the system to see overview insights here.
        </Typography>
      </Box>
    );
  }

  // Show warning for potential data issues
  const showDataWarning = safeData.totalUsers === 0 || safeData.averageSessionDuration === 0;

  return (
    <Box sx={{ p: 3 }}>
      {/* System Status Banner */}
      {safeData.fallback && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            System is running in fallback mode – limited accuracy may be experienced.
          </Typography>
        </Alert>
      )}

      {/* Data Quality Warning */}
      {showDataWarning && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            User tracking or session duration data may be missing or not enabled.
          </Typography>
        </Alert>
      )}

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
                      {safeData.totalSessions.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Active sessions tracked
                    </Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'primary.main' }}>
                    <TimelineIcon />
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
                      Total Users
                    </Typography>
                    <Typography variant="h4">
                      {safeData.totalUsers.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {safeData.totalUsers === 0 ? 'Anonymous tracking' : 'Registered users'}
                    </Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'info.main' }}>
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
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Analyses
                    </Typography>
                    <Typography variant="h4">
                      {safeData.totalAnalyses.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Completed analyses
                    </Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'success.main' }}>
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
                      High Risk Cases
                    </Typography>
                    <Typography variant="h4" color="error.main">
                      {highRiskCount.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Require attention
                    </Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'error.main' }}>
                    <SecurityIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Additional Metrics Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Avg Session Duration
                  </Typography>
                  <Typography variant="h5">
                    {safeData.averageSessionDuration === 0 ? 'N/A' : `${safeData.averageSessionDuration.toFixed(1)}m`}
                  </Typography>
                </Box>
                <Avatar sx={{ backgroundColor: 'warning.main' }}>
                  <TimelineIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Overall Avg Confidence
                  </Typography>
                  <Typography variant="h5">
                    {overallAvgConfidence > 0 ? `${(overallAvgConfidence * 100).toFixed(1)}%` : 'N/A'}
                  </Typography>
                </Box>
                <Avatar sx={{ backgroundColor: 'info.main' }}>
                  <CheckCircleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    System Status
                  </Typography>
                  <Chip 
                    label={safeData.fallback ? 'Fallback Mode' : 'Normal Operation'}
                    color={safeData.fallback ? 'warning' : 'success'}
                    variant="outlined"
                  />
                </Box>
                <Avatar sx={{ backgroundColor: safeData.fallback ? 'warning.main' : 'success.main' }}>
                  <BarChartIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Session Trends Chart */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Session & Risk Trends Over Time
            </Typography>
            <SimpleChartFallback
             data={safeData.sessionTrends
              .filter(item => typeof item.sessions === 'number' && !isNaN(item.sessions))
              .map(item => ({
                name: item.date || '',
                value: item.sessions
              }))}
            type="line"
            title="Session Trends"
            />
          </Card>
        </Grid>

        {/* Risk Distribution Pie Chart */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Risk Level Distribution
            </Typography>
            <SimpleChartFallback
             data={safeData.riskDistribution
              .filter(item => typeof item.count === 'number' && !isNaN(item.count))
              .map(item => ({
                name: item.level ? item.level.charAt(0).toUpperCase() + item.level.slice(1) : 'Unknown',
                value: item.count
              }))}
            type="pie"
            title="Risk Distribution"
            />
          </Card>
        </Grid>

        {/* Mental State Distribution */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Mental State Distribution
            </Typography>
            <SimpleChartFallback
                data={safeData.mentalStateDistribution
                  .filter(item => typeof item.count === 'number' && !isNaN(item.count))
                  .map(item => ({
                    name: item.state || 'Unknown',
                    value: item.count
                  }))}
                type="bar"
                title="Mental State Distribution"
            />
          </Card>
        </Grid>

        {/* Modality Performance */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Modality Usage & Confidence
            </Typography>
            <Box sx={{ height: 300 }}>
              {safeData.modalityPerformance.map((item) => (
                <Box key={item.modality} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {item.modality}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.usage} uses • {item.avgConfidence > 0 ? `${(item.avgConfidence * 100).toFixed(1)}%` : 'N/A'} confidence
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                      value={typeof item.avgConfidence === 'number' && !isNaN(item.avgConfidence) ? item.avgConfidence * 100 : 0}
                    sx={{ height: 8, borderRadius: 4 }}
                  />

                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity Section */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            {safeData.recentActivity.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No recent activity to display
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Risk Level</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {safeData.recentActivity.map((activity, index) => (
                      <TableRow key={activity.id || index}>
                        <TableCell>{activity.timestamp || 'N/A'}</TableCell>
                        <TableCell>{activity.user || 'Anonymous'}</TableCell>
                        <TableCell>{activity.action || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={activity.riskLevel || 'Unknown'}
                            color={
                              activity.riskLevel === 'high' ? 'error' :
                              activity.riskLevel === 'medium' ? 'warning' :
                              activity.riskLevel === 'low' ? 'success' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};