import { toast as hotToast } from 'react-hot-toast'

/**
 * useToast Hook
 * Custom hook for showing toast notifications
 * 
 * @example
 * const { showSuccess, showError } = useToast()
 * showSuccess('Project created!')
 */
export const useToast = () => {
  const showSuccess = (message, options = {}) => {
    return hotToast.success(message, {
      duration: options.duration || 4000,
      ...options,
    })
  }

  const showError = (message, options = {}) => {
    return hotToast.error(message, {
      duration: options.duration || 5000,
      ...options,
    })
  }

  const showWarning = (message, options = {}) => {
    return hotToast(message, {
      icon: '⚠️',
      duration: options.duration || 4000,
      ...options,
    })
  }

  const showInfo = (message, options = {}) => {
    return hotToast(message, {
      icon: 'ℹ️',
      duration: options.duration || 4000,
      ...options,
    })
  }

  const show = (message, type = 'default', options = {}) => {
    const toastOptions = {
      duration: options.duration || 4000,
      ...options,
    }

    switch (type) {
      case 'success':
        return hotToast.success(message, toastOptions)
      case 'error':
        return hotToast.error(message, toastOptions)
      case 'warning':
        return hotToast(message, { ...toastOptions, icon: '⚠️' })
      case 'info':
        return hotToast(message, { ...toastOptions, icon: 'ℹ️' })
      default:
        return hotToast(message, toastOptions)
    }
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    show,
    dismiss: hotToast.dismiss,
    remove: hotToast.remove,
  }
}

export default useToast

