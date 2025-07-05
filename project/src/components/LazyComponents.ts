import { lazy } from 'react';

// This file centralizes all lazy-loaded components for easier management and potential preloading.

// --- Analytics Dashboards ---
export const OverviewDashboard = lazy(() => 
  import('./analytics/OverviewDashboard').then(m => ({ default: m.OverviewDashboard }))
);
export const VideoAnalyticsDashboard = lazy(() => 
  import('./analytics/VideoAnalyticsDashboard').then(m => ({ default: m.VideoAnalyticsDashboard }))
);
export const SpeechAnalyticsDashboard = lazy(() => 
  import('./analytics/SpeechAnalyticsDashboard').then(m => ({ default: m.SpeechAnalyticsDashboard }))
);
export const ChatAnalyticsDashboard = lazy(() => 
  import('./analytics/ChatAnalyticsDashboard').then(m => ({ default: m.ChatAnalyticsDashboard }))
);

// --- Other heavy or conditionally rendered components can be added here ---
// Example:
// export const HeavyChartComponent = lazy(() => import('../charts/HeavyChart')); 