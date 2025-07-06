import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  VideoCallIcon,
  MicIcon,
  ChatIcon,
  AssignmentIcon,
  TrendingUpIcon,
  
  ZapIcon,
  HeartIcon,
  PlayArrowIcon,
  PauseIcon,
  NotificationsIcon,
  PeopleIcon,
  EmojiEmotionsIcon,
  AutoAwesomeIcon,
} from '../utils/icons';

// Real-time data simulation
const useRealTimeData = () => {
  const [data, setData] = useState({
    activeUsers: 42,
    emotionsDetected: 1247,
    happinessLevel: 78,
    stressLevel: 23,
    currentMood: 'Vibing ✨',
    energyLevel: 89,
    liveAnalyses: 8,
    aiConfidence: 94.2,
  });

  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setData(prev => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 3) - 1,
        emotionsDetected: prev.emotionsDetected + Math.floor(Math.random() * 5),
        happinessLevel: Math.max(0, Math.min(100, prev.happinessLevel + Math.floor(Math.random() * 6) - 3)),
        stressLevel: Math.max(0, Math.min(100, prev.stressLevel + Math.floor(Math.random() * 4) - 2)),
        currentMood: ['Vibing ✨', 'Chillin 😎', 'Focused 🎯', 'Energetic ⚡', 'Creative 🎨'][Math.floor(Math.random() * 5)],
        energyLevel: Math.max(0, Math.min(100, prev.energyLevel + Math.floor(Math.random() * 4) - 2)),
        liveAnalyses: Math.max(0, prev.liveAnalyses + Math.floor(Math.random() * 3) - 1),
        aiConfidence: Math.max(80, Math.min(99, prev.aiConfidence + (Math.random() - 0.5) * 2)),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive]);

  return { data, isLive, setIsLive };
};

// MetricCard component
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  trend?: string;
}
const MetricCard: React.FC<MetricCardProps> = (props) => {
  const { title, value, icon, color, subtitle, trend } = props;
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.04, boxShadow: '0 6px 24px rgba(25, 118, 210, 0.08)' }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 80 }}
      style={{ height: '100%' }}
    >
      <Card
        sx={{
          height: '100%',
          background: '#fff',
          border: `1px solid #e0e0e0`,
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              sx={{
                background: '#f5f5f5',
                color: color,
                width: 48,
                height: 48,
                mr: 2,
                fontSize: 28,
                transition: 'transform 0.3s',
              }}
            >
              {icon}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {title}
              </Typography>
              <motion.div
                key={value}
                initial={{ scale: 1.15, color: color }}
                animate={{ scale: 1, color: '#222' }}
                transition={{ duration: 0.3 }}
              >
                <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1, color: '#222' }}>
                  {value}
                </Typography>
              </motion.div>
            </Box>
          </Box>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Chip
              label={trend}
              size="small"
              color="success"
              sx={{ mt: 1, fontSize: '0.7rem', background: '#e8f5e9', color: '#388e3c' }}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// LiveActivityFeed component
const LiveActivityFeed = () => {
  const [activities, setActivities] = useState([
    { id: 1, text: "Sarah just completed video analysis", icon: "🎥", time: "2s ago" },
    { id: 2, text: "New happiness spike detected!", icon: "😊", time: "5s ago" },
    { id: 3, text: "Team mood: Absolutely vibing", icon: "✨", time: "12s ago" },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newActivities = [
        "Alex started speech analysis 🎤",
        "Stress levels dropping! 📉",
        "New user joined the vibe check 👋",
        "AI confidence boosted! 🚀",
        "Team energy is through the roof! ⚡",
        "Burnout risk decreased 💪",
        "Happy emotions detected 😄",
        "Productivity mode: ON 🔥",
      ];
      const newActivity = {
        id: Date.now(),
        text: newActivities[Math.floor(Math.random() * newActivities.length)],
        icon: "🎯",
        time: "now"
      };
      setActivities(prev => [newActivity, ...prev.slice(0, 4)]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ maxHeight: 300, overflow: 'auto', bgcolor: '#fafafa', borderRadius: 2, p: 2 }}>
      <AnimatePresence>
        {activities.map((activity) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 1.5,
                mb: 1,
                borderRadius: 2,
                background: '#fff',
                border: '1px solid #e0e0e0',
              }}
            >
              <Typography sx={{ fontSize: '1.3rem', mr: 2 }}>
                {activity.icon}
              </Typography>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {activity.text}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {activity.time}
                </Typography>
              </Box>
            </Box>
          </motion.div>
        ))}
      </AnimatePresence>
    </Box>
  );
};

