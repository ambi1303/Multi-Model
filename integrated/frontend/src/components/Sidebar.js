import React from 'react';
import { Box, Typography, Paper, Button, List, ListItem, ListItemText, Divider, RadioGroup, FormControlLabel, Radio } from '@mui/material';

const navOptions = [
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'Communication Analysis', value: 'communication' },
  { label: 'Survey', value: 'survey' },
  { label: 'Voice Analysis', value: 'voice' },
];

const events = [
  'Team Building - Friday 3 PM',
  'Wellness Workshop - Next Monday',
  'Stress Management Session - Next Wednesday',
];

function Sidebar({ selected, onSelect }) {
  return (
    <Box
      sx={{
        width: 300,
        minHeight: '100vh',
        bgcolor: 'background.paper',
        color: 'text.primary',
        p: 3,
        borderRight: '1px solid #222',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>Navigation</Typography>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Go to</Typography>
        <RadioGroup
          value={selected}
          onChange={e => onSelect(e.target.value)}
        >
          {navOptions.map(opt => (
            <FormControlLabel
              key={opt.value}
              value={opt.value}
              control={<Radio size="small" />}
              label={opt.label}
              sx={{ color: 'text.primary' }}
            />
          ))}
        </RadioGroup>
      </Box>
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
    </Box>
  );
}

export default Sidebar; 