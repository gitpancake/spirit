'use client'

import { useState, useEffect, useCallback } from 'react'
import { edenVideoGenerator, VideoGenerationRequest, VideoGenerationTask } from '@/lib/eden-api'

export function useVideoGeneration() {
  const [tasks, setTasks] = useState<VideoGenerationTask[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean
    error?: string
  } | null>(null)

  // Load tasks on mount
  useEffect(() => {
    setTasks(edenVideoGenerator.getAllTasks())
  }, [])

  // Generate video function
  const generateVideo = useCallback(async (request: VideoGenerationRequest): Promise<string> => {
    setIsGenerating(true)
    try {
      const taskId = await edenVideoGenerator.generateVideo(request)
      
      // Set up listener for this specific task
      const unsubscribe = edenVideoGenerator.onTaskUpdate(taskId, (updatedTask) => {
        setTasks(prevTasks => {
          const newTasks = [...prevTasks]
          const existingIndex = newTasks.findIndex(t => t.id === taskId)
          if (existingIndex >= 0) {
            newTasks[existingIndex] = updatedTask
          } else {
            newTasks.unshift(updatedTask)
          }
          return newTasks
        })

        // Show notification when completed
        if (updatedTask.status === 'completed') {
          showNotification('Video generation completed!', 'success')
          setIsGenerating(false)
        } else if (updatedTask.status === 'failed') {
          showNotification(`Video generation failed: ${updatedTask.error}`, 'error')
          setIsGenerating(false)
        }
      })

      // Add initial task to state
      const initialTask = edenVideoGenerator.getTask(taskId)
      if (initialTask) {
        setTasks(prevTasks => [initialTask, ...prevTasks])
      }

      // Clean up listener when task is done
      const cleanup = () => {
        unsubscribe()
      }

      // Store cleanup function for later use
      setTimeout(() => {
        const task = edenVideoGenerator.getTask(taskId)
        if (task && (task.status === 'completed' || task.status === 'failed')) {
          cleanup()
        }
      }, 1000)

      return taskId
    } catch (error) {
      setIsGenerating(false)
      showNotification(
        error instanceof Error ? error.message : 'Video generation failed',
        'error'
      )
      throw error
    }
  }, [])

  // Test Eden API connection
  const testConnection = useCallback(async () => {
    const result = await edenVideoGenerator.testConnection()
    setConnectionStatus(result)
    return result
  }, [])

  // Get specific task
  const getTask = useCallback((taskId: string) => {
    return edenVideoGenerator.getTask(taskId)
  }, [])

  // Clear completed tasks
  const clearCompletedTasks = useCallback(() => {
    edenVideoGenerator.clearCompletedTasks()
    setTasks(edenVideoGenerator.getAllTasks())
  }, [])

  // Get tasks by status
  const getTasksByStatus = useCallback((status: VideoGenerationTask['status']) => {
    return tasks.filter(task => task.status === status)
  }, [tasks])

  return {
    tasks,
    isGenerating,
    connectionStatus,
    generateVideo,
    testConnection,
    getTask,
    clearCompletedTasks,
    getTasksByStatus,
    pendingTasks: getTasksByStatus('pending'),
    processingTasks: getTasksByStatus('processing'),
    completedTasks: getTasksByStatus('completed'),
    failedTasks: getTasksByStatus('failed')
  }
}

// Simple notification system (could be replaced with a proper toast library)
function showNotification(message: string, type: 'success' | 'error' | 'info') {
  if (typeof window === 'undefined') return

  // Create notification element
  const notification = document.createElement('div')
  notification.className = `
    fixed top-4 right-4 z-50 p-4 rounded-lg border border-white text-white font-sans max-w-sm
    ${type === 'success' ? 'bg-green-900' : type === 'error' ? 'bg-red-900' : 'bg-black'}
  `.trim()
  notification.textContent = message

  document.body.appendChild(notification)

  // Animate in
  notification.style.transform = 'translateX(100%)'
  notification.style.transition = 'transform 0.3s ease-in-out'
  setTimeout(() => {
    notification.style.transform = 'translateX(0)'
  }, 10)

  // Remove after 5 seconds
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)'
    setTimeout(() => {
      document.body.removeChild(notification)
    }, 300)
  }, 5000)
}