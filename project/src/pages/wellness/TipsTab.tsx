import React from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';

interface TipsTabProps {
  colors: {
    primaryText: string;
    secondaryText: string;
    cardBg: string;
    border: string;
  };
  mode: 'light' | 'dark';
}

export const TipsTab: React.FC<TipsTabProps> = ({ colors, mode }) => {
  const wellnessTips = [
    {
      id: 'breathing-technique',
      title: 'Practice the 4-7-8 Breathing Technique',
      description: 'Inhale for 4 counts, hold for 7 counts, exhale for 8 counts. This technique activates your parasympathetic nervous system, promoting relaxation and reducing stress hormones.',
      readTime: '2 min read',
      category: 'mental',
      categoryColor: '#8B5CF6',
      icon: '🌬️',
      iconBg: '#F3E8FF',
    },
    {
      id: 'movement-breaks',
      title: 'Take Regular Movement Breaks',
      description: 'Stand up and move for 2-3 minutes every hour. Simple stretches, walking, or desk exercises can improve circulation, reduce muscle tension, and boost energy levels.',
      readTime: '3 min read',
      category: 'physical',
      categoryColor: '#10B981',
      icon: '🏃',
      iconBg: '#ECFDF5',
    },
    {
      id: 'stay-hydrated',
      title: 'Stay Hydrated Throughout the Day',
      description: 'Drink water regularly, aiming for 8-10 glasses daily. Proper hydration improves cognitive function, mood, and energy levels while supporting overall health.',
      readTime: '2 min read',
      category: 'nutrition',
      categoryColor: '#F59E0B',
      icon: '💧',
      iconBg: '#FEF3C7',
    },
    {
      id: 'sleep-schedule',
      title: 'Create a Consistent Sleep Schedule',
      description: 'Go to bed and wake up at the same time daily, even on weekends. This helps regulate your circadian rhythm and improves sleep quality and daytime alertness.',
      readTime: '3 min read',
      category: 'sleep',
      categoryColor: '#3B82F6',
      icon: '🌙',
      iconBg: '#E0F2FE',
    },
    {
      id: 'practice-gratitude',
      title: 'Practice Gratitude Daily',
      description: 'Write down three things you\'re grateful for each day. This simple practice can improve mood, reduce stress, and enhance overall life satisfaction.',
      readTime: '2 min read',
      category: 'mental',
      categoryColor: '#8B5CF6',
      icon: '💜',
      iconBg: '#F3E8FF',
    },
    {
      id: 'eat-mindfully',
      title: 'Eat Mindfully',
      description: 'Focus on your food while eating. Chew slowly, savor flavors, and avoid distractions. Mindful eating improves digestion and helps maintain a healthy weight.',
      readTime: '4 min read',
      category: 'nutrition',
      categoryColor: '#F59E0B',
      icon: '🍎',
      iconBg: '#FEF3C7',
    },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ color: colors.primaryText, mb: 4, fontWeight: 600 }}>
        Wellness Tips
      </Typography>
      <Grid container spacing={3}>
        {wellnessTips.map((tip) => (
          <Grid item xs={12} md={6} key={tip.id}>
            <Card sx={{
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: '16px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.1)',
              }
            }}>
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '16px',
                    backgroundColor: tip.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    flexShrink: 0,
                  }}>
                    {tip.icon}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: colors.secondaryText }}>
                    <Box sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: colors.secondaryText,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: colors.cardBg
                    }}>
                      ⏱
                    </Box>
                    <Typography variant="caption" sx={{
                      color: colors.secondaryText,
                      fontSize: '0.75rem'
                    }}>
                      {tip.readTime}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h6" sx={{
                  color: colors.primaryText,
                  fontWeight: 600,
                  mb: 2,
                  lineHeight: 1.3
                }}>
                  {tip.title}
                </Typography>
                <Typography variant="body2" sx={{
                  color: colors.secondaryText,
                  mb: 3,
                  lineHeight: 1.5
                }}>
                  {tip.description}
                </Typography>
                <Box sx={{
                  px: 2,
                  py: 0.5,
                  borderRadius: '12px',
                  backgroundColor: `${tip.categoryColor}20`,
                  border: `1px solid ${tip.categoryColor}30`,
                  display: 'inline-block'
                }}>
                  <Typography variant="caption" sx={{
                    color: tip.categoryColor,
                    fontWeight: 500,
                    fontSize: '0.75rem'
                  }}>
                    {tip.category}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TipsTab; 