import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  Divider,
} from '@mui/material';
import { useTheme } from '../../contexts/ThemeContext';
import {
  HomeIcon,
  BarChartIcon,
  VideoCallIcon as VideocamIcon,
  MicIcon,
  ChatIcon,
  HeartIcon,
  HelpIcon,
  SettingsIcon,
  TrendingUpIcon,
  StarIcon,
  AssignmentIcon,
  DashboardIcon,
} from '../../utils/icons';

// --- Prefetching Logic ---
const lazyLoadMap: { [key: string]: () => Promise<any> } = {
  '/': () => import('../../pages/Home'),
  '/dashboard': () => import('../../pages/Dashboard'),
  '/analytics': () => import('../../pages/Analytics'),
  '/video': () => import('../../pages/VideoAnalysis'),
  '/speech': () => import('../../pages/SpeechAnalysis'),
  '/chat': () => import('../../pages/ChatAnalysis'),
  '/enhanced-survey': () => import('../../pages/EnhancedBurnoutSurvey'),
  '/emo-buddy': () => import('../../pages/EmoBuddy'),
  '/wellness': () => import('../../pages/Wellness'),
  '/faq': () => import('../../pages/FAQ'),
  '/admin': () => import('../../pages/Admin'),
  '/settings': () => import('../../pages/Settings'),
};

const prefetchComponent = (path: string) => {
  if (lazyLoadMap[path]) {
    lazyLoadMap[path]();
  }
};
// -------------------------

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant: 'temporary' | 'persistent';
  width: number;
}

interface NavItem {
  text: string;
  icon: React.FC<any> | string;
  path: string;
  description: string;
  live?: boolean;
  special?: 'sparkle' | 'heart' | 'pro';
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [
      { text: 'Home', icon: HomeIcon, path: '/', description: 'Welcome & Overview' },
      { text: 'Dashboard', icon: DashboardIcon, path: '/dashboard', description: 'Key metrics at a glance' },
      { text: 'Analytics', icon: BarChartIcon, path: '/analytics', description: 'Real-time insights & metrics', live: true },
    ],
  },
  {
    title: 'ANALYSIS TOOLS',
    items: [
      { text: 'Video Analysis', icon: VideocamIcon, path: '/video', description: 'Facial expression analysis' },
      { text: 'Audio Analysis', icon: MicIcon, path: '/speech', description: 'Voice sentiment analysis' },
      { text: 'Chat Analysis', icon: ChatIcon, path: '/chat', description: 'Conversation sentiment' },
      { text: 'Burnout Survey', icon: AssignmentIcon, path: '/enhanced-survey', description: 'Assess and track burnout levels' },
    ],
  },
  {
    title: 'AI COMPANION',
    items: [
      { text: 'Emo-Buddy', icon: '🤖', path: '/emo-buddy', description: 'AI emotional companion', special: 'sparkle' },
    ],
  },
  {
    title: 'WELLNESS & SUPPORT',
    items: [
      { text: 'Wellness Center', icon: HeartIcon, path: '/wellness', description: 'Mental health & meditation', special: 'heart' },
      { text: 'FAQ & Help', icon: HelpIcon, path: '/faq', description: 'Frequently asked questions' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { text: 'Admin Panel', icon: SettingsIcon, path: '/admin', description: 'User & system management', special: 'pro' },
      { text: 'Settings', icon: SettingsIcon, path: '/settings', description: 'Application preferences' },
    ],
  },
];

