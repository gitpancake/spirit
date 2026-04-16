import { publishGenesisRegistryTask, GenesisRegistryTask } from './rabbitmq';

export interface ApplicationData {
  name: string;
  handle: string;
  role: string;
  public_persona: string;
  artist_wallet: string;
  [key: string]: any;
}

export async function processApplication(taskId: string, applicationData: ApplicationData): Promise<void> {
  try {
    console.log(`🚀 Processing application for task: ${taskId}`);
    console.log('📊 Environment check:');
    console.log('  - RABBITMQ_URL:', process.env.RABBITMQ_URL ? 'SET' : 'NOT SET');
    console.log('  - RABBITMQ_QUEUE_NAME:', process.env.RABBITMQ_QUEUE_NAME || 'applications');

    // Generate unique agent ID from handle + timestamp
    const agentId = `${applicationData.handle}-${Date.now()}`.toLowerCase();
    console.log('🆔 Generated agent ID:', agentId);

    // Create RabbitMQ task
    console.log('📝 Creating RabbitMQ task object...');
    const rabbitMQTask: GenesisRegistryTask = {
      taskId,
      type: 'GENESIS_REGISTRY_APPLICATION',
      timestamp: new Date().toISOString(),
      data: {
        name: applicationData.name,
        handle: applicationData.handle,
        role: applicationData.role,
        public_persona: applicationData.public_persona,
        artist_wallet: applicationData.artist_wallet,
        agentId,
        
        // Optional fields
        tagline: applicationData.tagline,
        system_instructions: applicationData.system_instructions,
        memory_context: applicationData.memory_context,
        schedule: applicationData.schedule,
        medium: applicationData.medium,
        daily_goal: applicationData.daily_goal,
        practice_actions: applicationData.practice_actions,
        technical_details: applicationData.technical_details,
        social_revenue: applicationData.social_revenue,
        lore_origin: applicationData.lore_origin,
        additional_fields: applicationData.additional_fields
      }
    };

    // Publish to RabbitMQ
    console.log('📤 Publishing task to RabbitMQ...');
    console.log('📋 Task object created, calling publishGenesisRegistryTask...');
    
    try {
      const published = await publishGenesisRegistryTask(rabbitMQTask);
      console.log('📤 publishGenesisRegistryTask returned:', published);
      
      if (!published) {
        console.error('❌ RabbitMQ publishing failed - returned false');
        throw new Error('Failed to publish task to RabbitMQ');
      }
      
      console.log('✅ RabbitMQ publishing successful');
    } catch (publishError) {
      console.error('💥 Exception during RabbitMQ publishing:', publishError);
      throw publishError;
    }

    console.log(`✅ Application successfully published to RabbitMQ: ${taskId}`);
    console.log(`🆔 Agent ID: ${agentId}`);
    console.log(`🎯 Queue: ${process.env.RABBITMQ_QUEUE_NAME || 'applications'}`);

  } catch (error) {
    console.error(`❌ Application processing failed for task ${taskId}:`, error);
    console.error('📊 Full error details:', {
      name: (error as any)?.name,
      message: (error as any)?.message,
      stack: (error as any)?.stack?.split('\n').slice(0, 5)
    });
    throw error;
  }
}

// Helper function to run processing in background (fire-and-forget)
export function processApplicationAsync(taskId: string, applicationData: ApplicationData): void {
  console.log(`🔄 Starting async processing for task: ${taskId}`);
  
  // Run in background without blocking
  processApplication(taskId, applicationData)
    .then(() => {
      console.log(`✅ Async processing completed for task: ${taskId}`);
    })
    .catch(error => {
      console.error(`💥 Background processing failed for task ${taskId}:`, error);
      console.error('📊 Full error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      // Error is already logged to Redis via TaskManager.setTaskError
    });
}