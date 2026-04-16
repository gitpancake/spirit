'use client'

import { VideoGenerationTask } from '@/lib/eden-api'

interface VideoTaskProgressProps {
  task: VideoGenerationTask
  onViewVideo?: (videoUrl: string) => void
  onRetry?: () => void
  compact?: boolean
}

export function VideoTaskProgress({ 
  task, 
  onViewVideo, 
  onRetry, 
  compact = false 
}: VideoTaskProgressProps) {
  const getStatusIcon = () => {
    switch (task.status) {
      case 'pending':
        return '⏳'
      case 'processing':
        return '⚡'
      case 'completed':
        return '✅'
      case 'failed':
        return '❌'
      default:
        return '⏳'
    }
  }

  const getStatusText = () => {
    switch (task.status) {
      case 'pending':
        return 'QUEUED'
      case 'processing':
        return task.progress ? `PROCESSING (${Math.round(task.progress)}%)` : 'PROCESSING'
      case 'completed':
        return 'COMPLETED'
      case 'failed':
        return 'FAILED'
      default:
        return 'UNKNOWN'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `${diffDays}d ago`
    } else if (diffHours > 0) {
      return `${diffHours}h ago`
    } else if (diffMins > 0) {
      return `${diffMins}m ago`
    } else {
      return 'Just now'
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span>{getStatusIcon()}</span>
        <span>{getStatusText()}</span>
        {task.status === 'completed' && task.videoUrl && onViewVideo && (
          <button
            onClick={() => onViewVideo(task.videoUrl!)}
            className="text-white hover:text-gray-300 underline ml-2"
          >
            VIEW
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="border border-white p-4 rounded">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getStatusIcon()}</span>
          <div>
            <h4 className="font-bold text-sm">{getStatusText()}</h4>
            <p className="text-xs text-white">{formatTimeAgo(task.createdAt)}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-white mb-1">
            {task.style.toUpperCase()} • {task.format.toUpperCase()}
          </div>
          {task.status === 'completed' && task.completedAt && (
            <div className="text-xs text-white">
              Completed {formatTimeAgo(task.completedAt)}
            </div>
          )}
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm text-white line-clamp-2">{task.prompt}</p>
      </div>

      {task.status === 'processing' && task.progress && (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs">Progress</span>
            <span className="text-xs">{Math.round(task.progress)}%</span>
          </div>
          <div className="w-full bg-black border border-white h-2">
            <div 
              className="bg-white h-full transition-all duration-300"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      {task.status === 'failed' && task.error && (
        <div className="mb-3">
          <p className="text-xs text-red-400">Error: {task.error}</p>
        </div>
      )}

      <div className="flex gap-2">
        {task.status === 'completed' && task.videoUrl && onViewVideo && (
          <button
            onClick={() => onViewVideo(task.videoUrl!)}
            className="border border-white px-3 py-1 text-sm hover:bg-white hover:text-black transition-colors"
          >
            🎥 VIEW VIDEO
          </button>
        )}
        
        {task.status === 'failed' && onRetry && (
          <button
            onClick={onRetry}
            className="border border-white px-3 py-1 text-sm hover:bg-white hover:text-black transition-colors"
          >
            🔄 RETRY
          </button>
        )}

        {task.status === 'processing' && (
          <div className="text-xs text-white flex items-center">
            <div className="animate-spin mr-2">⚡</div>
            Generating video...
          </div>
        )}
      </div>
    </div>
  )
}

interface VideoTaskListProps {
  tasks: VideoGenerationTask[]
  onViewVideo?: (videoUrl: string) => void
  onRetryTask?: (task: VideoGenerationTask) => void
  maxItems?: number
  title?: string
}

export function VideoTaskList({ 
  tasks, 
  onViewVideo, 
  onRetryTask, 
  maxItems = 10,
  title = 'Video Generation Tasks'
}: VideoTaskListProps) {
  const displayTasks = tasks.slice(0, maxItems)

  if (tasks.length === 0) {
    return (
      <div className="border border-white p-6 text-center">
        <div className="text-4xl mb-2">🎬</div>
        <p className="text-white">No video generation tasks yet</p>
      </div>
    )
  }

  return (
    <div className="border border-white p-6">
      <h3 className="text-lg font-bold mb-4">{title} ({tasks.length})</h3>
      <div className="space-y-4">
        {displayTasks.map((task) => (
          <VideoTaskProgress
            key={task.id}
            task={task}
            onViewVideo={onViewVideo}
            onRetry={onRetryTask ? () => onRetryTask(task) : undefined}
          />
        ))}
        {tasks.length > maxItems && (
          <p className="text-sm text-white text-center">
            ... and {tasks.length - maxItems} more tasks
          </p>
        )}
      </div>
    </div>
  )
}