import { useRef, useCallback, useEffect, useState } from 'react'

/**
 * Performance Utilities
 * Collection of performance optimization helpers
 */

/**
 * Debounce function
 * Delays function execution until after wait time has passed since last invocation
 * 
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute immediately on first call
 * @returns {Function} Debounced function
 * 
 * @example
 * const debouncedSearch = debounce(handleSearch, 300);
 * debouncedSearch('query');
 */
export function debounce(func, wait = 300, immediate = false) {
  let timeout = null

  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }

    const callNow = immediate && !timeout

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)

    if (callNow) func(...args)
  }
}

/**
 * Throttle function
 * Limits function execution to at most once per wait time
 * 
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 * 
 * @example
 * const throttledScroll = throttle(handleScroll, 100);
 * window.addEventListener('scroll', throttledScroll);
 */
export function throttle(func, limit = 300) {
  let inThrottle = false

  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * useDebounce Hook
 * React hook for debouncing values
 * 
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {any} Debounced value
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * useDebouncedCallback Hook
 * React hook for debouncing callback functions
 * 
 * @param {Function} callback - Callback function
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced callback
 * 
 * @example
 * const debouncedSearch = useDebouncedCallback((query) => {
 *   performSearch(query);
 * }, 300);
 */
export function useDebouncedCallback(callback, delay = 300) {
  const timeoutRef = useRef(null)

  const debouncedCallback = useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

/**
 * useThrottledCallback Hook
 * React hook for throttling callback functions
 * 
 * @param {Function} callback - Callback function
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled callback
 * 
 * @example
 * const throttledScroll = useThrottledCallback(() => {
 *   handleScroll();
 * }, 100);
 */
export function useThrottledCallback(callback, limit = 300) {
  const lastRun = useRef(Date.now())

  return useCallback(
    (...args) => {
      if (Date.now() - lastRun.current >= limit) {
        callback(...args)
        lastRun.current = Date.now()
      }
    },
    [callback, limit]
  )
}

/**
 * useIntersectionObserver Hook
 * React hook for Intersection Observer API
 * Useful for lazy loading images and infinite scroll
 * 
 * @param {object} options - Intersection Observer options
 * @param {number} options.threshold - Threshold for intersection
 * @param {string} options.rootMargin - Root margin
 * @returns {[React.RefObject, boolean]} - [ref, isIntersecting]
 * 
 * @example
 * const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
 * return <div ref={ref}>{isVisible && <HeavyComponent />}</div>;
 */
export function useIntersectionObserver(options = {}) {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    root = null,
  } = options

  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const targetRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting
        setIsIntersecting(isElementIntersecting)

        if (isElementIntersecting && !hasIntersected) {
          setHasIntersected(true)
        }
      },
      {
        threshold,
        rootMargin,
        root,
      }
    )

    const currentTarget = targetRef.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [threshold, rootMargin, root, hasIntersected])

  return [targetRef, isIntersecting, hasIntersected]
}

/**
 * useLazyLoad Hook
 * Hook for lazy loading components or data
 * 
 * @param {boolean} shouldLoad - Condition to trigger loading
 * @returns {boolean} - Whether to load
 * 
 * @example
 * const shouldLoad = useLazyLoad(isVisible);
 * return shouldLoad ? <HeavyComponent /> : <Placeholder />;
 */
export function useLazyLoad(shouldLoad) {
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    if (shouldLoad && !hasLoaded) {
      setHasLoaded(true)
    }
  }, [shouldLoad, hasLoaded])

  return hasLoaded
}

/**
 * Performance measurement utilities
 */
export const performanceUtils = {
  /**
   * Measure function execution time
   * 
   * @param {string} label - Label for measurement
   * @param {Function} fn - Function to measure
   * @returns {any} Function result
   */
  measure: (label, fn) => {
    if (process.env.NODE_ENV === 'development') {
      const start = performance.now()
      const result = fn()
      const end = performance.now()
      console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`)
      return result
    }
    return fn()
  },

  /**
   * Measure async function execution time
   * 
   * @param {string} label - Label for measurement
   * @param {Function} fn - Async function to measure
   * @returns {Promise<any>} Function result
   */
  measureAsync: async (label, fn) => {
    if (process.env.NODE_ENV === 'development') {
      const start = performance.now()
      const result = await fn()
      const end = performance.now()
      console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`)
      return result
    }
    return fn()
  },

  /**
   * Get memory usage (if available)
   */
  getMemoryUsage: () => {
    if (performance.memory) {
      return {
        used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
        limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
      }
    }
    return null
  },
}

/**
 * Batch updates utility
 * Groups multiple state updates into a single render
 */
export function batchUpdates(updates) {
  // React 18 automatically batches updates, but this can be used for clarity
  updates.forEach((update) => update())
}

export default {
  debounce,
  throttle,
  useDebounce,
  useDebouncedCallback,
  useThrottledCallback,
  useIntersectionObserver,
  useLazyLoad,
  performanceUtils,
  batchUpdates,
}

