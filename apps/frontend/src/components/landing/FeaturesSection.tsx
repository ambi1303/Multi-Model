import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Container, Grid, Card, CardContent } from '@mui/material';
import { VideoCallIcon, MicIcon, ChatIcon, AssignmentIcon, InfoIcon, TrendingUpIcon } from '../../utils/icons';

const features = [
  {
    icon: <VideoCallIcon />,
    title: 'Video Emotion Recognition',
    description: 'Advanced computer vision analyzes facial expressions and micro-emotions in real-time',
    color: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    delay: 0.1,
  },
  {
    icon: <MicIcon />,
    title: 'Speech Analysis',
    description: 'AI-powered voice analysis detects emotional patterns and sentiment from speech',
    color: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
    delay: 0.2,
  },
  {
    icon: <ChatIcon />,
    title: 'Text Intelligence',
    description: 'Natural language processing reveals emotional context and mental state indicators',
    color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    delay: 0.3,
  },
  {
    icon: <AssignmentIcon />,
    title: 'Burnout Prediction',
    description: 'Comprehensive assessment tools predict workplace stress and burnout risk',
    color: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    delay: 0.4,
  },
  {
    icon: <InfoIcon />,
    title: 'AI-Powered Insights',
    description: 'Machine learning algorithms provide deep psychological and behavioral analysis',
    color: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    delay: 0.5,
  },
  {
    icon: <TrendingUpIcon />,
    title: 'Real-time Processing',
    description: 'Lightning-fast analysis with sub-second response times for immediate insights',
    color: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    delay: 0.6,
  },
  {
    icon: <TrendingUpIcon />,
    title: 'Trend Analytics',
    description: 'Track emotional patterns over time with comprehensive reporting and visualization',
    color: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    delay: 0.7,
  },
  {
    icon: <InfoIcon />,
    title: 'Privacy First',
    description: 'Enterprise-grade security with end-to-end encryption and GDPR compliance',
    color: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    delay: 0.8,
  },
];

const FeatureCard: React.FC<{ feature: typeof features[0]; index: number }> = ({ feature}) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: feature.delay, duration: 0.6 }}
    whileHover={{ y: -10 }}
  >
    <Card
      sx={{
        height: '100%',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: feature.color,
        }}
      />
      
      <CardContent sx={{ p: 4 }}>
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: feature.delay + 0.2, duration: 0.5 }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: 3,
              background: feature.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              color: 'white',
            }}
          >
            {feature.icon}
          </Box>
        </motion.div>

        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            mb: 2,
            color: 'white',
          }}
        >
          {feature.title}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: 1.6,
          }}
        >
          {feature.description}
        </Typography>
      </CardContent>
    </Card>
  </motion.div>
);

export const FeaturesSection: React.FC = () => {
  return (
    <Box
      sx={{
        width: '100vw',
        py: { xs: 8, sm: 10, md: 12 },
        background: 'linear-gradient(180deg, #0f0f23 0%, #1a1a2e 100%)',
        position: 'relative',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        paddingTop: { xs: 8, sm: 10, md: 12 },
        paddingBottom: { xs: 8, sm: 10, md: 12 },
      }}
    >
      {/* Animated Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          backgroundImage: `
            radial-gradient(circle at 25% 25%, #3b82f6 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, #8b5cf6 0%, transparent 50%)
          `,
        }}
      />

      <Container 
        maxWidth={false} 
        sx={{ 
          position: 'relative', 
          zIndex: 1,
          maxWidth: '1400px',
          mx: 'auto',
          px: { xs: 2, sm: 3, md: 4, lg: 6 },
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Typography
            variant="h2"
            sx={{
              textAlign: 'center',
              fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem', lg: '4rem' },
              fontWeight: 800,
              mb: { xs: 2, md: 3 },
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Powerful Features
          </Typography>

          <Typography
            variant="h6"
            sx={{
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.7)',
              mb: { xs: 6, md: 8 },
              maxWidth: '800px',
              mx: 'auto',
              fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' },
              lineHeight: 1.6,
              px: { xs: 2, sm: 0 },
            }}
          >
            Advanced AI-powered tools for comprehensive emotion analysis across multiple modalities
          </Typography>
        </motion.div>

        <Grid 
          container 
          spacing={{ xs: 3, sm: 4, md: 5 }} 
          sx={{ 
            justifyContent: 'center',
            alignItems: 'stretch',
          }}
        >
          {features.map((feature, index) => (
            <Grid 
              item 
              xs={12} 
              sm={6} 
              md={4} 
              lg={3}
              key={index}
              sx={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <FeatureCard feature={feature} index={index} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};