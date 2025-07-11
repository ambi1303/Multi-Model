import React from 'react';
import { Box, Typography, Card, CardContent, Grid, Zoom } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface WellnessDashboardProps {
  colors: {
    background: string;
    primaryText: string;
    secondaryText: string;
    cardBg: string;
    border: string;
    gradient: string;
  };
  setActiveTab: (tab: string) => void;
  mode: 'light' | 'dark';
}

const WellnessDashboard: React.FC = () => {
  const { mode } = useTheme();

  // Theme-aware colors
  const colors = {
    background: mode === 'dark' ? '#1A2027' : '#FFFFFF',
    primaryText: mode === 'dark' ? '#FFFFFF' : '#333333',
    secondaryText: mode === 'dark' ? '#B0B0B0' : '#666666',
    cardBg: mode === 'dark' ? '#2D3748' : '#F5F5F5',
    border: mode === 'dark' ? '#4A5568' : '#E0E0E0',
    gradient: mode === 'dark' ? 'linear-gradient(90deg, #4A5568, #718096)' : 'linear-gradient(90deg, #4299E1, #3498DB)',
  };

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
};

export default WellnessDashboard; 