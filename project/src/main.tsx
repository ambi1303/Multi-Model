import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Get root element
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

// Create root with concurrent features
const root = ReactDOM.createRoot(rootElement);

// Render app with performance optimizations
root.render(
  <React.StrictMode>
    <App />
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

// Register service worker for caching (optional)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
