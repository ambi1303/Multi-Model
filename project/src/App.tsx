import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { AppShell } from './components/layout/AppShell';
import CookieConsent from './components/common/CookieConsent';

// Lazy load pages for better performance
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const VideoAnalysis = React.lazy(() => import('./pages/VideoAnalysis').then(m => ({ default: m.VideoAnalysis })));
const SpeechAnalysis = React.lazy(() => import('./pages/SpeechAnalysis').then(m => ({ default: m.SpeechAnalysis })));
const ChatAnalysis = React.lazy(() => import('./pages/ChatAnalysis').then(m => ({ default: m.ChatAnalysis })));
const EnhancedBurnoutSurvey = React.lazy(() => import('./pages/EnhancedBurnoutSurvey').then(m => ({ default: m.EnhancedBurnoutSurvey })));
const Home = React.lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Analytics = React.lazy(() => import('./pages/Analytics').then(m => ({ default: m.Analytics })));
const EmoBuddy = React.lazy(() => import('./pages/EmoBuddy').then(m => ({ default: m.EmoBuddy })));

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
                    <Suspense fallback={<LoadingSpinner message="Loading Home..." />}>
                      <Home />
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
                <Route
                  path="dashboard"
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
                  path="emo-buddy"
                  element={
                    <Suspense fallback={<LoadingSpinner message="Loading Emo Buddy..." />}>
                      <EmoBuddy />
                    </Suspense>
                  }
                />
                <Route
                  path="survey"
                  element={
                    <Suspense fallback={<LoadingSpinner message="Loading Burnout Survey..." />}>
                      <EnhancedBurnoutSurvey />
                    </Suspense>
                  }
                />
                <Route
                  path="enhanced-survey"
                  element={
                    <Suspense fallback={<LoadingSpinner message="Loading Enhanced Survey..." />}>
                      <EnhancedBurnoutSurvey />
                    </Suspense>
                  }
                />
                <Route
                  path="analytics"
                  element={
                    <Suspense fallback={<LoadingSpinner message="Loading Analytics..." />}>
                      <Analytics />
                    </Suspense>
                  }
                />
              </Route>
            </Routes>
          </Router>
          <CookieConsent />
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;