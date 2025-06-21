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
  Divider,
} from '@mui/material';
import {
  Dashboard,
  Videocam,
  Mic,
  Chat,
  Assignment,
  TrendingUp,
} from '@mui/icons-material';

interface NavigationItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
}

const navigationItems: NavigationItem[] = [
  { label: 'Home', path: '/home', icon: <Dashboard /> },
  { label: 'Dashboard', path: '/', icon: <Dashboard /> },
  { label: 'Video Analysis', path: '/video', icon: <Videocam /> },
  { label: 'Speech Analysis', path: '/speech', icon: <Mic /> },
  { label: 'Chat Analysis', path: '/chat', icon: <Chat /> },
  { label: 'Burnout Survey', path: '/survey', icon: <Assignment /> },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant: 'permanent' | 'temporary' | 'persistent';
  width: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  open,
  onClose,
  variant,
  width,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    if (variant === 'temporary') {
      onClose();
    }
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, pt: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Navigation
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Choose an analysis mode
        </Typography>
      </Box>

      <List sx={{ flexGrow: 1, px: 2 }}>
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  backgroundColor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'primary.contrastText' : 'text.primary',
                  '&:hover': {
                    backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'primary.contrastText' : 'text.secondary',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.875rem',
                  }}
                />
                {item.badge && (
                  <Chip
                    label={item.badge}
                    size="small"
                    color="secondary"
                    sx={{ ml: 1 }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ mx: 2 }} />
      
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <TrendingUp sx={{ mb: 1 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Analysis Insights
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            Unlock comprehensive emotional intelligence across all modalities
          </Typography>
        </Box>
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
          borderRight: 'none',
          mt: variant === 'permanent' ? '64px' : 0,
          height: variant === 'permanent' ? 'calc(100vh - 64px)' : '100vh',
        },
      }}
      ModalProps={{
        keepMounted: true, // Better mobile performance
      }}
    >
      {drawerContent}
    </Drawer>
  );
};