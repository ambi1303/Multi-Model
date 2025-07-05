import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  LinearProgress,
  Fade,
  Slide,
  Zoom,
  Paper,
} from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import { PlayArrowIcon, PauseIcon, StopIcon, ArrowBackIcon, ArrowForwardIcon, VolumeUpIcon } from '../utils/icons';

const Wellness: React.FC = () => {
  const { mode } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeMusicTrack, setActiveMusicTrack] = useState<string | null>(null);
  const [musicProgress, setMusicProgress] = useState<number>(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // Enhanced theme-aware colors with gradients
  const colors = {
    background: mode === 'dark' ? '#0B1121' : '#f8fafc',
    primaryText: mode === 'dark' ? '#FFFFFF' : '#0f172a',
    secondaryText: mode === 'dark' ? '#94A3B8' : '#64748b',
    cardBg: mode === 'dark' ? '#1E293B' : '#ffffff',
    border: mode === 'dark' ? '#374151' : '#e5e7eb',
    gradient: mode === 'dark' 
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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

  // Timer functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
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
    return () => clearInterval(interval);
  }, [isPlaying, timeRemaining]);

  // Music progress simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMusicPlaying && activeMusicTrack) {
      interval = setInterval(() => {
        setMusicProgress((prev) => {
          if (prev >= 100) {
            setIsMusicPlaying(false);
            return 100;
          }
          return prev + 0.5; // Increment by 0.5% every second
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isMusicPlaying, activeMusicTrack]);

  const startTimer = (sessionId: string, durationMinutes: number) => {
    setActiveTimer(sessionId);
    setTimeRemaining(durationMinutes * 60);
    setIsPlaying(true);
  };

  const pauseTimer = () => {
    setIsPlaying(false);
  };

  const resumeTimer = () => {
    setIsPlaying(true);
  };

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

  const pauseMusicTrack = () => {
    setIsMusicPlaying(false);
  };

  const resumeMusicTrack = () => {
    setIsMusicPlaying(true);
  };

  const stopMusicTrack = () => {
    setActiveMusicTrack(null);
    setIsMusicPlaying(false);
    setMusicProgress(0);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Box>
            {/* Enhanced Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Zoom in timeout={600} style={{ transitionDelay: '100ms' }}>
                  <Card sx={{ 
                    backgroundColor: colors.cardBg, 
                    border: `1px solid ${colors.border}`,
                    borderRadius: '20px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: '0 20px 40px rgba(254, 243, 199, 0.3)',
                      '& .stat-icon': {
                        transform: 'rotate(10deg) scale(1.1)',
                      },
                      '& .stat-number': {
                        color: '#F59E0B',
                      },
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: 'linear-gradient(90deg, #F59E0B, #FBBF24)',
                    },
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box 
                          className="stat-icon"
                          sx={{ 
                            width: 56, 
                            height: 56, 
                            borderRadius: '16px', 
                            background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(254, 243, 199, 0.4)',
                          }}
                        >
                          🧘
                        </Box>
                        <Box>
                          <Typography 
                            variant="h3" 
                            className="stat-number"
                            sx={{ 
                              color: colors.primaryText, 
                              fontWeight: 800,
                              transition: 'color 0.3s ease',
                              lineHeight: 1,
                            }}
                          >
                            127
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: colors.secondaryText,
                            fontWeight: 500,
                            mt: 0.5,
                          }}>
                            Meditation Minutes
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Zoom in timeout={600} style={{ transitionDelay: '200ms' }}>
                  <Card sx={{ 
                    backgroundColor: colors.cardBg, 
                    border: `1px solid ${colors.border}`,
                    borderRadius: '20px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: '0 20px 40px rgba(220, 252, 231, 0.3)',
                      '& .stat-icon': {
                        transform: 'rotate(-10deg) scale(1.1)',
                      },
                      '& .stat-number': {
                        color: '#10B981',
                      },
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: 'linear-gradient(90deg, #10B981, #34D399)',
                    },
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box 
                          className="stat-icon"
                          sx={{ 
                            width: 56, 
                            height: 56, 
                            borderRadius: '16px', 
                            background: 'linear-gradient(135deg, #DCFCE7, #BBF7D0)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(220, 252, 231, 0.4)',
                          }}
                        >
                          🔥
                        </Box>
                        <Box>
                          <Typography 
                            variant="h3" 
                            className="stat-number"
                            sx={{ 
                              color: colors.primaryText, 
                              fontWeight: 800,
                              transition: 'color 0.3s ease',
                              lineHeight: 1,
                            }}
                          >
                            12
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: colors.secondaryText,
                            fontWeight: 500,
                            mt: 0.5,
                          }}>
                            Current Streak
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Zoom in timeout={600} style={{ transitionDelay: '300ms' }}>
                  <Card sx={{ 
                    backgroundColor: colors.cardBg, 
                    border: `1px solid ${colors.border}`,
                    borderRadius: '20px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: '0 20px 40px rgba(224, 242, 254, 0.3)',
                      '& .stat-icon': {
                        transform: 'rotate(10deg) scale(1.1)',
                      },
                      '& .stat-number': {
                        color: '#3B82F6',
                      },
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: 'linear-gradient(90deg, #3B82F6, #60A5FA)',
                    },
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box 
                          className="stat-icon"
                          sx={{ 
                            width: 56, 
                            height: 56, 
                            borderRadius: '16px', 
                            background: 'linear-gradient(135deg, #E0F2FE, #BAE6FD)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(224, 242, 254, 0.4)',
                          }}
                        >
                          ✅
                        </Box>
                        <Box>
                          <Typography 
                            variant="h3" 
                            className="stat-number"
                            sx={{ 
                              color: colors.primaryText, 
                              fontWeight: 800,
                              transition: 'color 0.3s ease',
                              lineHeight: 1,
                            }}
                          >
                            23
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: colors.secondaryText,
                            fontWeight: 500,
                            mt: 0.5,
                          }}>
                            Sessions Completed
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Zoom in timeout={600} style={{ transitionDelay: '400ms' }}>
                  <Card sx={{ 
                    backgroundColor: colors.cardBg, 
                    border: `1px solid ${colors.border}`,
                    borderRadius: '20px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: '0 20px 40px rgba(243, 232, 255, 0.3)',
                      '& .stat-icon': {
                        transform: 'rotate(-10deg) scale(1.1)',
                      },
                      '& .stat-number': {
                        color: '#8B5CF6',
                      },
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)',
                    },
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box 
                          className="stat-icon"
                          sx={{ 
                            width: 56, 
                            height: 56, 
                            borderRadius: '16px', 
                            background: 'linear-gradient(135deg, #F3E8FF, #E9D5FF)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(243, 232, 255, 0.4)',
                          }}
                        >
                          📉
                        </Box>
                        <Box>
                          <Typography 
                            variant="h3" 
                            className="stat-number"
                            sx={{ 
                              color: colors.primaryText, 
                              fontWeight: 800,
                              transition: 'color 0.3s ease',
                              lineHeight: 1,
                            }}
                          >
                            34%
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: colors.secondaryText,
                            fontWeight: 500,
                            mt: 0.5,
                          }}>
                            Stress Reduction
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
            </Grid>

            {/* Quick Actions */}
            <Typography variant="h6" sx={{ color: colors.primaryText, mb: 3, fontWeight: 600 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card 
                  onClick={() => setActiveTab('meditation')}
                  sx={{ 
                    backgroundColor: colors.cardBg, 
                    border: `1px solid ${colors.border}`, 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.1)',
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box sx={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '10px', 
                        backgroundColor: '#E0F2FE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px'
                      }}>
                        🧘
                      </Box>
                      <Typography variant="h6" sx={{ color: colors.primaryText, fontWeight: 600 }}>
                        Start Meditation
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                      Begin your mindfulness journey
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card 
                  onClick={() => setActiveTab('music')}
                  sx={{ 
                    backgroundColor: colors.cardBg, 
                    border: `1px solid ${colors.border}`, 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.1)',
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box sx={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '10px', 
                        backgroundColor: '#DCFCE7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px'
                      }}>
                        🎵
                      </Box>
                      <Typography variant="h6" sx={{ color: colors.primaryText, fontWeight: 600 }}>
                        Relaxing Music
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                      Soothing sounds for relaxation
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card 
                  onClick={() => setActiveTab('tips')}
                  sx={{ 
                    backgroundColor: colors.cardBg, 
                    border: `1px solid ${colors.border}`, 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.1)',
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box sx={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '10px', 
                        backgroundColor: '#FEF3C7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px'
                      }}>
                        💡
                      </Box>
                      <Typography variant="h6" sx={{ color: colors.primaryText, fontWeight: 600 }}>
                        Daily Tips
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                      Wellness tips for better living
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 'meditation':
        // Full-screen meditation interface when timer is active
        if (activeTimer) {
          const activeSession = meditationSessions.find(s => s.id === activeTimer);
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
              {/* Session Icon */}
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

              {/* Session Title */}
              <Typography variant="h3" sx={{ 
                color: '#1F2937', 
                fontWeight: 600, 
                mb: 2,
                textAlign: 'center'
              }}>
                {activeSession?.title}
              </Typography>

              {/* Session Description */}
              <Typography variant="h6" sx={{ 
                color: '#6B7280', 
                mb: 6,
                textAlign: 'center',
                maxWidth: 600
              }}>
                {activeSession?.description}
              </Typography>

              {/* Timer Display */}
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

              {/* Progress Bar */}
              <Box sx={{ width: '100%', maxWidth: 800, mb: 6 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={((activeSession?.durationMinutes || 0) * 60 - timeRemaining) / ((activeSession?.durationMinutes || 0) * 60) * 100}
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

              {/* Control Buttons */}
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
        }

        // Regular meditation sessions grid when no timer is active
        return (
          <Box>
            <Typography variant="h5" sx={{ color: colors.primaryText, mb: 4, fontWeight: 600 }}>
              Meditation Sessions
            </Typography>

            <Grid container spacing={3}>
              {meditationSessions.map((session) => (
                <Grid item xs={12} md={6} lg={4} key={session.id}>
                  <Card sx={{ 
                    backgroundColor: colors.cardBg, 
                    border: `1px solid ${colors.border}`,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                  }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                        <Box sx={{ 
                          width: 48, 
                          height: 48, 
                          borderRadius: '12px', 
                          backgroundColor: session.iconBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px'
                        }}>
                          {session.icon}
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" sx={{ color: colors.primaryText, fontWeight: 600, mb: 0.5 }}>
                            {session.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: colors.secondaryText, mb: 0.5 }}>
                            {session.duration}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" sx={{ color: colors.secondaryText, mb: 3 }}>
                        {session.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{
                          px: 2,
                          py: 0.5,
                          borderRadius: '16px',
                          backgroundColor: `${session.tagColor}20`,
                          border: `1px solid ${session.tagColor}30`
                        }}>
                          <Typography variant="caption" sx={{ color: session.tagColor, fontWeight: 500 }}>
                            {session.tag}
                          </Typography>
                        </Box>
                        
                        <IconButton 
                          onClick={() => startTimer(session.id, session.durationMinutes)}
                          sx={{ 
                            color: '#10B981',
                            backgroundColor: '#10B98120',
                            '&:hover': {
                              backgroundColor: '#10B98130'
                            }
                          }}
                        >
                          <PlayArrowIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 'music':
        const musicTracks = [
          {
            id: 'forest-rain',
            title: 'Forest Rain',
            artist: 'Nature Sounds',
            duration: '3:00',
            category: 'nature',
            categoryColor: '#10B981',
            image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop&crop=center'
          },
          {
            id: 'peaceful-piano',
            title: 'Peaceful Piano',
            artist: 'Ambient Collective',
            duration: '4:00',
            category: 'ambient',
            categoryColor: '#3B82F6',
            image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=300&fit=crop&crop=center'
          },
          {
            id: 'ocean-waves',
            title: 'Ocean Waves',
            artist: 'Natural Harmony',
            duration: '5:00',
            category: 'nature',
            categoryColor: '#10B981',
            image: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400&h=300&fit=crop&crop=center'
          },
          {
            id: 'meditation-bells',
            title: 'Meditation Bells',
            artist: 'Zen Masters',
            duration: '7:00',
            category: 'ambient',
            categoryColor: '#3B82F6',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center'
          },
        ];

        return (
          <Box>
            <Typography variant="h5" sx={{ color: colors.primaryText, mb: 4, fontWeight: 600 }}>
              Relaxing Music
            </Typography>
            
            {/* Music Player Interface */}
            {activeMusicTrack && (
              <Card sx={{ 
                backgroundColor: colors.cardBg, 
                border: `1px solid ${colors.border}`,
                borderRadius: '16px',
                mb: 4,
                overflow: 'hidden'
              }}>
                <Box sx={{ p: 3 }}>
                  {/* Now Playing Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      mr: 2,
                      background: `linear-gradient(135deg, ${musicTracks.find(t => t.id === activeMusicTrack)?.categoryColor}20, ${musicTracks.find(t => t.id === activeMusicTrack)?.categoryColor}40)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                    }}>
                      {musicTracks.find(t => t.id === activeMusicTrack)?.category === 'nature' ? '🌿' : '🎹'}
                    </Box>
                    
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ 
                        color: colors.primaryText, 
                        fontWeight: 600, 
                        mb: 0.5
                      }}>
                        {musicTracks.find(t => t.id === activeMusicTrack)?.title}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: colors.secondaryText
                      }}>
                        {musicTracks.find(t => t.id === activeMusicTrack)?.artist}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Progress Bar */}
                  <Box sx={{ mb: 3 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={musicProgress}
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        backgroundColor: colors.border,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#3B82F6',
                          borderRadius: 3,
                        }
                      }}
                    />
                  </Box>

                  {/* Control Buttons */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    <IconButton sx={{ 
                      color: '#3B82F6',
                      backgroundColor: '#3B82F620',
                      '&:hover': {
                        backgroundColor: '#3B82F630',
                      }
                    }}>
                      <ArrowBackIcon />
                    </IconButton>
                    
                    <IconButton 
                      onClick={isMusicPlaying ? pauseMusicTrack : resumeMusicTrack}
                      sx={{ 
                        color: '#3B82F6',
                        backgroundColor: '#3B82F620',
                        width: 56,
                        height: 56,
                        '&:hover': {
                          backgroundColor: '#3B82F630',
                        }
                      }}
                    >
                      {isMusicPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>
                    
                    <IconButton sx={{ 
                      color: '#3B82F6',
                      backgroundColor: '#3B82F620',
                      '&:hover': {
                        backgroundColor: '#3B82F630',
                      }
                    }}>
                      <ArrowForwardIcon />
                    </IconButton>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                      <Box sx={{ color: colors.secondaryText, mr: 1, display: 'flex', alignItems: 'center' }}>
                        <VolumeUpIcon />
                      </Box>
                      <Box sx={{ width: 100 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={70}
                          sx={{ 
                            height: 4, 
                            borderRadius: 2,
                            backgroundColor: colors.border,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#3B82F6',
                              borderRadius: 2,
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Card>
            )}
            
            <Grid container spacing={3}>
              {musicTracks.map((track) => (
                <Grid item xs={12} md={6} key={track.id}>
                  <Card sx={{ 
                    backgroundColor: colors.cardBg, 
                    border: `1px solid ${colors.border}`,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.1)',
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
                      {/* Track Image */}
                      <Box sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '12px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        mr: 2,
                        background: `linear-gradient(135deg, ${track.categoryColor}20, ${track.categoryColor}40)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                      }}>
                        {track.category === 'nature' ? '🌿' : '🎹'}
                      </Box>

                      {/* Track Info */}
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="h6" sx={{ 
                          color: colors.primaryText, 
                          fontWeight: 600, 
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {track.title}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: colors.secondaryText, 
                          mb: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {track.artist}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '12px',
                            backgroundColor: `${track.categoryColor}20`,
                            border: `1px solid ${track.categoryColor}30`
                          }}>
                            <Typography variant="caption" sx={{ 
                              color: track.categoryColor, 
                              fontWeight: 500,
                              fontSize: '0.75rem'
                            }}>
                              {track.category}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ 
                            color: colors.secondaryText,
                            fontWeight: 500
                          }}>
                            {track.duration}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Play Button */}
                      <IconButton 
                        onClick={() => playMusicTrack(track.id)}
                        disabled={activeMusicTrack === track.id}
                        sx={{ 
                          color: '#3B82F6',
                          backgroundColor: '#3B82F620',
                          ml: 2,
                          '&:hover': {
                            backgroundColor: '#3B82F630',
                            transform: 'scale(1.05)',
                          },
                          '&:disabled': {
                            color: colors.secondaryText,
                            backgroundColor: colors.border
                          }
                        }}
                      >
                        <PlayArrowIcon />
                      </IconButton>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 'tips':
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
                      {/* Header with Icon and Read Time */}
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

                      {/* Title */}
                      <Typography variant="h6" sx={{ 
                        color: colors.primaryText, 
                        fontWeight: 600, 
                        mb: 2,
                        lineHeight: 1.3
                      }}>
                        {tip.title}
                      </Typography>

                      {/* Description */}
                      <Typography variant="body2" sx={{ 
                        color: colors.secondaryText, 
                        mb: 3,
                        lineHeight: 1.5
                      }}>
                        {tip.description}
                      </Typography>

                      {/* Category Tag */}
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
        {/* Enhanced Header Section */}
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
            {/* Floating background elements */}
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

        {/* Enhanced Navigation Tabs */}
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

        {/* Dashboard Content */}
        {renderContent()}
      </Box>
    </Box>
  );
};

export default Wellness; 