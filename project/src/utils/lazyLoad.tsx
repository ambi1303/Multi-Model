import React, { Suspense } from 'react';
import { LoadingSpinner } from '@components/common/LoadingSpinner';

type LazyComponentModule = { [key: string]: React.ComponentType<any> };
type LazyLoader = () => Promise<LazyComponentModule>;

/**
 * A higher-order function to wrap React.lazy and Suspense for cleaner route definitions.
 * It intelligently handles modules with named exports.
 * @param lazyLoader - A function that returns a dynamic import, e.g., () => import('./pages/Home')
 * @param message - The loading message to display in the spinner.
 * @returns A component wrapped in Suspense with a loading fallback.
 */
export const lazyLoad = (lazyLoader: LazyLoader, message: string = 'Loading...') => {
  const LazyComponent = React.lazy(async () => {
    const module = await lazyLoader();
    // This assumes the component is the first named export in the module.
    // This is a common convention but might need adjustment if the convention changes.
    const componentName = Object.keys(module)[0];
    return { default: module[componentName] };
  });

  return (
    <Suspense fallback={<LoadingSpinner message={message} />}>
      <LazyComponent />
    </Suspense>
  );
}; 