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

// Animated metric card component
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  trend?: string;
  delay?: number;
}
const MetricCard: React.FC<MetricCardProps> = (props) => {
  const { title, value, icon, color, subtitle, trend, delay = 0 } = props;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      whileHover={{ 
        scale: 1.05, 
        rotateY: 5,
        boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        sx={{
          height: '100%',
          background: `linear-gradient(135deg, ${color}20 0%, ${color}40 100%)`,
          backdropFilter: 'blur(20px)',
          border: `2px solid ${color}30`,
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <motion.div
          animate={{
            background: isHovered 
              ? `linear-gradient(45deg, ${color}30, transparent, ${color}30)`
              : 'transparent'
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '200%',
            height: '100%',
            zIndex: 0,
          }}
          transition={{ duration: 0.6 }}
        />
        
        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <motion.div
              animate={{ 
                rotate: isHovered ? 360 : 0,
                scale: isHovered ? 1.2 : 1
              }}
              transition={{ duration: 0.6 }}
            >
              <Avatar
                sx={{
                  background: `linear-gradient(135deg, ${color} 0%, ${color}80 100%)`,
                  width: 56,
                  height: 56,
                  mr: 2,
                }}
              >
                {icon}
              </Avatar>
            </motion.div>
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {title}
              </Typography>
              <motion.div
                key={value}
                initial={{ scale: 1.2, color: color }}
                animate={{ scale: 1, color: 'inherit' }}
                transition={{ duration: 0.3 }}
              >
                <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1 }}>
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
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Chip
                label={trend}
                size="small"
                color="success"
                sx={{ mt: 1, fontSize: '0.7rem' }}
              />
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Floating emoji animation
interface FloatingEmojiProps {
  emoji: string;
  delay?: number;
}
const FloatingEmoji: React.FC<FloatingEmojiProps> = (props) => {
  const { emoji, delay = 0 } = props;
  return (
    <motion.div
      initial={{ opacity: 0, y: 100, rotate: 0 }}
      animate={{ 
        opacity: [0, 1, 1, 0],
        y: [100, -20, -40, -100],
        rotate: [0, 180, 360],
        scale: [0.5, 1, 1.2, 0.8]
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 3,
        ease: "easeInOut"
      }}
      style={{
        position: 'absolute',
        left: `${Math.random() * 100}%`,
        fontSize: '2rem',
        zIndex: 0,
      }}
    >
      {emoji}
    </motion.div>
  );
};

// Pulse animation component
interface PulseRingProps {
  color: string;
  delay?: number;
}
const PulseRing: React.FC<PulseRingProps> = (props) => {
  const { color, delay = 0 } = props;
  return (
    <motion.div
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 2, opacity: 0 }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        ease: "easeOut"
      }}
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        border: `2px solid ${color}`,
        top: 0,
        left: 0,
      }}
    />
  );
};

