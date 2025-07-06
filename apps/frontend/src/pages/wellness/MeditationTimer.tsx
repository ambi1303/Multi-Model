import React from 'react';
import { Box, Typography, Button, LinearProgress } from '@mui/material';
import { PlayArrowIcon, PauseIcon, StopIcon } from '../../utils/icons';

interface MeditationTimerProps {
  activeSession: {
    id: string;
    title: string;
    durationMinutes: number;
    description: string;
    icon: string;
  } | undefined;
  timeRemaining: number;
  isPlaying: boolean;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  formatTime: (seconds: number) => string;
}

export const MeditationTimer: React.FC<MeditationTimerProps> = ({
  activeSession,
  timeRemaining,
  isPlaying,
  pauseTimer,
  resumeTimer,
  stopTimer,
  formatTime,
}) => {
  return (
    <Box sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      bgcolor: '#F0F9FF',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1300,
      p: 4,
    }}>
      <Box sx={{
        width: 120,
        height: 120,
        borderRadius: '50%',
        bgcolor: '#10B981',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 4,
        fontSize: '48px',
      }}>
        {activeSession?.icon}
      </Box>
      <Typography variant="h3" sx={{
        color: '#1F2937',
        fontWeight: 600,
        mb: 2,
        textAlign: 'center'
      }}>
        {activeSession?.title}
      </Typography>
      <Typography variant="h6" sx={{
        color: '#6B7280',
        mb: 6,
        textAlign: 'center',
        maxWidth: 600
      }}>
        {activeSession?.description}
      </Typography>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 4,
      }}>
        <Box sx={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          bgcolor: '#10B981',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '14px',
        }}>
          <PlayArrowIcon />
        </Box>
        <Typography variant="h1" sx={{
          color: '#10B981',
          fontWeight: 'bold',
          fontSize: '4rem',
          fontFamily: 'monospace'
        }}>
          {formatTime(timeRemaining)}
        </Typography>
      </Box>
      <Box sx={{ width: '100%', maxWidth: 800, mb: 6 }}>
        <LinearProgress
          variant="determinate"
          value={
            activeSession
              ? ((activeSession.durationMinutes * 60 - timeRemaining) / (activeSession.durationMinutes * 60)) * 100
              : 0
          }
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: '#E5E7EB',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#10B981',
              borderRadius: 4,
            }
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={isPlaying ? pauseTimer : resumeTimer}
          sx={{
            bgcolor: '#10B981',
            color: 'white',
            px: 4,
            py: 1.5,
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '1rem',
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#059669',
            },
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          {isPlaying ? 'Pause' : 'Resume'}
        </Button>
        <Button
          variant="outlined"
          onClick={stopTimer}
          sx={{
            borderColor: '#9CA3AF',
            color: '#6B7280',
            px: 4,
            py: 1.5,
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '1rem',
            textTransform: 'none',
            '&:hover': {
              borderColor: '#6B7280',
              bgcolor: '#F9FAFB',
            },
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <StopIcon />
          Stop
        </Button>
      </Box>
    </Box>
  );
};

export default MeditationTimer; 