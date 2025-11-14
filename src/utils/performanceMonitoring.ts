/**
 * 📊 Performance Monitoring
 * 
 * Advanced performance tracking en analytics
 */

import * as React from 'react';

// Performance metric types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ComponentRenderMetric {
  component: string;
  renderTime: number;
  renderCount: number;
  averageRenderTime: number;
  lastRender: Date;
}

export interface APICallMetric {
  endpoint: string;
  method: string;
  duration: number;
  success: boolean;
  timestamp: Date;
  statusCode?: number;
}

// Singleton performance monitor
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private componentMetrics: Map<string, ComponentRenderMetric> = new Map();
  private apiMetrics: APICallMetric[] = [];
  private enabled: boolean = true;

  // Enable/disable monitoring
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // Track custom metric
  trackMetric(metric: Omit<PerformanceMetric, 'timestamp'>) {
    if (!this.enabled) return;

    this.metrics.push({
      ...metric,
      timestamp: new Date()
    });

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  // Track component render
  trackComponentRender(componentName: string, renderTime: number) {
    if (!this.enabled) return;

    const existing = this.componentMetrics.get(componentName);
    
    if (existing) {
      const newCount = existing.renderCount + 1;
      const totalTime = existing.averageRenderTime * existing.renderCount + renderTime;
      
      this.componentMetrics.set(componentName, {
        component: componentName,
        renderTime,
        renderCount: newCount,
        averageRenderTime: totalTime / newCount,
        lastRender: new Date()
      });
    } else {
      this.componentMetrics.set(componentName, {
        component: componentName,
        renderTime,
        renderCount: 1,
        averageRenderTime: renderTime,
        lastRender: new Date()
      });
    }
  }

  // Track API call
  trackAPICall(metric: Omit<APICallMetric, 'timestamp'>) {
    if (!this.enabled) return;

    this.apiMetrics.push({
      ...metric,
      timestamp: new Date()
    });

    // Keep only last 500 API calls
    if (this.apiMetrics.length > 500) {
      this.apiMetrics = this.apiMetrics.slice(-500);
    }
  }

  // Get all metrics
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Get component metrics
  getComponentMetrics(): ComponentRenderMetric[] {
    return Array.from(this.componentMetrics.values());
  }

  // Get API metrics
  getAPIMetrics(): APICallMetric[] {
    return [...this.apiMetrics];
  }

  // Get slow components (average render > 16ms = below 60fps)
  getSlowComponents(threshold: number = 16): ComponentRenderMetric[] {
    return this.getComponentMetrics()
      .filter(m => m.averageRenderTime > threshold)
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime);
  }

  // Get slow API calls
  getSlowAPICalls(threshold: number = 1000): APICallMetric[] {
    return this.apiMetrics
      .filter(m => m.duration > threshold)
      .sort((a, b) => b.duration - a.duration);
  }

  // Get API success rate
  getAPISuccessRate(): number {
    if (this.apiMetrics.length === 0) return 100;
    const successful = this.apiMetrics.filter(m => m.success).length;
    return (successful / this.apiMetrics.length) * 100;
  }

  // Get average API response time
  getAverageAPIResponseTime(): number {
    if (this.apiMetrics.length === 0) return 0;
    const total = this.apiMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / this.apiMetrics.length;
  }

  // Clear all metrics
  clear() {
    this.metrics = [];
    this.componentMetrics.clear();
    this.apiMetrics = [];
  }

  // Export metrics as JSON
  export(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      componentMetrics: this.getComponentMetrics(),
      apiMetrics: this.apiMetrics,
      summary: {
        totalMetrics: this.metrics.length,
        totalComponents: this.componentMetrics.size,
        totalAPICalls: this.apiMetrics.length,
        apiSuccessRate: this.getAPISuccessRate(),
        averageAPIResponseTime: this.getAverageAPIResponseTime(),
        slowComponents: this.getSlowComponents().length
      }
    }, null, 2);
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for component performance tracking
export const usePerformanceTracking = (componentName: string) => {
  const startTime = performance.now();

  // Track on unmount
  React.useEffect(() => {
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      performanceMonitor.trackComponentRender(componentName, duration);
    };
  }, [componentName, startTime]);
};

// Higher-order component for performance tracking
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => {
    const name = componentName || Component.displayName || Component.name || 'Unknown';
    usePerformanceTracking(name);
    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `WithPerformanceTracking(${componentName || Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Measure function execution time
export const measureExecutionTime = async <T,>(
  fn: () => Promise<T> | T,
  metricName: string
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await fn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    performanceMonitor.trackMetric({
      name: metricName,
      value: duration,
      unit: 'ms',
      metadata: { success: true }
    });
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    performanceMonitor.trackMetric({
      name: metricName,
      value: duration,
      unit: 'ms',
      metadata: { success: false, error: String(error) }
    });
    
    throw error;
  }
};

// API call wrapper with tracking
export const trackAPICall = async <T,>(
  endpoint: string,
  method: string,
  fn: () => Promise<T>
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await fn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    performanceMonitor.trackAPICall({
      endpoint,
      method,
      duration,
      success: true
    });
    
    return result;
  } catch (error: any) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    performanceMonitor.trackAPICall({
      endpoint,
      method,
      duration,
      success: false,
      statusCode: error?.status || error?.statusCode
    });
    
    throw error;
  }
};

// Get Web Vitals
export const getWebVitals = () => {
  if (!window.performance) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');

  return {
    // Time to First Byte
    ttfb: navigation ? navigation.responseStart - navigation.requestStart : 0,
    
    // First Contentful Paint
    fcp: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
    
    // DOM Content Loaded
    domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
    
    // Load Complete
    loadComplete: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
    
    // Total Page Load Time
    totalLoadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0
  };
};

// Get memory usage (if available)
export const getMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usedPercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };
  }
  return null;
};

// Log performance summary to console
export const logPerformanceSummary = () => {
  console.group('📊 Performance Summary');
  
  const webVitals = getWebVitals();
  if (webVitals) {
    console.log('🌐 Web Vitals:');
    console.table(webVitals);
  }
  
  const memory = getMemoryUsage();
  if (memory) {
    console.log('💾 Memory Usage:');
    console.table(memory);
  }
  
  const slowComponents = performanceMonitor.getSlowComponents();
  if (slowComponents.length > 0) {
    console.log('🐌 Slow Components (>16ms):');
    console.table(slowComponents);
  }
  
  const slowAPICalls = performanceMonitor.getSlowAPICalls(1000);
  if (slowAPICalls.length > 0) {
    console.log('🐌 Slow API Calls (>1s):');
    console.table(slowAPICalls);
  }
  
  console.log('📈 API Stats:');
  console.table({
    totalCalls: performanceMonitor.getAPIMetrics().length,
    successRate: `${performanceMonitor.getAPISuccessRate().toFixed(1)}%`,
    averageResponseTime: `${performanceMonitor.getAverageAPIResponseTime().toFixed(0)}ms`
  });
  
  console.groupEnd();
};

// Auto-log performance summary in development
if (process.env.NODE_ENV === 'development') {
  // Log on page load
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      setTimeout(() => {
        logPerformanceSummary();
      }, 1000);
    });
  }
}

// Export for global access in dev tools
if (typeof window !== 'undefined') {
  (window as any).__performanceMonitor = performanceMonitor;
  (window as any).__logPerformanceSummary = logPerformanceSummary;
}
