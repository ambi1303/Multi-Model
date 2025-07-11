import React, { Suspense, lazy } from 'react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

type LazyComponentModule = { default: React.ComponentType<any> };
type LazyLoader = () => Promise<LazyComponentModule>;

/**
 * A higher-order function to wrap React.lazy and Suspense for cleaner route definitions.
 * It now correctly uses React.lazy with modules that have a default export.
 * @param lazyLoader - A function that returns a dynamic import, e.g., () => import('../pages/Home')
 * @param message - The loading message to display in the spinner.
 * @returns A component wrapped in Suspense with a loading fallback.
 */
export const lazyLoad = (lazyLoader: LazyLoader, message: string = 'Loading...') => {
  const LazyComponent = lazy(lazyLoader);

  return (
    <Suspense fallback={<LoadingSpinner message={message} />}>
      <LazyComponent />
    </Suspense>
  );
}; 