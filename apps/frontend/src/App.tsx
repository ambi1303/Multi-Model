import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import ThemeHandler from './contexts/ThemeHandler';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppShell } from './components/layout/AppShell';
import CookieConsent from './components/common/CookieConsent';
import AuthInitializer from './components/common/AuthInitializer';
import { lazyLoad } from './utils/lazyLoad';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { Suspense } from 'react';
import { OptimizedLoadingSpinner } from './components/common/OptimizedLoadingSpinner';
import { WelcomeModal } from './components/common/WelcomeModal';

function App() {
  return (
    <ErrorBoundary>
      <ThemeHandler />
      <AuthInitializer>
        <Router>
          <Suspense fallback={<OptimizedLoadingSpinner />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* AppShell now acts as the protected layout route */}
              <Route element={<AppShell />}>
                <Route index element={lazyLoad(() => import('./pages/Home'))} />
                <Route path="dashboard" element={lazyLoad(() => import('./pages/Dashboard'))} />
                <Route path="video" element={lazyLoad(() => import('./pages/VideoAnalysis'))} />
                <Route path="speech" element={lazyLoad(() => import('./pages/SpeechAnalysis'))} />
                <Route path="chat" element={lazyLoad(() => import('./pages/ChatAnalysis'))} />
                <Route path="emo-buddy" element={lazyLoad(() => import('./pages/EmoBuddy'))} />
                <Route path="survey" element={lazyLoad(() => import('./pages/EnhancedBurnoutSurvey'))} />
                <Route path="analytics" element={lazyLoad(() => import('./pages/Analytics'))} />
                <Route path="wellness" element={lazyLoad(() => import('./pages/Wellness'))} />
                <Route path="faq" element={lazyLoad(() => import('./pages/FAQ'))} />
                <Route path="admin" element={lazyLoad(() => import('./pages/Admin'))} />
                <Route path="settings" element={lazyLoad(() => import('./pages/Settings'))} />
              </Route>
            </Routes>
          </Suspense>
          <CookieConsent />
          <WelcomeModal />
        </Router>
      </AuthInitializer>
    </ErrorBoundary>
  );
}

export default App;