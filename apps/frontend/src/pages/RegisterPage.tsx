import React from 'react';
import { RegisterForm } from '../components/Auth/RegisterForm';
import { Box, Paper, Typography, Grid } from '@mui/material';
import { BarChart, BrainCircuit } from 'lucide-react';

const RegisterPage: React.FC = () => {
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
          display: { xs: 'none', sm: 'flex' }, // Hide on extra small screens
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: { sm: 4, md: 8 },
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
            Join a smarter, healthier workforce
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Create your account to unlock personalized wellness insights and contribute to a more emotionally intelligent workplace.
          </Typography>

          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BarChart size={20} color="#2563eb" />
              <Typography variant="body1" sx={{ fontWeight: 500 }}>Personalized Dashboards</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BrainCircuit size={20} color="#7c3aed" />
              <Typography variant="body1" sx={{ fontWeight: 500 }}>AI-Powered Recommendations</Typography>
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
        <Box sx={{ width: '100%', maxWidth: 450 }}>
          <RegisterForm />
        </Box>
      </Grid>
    </Grid>
  );
};

export default RegisterPage; 