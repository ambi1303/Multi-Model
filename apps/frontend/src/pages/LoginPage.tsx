import React from 'react';
import { LoginForm } from '../components/Auth/LoginForm';
import { Box, Paper, Typography, Grid, Icon } from '@mui/material';
import { BarChart, BrainCircuit } from 'lucide-react';

const LoginPage: React.FC = () => {
  return (
    <Grid container component="main" sx={{ height: '100vh' }}>
      {/* Left Pane */}
      <Grid
        item
        xs={12}
        sm={6}
        md={7}
        sx={{
          background: 'linear-gradient(135deg, #f5f7fa 0%, #eef2f7 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, sm: 4, md: 8 },
        }}
      >
        <Box sx={{ maxWidth: 500 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                color: 'white',
              }}
            >
             <BrainCircuit size={30} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              EmotiAnalyze
            </Typography>
          </Box>

          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
            Your wellness, intelligently analyzed
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Empowering organizations with AI-driven mental health insights and emotional intelligence analytics for a healthier, more productive workforce.
          </Typography>

          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BarChart size={20} color="#2563eb" />
              <Typography variant="body1" sx={{ fontWeight: 500 }}>Real-time Analytics</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BrainCircuit size={20} color="#7c3aed" />
              <Typography variant="body1" sx={{ fontWeight: 500 }}>AI-Powered Insights</Typography>
            </Box>
          </Box>
        </Box>
      </Grid>

      {/* Right Pane */}
      <Grid 
        item 
        xs={12} 
        sm={6} 
        md={5} 
        component={Paper} 
        elevation={6} 
        square 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: { xs: 2, sm: 4, md: 8 },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <LoginForm />
        </Box>
      </Grid>
    </Grid>
  );
};

export default LoginPage; 