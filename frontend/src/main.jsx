import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { useAuthStore } from './stores/useAuthStore'
import { initPerformanceMonitoring } from './utils/performanceMonitor'
import './index.css'

// Initialize auth on app load
function AppWrapper() {
  const initAuth = useAuthStore((state) => state.initAuth)

  useEffect(() => {
    initAuth()
    // Initialize performance monitoring
    initPerformanceMonitoring()
  }, [initAuth])

  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
)
