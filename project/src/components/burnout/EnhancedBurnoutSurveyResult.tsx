import React, { useState, useEffect, useMemo, Suspense } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Button,
  Divider,
  Alert,
  Paper,
  Fade,
  Slide,
  useTheme,
  alpha,
  CircularProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  Lightbulb as LightbulbIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Star as StarIcon,
  Timeline as TimelineIcon,
  LocalHospital as HealthIcon,
  EmojiObjects as IdeasIcon,
  Support as SupportIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { CombinedAnalysisResponse } from '../../services/api';
import ErrorBoundary from '../common/ErrorBoundary';

// Lazy load chart components
const RadarChartComp = React.lazy(() => import('../charts/RadarChartComp'));
const PieChartComp = React.lazy(() => import('../charts/PieChartComp'));
const BarChartComp = React.lazy(() => import('../charts/BarChartComp'));

// Extended interface for the component with additional properties
interface ExtendedAnalysisResponse extends CombinedAnalysisResponse {
  riskLevel?: 'Low' | 'Medium' | 'High';
  burnoutScore?: number;
  employeeData?: {
    designation_encoded?: number;
    gender_encoded?: number;
    company_type_encoded?: number;
    wfh_setup_available_encoded?: number;
    mental_fatigue_score?: number;
    resource_allocation?: number;
  };
  surveyResults?: {
    stress_level?: number;
    job_satisfaction?: number;
    work_life_balance?: number;
    emotional_exhaustion?: number;
  };
  mlResult?: any;
  surveyResult?: any;
  breakdown?: Array<{
    category: string;
    score: number;
    description: string;
  }>;
}

interface EnhancedBurnoutSurveyResultProps {
  result: ExtendedAnalysisResponse;
  onRetakeAssessment: () => void;
  mlAnalysisComplete?: boolean;
}

// Chart loading spinner component
const ChartLoader: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: 350,
      gap: 2,
    }}
  >
    <CircularProgress size={40} />
    <Typography variant="body2" color="text.secondary">
      Loading chart...
    </Typography>
  </Box>
);

