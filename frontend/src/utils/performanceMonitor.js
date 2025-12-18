/**
 * Performance Monitoring Utilities
 * Track Core Web Vitals and component render times
 */
import React from 'react'

/**
 * Measure Core Web Vitals
 * Tracks LCP, FID, CLS, and other performance metrics
 */
export function measureWebVitals() {
  if (typeof window === 'undefined' || !window.performance) {
    return
  }

  // Largest Contentful Paint (LCP)
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        console.log('[Performance] LCP:', lastEntry.renderTime || lastEntry.loadTime, 'ms')
        
        // Send to analytics if needed
        if (window.gtag) {
          window.gtag('event', 'web_vitals', {
            event_category: 'Web Vitals',
            event_label: 'LCP',
            value: Math.round(lastEntry.renderTime || lastEntry.loadTime),
          })
        }
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (e) {
      console.warn('[Performance] LCP observer not supported:', e)
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          const fid = entry.processingStart - entry.startTime
          console.log('[Performance] FID:', fid, 'ms')
          
          if (window.gtag) {
            window.gtag('event', 'web_vitals', {
              event_category: 'Web Vitals',
              event_label: 'FID',
              value: Math.round(fid),
            })
          }
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
    } catch (e) {
      console.warn('[Performance] FID observer not supported:', e)
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        console.log('[Performance] CLS:', clsValue)
        
        if (window.gtag) {
          window.gtag('event', 'web_vitals', {
            event_category: 'Web Vitals',
            event_label: 'CLS',
            value: Math.round(clsValue * 1000) / 1000,
          })
        }
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
    } catch (e) {
      console.warn('[Performance] CLS observer not supported:', e)
    }
  }
}

/**
 * Measure component render time
 * Use with React DevTools Profiler or manually
 * 
 * @param {string} componentName - Name of the component
 * @param {Function} renderFn - Render function to measure
 * @returns {any} Render result
 */
export function measureRender(componentName, renderFn) {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now()
    const result = renderFn()
    const end = performance.now()
    const duration = end - start

    if (duration > 16) {
      // Warn if render takes longer than one frame (16ms)
      console.warn(
        `[Performance] ${componentName} render took ${duration.toFixed(2)}ms (>16ms)`
      )
    } else {
      console.log(`[Performance] ${componentName} render: ${duration.toFixed(2)}ms`)
    }

    return result
  }
  return renderFn()
}

/**
 * Track page load performance
 */
export function trackPageLoad() {
  if (typeof window === 'undefined' || !window.performance) {
    return
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = window.performance.timing
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart
      const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart
      const connectTime = perfData.responseEnd - perfData.requestStart

      console.log('[Performance] Page Load Metrics:', {
        pageLoadTime: `${pageLoadTime}ms`,
        domReadyTime: `${domReadyTime}ms`,
        connectTime: `${connectTime}ms`,
      })

      // Send to analytics
      if (window.gtag) {
        window.gtag('event', 'page_load', {
          page_load_time: pageLoadTime,
          dom_ready_time: domReadyTime,
          connect_time: connectTime,
        })
      }
    }, 0)
  })
}

/**
 * React Profiler component wrapper
 * Logs render times for wrapped components
 * Note: This function should be used in .jsx files, not in .js files
 * For .js files, use React.createElement or move to .jsx
 */
export function withProfiler(Component, componentName) {
  if (process.env.NODE_ENV !== 'development') {
    return Component
  }

  // This function should be used in .jsx files where JSX is enabled
  // For now, we'll return a wrapper that uses React.createElement
  return function ProfiledComponent(props) {
    const start = performance.now()

    // Use React.createElement instead of JSX for .js files
    const result = React.createElement(Component, props)

    const end = performance.now()
    const duration = end - start

    if (duration > 16) {
      console.warn(
        `[Profiler] ${componentName} render: ${duration.toFixed(2)}ms (>16ms)`
      )
    }

    return result
  }
}

/**
 * Get performance metrics
 */
export function getPerformanceMetrics() {
  if (typeof window === 'undefined' || !window.performance) {
    return null
  }

  const navigation = performance.getEntriesByType('navigation')[0]
  const resources = performance.getEntriesByType('resource')

  return {
    // Navigation timing
    dns: navigation?.domainLookupEnd - navigation?.domainLookupStart,
    tcp: navigation?.connectEnd - navigation?.connectStart,
    request: navigation?.responseStart - navigation?.requestStart,
    response: navigation?.responseEnd - navigation?.responseStart,
    dom: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
    load: navigation?.loadEventEnd - navigation?.loadEventStart,
    // Resource timing
    resources: resources.map((resource) => ({
      name: resource.name,
      duration: resource.duration,
      size: resource.transferSize,
      type: resource.initiatorType,
    })),
    // Memory (if available)
    memory: performance.memory
      ? {
          used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
          total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
          limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
        }
      : null,
  }
}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') {
    return
  }

  // Measure Web Vitals
  measureWebVitals()

  // Track page load
  trackPageLoad()

  // Log performance metrics on demand
  if (process.env.NODE_ENV === 'development') {
    window.getPerformanceMetrics = getPerformanceMetrics
    console.log(
      '[Performance] Monitoring initialized. Call window.getPerformanceMetrics() to see metrics.'
    )
  }
}

export default {
  measureWebVitals,
  measureRender,
  trackPageLoad,
  withProfiler,
  getPerformanceMetrics,
  initPerformanceMonitoring,
}