// Live activity feed
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
    <Box sx={{ maxHeight: 300, overflow: 'hidden' }}>
      <AnimatePresence>
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.8 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 2,
                mb: 1,
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Typography sx={{ fontSize: '1.5rem', mr: 2 }}>
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
    <Box sx={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
      {/* Floating Emojis Background */}
      {['✨', '🚀', '💫', '⚡', '🎯', '💎', '🔥', '🌟'].map((emoji, index) => (
        <FloatingEmoji key={index} emoji={emoji} delay={index * 0.5} />
      ))}

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring" }}
      >
        <Box sx={{ textAlign: 'center', mb: 3, position: 'relative', zIndex: 1 }}>
          <motion.div
            animate={{ 
              background: [
                'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                'linear-gradient(45deg, #4ECDC4, #45B7D1)',
                'linear-gradient(45deg, #45B7D1, #96CEB4)',
                'linear-gradient(45deg, #96CEB4, #FF6B6B)',
              ]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            <Typography
              variant="h1"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '3rem', md: '5rem' },
                mb: 2,
                textShadow: '0 0 30px rgba(255,107,107,0.3)',
              }}
            >
              EmotiVibe Dashboard
            </Typography>
          </motion.div>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          >
            <Typography
              variant="h5"
              sx={{
                color: 'text.secondary',
                mb: 2,
                fontWeight: 300,
              }}
            >
              Real-time emotion intelligence • {currentTime.toLocaleTimeString()}
            </Typography>
          </motion.div>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <IconButton
                onClick={() => setIsLive(!isLive)}
                sx={{
                  background: isLive 
                    ? 'linear-gradient(135deg, #FF6B6B, #4ECDC4)' 
                    : 'linear-gradient(135deg, #666, #999)',
                  color: 'white',
                  position: 'relative',
                }}
              >
                {isLive ? <PauseIcon /> : <PlayArrowIcon />}
                {isLive && (
                  <>
                    <PulseRing color="#FF6B6B" />
                    <PulseRing color="#4ECDC4" delay={0.5} />
                  </>
                )}
              </IconButton>
            </motion.div>
            
            <Tooltip title="View Analytics">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <IconButton
                  onClick={() => navigate('/analytics')}
                  sx={{
                    background: 'linear-gradient(135deg, #45B7D1, #96CEB4)',
                    color: 'white',
                  }}
                >
                  <TrendingUpIcon />
                </IconButton>
              </motion.div>
            </Tooltip>
          </Box>
        </Box>
      </motion.div>

      {/* Real-time Metrics */}
      <Grid container spacing={2} sx={{ mb: 3, position: 'relative', zIndex: 1 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Live Users"
            value={data.activeUsers}
            icon={<PeopleIcon />}
            color="#FF6B6B"
            subtitle="Currently vibing"
            trend="+12% today"
            delay={0.1}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Emotions Detected"
            value={data.emotionsDetected.toLocaleString()}
            icon={<EmojiEmotionsIcon />}
            color="#4ECDC4"
            subtitle="Total today"
            trend="+8% vs yesterday"
            delay={0.2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Happiness Level"
            value={`${data.happinessLevel}%`}
            icon={<HeartIcon />}
            color="#45B7D1"
            subtitle="Team average"
            trend="+5% this week"
            delay={0.3}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="AI Confidence"
            value={`${data.aiConfidence.toFixed(1)}%`}
            icon={<AutoAwesomeIcon />}
            color="#96CEB4"
            subtitle="Model accuracy"
            trend="Stable"
            delay={0.4}
          />
        </Grid>
      </Grid>

      {/* Live Dashboard Grid */}
      <Grid container spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
        {/* Current Vibe */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <Card
              sx={{
                background: 'linear-gradient(135deg, rgba(255,107,107,0.1) 0%, rgba(78,205,196,0.1) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 4,
                p: 3,
                height: '100%',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Typography sx={{ fontSize: '3rem', mr: 2 }}>🎯</Typography>
                </motion.div>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Current Vibe
                </Typography>
              </Box>
              
              <motion.div
                key={data.currentMood}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
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
                  transition={{ delay: 0.8, duration: 1 }}
                >
                  <LinearProgress
                    variant="determinate"
                    value={data.energyLevel}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      background: 'rgba(255,255,255,0.1)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #FF6B6B, #4ECDC4)',
                        borderRadius: 6,
                      },
                    }}
                  />
                </motion.div>
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  {data.energyLevel}% - Keep it up! 🔥
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  label={`${data.liveAnalyses} Live Analyses`}
                  color="primary"
                  size="small"
                  icon={<ZapIcon />}
                />
                <Chip
                  label={`${data.stressLevel}% Stress`}
                  color={data.stressLevel > 50 ? 'error' : 'success'}
                  size="small"
                />
              </Box>
            </Card>
          </motion.div>
        </Grid>

        {/* Live Activity Feed */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Card
              sx={{
                background: 'linear-gradient(135deg, rgba(69,183,209,0.1) 0%, rgba(150,206,180,0.1) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 4,
                p: 3,
                height: '100%',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Badge badgeContent={data.liveAnalyses} color="error">
                    <Box sx={{ fontSize: '2rem', mr: 2, color: '#45B7D1', display: 'flex', alignItems: 'center' }}>
          <NotificationsIcon />
        </Box>
                  </Badge>
                </motion.div>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Live Activity
                </Typography>
              </Box>
              
              <LiveActivityFeed />
            </Card>
          </motion.div>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 3,
                textAlign: 'center',
                background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Start Your Vibe Check 🚀
            </Typography>
          </motion.div>
          
          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 50, rotateY: -90 }}
                  animate={{ opacity: 1, y: 0, rotateY: 0 }}
                  transition={{ 
                    delay: 0.8 + index * 0.1, 
                    duration: 0.8,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    rotateY: 10,
                    boxShadow: "0 25px 50px rgba(0,0,0,0.2)"
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      background: `linear-gradient(135deg, ${feature.color}20 0%, ${feature.color}40 100%)`,
                      backdropFilter: 'blur(20px)',
                      border: `2px solid ${feature.color}30`,
                      borderRadius: 4,
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onClick={() => navigate(feature.route)}
                  >
                    <motion.div
                      animate={{
                        background: [
                          `linear-gradient(45deg, transparent, ${feature.color}20, transparent)`,
                          `linear-gradient(45deg, transparent, ${feature.color}40, transparent)`,
                          `linear-gradient(45deg, transparent, ${feature.color}20, transparent)`,
                        ]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '200%',
                        height: '100%',
                        zIndex: 0,
                      }}
                    />
                    
                    <CardContent sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                      <motion.div
                        animate={{ 
                          rotate: [0, 10, -10, 0],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Typography sx={{ fontSize: '4rem', mb: 2 }}>
                          {feature.emoji}
                        </Typography>
                      </motion.div>
                      
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                        {feature.title}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {feature.description}
                      </Typography>
                      
                      <Button
                        variant="contained"
                        fullWidth
                        sx={{
                          background: `linear-gradient(135deg, ${feature.color} 0%, ${feature.color}80 100%)`,
                          fontWeight: 600,
                          '&:hover': {
                            background: `linear-gradient(135deg, ${feature.color}80 0%, ${feature.color} 100%)`,
                          },
                        }}
                      >
                        Let's Go! 🚀
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};