const EnhancedBurnoutSurveyResult: React.FC<EnhancedBurnoutSurveyResultProps> = ({
  result,
  onRetakeAssessment,
  mlAnalysisComplete = true,
}) => {
  const theme = useTheme();
  const [visibleSections, setVisibleSections] = useState<{ [key: string]: boolean }>({});
  const [expanded, setExpanded] = useState<string | false>('overview');

  useEffect(() => {
    // Animate sections in sequence
    const sections = ['header', 'overview', 'assessment', 'insights', 'recommendations'];
    sections.forEach((section, index) => {
      setTimeout(() => {
        setVisibleSections(prev => ({ ...prev, [section]: true }));
      }, index * 200);
    });
  }, []);

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high':
        return { color: theme.palette.error.main, bg: alpha(theme.palette.error.main, 0.1) };
      case 'medium':
        return { color: theme.palette.warning.main, bg: alpha(theme.palette.warning.main, 0.1) };
      case 'low':
        return { color: theme.palette.success.main, bg: alpha(theme.palette.success.main, 0.1) };
      default:
        return { color: theme.palette.info.main, bg: alpha(theme.palette.info.main, 0.1) };
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high':
        return <WarningIcon />;
      case 'medium':
        return <InfoIcon />;
      case 'low':
        return <CheckCircleIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const riskColors = getRiskColor(result.riskLevel || 'Unknown');

  // Memoized chart data preparation
  const chartData = useMemo(() => {
    // Assessment metrics data for radar chart
    const assessmentData = [
      { name: 'Designation', value: result.employeeData?.designation_encoded || 0 },
      { name: 'Gender', value: result.employeeData?.gender_encoded || 0 },
      { name: 'Company Type', value: result.employeeData?.company_type_encoded || 0 },
      { name: 'WFH Setup', value: result.employeeData?.wfh_setup_available_encoded || 0 },
      { name: 'Mental Fatigue', value: result.employeeData?.mental_fatigue_score || 0 },
      { name: 'Resource Access', value: result.employeeData?.resource_allocation || 0 },
    ].filter(item => item.value > 0);

    // Wellness distribution data for pie chart
    const wellnessData = [
      { 
        name: 'Burnout Risk', 
        value: Math.round((result.burnoutScore || 0) * 100), 
        color: theme.palette.error.main 
      },
      { 
        name: 'Stress Level', 
        value: result.surveyResults?.stress_level || 0, 
        color: theme.palette.warning.main 
      },
      { 
        name: 'Job Satisfaction', 
        value: result.surveyResults?.job_satisfaction || 0, 
        color: theme.palette.success.main 
      },
      { 
        name: 'Work-Life Balance', 
        value: result.surveyResults?.work_life_balance || 0, 
        color: theme.palette.info.main 
      },
    ].filter(item => item.value > 0);

    // Breakdown data for bar chart
    const breakdownData = result.breakdown?.map(item => ({
      name: item.category,
      value: item.score,
      color: theme.palette.primary.main
    })) || [];

    return {
      assessmentData,
      wellnessData,
      breakdownData
    };
  }, [result, theme.palette]);

  // Show loading state if ML analysis is not complete
  if (!mlAnalysisComplete) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3, minHeight: '100vh' }}>
        <ChartLoader />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3, minHeight: '100vh' }}>
      {/* Header Section */}
      <Fade in={visibleSections.header} timeout={800}>
        <Paper
          elevation={0}
          sx={{
            background: `linear-gradient(135deg, ${riskColors.color}15 0%, ${riskColors.color}05 100%)`,
            border: `1px solid ${riskColors.color}30`,
            borderRadius: 3,
            p: 4,
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${riskColors.color}20 0%, transparent 70%)`,
            }}
          />
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: riskColors.color,
                    width: 60,
                    height: 60,
                    fontSize: '1.5rem',
                  }}
                >
                  <AssessmentIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                    }}
                  >
                    Assessment Complete
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    Your Comprehensive Mental Health Analysis
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Chip
                  icon={getRiskIcon(result.riskLevel || 'Unknown')}
                  label={`${result.riskLevel || 'Unknown'} Risk Level`}
                  sx={{
                    bgcolor: riskColors.bg,
                    color: riskColors.color,
                    fontSize: '1rem',
                    py: 2,
                    px: 1,
                    fontWeight: 600,
                    mb: 2,
                  }}
                  size="medium"
                />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Burnout Score
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: riskColors.color }}>
                    {Math.round((result.burnoutScore || 0) * 100)}%
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Fade>

      {/* Overview Section */}
      <Slide direction="up" in={visibleSections.overview} timeout={600}>
        <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
          <CardContent sx={{ p: 0 }}>
            <Accordion 
              expanded={expanded === 'overview'} 
              onChange={handleAccordionChange('overview')}
              sx={{ boxShadow: 'none' }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  '& .MuiAccordionSummary-content': { alignItems: 'center' },
                  py: 2,
                }}
              >
                <TimelineIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Assessment Overview
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PsychologyIcon color="primary" />
                        Analysis Summary
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {result.mental_health_summary || 'Your comprehensive mental health assessment has been completed using advanced AI analysis.'}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Analysis Source: {result.source || 'AI-Powered Assessment'}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={85}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            },
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Analysis Confidence: 85%
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUpIcon color="primary" />
                        Key Metrics
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                              {result.surveyResults?.job_satisfaction || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Job Satisfaction
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                              {result.surveyResults?.work_life_balance || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Work-Life Balance
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                              {result.surveyResults?.stress_level || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Stress Level
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(riskColors.color, 0.05) }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: riskColors.color }}>
                              {Math.round((result.burnoutScore || 0) * 100)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Burnout Score
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>
      </Slide>

      {/* Assessment Visualization */}
      <Slide direction="up" in={visibleSections.assessment} timeout={800}>
        <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
          <CardContent sx={{ p: 0 }}>
            <Accordion 
              expanded={expanded === 'assessment'} 
              onChange={handleAccordionChange('assessment')}
              sx={{ boxShadow: 'none' }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor: alpha(theme.palette.secondary.main, 0.05),
                  '& .MuiAccordionSummary-content': { alignItems: 'center' },
                  py: 2,
                }}
              >
                <AssessmentIcon sx={{ mr: 2, color: theme.palette.secondary.main }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Visual Assessment Analysis
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 3 }}>
                <Grid container spacing={4}>
                  <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 3, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                      <ErrorBoundary>
                        <Suspense fallback={<ChartLoader />}>
                          <RadarChartComp
                            data={chartData.assessmentData}
                            title="Assessment Metrics"
                            height={350}
                          />
                        </Suspense>
                      </ErrorBoundary>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 3, borderRadius: 2, bgcolor: alpha(theme.palette.secondary.main, 0.02) }}>
                      <ErrorBoundary>
                        <Suspense fallback={<ChartLoader />}>
                          <PieChartComp
                            data={chartData.wellnessData}
                            title="Wellness Distribution"
                            height={350}
                          />
                        </Suspense>
                      </ErrorBoundary>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 3, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.02) }}>
                      <ErrorBoundary>
                        <Suspense fallback={<ChartLoader />}>
                          <BarChartComp
                            data={chartData.breakdownData}
                            title="Analysis Breakdown"
                            height={350}
                          />
                        </Suspense>
                      </ErrorBoundary>
                    </Paper>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>
      </Slide>

      {/* AI Insights */}
      <Slide direction="up" in={visibleSections.insights} timeout={1000}>
        <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
          <CardContent sx={{ p: 0 }}>
            <Accordion 
              expanded={expanded === 'insights'} 
              onChange={handleAccordionChange('insights')}
              sx={{ boxShadow: 'none' }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor: alpha(theme.palette.success.main, 0.05),
                  '& .MuiAccordionSummary-content': { alignItems: 'center' },
                  py: 2,
                }}
              >
                <IdeasIcon sx={{ mr: 2, color: theme.palette.success.main }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  AI-Powered Insights
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 3 }}>
                <Alert
                  severity={result.riskLevel === 'High' ? 'error' : result.riskLevel === 'Medium' ? 'warning' : 'success'}
                  sx={{ mb: 3, borderRadius: 2 }}
                  icon={<PsychologyIcon />}
                >
                  <Typography variant="h6" gutterBottom>
                    Mental Health Assessment
                  </Typography>
                  <Typography variant="body1">
                    {result.mental_health_summary || 'Your mental health assessment indicates areas for attention and improvement.'}
                  </Typography>
                </Alert>
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StarIcon color="warning" />
                    Key Insights
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, height: '100%', bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                        <HealthIcon sx={{ color: theme.palette.info.main, mb: 1 }} />
                        <Typography variant="subtitle2" gutterBottom>
                          Risk Assessment
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Your current risk level is <strong>{result.riskLevel || 'Unknown'}</strong> based on comprehensive analysis.
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, height: '100%', bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                        <TrendingUpIcon sx={{ color: theme.palette.success.main, mb: 1 }} />
                        <Typography variant="subtitle2" gutterBottom>
                          Analysis Method
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Results generated using <strong>{result.source || 'AI Analysis'}</strong> for accurate insights.
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, height: '100%', bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
                        <ScheduleIcon sx={{ color: theme.palette.warning.main, mb: 1 }} />
                        <Typography variant="subtitle2" gutterBottom>
                          Follow-up
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Regular monitoring recommended for optimal mental health maintenance.
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>
      </Slide>

      {/* Recommendations */}
      <Slide direction="up" in={visibleSections.recommendations} timeout={1200}>
        <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
          <CardContent sx={{ p: 0 }}>
            <Accordion 
              expanded={expanded === 'recommendations'} 
              onChange={handleAccordionChange('recommendations')}
              sx={{ boxShadow: 'none' }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ 
                  bgcolor: alpha(theme.palette.warning.main, 0.05),
                  '& .MuiAccordionSummary-content': { alignItems: 'center' },
                  py: 2,
                }}
              >
                <LightbulbIcon sx={{ mr: 2, color: theme.palette.warning.main }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Personalized Recommendations
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" paragraph>
                    {Array.isArray(result.recommendations) 
                      ? result.recommendations.join('. ') 
                      : result.recommendations || 'Based on your assessment, here are personalized recommendations to improve your mental health and well-being.'
                    }
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                      <SupportIcon sx={{ color: theme.palette.primary.main, mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Immediate Actions
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Consider implementing stress-reduction techniques and seeking professional support if needed.
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ mt: 1 }}
                      >
                        Learn More
                      </Button>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%', bgcolor: alpha(theme.palette.success.main, 0.02) }}>
                      <HealthIcon sx={{ color: theme.palette.success.main, mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Long-term Wellness
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Develop sustainable habits for maintaining good mental health and work-life balance.
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ mt: 1 }}
                      >
                        Get Resources
                      </Button>
                    </Paper>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>
      </Slide>

      {/* Action Buttons */}
      <Fade in={visibleSections.recommendations} timeout={1400}>
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            onClick={onRetakeAssessment}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 3,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              boxShadow: theme.shadows[8],
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[12],
              },
              transition: 'all 0.3s ease',
            }}
          >
            Retake Assessment
          </Button>
        </Box>
      </Fade>
    </Box>
  );
};

export default EnhancedBurnoutSurveyResult; 