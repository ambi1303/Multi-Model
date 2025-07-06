import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  LinearProgress,
  Grid,
} from '@mui/material';
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  RemoveIcon, 
  ZapIcon, 
  InfoIcon, 
  HeartIcon, 
  SpeedIcon 
} from '../../utils/icons';

interface MetricData {
  id: string;
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  color: string;
  icon: React.ReactNode;
  description: string;
}

const useRealTimeMetrics = () => {
  const [metrics, setMetrics] = useState<MetricData[]>([
    {
      id: 'happiness',
      label: 'Happiness Index',
      value: 78,
      unit: '%',
      trend: 'up',
      trendValue: 5.2,
      color: '#FF6B6B',
      icon: <HeartIcon />,
      description: 'Overall team happiness level',
    },
    {
      id: 'stress',
      label: 'Stress Level',
      value: 23,
      unit: '%',
      trend: 'down',
      trendValue: -3.1,
      color: '#4ECDC4',
      icon: <InfoIcon />,
      description: 'Current stress indicators',
    },
    {
      id: 'energy',
      label: 'Energy Level',
      value: 89,
      unit: '%',
      trend: 'up',
      trendValue: 2.8,
      color: '#45B7D1',
      icon: <ZapIcon />,
      description: 'Team energy and motivation',
    },
    {
      id: 'productivity',
      label: 'Productivity',
      value: 94,
      unit: '%',
      trend: 'stable',
      trendValue: 0.5,
      color: '#96CEB4',
      icon: <SpeedIcon />,
      description: 'Work efficiency metrics',
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => {
        const change = (Math.random() - 0.5) * 4; // -2 to +2
        const newValue = Math.max(0, Math.min(100, metric.value + change));
        const newTrend = change > 1 ? 'up' : change < -1 ? 'down' : 'stable';
        
        return {
          ...metric,
          value: Math.round(newValue * 10) / 10,
          trend: newTrend,
          trendValue: Math.round(Math.abs(change) * 10) / 10,
        };
      }));
    }, 3000);

    // Pause interval when page is not visible (helps with bfcache)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(interval);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return metrics;
};

const MetricCard: React.FC<{ metric: MetricData; index: number }> = ({ metric, index }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 600);
    return () => clearTimeout(timer);
  }, [metric.value]);

  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up': return <TrendingUpIcon />;
      case 'down': return <TrendingDownIcon />;
      default: return <RemoveIcon />;
    }
  };

  const getTrendColor = () => {
    switch (metric.trend) {
      case 'up': return 'success';
      case 'down': return 'error';
      default: return 'default';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        scale: 1.05,
        rotateY: 5,
        boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
      }}
    >
      <Card
        sx={{
          height: '100%',
          backgroundColor: `${metric.color}15`,
          backgroundImage: `linear-gradient(135deg, ${metric.color}15 0%, ${metric.color}25 100%)`,
          backdropFilter: 'blur(20px)',
          border: `2px solid ${metric.color}30`,
          borderRadius: 4,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated background pulse */}
        <motion.div
          animate={{
            scale: isAnimating ? [1, 1.2, 1] : 1,
            opacity: isAnimating ? [0.3, 0.6, 0.3] : 0.3,
          }}
          transition={{ duration: 0.6 }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '200%',
            height: '200%',
            backgroundColor: `${metric.color}20`,
            backgroundImage: `radial-gradient(circle, ${metric.color}20 0%, transparent 70%)`,
            zIndex: 0,
          }}
        />

        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <motion.div
              animate={{ 
                rotate: isAnimating ? [0, 360] : 0,
                scale: isAnimating ? [1, 1.2, 1] : 1
              }}
              transition={{ duration: 0.6 }}
            >
              <Avatar
                sx={{
                  backgroundColor: metric.color,
                  backgroundImage: `linear-gradient(135deg, ${metric.color} 0%, ${metric.color}80 100%)`,
                  width: 48,
                  height: 48,
                  mr: 2,
                }}
              >
                {metric.icon}
              </Avatar>
            </motion.div>
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                {metric.label}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>
                  {metric.value}{metric.unit}
                </Typography>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {getTrendIcon()}
                </motion.div>
              </Box>
            </Box>
          </Box>
          
          <Typography variant="caption" sx={{ mb: 2, display: 'block', color: 'text.secondary' }}>
            {metric.description}
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.3, duration: 1 }}
            >
              <LinearProgress
                variant="determinate"
                value={metric.value}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: metric.color,
                    backgroundImage: `linear-gradient(90deg, ${metric.color} 0%, ${metric.color}80 100%)`,
                    borderRadius: 4,
                  },
                }}
              />
            </motion.div>
          </Box>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Chip
              label={`${metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : ''}${metric.trendValue}% today`}
              size="small"
              color={getTrendColor() as any}
              sx={{ fontSize: '0.7rem' }}
            />
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const RealTimeMetrics: React.FC = () => {
  const metrics = useRealTimeMetrics();

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 3,
            textAlign: 'center',
            backgroundImage: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Live Emotion Metrics 📊
        </Typography>
      </motion.div>

      <Grid container spacing={3}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={metric.id}>
            <MetricCard metric={metric} index={index} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};