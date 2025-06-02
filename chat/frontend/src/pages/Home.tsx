import React from 'react';
import { Container, Typography, Box, Paper, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TimelineIcon from '@mui/icons-material/Timeline';
import HistoryIcon from '@mui/icons-material/History';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Real-time Analysis',
      description: 'Analyze your messages in real-time to understand your mental state and emotions.',
      icon: <PsychologyIcon sx={{ fontSize: 40 }} />,
      path: '/analysis'
    },
    {
      title: 'Visual Insights',
      description: 'Get visual representations of your mental state trends and emotional patterns.',
      icon: <TimelineIcon sx={{ fontSize: 40 }} />,
      path: '/analysis'
    },
    {
      title: 'Historical Data',
      description: 'Access your analysis history and track your emotional journey over time.',
      icon: <HistoryIcon sx={{ fontSize: 40 }} />,
      path: '/history'
    }
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          Welcome to Mental State Analyzer
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom align="center" color="text.secondary">
          Understand your emotions and mental state through advanced text analysis
        </Typography>
      </Box>

      <Grid container spacing={4} sx={{ mt: 4 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Paper
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
              onClick={() => navigate(feature.path)}
            >
              <Box sx={{ mb: 2 }}>{feature.icon}</Box>
              <Typography variant="h5" component="h3" gutterBottom>
                {feature.title}
              </Typography>
              <Typography color="text.secondary" align="center">
                {feature.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Home; 