import React, { useState, lazy, Suspense } from 'react';
import { Box, AppBar, Toolbar, Typography, Paper, Tabs, Tab } from '@mui/material';
import { PhotoCamera, Mic, Send, History } from '@mui/icons-material';
import CircularProgress from '@mui/material/CircularProgress';

// Lazy load tab components
const VideoTab = lazy(() => import('./components/VideoTab'));
const SpeechTab = lazy(() => import('./components/SpeechTab'));
const ChatTab = lazy(() => import('./components/ChatTab'));
const SurveyTab = lazy(() => import('./components/SurveyTab'));

const TABS = [
  { name: 'Video', component: VideoTab },
  { name: 'Speech', component: SpeechTab },
  { name: 'Chat', component: ChatTab },
  { name: 'Survey', component: SurveyTab },
];

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const ActiveTabComponent = TABS[activeTab].component;

  return (
    <Box className="App" sx={{ bgcolor: '#f4f7fa', minHeight: '100vh' }}>
      <AppBar position="static" color="primary" sx={{ mb: 4 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Integrated Multi-Modal Emotion & Mental State Analyzer
          </Typography>
        </Toolbar>
      </AppBar>
      <Paper elevation={3} sx={{ maxWidth: 900, mx: 'auto', p: { xs: 2, md: 4 }, borderRadius: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          <Tab label="Video" icon={<PhotoCamera />} iconPosition="start" />
          <Tab label="Speech" icon={<Mic />} iconPosition="start" />
          <Tab label="Chat" icon={<Send />} iconPosition="start" />
          <Tab label="Survey" icon={<History />} iconPosition="start" />
        </Tabs>
        <Box className="tab-content">
          <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>}>
            <ActiveTabComponent />
          </Suspense>
        </Box>
      </Paper>
    </Box>
  );
}

export default App;
