import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Badge,
} from '@mui/material';
import {
  Notifications,
  Videocam,
  Mic,
  Chat,
  Assignment,
  Bolt,
  Star,
  Celebration,
} from '@mui/icons-material';

interface Activity {
  id: string;
  type: 'video' | 'speech' | 'chat' | 'survey' | 'achievement';
  message: string;
  user: string;
  timestamp: Date;
  icon: React.ReactNode;
  color: string;
  emoji: string;
}

const useActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      type: 'video',
      message: 'completed video emotion analysis',
      user: 'Sarah',
      timestamp: new Date(Date.now() - 2000),
      icon: <Videocam />,
      color: '#FF6B6B',
      emoji: '🎥',
    },
    {
      id: '2',
      type: 'achievement',
      message: 'reached happiness milestone!',
      user: 'Team',
      timestamp: new Date(Date.now() - 5000),
      icon: <Star />,
      color: '#FECA57',
      emoji: '⭐',
    },
    {
      id: '3',
      type: 'speech',
      message: 'analyzed voice patterns',
      user: 'Alex',
      timestamp: new Date(Date.now() - 12000),
      icon: <Mic />,
      color: '#4ECDC4',
      emoji: '🎤',
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const activityTypes = [
        {
          type: 'video' as const,
          messages: ['started video analysis', 'completed emotion detection', 'captured mood snapshot'],
          icon: <Videocam />,
          color: '#FF6B6B',
          emoji: '🎥',
        },
        {
          type: 'speech' as const,
          messages: ['analyzed speech patterns', 'detected voice emotions', 'completed audio processing'],
          icon: <Mic />,
          color: '#4ECDC4',
          emoji: '🎤',
        },
        {
          type: 'chat' as const,
          messages: ['analyzed text sentiment', 'processed chat emotions', 'detected mood shift'],
          icon: <Chat />,
          color: '#45B7D1',
          emoji: '💬',
        },
        {
          type: 'survey' as const,
          messages: ['completed burnout assessment', 'submitted wellness check', 'updated health metrics'],
          icon: <Assignment />,
          color: '#96CEB4',
          emoji: '📋',
        },
        {
          type: 'achievement' as const,
          messages: ['reached happiness goal!', 'stress levels improved!', 'productivity boost detected!', 'team morale rising!'],
          icon: <Celebration />,
          color: '#FECA57',
          emoji: '🎉',
        },
      ];

      const users = ['Sarah', 'Alex', 'Jordan', 'Casey', 'Morgan', 'Taylor', 'Team'];
      const randomType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomMessage = randomType.messages[Math.floor(Math.random() * randomType.messages.length)];

      const newActivity: Activity = {
        id: Date.now().toString(),
        type: randomType.type,
        message: randomMessage,
        user: randomUser,
        timestamp: new Date(),
        icon: randomType.icon,
        color: randomType.color,
        emoji: randomType.emoji,
      };

      setActivities(prev => [newActivity, ...prev.slice(0, 9)]); // Keep last 10
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return activities;
};

const ActivityItem: React.FC<{ activity: Activity; index: number }> = ({ activity, index }) => {
  const timeAgo = Math.floor((Date.now() - activity.timestamp.getTime()) / 1000);
  const timeString = timeAgo < 60 ? `${timeAgo}s ago` : `${Math.floor(timeAgo / 60)}m ago`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -50, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.8 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.05,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ scale: 1.02, x: 5 }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          mb: 1,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${activity.color}15 0%, ${activity.color}25 100%)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${activity.color}30`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated background pulse */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at 20% 50%, ${activity.color}20 0%, transparent 70%)`,
            zIndex: 0,
          }}
        />

        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ zIndex: 1 }}
        >
          <Typography sx={{ fontSize: '1.5rem', mr: 2 }}>
            {activity.emoji}
          </Typography>
        </motion.div>

        <Box sx={{ flexGrow: 1, zIndex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            <motion.span
              initial={{ color: activity.color }}
              animate={{ color: 'inherit' }}
              transition={{ duration: 0.5 }}
            >
              {activity.user}
            </motion.span>{' '}
            {activity.message}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {timeString}
          </Typography>
        </Box>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          style={{ zIndex: 1 }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              background: `linear-gradient(135deg, ${activity.color} 0%, ${activity.color}80 100%)`,
            }}
          >
            {activity.icon}
          </Avatar>
        </motion.div>

        {activity.type === 'achievement' && (
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatDelay: 2,
            }}
            style={{
              position: 'absolute',
              top: 5,
              right: 5,
              zIndex: 2,
            }}
          >
            <Star sx={{ color: '#FECA57', fontSize: 16 }} />
          </motion.div>
        )}
      </Box>
    </motion.div>
  );
};

export const ActivityPulse: React.FC = () => {
  const activities = useActivityFeed();
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseCount(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card
      sx={{
        background: 'linear-gradient(135deg, rgba(69,183,209,0.1) 0%, rgba(150,206,180,0.1) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 4,
        height: 400,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Badge badgeContent={activities.length} color="error">
                <Avatar
                  sx={{
                    background: 'linear-gradient(135deg, #45B7D1 0%, #96CEB4 100%)',
                    mr: 2,
                  }}
                >
                  <Notifications />
                </Avatar>
              </Badge>
            </motion.div>
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Live Activity Pulse
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Real-time team activity • {activities.length} recent actions
              </Typography>
            </Box>

            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Chip
                label="LIVE"
                size="small"
                sx={{
                  background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
                  color: 'white',
                  fontWeight: 700,
                }}
              />
            </motion.div>
          </Box>
        </motion.div>

        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <AnimatePresence mode="popLayout">
            {activities.map((activity, index) => (
              <ActivityItem key={activity.id} activity={activity} index={index} />
            ))}
          </AnimatePresence>
        </Box>

        {/* Pulse indicator */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Box
            sx={{
              textAlign: 'center',
              mt: 2,
              p: 1,
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              <Bolt sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
              System pulse: {pulseCount} beats
            </Typography>
          </Box>
        </motion.div>
      </CardContent>
    </Card>
  );
};