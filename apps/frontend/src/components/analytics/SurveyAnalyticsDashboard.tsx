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
  Button,
  Divider,
  Stack,
} from '@mui/material';
import {
  AssessmentIcon,
  TargetIcon,
  WarningIcon,
  CheckCircleIcon,
  ScheduleIcon,
  PsychologyIcon,
  LightbulbIcon,
  GaugeIcon,
  ClockIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  DownloadIcon,
  InfoIcon,
  BarChartIcon,
  PieChartIcon,
} from '../../utils/icons';
import ChartWrapper from '../charts/ChartWrapper';
import { motion } from 'framer-motion';
import { SurveyAnalyticsData } from '../../types/analytics';

interface SurveyAnalyticsDashboardProps {
  data: SurveyAnalyticsData;
}

export const SurveyAnalyticsDashboard: React.FC<SurveyAnalyticsDashboardProps> = ({ data }) => {
  const [showDataWarnings, setShowDataWarnings] = useState(true);

  // Add null safety - provide default values if data is undefined
  const safeData = data || {
    burnoutTrends: [],
    stressLevelDistribution: [],
    riskCategoryAnalysis: [],
    completionTimeAnalysis: [],
    recommendationStats: [],
    predictionAccuracy: {
      avgConfidence: 0,
      highConfidencePredictions: 0,
      totalPredictions: 0,
      predictionsWithConfidence: 0
    }
  };

  // Check for empty data
  if (!data || safeData.burnoutTrends.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No burnout survey data available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Complete burnout surveys to see insights here.
        </Typography>
      </Box>
    );
  }

  // Calculate derived metrics
  const avgBurnoutScore = safeData.burnoutTrends.length > 0
    ? safeData.burnoutTrends.reduce((sum, item) => sum + item.avgBurnoutScore, 0) / safeData.burnoutTrends.length
    : 0;

  const totalHighRisk = safeData.burnoutTrends.reduce((sum, item) => sum + item.highRiskCount, 0);
  const peakBurnoutDay = safeData.burnoutTrends.reduce((prev, current) => 
    prev.avgBurnoutScore > current.avgBurnoutScore ? prev : current
  );

  const dominantStressLevel = safeData.stressLevelDistribution.length > 0
    ? safeData.stressLevelDistribution.reduce((prev, current) => 
        prev.percentage > current.percentage ? prev : current
      )
    : { level: 'N/A', percentage: 0 };

  const avgCompletionTime = safeData.completionTimeAnalysis.length > 0
    ? safeData.completionTimeAnalysis.reduce((sum, item) => sum + item.avgTimeSeconds, 0) / safeData.completionTimeAnalysis.length
    : 0;

  // Data quality checks
  const hasCorruptedRecommendations = safeData.recommendationStats.some(rec => 
    rec.recommendation.includes('{') || rec.recommendation.includes('\\')
  );
  const hasVeryFastCompletions = avgCompletionTime < 30;
  const hasLowConfidence = safeData.predictionAccuracy.avgConfidence < 0.7;

  // Helper functions
  const getBurnoutColor = (score: number) => {
    if (score >= 0.7) return 'error';
    if (score >= 0.5) return 'warning';
    if (score >= 0.3) return 'info';
    return 'success';
  };

  const getStressLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'severe': return 'error';
      case 'high': return 'warning';
      case 'moderate': return 'info';
      default: return 'success';
    }
  };

  const getStressLevelEmoji = (level: string) => {
    switch (level.toLowerCase()) {
      case 'severe': return '🚨';
      case 'high': return '😰';
      case 'moderate': return '😐';
      default: return '😌';
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const cleanRecommendation = (rec: string) => {
    if (rec.includes('{') || rec.includes('\\')) {
      return 'Corrupted Data';
    }
    return rec.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleExportData = () => {
    const exportData = {
      burnoutAnalytics: safeData,
      exportedAt: new Date().toISOString(),
      summary: {
        avgBurnoutScore,
        totalHighRisk,
        dominantStressLevel: dominantStressLevel.level,
        avgCompletionTime
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `burnout-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Data Quality Warnings */}
      {showDataWarnings && (hasCorruptedRecommendations || hasVeryFastCompletions || hasLowConfidence) && (
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
            {hasCorruptedRecommendations && (
              <li>⚠️ Corrupted recommendation data detected - may indicate parsing issues</li>
            )}
            {hasVeryFastCompletions && (
              <li>⚠️ Very fast completion times ({formatTime(avgCompletionTime)}) - may affect reliability</li>
            )}
            {hasLowConfidence && (
              <li>⚠️ Low prediction confidence ({(safeData.predictionAccuracy.avgConfidence * 100).toFixed(1)}%) - model may need improvement</li>
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
          Export Burnout Data
        </Button>
      </Box>

      {/* Key Metrics (KPI Cards) */}
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
                      🔮 Avg Prediction Confidence
                    </Typography>
                    <Typography variant="h4" color={safeData.predictionAccuracy.avgConfidence >= 0.8 ? 'success.main' : 'warning.main'}>
                      {(safeData.predictionAccuracy.avgConfidence * 100).toFixed(0)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Model reliability
                    </Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'primary.main' }}>
                    <GaugeIcon />
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
                      📊 High-Confidence Predictions
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      {safeData.predictionAccuracy.highConfidencePredictions} / {safeData.predictionAccuracy.totalPredictions}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {safeData.predictionAccuracy.totalPredictions > 0 ? 
                        `${((safeData.predictionAccuracy.highConfidencePredictions / safeData.predictionAccuracy.totalPredictions) * 100).toFixed(1)}% accuracy` : 
                        'No predictions'
                      }
                    </Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'info.main' }}>
                    <TargetIcon />
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
                      ⚠️ High-Risk Burnout Cases
                    </Typography>
                    <Typography variant="h4" color="error.main">
                      {totalHighRisk}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Peak: {peakBurnoutDay.highRiskCount} on {formatDate(peakBurnoutDay.date)}
                    </Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'error.main' }}>
                    <WarningIcon />
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
                      😓 Dominant Stress Level
                    </Typography>
                    <Typography variant="h4" color={getStressLevelColor(dominantStressLevel.level)}>
                      {getStressLevelEmoji(dominantStressLevel.level)} {dominantStressLevel.level}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dominantStressLevel.percentage.toFixed(1)}% of respondents
                    </Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: getStressLevelColor(dominantStressLevel.level) }}>
                    <PsychologyIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* High Risk Alert */}
      {totalHighRisk > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
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
              📉 Burnout peaked on {formatDate(peakBurnoutDay.date)} (avg score: {(peakBurnoutDay.avgBurnoutScore * 100).toFixed(1)}%, {peakBurnoutDay.highRiskCount} high-risk flags)
            </Typography>
          </Alert>
        </motion.div>
      )}

      <Grid container spacing={3}>
        {/* Burnout Score Over Time */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  📈 Burnout Score Over Time
                </Typography>
                <ChartWrapper
                  data={safeData.burnoutTrends.map(trend => ({
                    name: formatDate(trend.date),
                    value: Math.round(trend.avgBurnoutScore * 100 * 100) / 100, // Round to 2 decimal places
                    highRisk: trend.highRiskCount
                  }))}
                  title="Burnout Trends (%)"
                  type="line"
                  height={300}
                />
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {safeData.burnoutTrends.map((trend, index) => (
                    <Tooltip key={index} title={`${trend.totalResponses} responses, ${trend.highRiskCount} high-risk`}>
                      <Chip
                        label={`${formatDate(trend.date)}: ${(trend.avgBurnoutScore * 100).toFixed(1)}%`}
                        size="small"
                        color={getBurnoutColor(trend.avgBurnoutScore)}
                        variant="outlined"
                      />
                    </Tooltip>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Stress Level Distribution */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  🧠 Stress Level Distribution
                </Typography>
                <ChartWrapper
                  data={safeData.stressLevelDistribution.map(item => ({
                    name: `${getStressLevelEmoji(item.level)} ${item.level}`,
                    value: item.count,
                    percentage: item.percentage
                  }))}
                  title="Stress Level Distribution"
                  type="pie"
                  height={250}
                />
                <Box sx={{ mt: 2 }}>
                  {safeData.stressLevelDistribution.map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {getStressLevelEmoji(item.level)}
                        </Typography>
                        <Chip
                          label={item.level}
                          size="small"
                          color={getStressLevelColor(item.level)}
                          sx={{ mr: 1, minWidth: 80 }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {item.count} ({item.percentage.toFixed(1)}%)
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Risk Category Breakdown */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  📊 Risk Category Breakdown
                </Typography>
                <ChartWrapper
                  data={safeData.riskCategoryAnalysis.map(category => ({
                    name: category.category,
                    value: category.count,
                    avgScore: Math.round(category.avgScore * 100 * 100) / 100 // Round to 2 decimal places
                  }))}
                  title="Risk Category Analysis"
                  type="bar"
                  height={300}
                />
                <Box sx={{ mt: 2 }}>
                  {safeData.riskCategoryAnalysis.map((category, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, textTransform: 'capitalize' }}>
                          {category.category}
                        </Typography>
                        <Chip
                          label={`${(category.avgScore * 100).toFixed(1)}% avg`}
                          size="small"
                          color={getBurnoutColor(category.avgScore)}
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(category.count / safeData.riskCategoryAnalysis.reduce((sum, cat) => sum + cat.count, 0)) * 100}
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
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Prediction Accuracy Summary */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  🎯 Prediction Accuracy Summary
                </Typography>
                
                {/* Confidence Gauge */}
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                    <Box
                      sx={{
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        background: `conic-gradient(
                          ${safeData.predictionAccuracy.avgConfidence >= 0.8 ? '#4CAF50' : 
                            safeData.predictionAccuracy.avgConfidence >= 0.6 ? '#FF9800' : '#F44336'} 
                          ${safeData.predictionAccuracy.avgConfidence * 360}deg,
                          #e0e0e0 0deg
                        )`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}
                    >
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          backgroundColor: 'background.paper',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                        }}
                      >
                        <Typography variant="h4" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                          {(safeData.predictionAccuracy.avgConfidence * 100).toFixed(0)}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Confidence
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" color="primary">
                        {safeData.predictionAccuracy.highConfidencePredictions}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        High Confidence
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" color="info.main">
                        {safeData.predictionAccuracy.totalPredictions}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Predictions
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {safeData.predictionAccuracy.avgConfidence < 0.8 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Model confidence is below 80%. Consider collecting more training data or reviewing model parameters.
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Completion Time Analysis */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  🕒 Survey Completion Time
                </Typography>
                
                {safeData.completionTimeAnalysis.length > 0 ? (
                  <>
                    <ChartWrapper
                      data={safeData.completionTimeAnalysis.map(item => ({
                        name: item.timeRange,
                        value: item.count,
                        avgTime: item.avgTimeSeconds
                      }))}
                      title="Completion Time Analysis"
                      type="bar"
                      height={200}
                    />
                    <Box sx={{ mt: 2 }}>
                      {safeData.completionTimeAnalysis.map((item, index) => (
                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ClockIcon />
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {item.timeRange}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {item.count} responses
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Avg: {formatTime(item.avgTimeSeconds)}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No completion time data available
                    </Typography>
                  </Box>
                )}

                {avgCompletionTime < 30 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      ⚡ Most surveys completed in under 30 seconds. Consider if this affects data reliability.
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Recommendation Breakdown */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  💡 AI Recommendation Breakdown
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Recommendation</TableCell>
                        <TableCell align="center">Frequency</TableCell>
                        <TableCell align="center">Avg Score</TableCell>
                        <TableCell align="center">Follow-up</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {safeData.recommendationStats
                        .filter(rec => !rec.recommendation.includes('{'))
                        .sort((a, b) => b.frequency - a.frequency)
                        .map((rec, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <LightbulbIcon />
                              <Typography variant="body2" sx={{ ml: 1 }}>
                                {cleanRecommendation(rec.recommendation)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={rec.frequency}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${(rec.avgBurnoutScore * 100).toFixed(1)}%`}
                              size="small"
                              color={getBurnoutColor(rec.avgBurnoutScore)}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={rec.followUpSuggested > 0 ? 'Yes' : 'No'}
                              size="small"
                              color={rec.followUpSuggested > 0 ? 'success' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {hasCorruptedRecommendations && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      ⚠️ Some recommendation data appears corrupted. Check data pipeline integrity.
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Smart Insights Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.1 }}
      >
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              🧠 Smart Insights & Recommendations
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    📉 Burnout Peak Analysis
                  </Typography>
                  <Typography variant="body2">
                    Burnout peaked on {formatDate(peakBurnoutDay.date)} with an average score of {(peakBurnoutDay.avgBurnoutScore * 100).toFixed(1)}% and {peakBurnoutDay.highRiskCount} high-risk cases.
                  </Typography>
                </Alert>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    📌 Stress Distribution
                  </Typography>
                  <Typography variant="body2">
                    Majority of respondents ({dominantStressLevel.percentage.toFixed(1)}%) fall under {dominantStressLevel.level} stress level.
                  </Typography>
                </Alert>
              </Grid>
              
              {hasCorruptedRecommendations && (
                <Grid item xs={12} md={6}>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      ⚠️ Data Quality Issue
                    </Typography>
                    <Typography variant="body2">
                      Corrupted recommendation strings detected - may indicate parsing issue or malformed input.
                    </Typography>
                  </Alert>
                </Grid>
              )}
              
              {hasVeryFastCompletions && (
                <Grid item xs={12} md={6}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      🕒 Completion Speed
                    </Typography>
                    <Typography variant="body2">
                      Most surveys completed in under 30 seconds - may affect data reliability and suggest need for validation.
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
}; 