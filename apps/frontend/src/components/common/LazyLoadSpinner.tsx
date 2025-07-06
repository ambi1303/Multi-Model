import React from 'react';
import { Box, Typography } from '@mui/material';

interface LazyLoadSpinnerProps {
  message?: string;
  minimal?: boolean;
}

export const LazyLoadSpinner: React.FC<LazyLoadSpinnerProps> = ({ 
  message = "Loading...", 
  minimal = false 
}) => {
  if (minimal) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '200px' 
        }}
      >
        <div className="loading-spinner" />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '300px',
        gap: 2,
      }}
    >
      <div className="loading-spinner" />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}; 