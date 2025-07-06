import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ErrorBoundary from './components/common/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes, garbage collection time
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

// Get root element
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find the root element");
}

// Create root with concurrent features
const root = ReactDOM.createRoot(rootElement);

// Render app with performance optimizations
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Simple performance monitoring
if (process.env.NODE_ENV === 'development') {
  // Log performance metrics
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (perfData) {
        console.log('Performance Metrics:', {
          FCP: perfData.responseEnd - perfData.fetchStart,
          LCP: 'Use browser dev tools to measure',
          loadTime: perfData.loadEventEnd - perfData.fetchStart,
        });
      }
    }, 1000);
  });
}
