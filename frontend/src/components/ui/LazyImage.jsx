import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useIntersectionObserver } from '@/utils/performance'
import { cn } from '@/utils'
import Spinner from './Spinner'

/**
 * LazyImage Component
 * Lazy loads images using Intersection Observer
 * Shows blur placeholder while loading
 * Supports WebP format and responsive images
 * 
 * @example
 * <LazyImage
 *   src="/image.jpg"
 *   alt="Description"
 *   className="w-full h-64"
 *   placeholder="/blur.jpg"
 * />
 */
export default function LazyImage({
  src,
  srcSet,
  alt = '',
  className = '',
  placeholder,
  blurDataURL,
  onLoad,
  onError,
  fallback,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [ref, isVisible] = useIntersectionObserver({
    threshold: 0.01,
    rootMargin: '50px',
  })
  const imgRef = useRef(null)

  // Start loading when visible
  useEffect(() => {
    if (isVisible && !isLoaded && !hasError) {
      const img = new Image()
      img.src = src

      img.onload = () => {
        setIsLoaded(true)
        if (onLoad) onLoad()
      }

      img.onerror = () => {
        setHasError(true)
        if (onError) onError()
      }
    }
  }, [isVisible, src, isLoaded, hasError, onLoad, onError])

  // Generate WebP src if available
  const webpSrc = src?.replace(/\.(jpg|jpeg|png)$/i, '.webp')
  const shouldUseWebP = typeof window !== 'undefined' && 
    window.Modernizr?.webp !== false

  if (hasError && fallback) {
    return (
      <div className={cn('flex items-center justify-center bg-gray-100', className)}>
        {fallback}
      </div>
    )
  }

  return (
    <div ref={ref} className={cn('relative overflow-hidden', className)}>
      {/* Blur placeholder */}
      {!isLoaded && (blurDataURL || placeholder) && (
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-sm scale-110"
          style={{
            backgroundImage: `url(${blurDataURL || placeholder})`,
          }}
        />
      )}

      {/* Loading spinner */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Spinner size="md" />
        </div>
      )}

      {/* Actual image */}
      {(isVisible || isLoaded) && (
        <img
          ref={imgRef}
          src={shouldUseWebP && webpSrc ? webpSrc : src}
          srcSet={srcSet}
          alt={alt}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          loading="lazy"
          onLoad={() => {
            setIsLoaded(true)
            if (onLoad) onLoad()
          }}
          onError={() => {
            setHasError(true)
            if (onError) onError()
          }}
          {...props}
        />
      )}

      {/* Placeholder while not visible */}
      {!isVisible && !isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  )
}

LazyImage.propTypes = {
  src: PropTypes.string.isRequired,
  srcSet: PropTypes.string,
  alt: PropTypes.string,
  className: PropTypes.string,
  placeholder: PropTypes.string,
  blurDataURL: PropTypes.string,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
  fallback: PropTypes.node,
}

