import React, { useState,  useMemo, Suspense } from 'react';
import {
  Box,
  Typography,
  Chip,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Button,
  Paper,
  Fade,
  useTheme,
  alpha,
  CircularProgress,
} from '@mui/material';
import {
  ArrowDownwardIcon as ExpandMoreIcon,
  LightbulbIcon,
  AssessmentIcon,
  WarningIcon,
  CheckCircleIcon,
  InfoIcon,
  HeartIcon as HealthIcon,
  HelpIcon as SupportIcon,
} from '../../utils/icons';
import { ExtendedAnalysisResponse } from '../../types/survey';
import { StyledIcon } from '../common/StyledIcon';

// Lazy load chart components
const BarChartComp = React.lazy(() => import('../charts/BarChartComp'));

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
  const [expanded, setExpanded] = useState<string | false>('overview');

  const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
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

  const getRiskIconComponent = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high':
        return WarningIcon;
      case 'medium':
        return InfoIcon;
      case 'low':
        return CheckCircleIcon;
      default:
        return InfoIcon;
    }
  };

  const RiskIcon = getRiskIconComponent(result.riskLevel || 'Unknown');

  const riskColors = getRiskColor(result.riskLevel || 'Unknown');

  // Memoized chart data preparation
  const chartData = useMemo(() => {
    // Bar chart data with meaningful assessment metrics (normalized to 0-100 scale)
    const assessmentBarData = [
      { 
        name: 'Burnout Risk', 
        value: Math.max(Math.round((result.burnoutScore || 0) * 100), 1), 
        color: theme.palette.error.main,
      },
      { 
        name: 'Stress Level', 
        value: Math.max(Math.round(((result.surveyResults?.stress_level || 3) / 5) * 100), 1), 
        color: theme.palette.warning.main,
      },
      { 
        name: 'Job Satisfaction', 
        value: Math.max(Math.round(((result.surveyResults?.job_satisfaction || 3) / 5) * 100), 1), 
        color: theme.palette.success.main,
      },
      { 
        name: 'Work-Life Balance', 
        value: Math.max(Math.round(((result.surveyResults?.work_life_balance || 3) / 5) * 100), 1), 
        color: theme.palette.info.main,
      },
      { 
        name: 'Mental Fatigue', 
        value: Math.max(Math.round(((result.employeeData?.mental_fatigue_score || 5) / 10) * 100), 1), 
        color: theme.palette.secondary.main,
      },
      { 
        name: 'Resource Allocation', 
        value: Math.max(Math.round(((result.employeeData?.resource_allocation || 5) / 10) * 100), 1), 
        color: theme.palette.primary.main,
      },
    ];

    return {
      assessmentBarData
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
      <Fade in={true} timeout={800}>
        <Paper
          elevation={0}
          sx={{
            background: `linear-gradient(135deg, ${riskColors.bg} 0%, ${alpha(riskColors.color, 0.05)} 100%)`,
            border: `1px solid ${alpha(riskColors.color, 0.2)}`,
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
                  }}
                >
                  <StyledIcon IconComponent={AssessmentIcon} sx={{ fontSize: '2rem' }} />
                </Avatar>
                <Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    Burnout Assessment Result
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Analysis based on your survey responses and work-life metrics.
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Chip
                  icon={<StyledIcon IconComponent={RiskIcon} />}
                  label={`${result.riskLevel || 'Unknown'} Risk`}
                  sx={{
                    bgcolor: riskColors.bg,
                    color: riskColors.color,
                    fontWeight: 600,
                    mb: 2,
                  }}
                />
                <Typography variant="caption" display="block" color="text.secondary">
                  Source: {result.source ?? 'Survey'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Fade>

      {/* Accordions */}
      <Accordion expanded={expanded === 'overview'} onChange={handleAccordionChange('overview')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <StyledIcon IconComponent={AssessmentIcon} sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6">Overview</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>{result.mental_health_summary ?? 'No summary available.'}</Typography>
        </AccordionDetails>
      </Accordion>
      
      <Accordion expanded={expanded === 'visuals'} onChange={handleAccordionChange('visuals')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <StyledIcon IconComponent={AssessmentIcon} sx={{ mr: 2, color: 'secondary.main' }} />
          <Typography variant="h6">Visual Analysis</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Suspense fallback={<ChartLoader />}>
            <BarChartComp data={chartData.assessmentBarData} />
          </Suspense>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'recommendations'} onChange={handleAccordionChange('recommendations')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <StyledIcon IconComponent={LightbulbIcon} sx={{ mr: 2, color: 'warning.main' }} />
          <Typography variant="h6">Recommendations</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {result.recommendations && result.recommendations.length > 0 ? (
            <Grid container spacing={3}>
              {result.recommendations.map((rec, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Paper sx={{ p: 2, height: '100%', bgcolor: alpha(theme.palette.primary.light, 0.1) }}>
                    <Typography variant="h6" gutterBottom>{rec.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{rec.description}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box>
              <Typography variant="body1" paragraph>
                Based on your assessment, here are some general recommendations to improve your mental health and well-being.
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, height: '100%', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                    <StyledIcon IconComponent={SupportIcon} sx={{ color: theme.palette.primary.main, mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Immediate Actions
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Consider implementing stress-reduction techniques and seeking professional support if needed.
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, height: '100%', bgcolor: alpha(theme.palette.success.main, 0.02) }}>
                    <StyledIcon IconComponent={HealthIcon} sx={{ color: theme.palette.success.main, mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Long-term Wellness
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Develop sustainable habits for maintaining good mental health and work-life balance.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      <Button onClick={onRetakeAssessment} variant="outlined" sx={{ mt: 3 }}>Retake Assessment</Button>
    </Box>
  );
};

export default EnhancedBurnoutSurveyResult; 