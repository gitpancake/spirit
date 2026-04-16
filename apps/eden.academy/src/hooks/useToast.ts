'use client'

import { useState, useCallback } from 'react'
import { ToastProps } from '~/components/Toast'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastOptions {
  message?: string
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const addToast = useCallback((type: ToastType, title: string, options: ToastOptions = {}) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: ToastProps = {
      id,
      type,
      title,
      message: options.message,
      duration: options.duration,
      onClose: removeToast
    }

    setToasts(prev => [...prev, newToast])
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const success = useCallback((title: string, options?: ToastOptions) => {
    return addToast('success', title, options)
  }, [addToast])

  const error = useCallback((title: string, options?: ToastOptions) => {
    return addToast('error', title, options)
  }, [addToast])

  const warning = useCallback((title: string, options?: ToastOptions) => {
    return addToast('warning', title, options)
  }, [addToast])

  const info = useCallback((title: string, options?: ToastOptions) => {
    return addToast('info', title, options)
  }, [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }
}