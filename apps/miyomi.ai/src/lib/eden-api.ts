export interface VideoGenerationRequest {
  prompt: string;
  style: 'fast' | 'creative' | 'data-driven' | 'artistic';
  format: 'short' | 'landscape';
  model?: string;
}

export interface VideoGenerationTask {
  id: string;
  prompt: string;
  style: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  createdAt: string;
  completedAt?: string;
  videoUrl?: string;
  error?: string;
}

export interface EdenApiResponse {
  taskId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: {
    uri: string;
  };
  error?: string;
}

const EDEN_API_BASE_URL = 'https://api.eden.art';

class EdenVideoGenerator {
  private apiKey: string | null = null;
  private tasks: Map<string, VideoGenerationTask> = new Map();
  private listeners: Map<string, ((task: VideoGenerationTask) => void)[]> = new Map();

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_EDEN_API_KEY || null;
    
    if (typeof window !== 'undefined') {
      const savedTasks = localStorage.getItem('miyomi-video-tasks');
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        this.tasks = new Map(Object.entries(parsedTasks));
      }
    }
  }

  private saveTasks() {
    if (typeof window !== 'undefined') {
      const tasksObj = Object.fromEntries(this.tasks.entries());
      localStorage.setItem('miyomi-video-tasks', JSON.stringify(tasksObj));
    }
  }

  private notifyListeners(taskId: string, task: VideoGenerationTask) {
    const taskListeners = this.listeners.get(taskId) || [];
    taskListeners.forEach(listener => listener(task));
  }

  private getModelForStyle(style: string): string {
    switch (style) {
      case 'fast':
        return 'txt2vid';
      case 'creative':
        return 'txt2vid-turbo';
      case 'data-driven':
        return 'txt2vid';
      case 'artistic':
        return 'txt2vid-xl';
      default:
        return 'txt2vid';
    }
  }

  private enhancePromptForStyle(prompt: string, style: string, format: string): string {
    let enhancedPrompt = prompt;

    if (style === 'data-driven') {
      enhancedPrompt = `Professional financial data visualization: ${prompt}. Clean charts, trading floor environment, professional lighting, 4K quality.`;
    } else if (style === 'artistic') {
      enhancedPrompt = `Cinematic market analysis: ${prompt}. Dynamic camera movements, dramatic lighting, high production value, cinematic quality.`;
    } else if (style === 'creative') {
      enhancedPrompt = `Creative market content: ${prompt}. Engaging visuals, modern graphics, smooth transitions.`;
    }

    if (format === 'short') {
      enhancedPrompt += ' Vertical 9:16 format optimized for mobile viewing.';
    } else {
      enhancedPrompt += ' Horizontal 16:9 format for desktop and TV viewing.';
    }

    return enhancedPrompt;
  }

  async generateVideo(request: VideoGenerationRequest): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Eden API key not configured. Please set NEXT_PUBLIC_EDEN_API_KEY environment variable.');
    }

    const taskId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const task: VideoGenerationTask = {
      id: taskId,
      prompt: request.prompt,
      style: request.style,
      format: request.format,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.tasks.set(taskId, task);
    this.saveTasks();
    this.notifyListeners(taskId, task);

    try {
      const model = request.model || this.getModelForStyle(request.style);
      const enhancedPrompt = this.enhancePromptForStyle(request.prompt, request.style, request.format);

      const response = await fetch(`${EDEN_API_BASE_URL}/v1/creation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generatorName: model,
          config: {
            text_input: enhancedPrompt,
            width: request.format === 'short' ? 576 : 1024,
            height: request.format === 'short' ? 1024 : 576,
            n_frames: 49,
            guidance_scale: 7.5,
            num_inference_steps: 25
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Eden API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      task.status = 'processing';
      this.tasks.set(taskId, task);
      this.saveTasks();
      this.notifyListeners(taskId, task);

      this.pollTaskStatus(taskId, data.taskId || data.id);
      
      return taskId;
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error occurred';
      this.tasks.set(taskId, task);
      this.saveTasks();
      this.notifyListeners(taskId, task);
      throw error;
    }
  }

  private async pollTaskStatus(taskId: string, edenTaskId: string) {
    const maxAttempts = 120; // 10 minutes with 5-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`${EDEN_API_BASE_URL}/v1/creation/${edenTaskId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to check task status: ${response.statusText}`);
        }

        const data: EdenApiResponse = await response.json();
        const task = this.tasks.get(taskId);
        
        if (!task) return;

        if (data.progress !== undefined) {
          task.progress = data.progress;
        }

        if (data.status === 'completed' && data.result?.uri) {
          task.status = 'completed';
          task.videoUrl = data.result.uri;
          task.completedAt = new Date().toISOString();
          this.tasks.set(taskId, task);
          this.saveTasks();
          this.notifyListeners(taskId, task);
          return;
        } else if (data.status === 'failed') {
          task.status = 'failed';
          task.error = data.error || 'Video generation failed';
          this.tasks.set(taskId, task);
          this.saveTasks();
          this.notifyListeners(taskId, task);
          return;
        } else if (data.status === 'processing' || data.status === 'queued') {
          task.status = 'processing';
          this.tasks.set(taskId, task);
          this.saveTasks();
          this.notifyListeners(taskId, task);
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          task.status = 'failed';
          task.error = 'Video generation timed out';
          this.tasks.set(taskId, task);
          this.saveTasks();
          this.notifyListeners(taskId, task);
        }
      } catch (error) {
        const task = this.tasks.get(taskId);
        if (task) {
          task.status = 'failed';
          task.error = error instanceof Error ? error.message : 'Polling error';
          this.tasks.set(taskId, task);
          this.saveTasks();
          this.notifyListeners(taskId, task);
        }
      }
    };

    poll();
  }

  getTask(taskId: string): VideoGenerationTask | undefined {
    return this.tasks.get(taskId);
  }

  getAllTasks(): VideoGenerationTask[] {
    return Array.from(this.tasks.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  onTaskUpdate(taskId: string, callback: (task: VideoGenerationTask) => void): () => void {
    if (!this.listeners.has(taskId)) {
      this.listeners.set(taskId, []);
    }
    this.listeners.get(taskId)!.push(callback);

    return () => {
      const callbacks = this.listeners.get(taskId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    if (!this.apiKey) {
      return { connected: false, error: 'API key not configured' };
    }

    try {
      const response = await fetch(`${EDEN_API_BASE_URL}/v1/generators`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });

      if (response.ok) {
        return { connected: true };
      } else {
        return { connected: false, error: `API error: ${response.status}` };
      }
    } catch (error) {
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  clearCompletedTasks() {
    for (const [taskId, task] of this.tasks.entries()) {
      if (task.status === 'completed' || task.status === 'failed') {
        this.tasks.delete(taskId);
        this.listeners.delete(taskId);
      }
    }
    this.saveTasks();
  }
}

export const edenVideoGenerator = new EdenVideoGenerator();