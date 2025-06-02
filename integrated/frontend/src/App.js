import React, { useState, Suspense, lazy } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Paper, CircularProgress } from '@mui/material';
import Sidebar from './components/Sidebar';

const Dashboard = lazy(() => import('./components/Dashboard'));
const VideoTab = lazy(() => import('./components/VideoTab'));
const SpeechTab = lazy(() => import('./components/SpeechTab'));
const ChatTab = lazy(() => import('./components/ChatTab'));
const SurveyTab = lazy(() => import('./components/SurveyTab'));

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#181A20',
      paper: '#23242a',
    },
    primary: {
      main: '#6C63FF',
      dark: '#4b47b5',
      contrastText: '#fff',
    },
    text: {
      primary: '#fff',
      secondary: '#b0b3b8',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
});

function App() {
  const [selected, setSelected] = useState('dashboard');

  let Content;
  if (selected === 'dashboard') Content = Dashboard;
  else if (selected === 'communication') Content = ChatTab;
  else if (selected === 'survey') Content = SurveyTab;
  else if (selected === 'voice') Content = SpeechTab;
  else Content = Dashboard;

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <Sidebar selected={selected} onSelect={setSelected} />
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', p: 4 }}>
          <Paper elevation={3} sx={{ width: '100%', maxWidth: 900, minHeight: 600, p: 5, mt: 2, bgcolor: 'background.paper', borderRadius: 4 }}>
            <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>}>
              <Content />
            </Suspense>
          </Paper>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
