import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  PORT: z.coerce.number().default(3000),
  
  RPC_URL: z.string().url('WebSocket RPC URL is required'),
  RPC_HTTP_URL: z.string().url('HTTP RPC URL is required'),
  CHAIN_ID: z.coerce.number().default(1),
  
  CONTRACT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address format'),
  CONTRACT_START_BLOCK: z.coerce.number().optional(),
  
  WEBHOOK_URL: z.string().url('Webhook URL is required'),
  WEBHOOK_SECRET: z.string().min(1, 'Webhook secret is required'),
  CACHE_API_URL: z.string().url().optional(),
  
  WS_PING_INTERVAL: z.coerce.number().default(30000),
  WS_PONG_TIMEOUT: z.coerce.number().default(5000),
  WS_RECONNECT_DELAY: z.coerce.number().default(5000),
  WS_MAX_RECONNECT_ATTEMPTS: z.coerce.number().default(10),
  
  WEBHOOK_MAX_RETRIES: z.coerce.number().default(3),
  WEBHOOK_RETRY_DELAY: z.coerce.number().default(1000),
  WEBHOOK_TIMEOUT: z.coerce.number().default(10000),
  
  INITIAL_SYNC_ENABLED: z.coerce.boolean().default(true),
  INITIAL_SYNC_BLOCK_RANGE: z.coerce.number().default(499),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error('Environment validation failed:');
  if (error instanceof z.ZodError) {
    error.errors.forEach((err) => {
      console.error(`  ${err.path.join('.')}: ${err.message}`);
    });
  }
  process.exit(1);
}

export default env;