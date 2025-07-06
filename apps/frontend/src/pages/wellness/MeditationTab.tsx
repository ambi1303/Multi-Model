import React from 'react';
import { Box, Typography, Card, CardContent, Grid, IconButton } from '@mui/material';
import { PlayArrowIcon } from '../../utils/icons';

interface MeditationTabProps {
  colors: {
    primaryText: string;
    secondaryText: string;
    cardBg: string;
    border: string;
  };
  meditationSessions: Array<{
    id: string;
    title: string;
    duration: string;
    durationMinutes: number;
    description: string;
    tag: string;
    tagColor: string;
    icon: string;
    iconBg: string;
  }>;
  startTimer: (sessionId: string, durationMinutes: number) => void;
}

export const MeditationTab: React.FC<MeditationTabProps> = ({ colors, meditationSessions, startTimer }) => {
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
};

export default MeditationTab; 