const SpecialIndicator = ({ type }: { type: string }) => {
  const styles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
  };
  if (type === 'live') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981' }} />
        <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 500 }}>Live</Typography>
      </Box>
    );
  }
  if (type === 'sparkle') return <Box sx={styles}>✨</Box>;
  if (type === 'heart') return <Box sx={styles}>❤️‍🔥</Box>;
  if (type === 'pro') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <StarIcon style={{ color: '#F59E0B', fontSize: 18 }} />
      </Box>
    );
  }
  return null;
};

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose, variant, width }) => {
  const { mode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    if (variant === 'temporary') {
      onClose();
    }
  };

  const colors = {
    bg: mode === 'dark' ? '#111827' : '#FFFFFF',
    textPrimary: mode === 'dark' ? '#F9FAFB' : '#111827',
    textSecondary: mode === 'dark' ? '#9CA3AF' : '#6B7280',
    itemBgActive: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
    itemBgHover: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6',
    title: mode === 'dark' ? '#9CA3AF' : '#6B7280',
    divider: mode === 'dark' ? '#374151' : '#E5E7EB',
  };

  const drawerContent = (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: colors.bg,
      color: colors.textPrimary,
      p: 2,
    }}>
      {/* User Profile */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar src="https://i.pravatar.cc/150?u=a042581f4e29026704d" sx={{ width: 48, height: 48 }} />
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.textPrimary }}>
            Admin User
          </Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary }}>
            IT Department
          </Typography>
        </Box>
        <Chip label="Admin" size="small" sx={{ ml: 'auto', bgcolor: '#EDE9FE', color: '#5B21B6', fontWeight: 600 }} />
      </Box>

      {/* Access Level */}
      <Box sx={{
        bgcolor: mode === 'dark' ? 'rgba(99, 102, 241, 0.1)' : '#EEF2FF',
        borderRadius: 3,
        p: 2,
        mb: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <HelpIcon style={{ color: '#6366F1' }} />
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: colors.textPrimary }}>
            Access Level
          </Typography>
          <Typography variant="body2" sx={{ color: '#6366F1' }}>
            12 of 12 features available
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
          {[...Array(4)].map((_, i) => (
            <Box key={i} sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#6366F1', opacity: i === 3 ? 0.4 : 1 }} />
          ))}
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {navSections.map((section, index) => (
          <List key={index} subheader={section.title ? (
            <Typography variant="caption" sx={{
              fontWeight: 700,
              color: colors.title,
              pl: 1.5,
              mt: index > 0 ? 2 : 0,
              display: 'block'
            }}>
              {section.title}
            </Typography>
          ) : null}>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/dashboard');

              return (
                <ListItem key={item.text} disablePadding sx={{ my: 0.5 }}>
                  <ListItemButton
                    onClick={() => handleNavigation(item.path)}
                    onMouseEnter={() => prefetchComponent(item.path)}
                    sx={{
                      borderRadius: 2.5,
                      py: 1.5,
                      px: 2,
                      background: isActive ? colors.itemBgActive : 'transparent',
                      color: isActive ? '#FFFFFF' : colors.textPrimary,
                      '&:hover': {
                        background: isActive ? colors.itemBgActive : colors.itemBgHover,
                      },
                      transition: 'background 0.3s, color 0.3s',
                    }}
                  >
                    <ListItemIcon sx={{
                      minWidth: 40,
                      color: 'inherit',
                      fontSize: typeof Icon === 'string' ? '24px' : 'inherit'
                    }}>
                      {typeof Icon === 'string'
                        ? <Box component="span" sx={{ fontSize: '24px', display: 'flex', alignItems: 'center' }}>{Icon}</Box>
                        : React.createElement(Icon, { style: { color: 'inherit', fontSize: 24 } })}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      secondary={item.description}
                      primaryTypographyProps={{ sx: { fontWeight: 600, fontSize: '0.9rem' } }}
                      secondaryTypographyProps={{ sx: {
                        color: isActive ? 'rgba(255,255,255,0.7)' : colors.textSecondary,
                        fontSize: '0.75rem'
                      }}}
                    />
                    {item.live && <SpecialIndicator type="live" />}
                    {item.special && <SpecialIndicator type={item.special} />}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        ))}
      </Box>

      <Divider sx={{ my: 2, borderColor: colors.divider }} />

      {/* Footer Stats */}
      <Box>
        <Box sx={{
          bgcolor: mode === 'dark' ? '#0596691A' : '#F0FDF4',
          borderRadius: 3,
          p: 2,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}>
          {/* TrendingUpIcon does not support sx prop directly, so use style instead */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUpIcon style={{ color: '#10B981' }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: colors.textPrimary }}>
              System Status
            </Typography>
            <Typography variant="body2" sx={{ color: '#10B981' }}>
              All systems operational
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Box sx={{ bgcolor: colors.itemBgHover, borderRadius: 3, p: 2 }}>
            <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 0.5 }}>Your Analyses</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: colors.textPrimary }}>1,247</Typography>
          </Box>
          <Box sx={{ bgcolor: colors.itemBgHover, borderRadius: 3, p: 2 }}>
            <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 0.5 }}>Accuracy</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#10B981' }}>94.8%</Typography>
          </Box>
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
          bgcolor: 'transparent',
          overflow: 'hidden',
        },
      }}
      ModalProps={{ keepMounted: true }}
    >
      {drawerContent}
    </Drawer>
  );
};