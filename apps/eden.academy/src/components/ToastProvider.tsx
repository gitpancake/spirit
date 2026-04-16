'use client'

import { createContext, useContext } from 'react'
import { useToast } from '~/hooks/useToast'
import { ToastContainer } from './Toast'

type ToastContextType = ReturnType<typeof useToast>

const ToastContext = createContext<ToastContextType | null>(null)

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast()

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}