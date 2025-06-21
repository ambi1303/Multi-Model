import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useAppStore } from '../../store/useAppStore';
import { designTokens } from '../../theme/theme';

const DRAWER_WIDTH = 280;

export const AppShell: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const location = useLocation();

  // Hide header/sidebar on landing page
  const isLanding = location.pathname === '/' || location.pathname === '/home';

  const handleDrawerToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {!isLanding && <Header onMenuClick={handleDrawerToggle} />}
      {!isLanding && (isMobile ? (
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          variant="temporary"
          width={DRAWER_WIDTH}
        />
      ) : (
        sidebarOpen && (
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            variant="persistent"
            width={DRAWER_WIDTH}
          />
        )
      ))}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          mt: !isLanding ? '64px' : 0, // Header height
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          width: '100%',
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3, md: 4 },
            width: '100%',
          }}
        >
          <Outlet />
        </Box>
        <Footer />
      </Box>
    </Box>
  );
};