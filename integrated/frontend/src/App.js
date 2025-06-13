import React, { useState } from 'react';
import { Box, Drawer, useTheme, CssBaseline, useMediaQuery } from '@mui/material';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import SpeechTab from './components/SpeechTab';
import ChatTab from './components/ChatTab';
import SurveyTab from './components/SurveyTab';
import LandingPage from './components/LandingPage';
import { AppHeader, AppFooter } from './components/SurveySharedUI';
import Sidebar from './components/Sidebar';

const SIDEBAR_WIDTH = 60;

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  const handleSidebarToggle = () => setSidebarOpen((open) => !open);

  const menuItems = [
    { text: 'Home', icon: <span className="pi pi-home" /> , path: '/home' },
    { text: 'Dashboard', icon: <span className="pi pi-th-large" />, path: '/dashboard' },
    { text: 'Speech Analysis', icon: <span className="pi pi-microphone" />, path: '/speech' },
    { text: 'Chat Analysis', icon: <span className="pi pi-comments" />, path: '/chat' },
    { text: 'Survey', icon: <span className="pi pi-chart-bar" />, path: '/survey' }
  ];

  const drawer = (
    <Sidebar
      collapsed={true}
      menuItems={menuItems}
      selected={location.pathname}
      onSelect={path => navigate(path)}
    />
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppHeader onSidebarToggle={handleSidebarToggle} sidebarOpen={sidebarOpen} />
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <CssBaseline />
        {/* Sidebar: Drawer on mobile, icon-only on desktop */}
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={sidebarOpen}
            onClose={handleSidebarToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: SIDEBAR_WIDTH },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Box
            sx={{
              width: SIDEBAR_WIDTH,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              flexShrink: 0,
              background: theme.palette.background.paper,
              borderRight: '1px solid #eee',
              minHeight: '100vh',
              overflowX: 'hidden',
              zIndex: 1200,
            }}
          >
            {drawer}
          </Box>
        )}
        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: '100%',
            marginLeft: 0,
            backgroundColor: theme.palette.background.default,
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowY: 'auto',
            minHeight: 0,
          }}
        >
          <Routes>
            <Route path="/home" element={<LandingPage />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/speech" element={<SpeechTab />} />
            <Route path="/chat" element={<ChatTab />} />
            <Route path="/survey" element={<SurveyTab />} />
          </Routes>
        </Box>
      </Box>
      <AppFooter />
    </Box>
  );
}

export default App;
