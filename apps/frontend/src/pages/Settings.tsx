import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const SettingsPage: React.FC = () => {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">
          Application Preferences
        </Typography>
        <Typography>
          This is where application preferences and settings will be.
        </Typography>
      </Paper>
    </Box>
  );
};

export default SettingsPage; 