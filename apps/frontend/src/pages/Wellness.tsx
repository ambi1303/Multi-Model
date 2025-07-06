import React, { useState, useEffect, Suspense, lazy } from 'react';
import {
  Box,
  Fade,
  Slide,
  Zoom,
  Paper,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';

const WellnessDashboard = lazy(() => import('./wellness/WellnessDashboard'));
const MeditationTab = lazy(() => import('./wellness/MeditationTab'));
const MusicTab = lazy(() => import('./wellness/MusicTab'));
const TipsTab = lazy(() => import('./wellness/TipsTab'));
const MeditationTimer = lazy(() => import('./wellness/MeditationTimer'));

const Wellness: React.FC = () => {
  const { mode } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeMusicTrack, setActiveMusicTrack] = useState<string | null>(null);
  const [musicProgress, setMusicProgress] = useState<number>(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  const colors = {
    background: mode === 'dark' ? '#0B1121' : '#f8fafc',
    primaryText: mode === 'dark' ? '#FFFFFF' : '#0f172a',
    secondaryText: mode === 'dark' ? '#94A3B8' : '#64748b',
    cardBg: mode === 'dark' ? '#1E293B' : '#ffffff',
    border: mode === 'dark' ? '#374151' : '#e5e7eb',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'meditation', label: 'Meditation', icon: '🧘' },
    { id: 'music', label: 'Relaxing Music', icon: '🎵' },
    { id: 'tips', label: 'Wellness Tips', icon: '💡' },
  ];

  const meditationSessions = [
    {
      id: 'deep-breathing',
      title: 'Deep Breathing',
      duration: '5 minutes',
      durationMinutes: 5,
      description: 'Simple breathing exercise to reduce stress and anxiety',
      tag: 'breathing',
      tagColor: '#3B82F6',
      icon: '🌬️',
      iconBg: '#E0F2FE',
    },
    {
      id: 'mindful-awareness',
      title: 'Mindful Awareness',
      duration: '10 minutes',
      durationMinutes: 10,
      description: 'Develop present-moment awareness and mental clarity',
      tag: 'mindfulness',
      tagColor: '#10B981',
      icon: '🍃',
      iconBg: '#ECFDF5',
    },
    {
      id: 'sleep-meditation',
      title: 'Sleep Meditation',
      duration: '15 minutes',
      durationMinutes: 15,
      description: 'Gentle meditation to help you fall asleep peacefully',
      tag: 'sleep',
      tagColor: '#8B5CF6',
      icon: '🌙',
      iconBg: '#F3E8FF',
    },
    {
      id: 'focus-enhancement',
      title: 'Focus Enhancement',
      duration: '20 minutes',
      durationMinutes: 20,
      description: 'Improve concentration and mental performance',
      tag: 'focus',
      tagColor: '#F59E0B',
      icon: '🎯',
      iconBg: '#FEF3C7',
    },
    {
      id: 'mountain-visualization',
      title: 'Mountain Visualization',
      duration: '12 minutes',
      durationMinutes: 12,
      description: 'Visualize yourself as a strong, stable mountain',
      tag: 'mindfulness',
      tagColor: '#10B981',
      icon: '⛰️',
      iconBg: '#ECFDF5',
    },
    {
      id: 'ocean-waves',
      title: 'Ocean Waves',
      duration: '8 minutes',
      durationMinutes: 8,
      description: 'Breathe with the rhythm of ocean waves',
      tag: 'breathing',
      tagColor: '#3B82F6',
      icon: '🌊',
      iconBg: '#E0F2FE',
    },
  ];

  const musicTracks = [
    {
      id: 'forest-rain',
      title: 'Forest Rain',
      artist: 'Nature Sounds',
      duration: '3:00',
      category: 'nature',
      categoryColor: '#10B981',
    },
    {
      id: 'peaceful-piano',
      title: 'Peaceful Piano',
      artist: 'Ambient Collective',
      duration: '4:00',
      category: 'ambient',
      categoryColor: '#3B82F6',
    },
    {
      id: 'ocean-waves',
      title: 'Ocean Waves',
      artist: 'Natural Harmony',
      duration: '5:00',
      category: 'nature',
      categoryColor: '#10B981',
    },
    {
      id: 'meditation-bells',
      title: 'Meditation Bells',
      artist: 'Zen Masters',
      duration: '7:00',
      category: 'ambient',
      categoryColor: '#3B82F6',
    },
  ];

  // Timer functionality
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isPlaying && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsPlaying(false);
            setActiveTimer(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, timeRemaining]);

  // Music progress simulation
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isMusicPlaying && activeMusicTrack) {
      interval = setInterval(() => {
        setMusicProgress((prev) => {
          if (prev >= 100) {
            setIsMusicPlaying(false);
            return 100;
          }
          return prev + 0.5;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMusicPlaying, activeMusicTrack]);

  const startTimer = (sessionId: string, durationMinutes: number) => {
    setActiveTimer(sessionId);
    setTimeRemaining(durationMinutes * 60);
    setIsPlaying(true);
  };

  const pauseTimer = () => setIsPlaying(false);

  const resumeTimer = () => setIsPlaying(true);

  const stopTimer = () => {
    setIsPlaying(false);
    setActiveTimer(null);
    setTimeRemaining(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Music player functions
  const playMusicTrack = (trackId: string) => {
    setActiveMusicTrack(trackId);
    setIsMusicPlaying(true);
    setMusicProgress(0);
  };

  const pauseMusicTrack = () => setIsMusicPlaying(false);

  const resumeMusicTrack = () => setIsMusicPlaying(true);

  const renderContent = () => {
    const activeSession = meditationSessions.find(s => s.id === activeTimer);

    if (activeTimer && activeSession) {
      return (
        <Suspense fallback={<CircularProgress />}>
          <MeditationTimer
            activeSession={activeSession}
            timeRemaining={timeRemaining}
            isPlaying={isPlaying}
            pauseTimer={pauseTimer}
            resumeTimer={resumeTimer}
            stopTimer={stopTimer}
            formatTime={formatTime}
          />
        </Suspense>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <WellnessDashboard colors={colors} setActiveTab={setActiveTab} mode={mode} />;
      case 'meditation':
        return <MeditationTab colors={colors} meditationSessions={meditationSessions} startTimer={startTimer} />;
      case 'music':
        return (
          <MusicTab
            colors={colors}
            mode={mode}
            musicTracks={musicTracks}
            activeMusicTrack={activeMusicTrack}
            musicProgress={musicProgress}
            isMusicPlaying={isMusicPlaying}
            playMusicTrack={playMusicTrack}
            pauseMusicTrack={pauseMusicTrack}
            resumeMusicTrack={resumeMusicTrack}
          />
        );
      case 'tips':
        return <TipsTab colors={colors} mode={mode} />;
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        bgcolor: colors.background,
        pt: 8,
        pb: 12,
        px: { xs: 2, md: 4 },
        transition: 'background-color 0.2s ease',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: '1280px', mx: 'auto' }}>
        <Fade in timeout={800}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              gap: 3,
              mb: 6,
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -20,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 200,
                height: 200,
                background: colors.gradient,
                borderRadius: '50%',
                opacity: 0.1,
                filter: 'blur(40px)',
                animation: 'float 6s ease-in-out infinite',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateX(-50%) translateY(0px)' },
                  '50%': { transform: 'translateX(-50%) translateY(-20px)' },
                },
              }}
            />
            <Zoom in timeout={600}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  background: colors.gradient,
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: -2,
                    background: colors.gradient,
                    borderRadius: '22px',
                    opacity: 0.7,
                    filter: 'blur(8px)',
                    zIndex: -1,
                  },
                }}
              >
                <Box sx={{ fontSize: '28px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>❤️</Box>
              </Box>
            </Zoom>
            <Slide direction="down" in timeout={800}>
              <Box>
                <Box
                  component="h1"
                  sx={{
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    fontWeight: 800,
                    background: colors.gradient,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1,
                    lineHeight: 1.2,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Wellness Center
                </Box>
                <Box
                  component="p"
                  sx={{
                    fontSize: '1.1rem',
                    color: colors.secondaryText,
                    lineHeight: 1.5,
                    opacity: 0.9,
                    transition: 'color 0.2s ease',
                  }}
                >
                  Take care of your mental and physical well-being
                </Box>
              </Box>
            </Slide>
          </Box>
        </Fade>
        <Slide direction="up" in timeout={1000}>
          <Paper
            elevation={mode === 'dark' ? 8 : 2}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 6,
              gap: 0,
              backgroundColor: mode === 'dark' ? '#1E293B' : '#ffffff',
              borderRadius: '16px',
              p: 1.5,
              maxWidth: 'fit-content',
              mx: 'auto',
              border: `1px solid ${colors.border}`,
              backdropFilter: 'blur(10px)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%)',
                pointerEvents: 'none',
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Zoom in timeout={800 + index * 100} key={tab.id}>
                <Box
                  onClick={() => setActiveTab(tab.id)}
                  sx={{
                    px: 3,
                    py: 2.5,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    backgroundColor: activeTab === tab.id
                      ? colors.gradient
                      : 'transparent',
                    color: activeTab === tab.id ? '#ffffff' : colors.secondaryText,
                    fontWeight: activeTab === tab.id ? 600 : 500,
                    fontSize: '0.9375rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    minWidth: 'fit-content',
                    whiteSpace: 'nowrap',
                    position: 'relative',
                    zIndex: 1,
                    '&:hover': {
                      backgroundColor: activeTab === tab.id
                        ? colors.gradient
                        : mode === 'dark' ? '#374151' : '#f8fafc',
                      transform: 'translateY(-1px)',
                      boxShadow: activeTab === tab.id
                        ? '0 8px 25px rgba(79, 70, 229, 0.4)'
                        : '0 4px 12px rgba(0,0,0,0.1)',
                    },
                    '&:active': {
                      transform: 'translateY(0px)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      fontSize: '18px',
                      transition: 'transform 0.2s ease',
                      transform: activeTab === tab.id ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    {tab.icon}
                  </Box>
                  {tab.label}
                </Box>
              </Zoom>
            ))}
          </Paper>
        </Slide>
        <Suspense fallback={
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        }>
          {renderContent()}
        </Suspense>
      </Box>
    </Box>
  );
};

export default Wellness;