import React from 'react';
import { Box, Typography, Container, Grid, Paper, Card, CardContent, Stack, LinearProgress } from '@mui/material';
import { 
  Mood as SentimentIcon,
  Psychology as EmotionIcon,
  Chat as TextIcon,
  BarChart as BarChartIcon,
  Visibility as VisibilityIcon,
  SentimentVerySatisfied as PositiveIcon,
  SentimentNeutral as NeutralIcon,
  SentimentVeryDissatisfied as NegativeIcon
} from '@mui/icons-material';
import HeroSectionAnimated from './HeroSectionAnimated';

function LandingPage() {
  const features = [
    {
      title: 'Emotion Recognition',
      description: 'Advanced AI-powered emotion detection from facial expressions and voice patterns.',
      icon: <EmotionIcon sx={{ fontSize: 40 }} />,
      color: '#2196F3'
    },
    {
      title: 'Sentiment Analysis',
      description: 'Deep learning models to analyze emotional undertones in text and speech.',
      icon: <SentimentIcon sx={{ fontSize: 40 }} />,
      color: '#4CAF50'
    },
    {
      title: 'Text Analysis',
      description: 'Comprehensive analysis of written communication patterns and emotional content.',
      icon: <TextIcon sx={{ fontSize: 40 }} />,
      color: '#FF9800'
    }
  ];

  const steps = [
    {
      stepNumber: 1,
      title: 'Upload Data',
      description: 'Upload text, audio, video, or images for comprehensive analysis',
      color: '#2E7D32' // Green
    },
    {
      stepNumber: 2,
      title: 'AI Processing',
      description: 'Advanced algorithms analyze multiple data modalities simultaneously',
      color: '#00695C' // Teal/Dark Green
    },
    {
      stepNumber: 3,
      title: 'Data Fusion',
      description: 'Combine insights from all sources for comprehensive understanding',
      color: '#6A1B9A' // Purple
    },
    {
      stepNumber: 4,
      title: 'Get Results',
      description: 'Receive detailed reports with actionable insights and visualizations',
      color: '#D84315' // Orange
    }
  ];

  const sentiments = [
    { label: 'Positive', value: 68, icon: <PositiveIcon sx={{ color: '#4CAF50', fontSize: 18 }} /> },
    { label: 'Neutral', value: 22, icon: <NeutralIcon sx={{ color: '#FFD700', fontSize: 18 }} /> },
    { label: 'Negative', value: 10, icon: <NegativeIcon sx={{ color: '#F44336', fontSize: 18 }} /> },
  ];

  const emotions = [
    { label: 'Joy', value: 45, color: '#E8F5E9', textColor: '#2E7D32' }, // Light green
    { label: 'Trust', value: 23, color: '#E3F2FD', textColor: '#2196F3' }, // Light blue
    { label: 'Surprise', value: 18, color: '#F3E5F5', textColor: '#6A1B9A' }, // Light purple
    { label: 'Anticipation', value: 14, color: '#FFECB3', textColor: '#D84315' }, // Light orange
  ];

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <HeroSectionAnimated />

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Typography variant="h3" component="h2" sx={{ 
          textAlign: 'center', 
          mb: 6, 
          fontWeight: 600,
          fontSize: { xs: '2rem', md: '2.5rem' }
        }}>
          Key Features
        </Typography>
        <Grid container spacing={{ xs: 3, md: 4 }}>
          {features.map((feature) => (
            <Grid item xs={12} md={4} key={feature.title}>
              <Card sx={{ 
                height: '100%',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6
                }
              }}>
                <CardContent sx={{ textAlign: 'center', p: { xs: 3, md: 4 } }}>
                  <Box sx={{ 
                    color: feature.color,
                    mb: 2,
                    p: 2,
                    borderRadius: '50%',
                    bgcolor: `${feature.color}26`,
                    display: 'inline-flex'
                  }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" component="h3" sx={{ 
                    mb: 2, 
                    fontWeight: 600,
                    fontSize: { xs: '1.25rem', md: '1.5rem' }
                  }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ bgcolor: 'grey.50', py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="overline" sx={{
              bgcolor: '#E8F5E9',
              color: '#2E7D32',
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: 1.5,
              display: 'inline-block',
              mb: 2
            }}>
              Process
            </Typography>
            <Typography variant="h3" component="h2" sx={{
              textAlign: 'center',
              fontWeight: 600,
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}>
              How It Works
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mt: 2, fontSize: { xs: '1rem', md: '1.2rem' } }}>
              Our AI-powered platform processes your data through multiple analysis layers
            </Typography>
          </Box>

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={{ xs: 4, md: 4 }}
            alignItems="center"
            justifyContent="center"
          >
            {steps.map((step, index) => (
              <React.Fragment key={step.stepNumber}>
                <Box sx={{
                  textAlign: 'center',
                  flexShrink: 0,
                  width: { xs: '100%', md: '22%' },
                  maxWidth: { xs: 300, md: 'none' },
                  mx: { xs: 'auto', md: 0 } // Center box on mobile
                }}>
                  <Box sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    bgcolor: step.color,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                    fontSize: '2rem',
                    fontWeight: 700
                  }}>
                    {step.stepNumber}
                  </Box>
                  <Typography variant="h6" component="h3" sx={{
                    mb: 1,
                    fontWeight: 600,
                    fontSize: { xs: '1rem', md: '1.25rem' }
                  }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', md: '0.95rem' } }}>
                    {step.description}
                  </Typography>
                </Box>
                {index < steps.length - 1 && (
                  <Box sx={{
                    display: { xs: 'none', md: 'flex' },
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 40,
                  }}>
                    <Typography variant="h4" color="grey.700" sx={{ fontSize: '2.5rem' }}>→</Typography>
                  </Box>
                )}
              </React.Fragment>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* Results Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="overline" sx={{
            bgcolor: '#F5F5F5',
            color: '#757575',
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            fontWeight: 700,
            fontSize: '0.8rem',
            letterSpacing: 1.5,
            display: 'inline-block',
            mb: 1
          }}>
            Sample Results
          </Typography>
          <Typography variant="h3" component="h2" sx={{
            textAlign: 'center',
            fontWeight: 700,
            fontSize: { xs: '2rem', md: '2.8rem' },
            color: '#212121'
          }}>
            Real-Time Insights
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mt: 2, fontSize: { xs: '1rem', md: '1.2rem' } }}>
            See how our platform transforms raw data into actionable emotional intelligence
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 3, md: 4 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ 
              p: { xs: 3, md: 4 }, 
              height: '100%',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4
              }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <BarChartIcon sx={{ color: '#424242', mr: 1, fontSize: 28 }} />
                <Typography variant="h5" component="h3" sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                  color: '#212121'
                }}>
                  Sentiment Distribution
                </Typography>
              </Box>
              
              <Box>
                {sentiments.map((sentiment) => (
                  <Box key={sentiment.label} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {sentiment.icon}
                        <Typography variant="body1" sx={{ ml: 1, fontWeight: 500, color: '#424242' }}>
                          {sentiment.label}
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 500, color: '#424242' }}>
                        {sentiment.value}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={sentiment.value} 
                      sx={{
                        height: 8,
                        borderRadius: 5,
                        bgcolor: '#EEEEEE',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: sentiment.label === 'Positive' ? '#4CAF50' : sentiment.label === 'Neutral' ? '#FFD700' : '#F44336',
                        }
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ 
              p: { xs: 3, md: 4 }, 
              height: '100%',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4
              }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <VisibilityIcon sx={{ color: '#424242', mr: 1, fontSize: 28 }} />
                <Typography variant="h5" component="h3" sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                  color: '#212121'
                }}>
                  Emotion Breakdown
                </Typography>
              </Box>

              <Grid container spacing={2}>
                {emotions.map((emotion) => (
                  <Grid item xs={6} key={emotion.label}>
                    <Box sx={{
                      bgcolor: emotion.color,
                      borderRadius: 2,
                      p: { xs: 2, md: 3 },
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 120,
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.02)'
                      }
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: emotion.textColor, mb: 0.5, fontSize: { xs: '1rem', md: '1.15rem' } }}>
                        {emotion.label}
                      </Typography>
                      <Typography variant="body2" sx={{ color: emotion.textColor, opacity: 0.8, fontSize: { xs: '0.875rem', md: '0.9rem' } }}>
                        {emotion.value}%
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default LandingPage; 