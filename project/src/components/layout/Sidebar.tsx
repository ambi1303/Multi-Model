import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Chip,
  Button,
} from '@mui/material';
import {
  DashboardIcon,
  VideoCallIcon as VideocamIcon,
  MicIcon,
  ChatIcon,
  AssignmentIcon,
  TrendingUpIcon,
  InfoIcon as StarIcon,
} from '../../utils/icons';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant: 'temporary' | 'persistent';
  width: number;
}

const navigationItems = [
  { text: 'Dashboard', icon: DashboardIcon, path: '/dashboard' },
  { text: 'Video Analysis', icon: VideocamIcon, path: '/video' },
  { text: 'Speech Analysis', icon: MicIcon, path: '/speech' },
  { text: 'Chat Analysis', icon: ChatIcon, path: '/chat' },
  { text: 'Emo-Buddy - AI Companion', icon: ChatIcon, path: '/emo-buddy' },
  { text: 'Enhanced Burnout Survey', icon: AssignmentIcon, path: '/enhanced-survey' },
  { text: 'Analytics', icon: TrendingUpIcon, path: '/analytics' },
  { text: 'FAQ', icon: StarIcon, path: '/faq' },
];

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose, variant, width }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    if (variant === 'temporary') {
      onClose();
    }
  };

  const drawerContent = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
    }}>
      {/* Navigation */}
      <List sx={{ flex: 1, pt: 2 }}>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <ListItem key={item.text} disablePadding sx={{ px: 2, mb: 1 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  backgroundColor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'primary.contrastText' : 'text.primary',
                  '&:hover': {
                    backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'primary.contrastText' : 'text.secondary',
                    minWidth: 40,
                  }}
                >
                  <Icon />
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 400,
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Status Section */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Chip
            label="9 Live Analyses"
            size="small"
            color="primary"
            variant="filled"
            sx={{ fontSize: '0.75rem' }}
          />
          <Chip
            label="19% Stress"
            size="small"
            color="success"
            variant="filled"
            sx={{ fontSize: '0.75rem' }}
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Advanced sentiment analysis using multiple machine learning models for accurate emotion detection and text classification across various domains.
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<StarIcon />}
            fullWidth
            sx={{ fontSize: '0.75rem' }}
          >
            Tutorials
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="text"
            size="small"
            fullWidth
            sx={{ fontSize: '0.75rem' }}
          >
            Contact Us
          </Button>
          <Button
            variant="text"
            size="small"
            fullWidth
            sx={{ fontSize: '0.75rem' }}
          >
            Report Issues
          </Button>
        </Box>
        
        <Button
          variant="text"
          size="small"
          fullWidth
          sx={{ fontSize: '0.75rem', mt: 1 }}
        >
          Service Status
        </Button>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: width,
          boxSizing: 'border-box',
          borderRight: 1,
          borderColor: 'divider',
          ...(variant === 'persistent' && {
            position: 'static',
            height: '100%',
            zIndex: 'auto',
          }),
          ...(variant === 'temporary' && {
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            zIndex: (theme) => theme.zIndex.drawer,
          }),
          overflowX: 'hidden',
          overflowY: 'auto',
        },
      }}
      ModalProps={{
        keepMounted: true,
      }}
    >
      {drawerContent}
    </Drawer>
  );
};