import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Admin: React.FC = () => {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Panel
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">
          User Management
        </Typography>
        <Typography>
          This is where user management features will be.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Admin; 