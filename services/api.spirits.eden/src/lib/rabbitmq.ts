import amqp, { Connection, ConfirmChannel } from 'amqplib';
import { once } from 'events';
import { randomUUID } from 'crypto';

let connection: Connection | null = null;
let channel: ConfirmChannel | null = null;

export interface GenesisRegistryTask {
  taskId: string;
  type: 'GENESIS_REGISTRY_APPLICATION';
  timestamp: string;
  data: {
    // Application data
    name: string;
    handle: string;
    role: string;
    public_persona: string;
    artist_wallet: string;
    
    // Generated IDs
    agentId: string;
    
    // Optional fields
    tagline?: string;
    system_instructions?: string;
    memory_context?: string;
    schedule?: string;
    medium?: string;
    daily_goal?: string;
    practice_actions?: string[];
    technical_details?: Record<string, any>;
    social_revenue?: Record<string, any>;
    lore_origin?: Record<string, any>;
    additional_fields?: Record<string, any>;
  };
}

const RABBITMQ_URL = process.env.RABBITMQ_URL!;
const QUEUE_NAME = process.env.RABBITMQ_QUEUE_NAME || 'applications';

/**
 * Initialize RabbitMQ connection with Vercel best practices
 */
async function initRabbitMQ(): Promise<ConfirmChannel> {
  if (channel) {
    console.log('♻️  Reusing existing RabbitMQ channel');
    return channel;
  }

  if (!RABBITMQ_URL) {
    throw new Error('RABBITMQ_URL environment variable is required');
  }

  console.log('🐰 Initializing RabbitMQ connection...');
  console.log('🔗 URL (masked):', RABBITMQ_URL.replace(/\/\/.*@/, '//***:***@'));
  
  try {
    // Connect with heartbeat and timeout settings
    console.log('⏳ Attempting amqp.connect...');
    
    const connectPromise = amqp.connect(RABBITMQ_URL, {
      heartbeat: 15, // Keepalive
      timeout: 2_000, // Very short connection timeout for serverless
      clientProperties: { product: 'vercel-genesis-registry' },
    });
    
    // Add manual timeout wrapper - shorter timeout for serverless
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout after 3 seconds')), 3000)
    );
    
    connection = await Promise.race([connectPromise, timeoutPromise]) as any;
    console.log('✅ Connected to RabbitMQ successfully');

    // Handle connection events
    connection.on('error', (err) => {
      console.error('❌ RabbitMQ connection error:', err);
    });
    
    connection.on('close', () => {
      console.log('🔌 RabbitMQ connection closed - nulling globals');
      channel = null;
      connection = null;
    });

    // Create confirm channel for delivery guarantees
    channel = await connection.createConfirmChannel();
    
    // Ensure queue exists with durability
    await channel.assertQueue(QUEUE_NAME, { 
      durable: true // Queue survives broker restarts
    });
    
    console.log(`✅ RabbitMQ initialized - Queue: ${QUEUE_NAME}`);
    return channel;
    
  } catch (error) {
    console.error('❌ Failed to initialize RabbitMQ:', error);
    console.error('🔍 Connection error details:', {
      name: (error as any)?.name,
      message: (error as any)?.message,
      code: (error as any)?.code,
      errno: (error as any)?.errno,
      syscall: (error as any)?.syscall,
      address: (error as any)?.address,
      port: (error as any)?.port
    });
    
    // Clean up on failure
    channel = null;
    connection = null;
    throw error;
  }
}

/**
 * Publish a Genesis Registry application task to RabbitMQ
 */
/**
 * Fallback: Simple HTTP webhook for local development/testing
 */