// Main Dashboard Component
export const Dashboard = () => {
  const navigate = useNavigate();
  const { data, isLive, setIsLive } = useRealTimeData();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: <VideoCallIcon />,
      title: 'Video Vibes',
      description: 'Real-time emotion detection from your camera feed',
      route: '/video',
      color: '#FF6B6B',
      emoji: '🎥',
    },
    {
      icon: <MicIcon />,
      title: 'Voice Feels',
      description: 'Analyze emotions from speech patterns',
      route: '/speech',
      color: '#4ECDC4',
      emoji: '🎤',
    },
    {
      icon: <ChatIcon />,
      title: 'Text Mood',
      description: 'Understand emotions in conversations',
      route: '/chat',
      color: '#45B7D1',
      emoji: '💬',
    },
    {
      icon: <AssignmentIcon />,
      title: 'Burnout Check',
      description: 'Assess your mental wellness',
      route: '/survey',
      color: '#96CEB4',
      emoji: '📋',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f8', p: { xs: 2, md: 4 } }}>
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, type: 'spring', stiffness: 80 }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2rem', md: '3rem' },
                mb: 1,
                color: '#222',
              }}
            >
              EmotiVibe Dashboard
            </Typography>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <Typography
              variant="h6"
              sx={{
                color: 'text.secondary',
                mb: 2,
                fontWeight: 400,
              }}
            >
              Real-time emotion intelligence • {currentTime.toLocaleTimeString()}
            </Typography>
          </motion.div>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
            <motion.div whileHover={{ scale: 1.08 }}>
              <IconButton
                onClick={() => setIsLive(!isLive)}
                sx={{
                  background: isLive ? '#388e3c' : '#bdbdbd',
                  color: 'white',
                  transition: 'background 0.3s',
                }}
              >
                {isLive ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
            </motion.div>
            <Tooltip title="View Analytics">
              <motion.div whileHover={{ scale: 1.08 }}>
                <IconButton
                  onClick={() => navigate('/analytics')}
                  sx={{ background: '#1976d2', color: 'white', transition: 'background 0.3s' }}
                >
                  <TrendingUpIcon />
                </IconButton>
              </motion.div>
            </Tooltip>
          </Box>
        </Box>
      </motion.div>

      {/* Real-time Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            title: "Live Users",
            value: data.activeUsers,
            icon: <PeopleIcon />,
            color: "#FF6B6B",
            subtitle: "Currently online",
            trend: "+12% today"
          },
          {
            title: "Emotions Detected",
            value: data.emotionsDetected.toLocaleString(),
            icon: <EmojiEmotionsIcon />,
            color: "#4ECDC4",
            subtitle: "Total today",
            trend: "+8% vs yesterday"
          },
          {
            title: "Happiness Level",
            value: `${data.happinessLevel}%`,
            icon: <HeartIcon />,
            color: "#45B7D1",
            subtitle: "Team average",
            trend: "+5% this week"
          },
          {
            title: "AI Confidence",
            value: `${data.aiConfidence.toFixed(1)}%`,
            icon: <AutoAwesomeIcon />,
            color: "#96CEB4",
            subtitle: "Model accuracy",
            trend: "Stable"
          }
        ].map((metric, idx) => (
          <Grid item xs={12} sm={6} md={3} key={metric.title}>
            <MetricCard {...metric} />
          </Grid>
        ))}
      </Grid>

      {/* Live Dashboard Grid */}
      <Grid container spacing={2}>
        {/* Current Vibe */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <Card
              sx={{
                background: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: 3,
                p: 3,
                height: '100%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography sx={{ fontSize: '2.2rem', mr: 2, color: '#1976d2' }}>🎯</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#222' }}>
                  Current Vibe
                </Typography>
              </Box>
              <motion.div
                key={data.currentMood}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: '#1976d2',
                    mb: 2,
                  }}
                >
                  {data.currentMood}
                </Typography>
              </motion.div>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Energy Level
                </Typography>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 0.2, duration: 0.7 }}
                >
                  <LinearProgress
                    variant="determinate"
                    value={data.energyLevel}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      background: '#f5f5f5',
                      '& .MuiLinearProgress-bar': {
                        background: '#1976d2',
                      },
                    }}
                  />
                </motion.div>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Team stress level: <b>{data.stressLevel}%</b>
              </Typography>
            </Card>
          </motion.div>
        </Grid>
        {/* Live Activity Feed */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <Card
              sx={{
                background: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: 3,
                p: 3,
                height: '100%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#222' }}>
                Live Activity Feed
              </Typography>
              <LiveActivityFeed />
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};