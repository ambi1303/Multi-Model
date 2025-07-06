// Dynamic import utilities for code splitting and lazy loading
// This helps reduce the initial bundle size by loading components only when needed

import React, { lazy, ComponentType } from 'react';

// Generic lazy loading wrapper with error handling
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) => {
  return lazy(async () => {
    try {
      const module = await importFn();
      return module;
    } catch (error) {
      console.error('Failed to load component:', error);
      // Return a fallback component
      return {
        default: (() => (
          React.createElement('div', { 
            style: { padding: '20px', textAlign: 'center' } 
          }, 'Failed to load component. Please refresh the page.')
        )) as unknown as T
      };
    }
  });
};

// Lazy load heavy MUI components only when needed
export const LazyAutocomplete = createLazyComponent(
  () => import('@mui/material/Autocomplete').then(m => ({ default: m.default }))
);

// Remove DataGrid import as @mui/x-data-grid is not available
// export const LazyDataGrid = createLazyComponent(
//   () => import('@mui/x-data-grid').then(m => ({ default: m.DataGrid }))
// );

export const LazyDatePicker = createLazyComponent(
  () => import('@mui/x-date-pickers/DatePicker').then(m => ({ default: m.DatePicker }))
);

// Remove Chart import as react-chartjs-2 is not available
// export const LazyChart = createLazyComponent(
//   () => import('react-chartjs-2').then(m => ({ default: m.Chart }))
// );

// Recharts removed due to dependency issues
// export const LazyRecharts = createLazyComponent(
//   () => import('recharts').then(m => ({ default: m.ResponsiveContainer }))
// );

// Preload critical components for better UX
export const preloadCriticalComponents = () => {
  // Preload components that are likely to be used soon
  const preloadPromises = [
    import('@mui/material/Dialog'),
    import('@mui/material/Snackbar'),
    import('../components/common/LoadingSpinner')
  ];

  return Promise.allSettled(preloadPromises);
};

// Dynamic import with retry logic
export const importWithRetry = async <T>(
  importFn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await importFn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Import failed after retries');
}; 