import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  SentimentSatisfied as EmotionIcon,
  Psychology as SentimentIcon,
  TextFields as TextIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const features = [
  {
    icon: <EmotionIcon sx={{ fontSize: 40 }} />,
    title: 'Emotion Recognition',
    description: 'Advanced AI-powered emotion detection from facial expressions and voice patterns',
  },
  {
    icon: <SentimentIcon sx={{ fontSize: 40 }} />,
    title: 'Sentiment Analysis',
    description: 'Real-time sentiment analysis of text and speech to understand emotional context',
  },
  {
    icon: <TextIcon sx={{ fontSize: 40 }} />,
    title: 'Text Analysis',
    description: 'Comprehensive text analysis with natural language processing capabilities',
  },
];

const steps = [
  {
    title: 'Input',
    description: 'Upload or record your content - text, audio, or video',
  },
  {
    title: 'Analysis',
    description: 'Our AI processes multiple data points simultaneously',
  },
  {
    title: 'Insights',
    description: 'Get detailed analysis and actionable insights',
  },
];

function LandingPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 700,
                    color: 'white',
                    mb: 2,
                  }}
                >
                  Multimodal Sentiment Analysis
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    mb: 4,
                  }}
                >
                  Unlock deeper insights with our advanced AI-powered analysis platform
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'grey.100',
                    },
                  }}
                >
                  Start Analysis
                </Button>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
              >
                <Box
                  component="img"
                  src="/hero-animation.svg"
                  alt="Data Visualization"
                  sx={{
                    width: '100%',
                    maxWidth: 500,
                    height: 'auto',
                  }}
                />
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          align="center"
          sx={{ mb: 6, fontWeight: 600 }}
        >
          Powerful Features
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Paper
                  elevation={3}
                  sx={{
                    p: 4,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                    },
                  }}
                >
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary">
                    {feature.description}
                  </Typography>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            align="center"
            sx={{ mb: 6, fontWeight: 600 }}
          >
            How It Works
          </Typography>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="/process-demo.svg"
                alt="Process Demo"
                sx={{
                  width: '100%',
                  maxWidth: 500,
                  height: 'auto',
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ once: true }}
                >
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
                      {index + 1}. {step.title}
                    </Typography>
                    <Typography color="text.secondary">
                      {step.description}
                    </Typography>
                  </Box>
                </motion.div>
              ))}
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Results Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          align="center"
          sx={{ mb: 6, fontWeight: 600 }}
        >
          See Results in Action
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 4,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Sample Analysis
              </Typography>
              <Box
                component="img"
                src="/sample-analysis.svg"
                alt="Sample Analysis"
                sx={{
                  width: '100%',
                  height: 'auto',
                  mb: 3,
                }}
              />
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Our platform provides detailed insights and visualizations of sentiment
                patterns across multiple modalities.
              </Typography>
              <Button
                variant="contained"
                startIcon={<PlayIcon />}
                sx={{ alignSelf: 'flex-start' }}
              >
                View Live Demo
              </Button>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 4,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Real-time Insights
              </Typography>
              <Box
                component="img"
                src="/real-time-insights.svg"
                alt="Real-time Insights"
                sx={{
                  width: '100%',
                  height: 'auto',
                  mb: 3,
                }}
              />
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Get instant feedback and analysis as you interact with the platform,
                enabling immediate understanding and action.
              </Typography>
              <Button
                variant="outlined"
                sx={{ alignSelf: 'flex-start' }}
              >
                Try It Now
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default LandingPage; 