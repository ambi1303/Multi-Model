import React from 'react';
import { Box, Typography, Paper, Button, List, ListItem, ListItemText, Divider, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  VideoLibrary as VideoIcon,
  Assessment as SurveyIcon,
  Chat as ChatIcon,
  Mic as SpeechIcon,
  Analytics as AnalysisIcon
} from '@mui/icons-material';
import Tooltip from '@mui/material/Tooltip';

const navOptions = [
  { label: 'Dashboard', value: 'dashboard', icon: <DashboardIcon />, path: '/' },
  { label: 'Video Analysis', value: 'video', icon: <VideoIcon />, path: '/video' },
  { label: 'Survey', value: 'survey', icon: <SurveyIcon />, path: '/survey' },
  { label: 'Chat Analysis', value: 'chat', icon: <ChatIcon />, path: '/chat' },
  { label: 'Speech Analysis', value: 'speech', icon: <SpeechIcon />, path: '/speech' },
  { label: 'Unified Analysis', value: 'unified', icon: <AnalysisIcon />, path: '/unified' }
];

const events = [
  'Team Building - Friday 3 PM',
  'Wellness Workshop - Next Monday',
  'Stress Management Session - Next Wednesday',
];

function Sidebar({ collapsed = false, menuItems = [], selected, onSelect }) {
  return (
    <Box
      sx={{
        width: collapsed ? 60 : 250,
        minHeight: '100vh',
        bgcolor: 'background.paper',
        color: 'text.primary',
        p: collapsed ? 1 : 3,
        borderRight: '1px solid #222',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        gap: 3,
        alignItems: collapsed ? 'center' : 'flex-start',
        transition: 'width 0.2s',
      }}
    >
      <Box sx={{ mb: 2, width: '100%', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <Typography variant="h6" sx={{ mb: 1, display: collapsed ? 'none' : 'block' }}>Navigation</Typography>
      </Box>
      <RadioGroup
        value={selected}
        onChange={e => onSelect(e.target.value)}
        sx={{ width: '100%' }}
      >
        {(menuItems.length ? menuItems : navOptions).map(opt => (
          <Tooltip key={opt.value || opt.text} title={opt.label || opt.text} placement="right" arrow disableInteractive>
            <FormControlLabel
              value={opt.path || opt.value}
              control={<Radio size="small" sx={{ display: 'none' }} />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {opt.icon}
                </Box>
              }
              sx={{
                color: 'text.primary',
                width: '100%',
                justifyContent: 'center',
                '&.Mui-selected': {
                  color: 'primary.main',
                },
                m: '8px 0',
                pl: 0,
                pr: 0,
              }}
            />
          </Tooltip>
        ))}
      </RadioGroup>
      {!collapsed && <>
        <Divider sx={{ my: 2, bgcolor: 'grey.800' }} />
        <Box>
          <Typography variant="h6" sx={{ mb: 1 }}>Mental Health Resources</Typography>
          <Paper elevation={2} sx={{ bgcolor: 'primary.dark', color: 'primary.contrastText', p: 2, mb: 2 }}>
            Need help? Contact HR or use the Employee Assistance Program
          </Paper>
        </Box>
        <Divider sx={{ my: 2, bgcolor: 'grey.800' }} />
        <Box>
          <Typography variant="h6" sx={{ mb: 1 }}>Upcoming Events</Typography>
          <List dense>
            {events.map((event, idx) => (
              <ListItem key={idx} sx={{ py: 0.5 }}>
                <ListItemText primary={event} primaryTypographyProps={{ fontSize: 15 }} />
              </ListItem>
            ))}
          </List>
        </Box>
      </>}
    </Box>
  );
}

export default Sidebar; 