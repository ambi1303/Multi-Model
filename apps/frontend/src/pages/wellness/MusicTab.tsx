import React from 'react';
import { Box, Typography, Card, Grid, IconButton, LinearProgress } from '@mui/material';
import { PlayArrowIcon, PauseIcon } from '../../utils/icons';

interface MusicTabProps {
  colors: {
    primaryText: string;
    secondaryText: string;
    cardBg: string;
    border: string;
  };
  mode: 'light' | 'dark';
  musicTracks: Array<{
    id: string;
    title: string;
    artist: string;
    duration: string;
    category: string;
    categoryColor: string;
  }>;
  activeMusicTrack: string | null;
  musicProgress: number;
  isMusicPlaying: boolean;
  playMusicTrack: (trackId: string) => void;
  pauseMusicTrack: () => void;
  resumeMusicTrack: () => void;
}

const MusicTab: React.FC<MusicTabProps> = ({
  colors,
  mode,
  musicTracks,
  activeMusicTrack,
  musicProgress,
  isMusicPlaying,
  playMusicTrack,
  pauseMusicTrack,
  resumeMusicTrack,
}) => {
  const currentTrack = musicTracks.find(t => t.id === activeMusicTrack);

  return (
    <Box sx={{ p: 3, backgroundColor: colors.background, borderRadius: '8px' }}>
      <Typography variant="h5" sx={{ color: colors.primaryText, mb: 4, fontWeight: 600 }}>
        Relaxing Music
      </Typography>
      {activeMusicTrack && (
        <Card sx={{
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          mb: 4,
          overflow: 'hidden'
        }}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box sx={{
                width: 80,
                height: 80,
                borderRadius: '12px',
                overflow: 'hidden',
                flexShrink: 0,
                mr: 2,
                background: `linear-gradient(135deg, ${currentTrack?.categoryColor}20, ${currentTrack?.categoryColor}40)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}>
                {currentTrack?.category === 'nature' ? '🌿' : '🎹'}
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" sx={{
                  color: colors.primaryText,
                  fontWeight: 600,
                  mb: 0.5
                }}>
                  {currentTrack?.title}
                </Typography>
                <Typography variant="body2" sx={{
                  color: colors.secondaryText
                }}>
                  {currentTrack?.artist}
                </Typography>
              </Box>
            </Box>
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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
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
};

export default MusicTab; 