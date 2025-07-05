import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import ThemeHandler from './contexts/ThemeHandler';
import { NotificationProvider } from './contexts/NotificationContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppShell } from './components/layout/AppShell';
import CookieConsent from './components/common/CookieConsent';
import { lazyLoad } from './utils/lazyLoad';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ThemeHandler />
        <NotificationProvider>
          <Router>
            <Routes>
              <Route path="/" element={<AppShell />}>
                <Route index element={lazyLoad(() => import('./pages/Home'), 'Loading Home...')} />
                <Route path="home" element={lazyLoad(() => import('./pages/Home'), 'Loading Home...')} />
                <Route path="dashboard" element={lazyLoad(() => import('./pages/Dashboard'), 'Loading Dashboard...')} />
                <Route path="video" element={lazyLoad(() => import('./pages/VideoAnalysis'), 'Loading Video Analysis...')} />
                <Route path="speech" element={lazyLoad(() => import('./pages/SpeechAnalysis'), 'Loading Speech Analysis...')} />
                <Route path="chat" element={lazyLoad(() => import('./pages/ChatAnalysis'), 'Loading Chat Analysis...')} />
                <Route path="emo-buddy" element={lazyLoad(() => import('./pages/EmoBuddy'), 'Loading Emo Buddy...')} />
                <Route path="survey" element={lazyLoad(() => import('./pages/EnhancedBurnoutSurvey'), 'Loading Burnout Survey...')} />
                <Route path="enhanced-survey" element={lazyLoad(() => import('./pages/EnhancedBurnoutSurvey'), 'Loading Enhanced Survey...')} />
                <Route path="analytics" element={lazyLoad(() => import('./pages/Analytics'), 'Loading Analytics...')} />
                <Route path="wellness" element={lazyLoad(() => import('./pages/Wellness'), 'Loading Wellness...')} />
                <Route path="faq" element={lazyLoad(() => import('./pages/FAQ'), 'Loading FAQ...')} />
                <Route path="admin" element={lazyLoad(() => import('./pages/Admin'), 'Loading Admin...')} />
                <Route path="settings" element={lazyLoad(() => import('./pages/Settings'), 'Loading Settings...')} />
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