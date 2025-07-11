import React from 'react';
import { Chip, ChipProps, Avatar } from '@mui/material';
import { styled, keyframes, useTheme } from '@mui/material/styles';

const bounceAnimation = keyframes`
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
`;

const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const EmotionAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== 'emotion',
})<{ emotion: string }>(({ theme, emotion }) => {
  const getEmotionColor = (emotion: string) => {
    const emotionColors: { [key: string]: string } = {
      happy: '#4CAF50',
      sad: '#2196F3', 
      angry: '#F44336',
      surprise: '#FF9800',
      fear: '#9C27B0',
      disgust: '#795548',
      neutral: '#607D8B'
    };
    return emotionColors[emotion.toLowerCase()] || theme.palette.primary.main;
  };

  return {
    backgroundColor: getEmotionColor(emotion),
    animation: `${bounceAnimation} 2s infinite`,
    width: 32,
    height: 32,
    fontSize: '1rem',
    '&:hover': {
      animation: `${pulseAnimation} 1s infinite`,
      transform: 'scale(1.2)',
    }
  };
});

export const getEmotionInfo = (emotion: string, isDarkMode: boolean = false) => {
  const emotionMap: { [key: string]: { emoji: string; color: string; bgColor: string; description: string } } = {
    happy: { 
      emoji: '😊', 
      color: '#4CAF50', 
      bgColor: isDarkMode ? '#1B5E20' : '#E8F5E8', 
      description: 'Joyful and positive' 
    },
    sad: { 
      emoji: '😢', 
      color: '#2196F3', 
      bgColor: isDarkMode ? '#0D47A1' : '#E3F2FD', 
      description: 'Melancholy and down' 
    },
    angry: { 
      emoji: '😠', 
      color: '#F44336', 
      bgColor: isDarkMode ? '#B71C1C' : '#FFEBEE', 
      description: 'Frustrated and upset' 
    },
    surprise: { 
      emoji: '😲', 
      color: '#FF9800', 
      bgColor: isDarkMode ? '#E65100' : '#FFF3E0', 
      description: 'Amazed and astonished' 
    },
    fear: { 
      emoji: '😨', 
      color: '#9C27B0', 
      bgColor: isDarkMode ? '#4A148C' : '#F3E5F5', 
      description: 'Anxious and worried' 
    },
    disgust: { 
      emoji: '🤢', 
      color: '#795548', 
      bgColor: isDarkMode ? '#3E2723' : '#EFEBE9', 
      description: 'Repulsed and revolted' 
    },
    neutral: { 
      emoji: '😐', 
      color: '#607D8B', 
      bgColor: isDarkMode ? '#263238' : '#ECEFF1', 
      description: 'Balanced and calm' 
    }
  };
  return emotionMap[emotion.toLowerCase()] || emotionMap.neutral;
};

interface EmotionChipProps extends Omit<ChipProps, 'avatar'> {
  emotion: string;
  showAvatar?: boolean;
  confidence?: number;
}

export const EmotionChip: React.FC<EmotionChipProps> = ({ 
  emotion,
  showAvatar = true,
  confidence,
  label,
  ...props 
}) => {
  const theme = useTheme();
  const emotionInfo = getEmotionInfo(emotion, theme.palette.mode === 'dark');
  
  return (
    <Chip
      avatar={showAvatar ? (
        <EmotionAvatar emotion={emotion}>
          {emotionInfo.emoji}
        </EmotionAvatar>
      ) : undefined}
      label={label || `${emotion}${confidence ? ` (${(confidence * 100).toFixed(0)}%)` : ''}`}
      sx={{ 
        bgcolor: theme.palette.mode === 'dark' 
          ? `${emotionInfo.color}40`
          : emotionInfo.bgColor,
        color: theme.palette.mode === 'dark' 
          ? emotionInfo.color
          : 'text.primary',
        fontWeight: 'bold',
        border: `1px solid ${emotionInfo.color}80`,
        '&:hover': {
          bgcolor: theme.palette.mode === 'dark' 
            ? `${emotionInfo.color}60`
            : emotionInfo.bgColor,
          transform: 'scale(1.05)',
        },
        ...props.sx
      }}
      {...props}
    />
  );
}; 