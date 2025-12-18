import { Component } from 'react'
import PropTypes from 'prop-types'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

/**
 * Error Boundary Component
 * Catches JavaScript errors in component tree and displays fallback UI
 * Supports full page and component-level error displays
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console
    console.error('Error caught by boundary:', error, errorInfo)
    
    // In production, send to error tracking service (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service
      // errorTrackingService.captureException(error, { extra: errorInfo })
    }

    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const { fallback, fullPage = true, onReset } = this.props

      // Custom fallback UI
      if (fallback) {
        return fallback(this.state.error, this.handleReset)
      }

      // Component-level error (inline)
      if (!fullPage) {
        return (
          <Card className="p-6 text-center border-error-200 bg-error-50">
            <AlertTriangle className="w-12 h-12 text-error-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Something went wrong
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              An error occurred while rendering this component.
            </p>
            <Button onClick={onReset || this.handleReset} variant="primary" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </Card>
        )
      }

      // Full page error
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-lg w-full">
            <Card className="p-8 text-center">
              <AlertTriangle className="w-20 h-20 text-error-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Something went wrong
              </h1>
              <p className="text-gray-600 mb-8">
                We're sorry, but something unexpected happened. Please try again or contact
                support if the problem persists.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left bg-gray-100 p-4 rounded-lg">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Error:</p>
                      <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-40">
                        {this.state.error.toString()}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">
                          Component Stack:
                        </p>
                        <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-40">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={onReset || this.handleReset} variant="primary">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleReload} variant="outline">
                  Reload Page
                </Button>
                <Button
                  onClick={() => (window.location.href = '/')}
                  variant="ghost"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.func,
  fullPage: PropTypes.bool,
  onReset: PropTypes.func,
}

export default ErrorBoundary

