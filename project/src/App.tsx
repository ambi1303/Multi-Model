import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { AppShell } from './components/layout/AppShell';

// Lazy load pages for better performance
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const VideoAnalysis = React.lazy(() => import('./pages/VideoAnalysis').then(m => ({ default: m.VideoAnalysis })));
const SpeechAnalysis = React.lazy(() => import('./pages/SpeechAnalysis').then(m => ({ default: m.SpeechAnalysis })));
const ChatAnalysis = React.lazy(() => import('./pages/ChatAnalysis').then(m => ({ default: m.ChatAnalysis })));
const BurnoutSurvey = React.lazy(() => import('./pages/BurnoutSurvey').then(m => ({ default: m.BurnoutSurvey })));
const Home = React.lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          <Router>
            <Routes>
              <Route path="/" element={<AppShell />}>
                <Route
                  index
                  element={
                    <Suspense fallback={<LoadingSpinner message="Loading Dashboard..." />}>
                      <Dashboard />
                    </Suspense>
                  }
                />
                <Route
                  path="video"
                  element={
                    <Suspense fallback={<LoadingSpinner message="Loading Video Analysis..." />}>
                      <VideoAnalysis />
                    </Suspense>
                  }
                />
                <Route
                  path="speech"
                  element={
                    <Suspense fallback={<LoadingSpinner message="Loading Speech Analysis..." />}>
                      <SpeechAnalysis />
                    </Suspense>
                  }
                />
                <Route
                  path="chat"
                  element={
                    <Suspense fallback={<LoadingSpinner message="Loading Chat Analysis..." />}>
                      <ChatAnalysis />
                    </Suspense>
                  }
                />
                <Route
                  path="survey"
                  element={
                    <Suspense fallback={<LoadingSpinner message="Loading Burnout Survey..." />}>
                      <BurnoutSurvey />
                    </Suspense>
                  }
                />
                <Route
                  path="home"
                  element={
                    <Suspense fallback={<LoadingSpinner message="Loading Home..." />}>
                      <Home />
                    </Suspense>
                  }
                />
              </Route>
            </Routes>
          </Router>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;