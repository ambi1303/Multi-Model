import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';

interface AnalyticsEvent {
  name: string;
  value: number;
  id: string;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType: string;
}

// Custom analytics function to send metrics to your analytics service
const sendToAnalytics = (metric: Metric) => {
  const analyticsEvent: AnalyticsEvent = {
    name: metric.name,
    value: metric.value,
    id: metric.id,
    delta: metric.delta,
    rating: metric.rating,
    navigationType: metric.navigationType,
  };

  // In production, send to your analytics service
  if (import.meta.env.PROD) {
    // Example: Send to Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        custom_map: {
          metric_rating: metric.rating,
          metric_delta: metric.delta,
        },
      });
    }

    // Example: Send to custom analytics endpoint
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analyticsEvent),
    }).catch(console.error);
  } else {
    // In development, log to console
    console.group(`🔍 Web Vital: ${metric.name}`);
    console.log(`Value: ${metric.value}`);
    console.log(`Rating: ${metric.rating}`);
    console.log(`Delta: ${metric.delta}`);
    console.log(`ID: ${metric.id}`);
    console.groupEnd();
  }
};

// Performance observer for additional metrics
const observePerformance = () => {
  if ('PerformanceObserver' in window) {
    // Observe Long Tasks (for Total Blocking Time)
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.warn(`Long Task detected: ${entry.duration}ms`, entry);
      }
    });

    try {
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (_e) {
      console.warn('Long Task Observer not supported');
    }

    // Observe Layout Shifts (for Cumulative Layout Shift)
    const layoutShiftObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue;
        console.warn(`Layout Shift detected: ${entry.value}`, entry);
      }
    });

    try {
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (_e) {
      console.warn('Layout Shift Observer not supported');
    }

    // Observe Largest Contentful Paint elements
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        console.log(`LCP Element:`, lastEntry.element);
        console.log(`LCP Size: ${lastEntry.size}`);
        console.log(`LCP Time: ${lastEntry.startTime}`);
      }
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (_e) {
      console.warn('LCP Observer not supported');
    }
  }
};

// Main function to initialize web vitals tracking
export const initWebVitals = () => {
  try {
    onCLS(sendToAnalytics, { reportAllChanges: true });
    onINP(sendToAnalytics);
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics, { reportAllChanges: true });
    onTTFB(sendToAnalytics);

    // Additional performance monitoring
    observePerformance();

    // Track bundle loading performance
    if ('performance' in window) {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        console.group('📊 Navigation Timing');
        console.log(`DNS Lookup: ${navigation.domainLookupEnd - navigation.domainLookupStart}ms`);
        console.log(`TCP Connection: ${navigation.connectEnd - navigation.connectStart}ms`);
        console.log(`Request: ${navigation.responseStart - navigation.requestStart}ms`);
        console.log(`Response: ${navigation.responseEnd - navigation.responseStart}ms`);
        console.log(`DOM Processing: ${navigation.domComplete - navigation.domLoading}ms`);
        console.log(`Load Event: ${navigation.loadEventEnd - navigation.loadEventStart}ms`);
        console.groupEnd();

        // Track resource loading
        const resources = performance.getEntriesByType('resource');
        const largeResources = resources
          .filter((resource: unknown) => (resource as PerformanceResourceTiming).transferSize > 100000) // > 100KB
          .sort((a: unknown, b: unknown) => (b as PerformanceResourceTiming).transferSize - (a as PerformanceResourceTiming).transferSize);

        if (largeResources.length > 0) {
          console.group('📦 Large Resources (>100KB)');
          largeResources.forEach((resource: any) => {
            console.log(`${resource.name}: ${Math.round(resource.transferSize / 1024)}KB`);
          });
          console.groupEnd();
        }
      });
    }
  } catch (error) {
    console.error('Error initializing web vitals:', error);
  }
};

// Performance budget checker
export const checkPerformanceBudget = () => {
  const budgets = {
    FCP: 1800, // 1.8s
    LCP: 2500, // 2.5s
    CLS: 0.1,
    INP: 200, // 200ms
    TTFB: 800, // 800ms
  };

  const checkBudget = (metric: Metric) => {
    const budget = budgets[metric.name as keyof typeof budgets];
    if (budget && metric.value > budget) {
      console.warn(`⚠️ Performance Budget Exceeded: ${metric.name}`);
      console.warn(`Budget: ${budget}, Actual: ${metric.value}`);
    }
  };

  try {
    onCLS(checkBudget);
    onINP(checkBudget);
    onFCP(checkBudget);
    onLCP(checkBudget);
    onTTFB(checkBudget);
  } catch (error) {
    console.error('Error checking performance budget:', error);
  }
};

// Utility to track custom metrics
export const trackCustomMetric = (name: string, value: number, unit = 'ms') => {
  if (import.meta.env.PROD) {
    // Send to analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'custom_metric', {
        event_category: 'Performance',
        event_label: name,
        value: Math.round(value),
        custom_map: {
          unit,
        },
      });
    }
  } else {
    console.log(`📈 Custom Metric: ${name} = ${value}${unit}`);
  }
};

// Bundle size tracking
export const trackBundleSize = () => {
  if ('navigator' in window && 'connection' in navigator) {
    const connection = (navigator as any).connection;
    const bundleSize = performance.getEntriesByType('resource')
      .filter((resource: any) => resource.name.includes('.js'))
      .reduce((total: number, resource: any) => total + resource.transferSize, 0);

    console.log(`📦 Total JS Bundle Size: ${Math.round(bundleSize / 1024)}KB`);
    
    if (connection) {
      console.log(`🌐 Connection: ${connection.effectiveType}`);
      console.log(`📶 Downlink: ${connection.downlink}Mbps`);
    }

    trackCustomMetric('bundle_size', bundleSize, 'bytes');
  }
}; 