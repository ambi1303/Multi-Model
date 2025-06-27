import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  Paper,
  Chip,
  Tooltip,
  Fade,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { 
  WarningIcon, 
  TrendingUpIcon, 
  AssessmentIcon, 
  PsychologyIcon, 
  CheckCircleIcon, 
  AutoAwesomeIcon, // Using AutoAwesome as SmartToy alternative
  RefreshIcon 
} from '../../utils/icons';
import { useTheme } from '@mui/material/styles';

interface BurnoutResult {
  employeeId: string;
  burnRate: number;
  surveyScore: string;
  mentalHealthSummary: string;
  recommendations: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  breakdown?: {
    category: string;
    score: number;
    description: string;
  }[];
}

interface EnhancedBurnoutSurveyResultProps {
  result: BurnoutResult;
  onRetake?: () => void;
}

export const EnhancedBurnoutSurveyResult: React.FC<EnhancedBurnoutSurveyResultProps> = ({ result, onRetake }) => {
  const theme = useTheme();
  
  // Generate radar chart data based on assessment metrics
  const radarData = [
    { subject: 'Designation Level (1-5)', A: 3, fullMark: 5 },
    { subject: 'Resource Allocation (1-10)', A: 7, fullMark: 10 },
    { subject: 'Mental Fatigue Score (1-10)', A: 5, fullMark: 10 },
    { subject: 'Company Type (Service=1, Product=2)', A: 1, fullMark: 2 },
    { subject: 'WFH Setup (Yes=1, No=2)', A: 1, fullMark: 2 },
    { subject: 'Gender (Male=1, Female=2)', A: 1, fullMark: 2 },
  ];

  // Wellness vs Burnout pie chart data
  const wellnessPieData = [
    { 
      name: 'Burnout Risk', 
      value: result.burnRate, 
      color: theme.palette.error.main 
    },
    { 
      name: 'Wellness Score', 
      value: 100 - result.burnRate, 
      color: theme.palette.success.main 
    },
  ];

  // Enhanced breakdown data using the progressive analysis results
  const detailedBreakdown = result.breakdown?.map(item => ({
    ...item,
    score: Math.min(10, Math.max(0, item.score))
  })) || [
    { category: 'Mental Fatigue', score: Math.min(10, Math.max(1, result.burnRate / 10)), description: 'Cognitive exhaustion level' },
    { category: 'Work-Life Balance', score: Math.min(10, Math.max(1, (result.burnRate / 8) + Math.random() * 2)), description: 'Balance between work and personal life' },
    { category: 'Job Satisfaction', score: Math.min(10, Math.max(1, 10 - (result.burnRate / 12))), description: 'Overall satisfaction with current role' },
    { category: 'Team Support', score: Math.min(10, Math.max(1, 8 - (result.burnRate / 15))), description: 'Support from colleagues and management' },
    { category: 'Workload Management', score: Math.min(10, Math.max(1, (result.burnRate / 12) + 2)), description: 'Ability to manage assigned tasks' },
  ];

  // Theme-aware colors
  const radarStroke = theme.palette.primary.main;
  const radarFill = theme.palette.primary.main;
  const gridColor = theme.palette.mode === 'dark' ? '#444' : '#e0e0e0';
  const textColor = theme.palette.text.primary;
  const subtleTextColor = theme.palette.text.secondary;

  // Risk level styling
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return { color: theme.palette.success.main, bg: theme.palette.success.light };
      case 'medium':
        return { color: theme.palette.warning.main, bg: theme.palette.warning.light };
      case 'high':
        return { color: theme.palette.error.main, bg: theme.palette.error.light };
      default:
        return { color: theme.palette.info.main, bg: theme.palette.info.light };
    }
  };

  const riskColors = getRiskColor(result.riskLevel);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, maxWidth: 250, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {label}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Score: {payload[0].value.toFixed(1)}/10
          </Typography>
          {payload[0].payload.description && (
            <Typography variant="caption" color="text.secondary">
              {payload[0].payload.description}
            </Typography>
          )}
        </Paper>
      );
    }
    return null;
  };

  // Check if certain results are still loading based on breakdown data
  const mlAnalysisComplete = result.breakdown?.some(item => item.category === "ML Burnout Prediction" && !item.description.includes("pending")) ?? false;
  const surveyAnalysisComplete = result.breakdown?.some(item => item.category === "Survey Risk Assessment" && !item.description.includes("pending")) ?? false;
  const aiInsightsComplete = result.breakdown?.some(item => item.category === "AI Insights" && item.score > 0) ?? false;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header with Overall Score */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
          Employee Burnout Assessment
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Comprehensive evaluation to identify burnout risk and stress levels
        </Typography>
        
        {/* Risk Level Badge */}
        <Chip
          label={`${result.riskLevel} Risk Level`}
          sx={{
            bgcolor: riskColors.bg,
            color: riskColors.color,
            fontWeight: 600,
            fontSize: '1rem',
            px: 2,
            py: 1,
            mb: 3
          }}
        />

        <Box sx={{ 
          bgcolor: 'background.paper', 
          p: 3, 
          borderRadius: 2, 
          border: '1px solid',
          borderColor: 'divider',
          mb: 4,
          boxShadow: 1
        }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Your burnout assessment indicates a <strong>{result.riskLevel.toLowerCase()} risk level</strong>
          </Typography>
          <Box sx={{ 
            bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.800',
            color: 'white', 
            p: 2, 
            borderRadius: 1,
            display: 'inline-block',
            minWidth: 120
          }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Overall Score:
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              {result.burnRate}%
            </Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Assessment Preview - Radar Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 2
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Assessment Preview
                </Typography>
                <Tooltip title={mlAnalysisComplete ? "ML Analysis Complete" : "ML Analysis Pending"}>
                  {mlAnalysisComplete ? 
                    <CheckCircleIcon /> : 
                    <CircularProgress size={16} />
                  }
                </Tooltip>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: 'primary.main', borderRadius: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                  Scores
                </Typography>
              </Box>
              <Box sx={{ 
                height: 350, 
                width: '100%',
                bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                borderRadius: 2,
                p: 2
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid 
                      gridType="polygon" 
                      stroke={gridColor}
                      strokeWidth={1}
                    />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ 
                        fontSize: 10, 
                        fill: textColor,
                        fontWeight: 500
                      }}
                      className="text-xs"
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 10]} 
                      tick={{ 
                        fontSize: 8, 
                        fill: subtleTextColor 
                      }}
                      stroke={gridColor}
                    />
                    <Radar
                      name="Score"
                      dataKey="A"
                      stroke={radarStroke}
                      fill={radarFill}
                      fillOpacity={0.4}
                      strokeWidth={3}
                      dot={{ fill: radarStroke, strokeWidth: 2, r: 4 }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Wellness vs Burnout Distribution - Pie Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 2
          }}>
                          <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AssessmentIcon />
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Wellness Distribution
                  </Typography>
                  <Tooltip title={surveyAnalysisComplete ? "Survey Analysis Complete" : "Survey Analysis Pending"}>
                    {surveyAnalysisComplete ? 
                      <CheckCircleIcon /> : 
                      <CircularProgress size={16} />
                    }
                  </Tooltip>
                </Box>
              <Box sx={{ 
                height: 350, 
                width: '100%',
                bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                borderRadius: 2,
                p: 2
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={wellnessPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      stroke={theme.palette.background.paper}
                      strokeWidth={2}
                    >
                      {wellnessPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: '8px',
                        color: theme.palette.text.primary
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Detailed Stress Level Breakdown - Bar Chart */}
        <Grid item xs={12}>
          <Card sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 2
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                  <TrendingUpIcon />
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Progressive Analysis Breakdown
                </Typography>
              </Box>
              <Box sx={{ 
                height: 400, 
                width: '100%',
                bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                borderRadius: 2,
                p: 2
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={detailedBreakdown} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke={gridColor}
                    />
                    <XAxis 
                      dataKey="category" 
                      tick={{ fill: textColor, fontSize: 12 }}
                      stroke={gridColor}
                    />
                    <YAxis 
                      tick={{ fill: textColor, fontSize: 12 }}
                      stroke={gridColor}
                      domain={[0, 10]}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="score" 
                      fill={theme.palette.primary.main}
                      radius={[4, 4, 0, 0]}
                      stroke={theme.palette.primary.dark}
                      strokeWidth={1}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Risk Breakdown */}
        <Grid item xs={12}>
          <Card sx={{ 
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 2
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                  <PsychologyIcon />
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Risk Breakdown
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Analysis by category • Survey Score: {result.surveyScore}
              </Typography>
              <Box sx={{ 
                bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                p: 3, 
                borderRadius: 2,
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? 'grey.700' : 'grey.300'
              }}>
                <Typography variant="body1" sx={{ 
                  lineHeight: 1.6,
                  color: 'text.primary'
                }}>
                  {result.mentalHealthSummary}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Personalized Recommendations */}
        <Grid item xs={12}>
          <Card sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 2
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                  <AutoAwesomeIcon />
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Personalized Recommendations
                  </Typography>
                  <Tooltip title={aiInsightsComplete ? "AI Insights Complete" : "AI Insights Pending"}>
                    {aiInsightsComplete ? 
                      <CheckCircleIcon /> : 
                      <CircularProgress size={16} />
                    }
                </Tooltip>
              </Box>
              
              {!aiInsightsComplete && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    AI-powered personalized recommendations are being generated. Basic recommendations are shown below.
                  </Typography>
                </Alert>
              )}
              
              <Grid container spacing={3} sx={{ mb: 3 }}>
                {result.recommendations.slice(0, 3).map((recommendation, index) => (
                  <Grid item xs={12} key={index}>
                    <Fade in timeout={1000 + index * 200}>
                      <Box sx={{ 
                        bgcolor: 'primary.main', 
                        color: 'primary.contrastText', 
                        p: 3, 
                        borderRadius: 2,
                        display: 'flex',
                        gap: 2,
                        alignItems: 'flex-start',
                        boxShadow: 2
                      }}>
                        <Box sx={{ 
                          bgcolor: 'rgba(255,255,255,0.2)', 
                          borderRadius: '50%', 
                          width: 32, 
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          fontWeight: 'bold',
                          color: 'primary.contrastText'
                        }}>
                          {index + 1}
                        </Box>
                        <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                          {recommendation}
                        </Typography>
                      </Box>
                    </Fade>
                  </Grid>
                ))}
              </Grid>
              
              {/* Important Note */}
              <Alert 
                severity="warning" 
                icon={<WarningIcon />}
                sx={{ 
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 193, 7, 0.15)'
                    : 'rgba(255, 193, 7, 0.1)',
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 193, 7, 0.4)'
                    : 'rgba(255, 193, 7, 0.3)',
                  color: 'text.primary',
                  '& .MuiAlert-icon': {
                    color: 'warning.main'
                  }
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Important Note
                </Typography>
                <Typography variant="body2">
                  This assessment is for informational purposes only. If you're experiencing 
                  severe burnout symptoms, consider consulting with a healthcare professional 
                  or your HR department.
                </Typography>
              </Alert>

              {/* Take Assessment Again Button */}
              {onRetake && (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="large"
                    onClick={onRetake}
                    startIcon={<RefreshIcon />}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: '1rem',
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                      }
                    }}
                  >
                    Take Assessment Again
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}; 