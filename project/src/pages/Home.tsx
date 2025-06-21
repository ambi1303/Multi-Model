import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Videocam,
  Mic,
  Chat,
  Assignment,
  TrendingUp,
  People,
  Speed,
  Psychology,
} from '@mui/icons-material';

const features = [
  {
    icon: <Videocam sx={{ fontSize: 40 }} />,
    title: 'Video Emotion Recognition',
    description: 'Analyze emotions from webcam feed or uploaded images using advanced computer vision and facial recognition technology.',
    route: '/video',
    color: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
    status: 'Ready',
  },
  {
    icon: <Mic sx={{ fontSize: 40 }} />,
    title: 'Speech Analysis',
    description: 'Convert speech to text and analyze emotional content, sentiment, and vocal patterns for comprehensive insights.',
    route: '/speech',
    color: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
    status: 'Ready',
  },
  {
    icon: <Chat sx={{ fontSize: 40 }} />,
    title: 'Chat Analysis',
    description: 'Evaluate mental state and emotional patterns from text conversations with real-time sentiment analysis.',
    route: '/chat',
    color: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)',
    status: 'Ready',
  },
  {
    icon: <Assignment sx={{ fontSize: 40 }} />,
    title: 'Burnout Assessment',
    description: 'Comprehensive survey to predict employee burnout risk and stress levels with personalized recommendations.',
    route: '/survey',
    color: 'linear-gradient(135deg, #dc2626 0%, #ea580c 100%)',
    status: 'Ready',
  },
];

const stats = [
  { label: 'Analyses Completed', value: '2,847', icon: <Speed />, change: '+12%' },
  { label: 'Users Helped', value: '1,204', icon: <People />, change: '+8%' },
  { label: 'Accuracy Rate', value: '94.2%', icon: <TrendingUp />, change: '+2%' },
  { label: 'AI Models Active', value: '4', icon: <Psychology />, change: '100%' },
];

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box>
      {/* Funky Animated Header */}
      <Box
        sx={{
          textAlign: 'center',
          mb: 6,
          mt: 4,
          animation: 'fadeIn 1.2s cubic-bezier(0.4,0,0.2,1)',
          '@keyframes fadeIn': {
            from: { opacity: 0, transform: 'translateY(-30px)' },
            to: { opacity: 1, transform: 'none' },
          },
        }}
      >
        <Typography
          variant="h2"
          component="h1"
          sx={{
            fontWeight: 700,
            mb: 2,
            background: 'linear-gradient(90deg, #6366f1, #7c3aed, #06b6d4, #f59e42, #6366f1)',
            backgroundSize: '200% auto',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'gradientMove 3s linear infinite',
            '@keyframes gradientMove': {
              '0%': { backgroundPosition: '0% 50%' },
              '50%': { backgroundPosition: '100% 50%' },
              '100%': { backgroundPosition: '0% 50%' },
            },
            position: 'relative',
            zIndex: 1,
          }}
        >
          Welcome to EmotiAnalyze
        </Typography>
        <Box
          sx={{
            width: 320,
            maxWidth: '80vw',
            height: 6,
            mx: 'auto',
            borderRadius: 3,
            background: 'linear-gradient(90deg, #6366f1, #7c3aed, #06b6d4, #f59e42, #6366f1)',
            backgroundSize: '200% auto',
            animation: 'underlineMove 3s linear infinite',
            '@keyframes underlineMove': {
              '0%': { backgroundPosition: '0% 50%' },
              '50%': { backgroundPosition: '100% 50%' },
              '100%': { backgroundPosition: '0% 50%' },
            },
            mt: 1,
            mb: 3,
            opacity: 0.85,
          }}
        />
        <Typography
          variant="h5"
          color="text.secondary"
          sx={{
            maxWidth: 900,
            mx: 'auto',
            lineHeight: 1.6,
            letterSpacing: 0.2,
            fontWeight: 400,
            fontSize: { xs: '1.1rem', sm: '1.3rem' },
            animation: 'fadeIn 2s 0.5s both',
          }}
        >
          Advanced multi-modal emotion analysis platform combining video recognition, speech processing, text analysis, and burnout prediction to provide comprehensive insights.
        </Typography>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                      color: 'white',
                      mr: 2,
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip
                    label={stat.change}
                    size="small"
                    color="success"
                    sx={{ fontSize: '0.75rem' }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    vs last month
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Features */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      background: feature.color,
                      color: 'white',
                      mr: 3,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 600, mr: 2 }}>
                        {feature.title}
                      </Typography>
                      <Chip
                        label={feature.status}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {feature.description}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
              <CardActions sx={{ p: 3, pt: 0 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate(feature.route)}
                  sx={{
                    background: feature.color,
                    '&:hover': {
                      background: feature.color,
                      filter: 'brightness(1.1)',
                    },
                  }}
                  fullWidth
                >
                  Get Started
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* How it works */}
      <Card sx={{ p: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 2, textAlign: 'center' }}>
          How It Works
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ textAlign: 'center', mb: 4, maxWidth: 600, mx: 'auto' }}
        >
          Our comprehensive approach to emotion analysis combines cutting-edge AI with intuitive design
        </Typography>

        <Grid container spacing={4}>
          {[
            {
              step: '1',
              title: 'Capture Input',
              description: 'Record video, audio, or enter text through our intuitive interface with real-time feedback',
              color: '#2563eb',
            },
            {
              step: '2',
              title: 'AI Analysis',
              description: 'Advanced machine learning algorithms process your data to identify emotions and behavioral patterns',
              color: '#7c3aed',
            },
            {
              step: '3',
              title: 'Get Insights',
              description: 'Receive detailed reports with actionable recommendations and comprehensive visualizations',
              color: '#059669',
            },
          ].map((item, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: item.color,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                    fontSize: '2rem',
                    fontWeight: 'bold',
                  }}
                >
                  {item.step}
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                  {item.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {item.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <LinearProgress
            variant="determinate"
            value={94.2}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                borderRadius: 4,
              },
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            94.2% Average Accuracy Across All Analysis Modes
          </Typography>
        </Box>
      </Card>
    </Box>
  );
}; 