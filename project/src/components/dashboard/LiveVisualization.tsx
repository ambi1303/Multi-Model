import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
} from '@mui/material';
import {
  EmojiEmotions,

} from '@mui/icons-material';

interface EmotionData {
  emotion: string;
  value: number;
  color: string;
  emoji: string;
  trend: number;
}

const useLiveEmotions = () => {
  const [emotions, setEmotions] = useState<EmotionData[]>([
    { emotion: 'Happy', value: 78, color: '#FF6B6B', emoji: '😊', trend: 5.2 },
    { emotion: 'Excited', value: 65, color: '#4ECDC4', emoji: '🤩', trend: 3.1 },
    { emotion: 'Calm', value: 82, color: '#45B7D1', emoji: '😌', trend: -1.2 },
    { emotion: 'Focused', value: 91, color: '#96CEB4', emoji: '🎯', trend: 7.8 },
    { emotion: 'Creative', value: 73, color: '#FECA57', emoji: '🎨', trend: 2.4 },
    { emotion: 'Confident', value: 88, color: '#FF9FF3', emoji: '💪', trend: 4.6 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setEmotions(prev => prev.map(emotion => ({
        ...emotion,
        value: Math.max(0, Math.min(100, emotion.value + (Math.random() - 0.5) * 6)),
        trend: (Math.random() - 0.5) * 10,
      })));
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return emotions;
};

const EmotionBubble: React.FC<{ emotion: EmotionData; index: number }> = ({ emotion, index }) => {
  const size = (emotion.value / 100) * 120 + 60; // 60-180px

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        delay: index * 0.1,
        duration: 0.6,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        scale: 1.1,
        zIndex: 10,
      }}
      style={{
        position: 'absolute',
        left: `${15 + (index % 3) * 30}%`,
        top: `${20 + Math.floor(index / 3) * 40}%`,
      }}
    >
      <motion.div
        animate={{
          y: [0, -10, 0],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 3 + index * 0.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Box
          sx={{
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: `${emotion.color}40`,
            backgroundImage: `linear-gradient(135deg, ${emotion.color}40 0%, ${emotion.color}80 100%)`,
            backdropFilter: 'blur(20px)',
            border: `3px solid ${emotion.color}60`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Animated background */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundColor: `${emotion.color}40`,
              backgroundImage: `radial-gradient(circle, ${emotion.color}40 0%, transparent 70%)`,
            }}
          />

          <Typography sx={{ fontSize: `${size * 0.25}px`, mb: 1, zIndex: 1 }}>
            {emotion.emoji}
          </Typography>
          
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: 700, 
              color: 'white',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              zIndex: 1,
              fontSize: `${Math.max(10, size * 0.08)}px`,
            }}
          >
            {emotion.emotion}
          </Typography>
          
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: 600, 
              color: 'white',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              zIndex: 1,
              fontSize: `${Math.max(8, size * 0.06)}px`,
            }}
          >
            {emotion.value.toFixed(0)}%
          </Typography>

          {/* Trend indicator */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              position: 'absolute',
              top: 5,
              right: 5,
              zIndex: 2,
            }}
          >
            <Chip
              label={`${emotion.trend > 0 ? '+' : ''}${emotion.trend.toFixed(1)}%`}
              size="small"
              sx={{
                backgroundColor: emotion.trend > 0 ? '#4CAF50' : emotion.trend < 0 ? '#f44336' : '#9E9E9E',
                color: 'white',
                fontSize: '0.6rem',
                height: 20,
              }}
            />
          </motion.div>
        </Box>
      </motion.div>
    </motion.div>
  );
};

export const LiveVisualization: React.FC = () => {
  const emotions = useLiveEmotions();

  return (
    <Card
      sx={{
        backgroundColor: 'rgba(255,255,255,0.05)',
        backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 4,
        height: 400,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <CardContent>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Avatar
                sx={{
                  backgroundColor: '#FF6B6B',
                  backgroundImage: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
                  mr: 2,
                }}
              >
                <EmojiEmotions />
              </Avatar>
            </motion.div>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Live Emotion Bubbles
            </Typography>
          </Box>
        </motion.div>

        {/* Floating background elements */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
            style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: 20 + Math.random() * 40,
              height: 20 + Math.random() * 40,
              borderRadius: '50%',
              backgroundColor: `${['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][i % 4]}40`,
              backgroundImage: `linear-gradient(135deg, ${['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][i % 4]}40 0%, transparent 100%)`,
              zIndex: 0,
            }}
          />
        ))}

        {/* Emotion bubbles */}
        <Box sx={{ position: 'relative', height: 300 }}>
          {emotions.map((emotion, index) => (
            <EmotionBubble key={emotion.emotion} emotion={emotion} index={index} />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};