import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useAppStore } from '../../store/useAppStore';
import { useLocation } from 'react-router-dom';

const DRAWER_WIDTH = 250; // Fixed width as suggested
const CONTENT_GAP = 3; // MUI spacing unit (3*8=24px)
const SIDEBAR_WIDTH_PERCENT = 0.2; // 20% for sidebar
const MAIN_WIDTH_PERCENT = 0.8; // 80% for main content

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

  const sidebarOpenDesktop = !isLanding && !isMobile && sidebarOpen;

  // Header height (match MUI AppBar default or your custom height)
  const HEADER_HEIGHT = 64;

  // If it's the landing page, render full-screen without constraints
  if (isLanding) {
    return (
      <Box 
        sx={{ 
          width: '100vw',
          minHeight: '100vh',
          margin: 0,
          padding: 0,
          overflow: 'hidden',
        }}
      >
        <Outlet />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header - Fixed at top */}
      <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1201 }}>
        <Header onMenuClick={handleDrawerToggle} />
      </Box>
      
      {/* Main Layout Container - Below header */}
      <Box sx={{ 
        display: 'flex', 
        flex: 1,
        position: 'relative',
        pt: `${HEADER_HEIGHT}px`, // Push content below fixed header
        height: '100vh',
        minHeight: 0,
      }}>
        {/* Sidebar */}
        {isMobile
          ? (sidebarOpen && (
              <Sidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                variant="temporary"
                width={DRAWER_WIDTH}
              />
            ))
          : (sidebarOpenDesktop && (
              <Box sx={{
                width: `${SIDEBAR_WIDTH_PERCENT * 100}vw`,
                minWidth: 200,
                maxWidth: 400,
                height: `calc(100vh - ${HEADER_HEIGHT}px)` ,
                position: 'fixed',
                top: `${HEADER_HEIGHT}px`,
                left: 0,
                zIndex: 1200,
                bgcolor: 'background.paper',
                borderRight: 1,
                borderColor: 'divider',
              }}>
                <Sidebar
                  open={sidebarOpenDesktop}
                  onClose={() => setSidebarOpen(false)}
                  variant="persistent"
                  width={window.innerWidth * SIDEBAR_WIDTH_PERCENT < 200 ? 200 : window.innerWidth * SIDEBAR_WIDTH_PERCENT > 400 ? 400 : window.innerWidth * SIDEBAR_WIDTH_PERCENT}
                />
              </Box>
            ))
        }
        
        {/* Main Content Area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            minHeight: '100vh',
            px: CONTENT_GAP, // Uniform horizontal padding always
            width: !isMobile && sidebarOpenDesktop ? `${MAIN_WIDTH_PERCENT * 100}%` : '100%',
            ml: !isMobile && sidebarOpenDesktop ? `${SIDEBAR_WIDTH_PERCENT * 100}vw` : 0, // Push content right of fixed sidebar
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }}
        >
          <Outlet />
          <Footer />
        </Box>
      </Box>
    </Box>
  );
};