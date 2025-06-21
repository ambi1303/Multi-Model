import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface BurnoutSurveyResultProps {
  result: {
    score: number;
    message: string;
  };
}

export const BurnoutSurveyResult: React.FC<BurnoutSurveyResultProps> = ({ result }) => {
  return (
    <Paper sx={{ maxWidth: 500, mx: 'auto', mt: 4, p: 3, textAlign: 'center' }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Burnout Survey Result
      </Typography>
      <Typography variant="h3" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
        {result.score}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {result.message}
      </Typography>
    </Paper>
  );
}; 