async function publishViaWebhook(task: GenesisRegistryTask): Promise<boolean> {
  try {
    console.log('🔄 Trying webhook fallback...');
    
    // You can set this to your local consumer endpoint for testing
    const webhookUrl = process.env.WEBHOOK_FALLBACK_URL;
    if (!webhookUrl) {
      console.log('🚨 RABBITMQ FAILED - NO WEBHOOK CONFIGURED - LOGGING TASK TO CONSOLE:');
      console.log('=' .repeat(80));
      console.log('📋 TASK TO PROCESS:', JSON.stringify(task, null, 2));
      console.log('=' .repeat(80));
      console.log('✅ Task logged to console since RabbitMQ connection failed');
      return true;
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    
    if (response.ok) {
      console.log('✅ Published via webhook fallback');
      return true;
    } else {
      console.error('❌ Webhook fallback failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Webhook fallback error:', error);
    return false;
  }
}

export async function publishGenesisRegistryTask(task: GenesisRegistryTask): Promise<boolean> {
  // TEMPORARY DEBUG: Force webhook fallback to test in production
  if (process.env.VERCEL_ENV) {
    console.log('🚨 TEMPORARY: Forcing webhook fallback for Vercel deployment debugging');
    return await publishViaWebhook(task);
  }
  
  try {
    console.log('📤 Publishing Genesis Registry task:', task.taskId);
    
    // Try RabbitMQ with aggressive timeout for serverless
    console.log('⚠️  Using 4 second total timeout for serverless RabbitMQ');
    
    const rabbitPromise = (async () => {
      // Get or create channel
      const ch = await initRabbitMQ();
      return ch;
    })();
    
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Overall RabbitMQ timeout after 4 seconds')), 4000)
    );
    
    const ch = await Promise.race([rabbitPromise, timeoutPromise]) as any;
    
    // Add unique message ID for idempotency
    const messageId = task.taskId || randomUUID();
    const message = JSON.stringify(task);
    
    console.log(`📝 Publishing to queue: ${QUEUE_NAME}`);
    console.log(`📏 Message size: ${message.length} characters`);
    console.log(`🆔 Message ID: ${messageId}`);
    
    // Publish with persistence and metadata
    const published = ch.sendToQueue(
      QUEUE_NAME, 
      Buffer.from(message), 
      {
        persistent: true, // Message survives broker restart
        contentType: 'application/json',
        messageId,
        timestamp: Date.now(),
        headers: {
          taskType: task.type,
          agentName: task.data.name,
          source: 'genesis-registry-api'
        }
      }
    );
    
    // Handle backpressure
    if (!published) {
      console.log('⏳ Handling backpressure - waiting for drain...');
      await once(ch as any, 'drain');
      console.log('✅ Drain completed');
    }
    
    // Wait for broker acknowledgment (confirm channel) with timeout
    console.log('⏳ Waiting for broker confirmation...');
    const confirmPromise = ch.waitForConfirms();
    const confirmTimeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Confirmation timeout after 2 seconds')), 2000)
    );
    
    await Promise.race([confirmPromise, confirmTimeoutPromise]);
    
    console.log(`✅ Successfully published and confirmed: ${messageId}`);
    console.log(`📋 Agent: ${task.data.name} (${task.data.handle})`);
    console.log(`🎯 Queue: ${QUEUE_NAME}`);
    
    return true;
    
  } catch (error) {
    console.error('💥 Failed to publish to RabbitMQ:', error);
    console.error('📊 Error details:', {
      name: (error as any)?.name,
      message: (error as any)?.message,
      code: (error as any)?.code
    });
    
    // Try webhook fallback
    console.log('🔄 Attempting webhook fallback...');
    return await publishViaWebhook(task);
  }
}

/**
 * Gracefully close RabbitMQ connection
 */
export async function closeRabbitMQ(): Promise<void> {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    
    if (connection) {
      await connection.close();
      connection = null;
    }
    
    console.log('🔌 RabbitMQ connection closed gracefully');
  } catch (error) {
    console.error('❌ Error closing RabbitMQ connection:', error);
  }
}

/**
 * Get connection status
 */
export function getRabbitMQStatus(): {
  connected: boolean;
  channelReady: boolean;
} {
  return {
    connected: connection !== null && !(connection as any)?.connection?.destroyed,
    channelReady: channel !== null
  };
}