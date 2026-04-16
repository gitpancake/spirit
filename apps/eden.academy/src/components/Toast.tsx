'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

export function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(id), 200) // Wait for animation to complete
  }

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: '✓',
          iconBg: 'bg-green-100',
          iconText: 'text-green-600',
          titleText: 'text-green-900'
        }
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200', 
          icon: '✕',
          iconBg: 'bg-red-100',
          iconText: 'text-red-600',
          titleText: 'text-red-900'
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: '⚠',
          iconBg: 'bg-yellow-100', 
          iconText: 'text-yellow-600',
          titleText: 'text-yellow-900'
        }
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'ℹ',
          iconBg: 'bg-blue-100',
          iconText: 'text-blue-600',
          titleText: 'text-blue-900'
        }
    }
  }

  const styles = getStyles()

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`max-w-sm w-full ${styles.bg} border ${styles.border} rounded-lg shadow-sm pointer-events-auto`}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className={`flex-shrink-0 ${styles.iconBg} rounded-full w-8 h-8 flex items-center justify-center`}>
                <span className={`text-sm font-medium ${styles.iconText}`}>{styles.icon}</span>
              </div>
              
              <div className="ml-3 flex-1">
                <h3 className={`text-sm font-medium ${styles.titleText}`}>
                  {title}
                </h3>
                {message && (
                  <p className="mt-1 text-sm text-gray-600">
                    {message}
                  </p>
                )}
              </div>

              <button
                onClick={handleClose}
                className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="sr-only">Close</span>
                <span className="text-lg">×</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Toast Container Component
interface ToastContainerProps {
  toasts: ToastProps[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onRemove} />
      ))}
    </div>
  )
}