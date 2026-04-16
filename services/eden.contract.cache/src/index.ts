import express from 'express';
import { AgentRegistryListener } from './services/agent-registry-listener';
import { AgentRegistrySyncService } from './services/agent-registry-sync';
import env from './config/env';
import logger from './utils/logger';

class AgentRegistryApplication {
  private listener: AgentRegistryListener;
  private syncService: AgentRegistrySyncService;
  private app: express.Application;
  private isShuttingDown = false;

  constructor() {
    this.listener = new AgentRegistryListener();
    this.syncService = new AgentRegistrySyncService();
    this.app = express();
    this.setupExpress();
    this.setupGracefulShutdown();
  }

  private setupExpress(): void {
    this.app.use(express.json());
    
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      res.json({
        status: 'healthy',
        uptime: Math.round(uptime),
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024),
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024)
        },
        listener: {
          listening: this.listener.listening,
          contractAddress: env.CONTRACT_ADDRESS,
          chainId: env.CHAIN_ID
        },
        sync: {
          lastSyncedBlock: this.syncService.getLastSyncedBlock().toString()
        },
        timestamp: new Date().toISOString()
      });
    });

    // Status endpoint
    this.app.get('/status', async (req, res) => {
      try {
        const latestBlock = await this.listener.getLatestBlock();
        res.json({
          contractAddress: env.CONTRACT_ADDRESS,
          chainId: env.CHAIN_ID,
          latestBlock: latestBlock.toString(),
          lastSyncedBlock: this.syncService.getLastSyncedBlock().toString(),
          listening: this.listener.listening,
          webhookUrl: env.WEBHOOK_URL
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to get status' });
      }
    });

    // Manual sync endpoint (for testing)
    this.app.post('/sync', async (req, res) => {
      try {
        const { fromBlock, toBlock } = req.body;
        
        if (!fromBlock || !toBlock) {
          return res.status(400).json({ error: 'fromBlock and toBlock are required' });
        }

        logger.info({ fromBlock, toBlock }, 'Manual sync requested');
        
        const logs = await this.listener.getHistoricalLogs(
          BigInt(fromBlock),
          BigInt(toBlock)
        );

        res.json({
          message: 'Sync completed',
          logsProcessed: logs.length,
          fromBlock,
          toBlock
        });
      } catch (error) {
        logger.error({ error }, 'Manual sync failed');
        res.status(500).json({ error: 'Sync failed' });
      }
    });
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string): Promise<void> => {
      if (this.isShuttingDown) {
        logger.warn('Force shutdown initiated');
        process.exit(1);
      }

      this.isShuttingDown = true;
      logger.info({ signal }, 'Graceful shutdown initiated');

      try {
        if (this.listener.listening) {
          await this.listener.stopListening();
        }

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error({ error }, 'Error during graceful shutdown');
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    process.on('uncaughtException', (error) => {
      logger.error({ error }, 'Uncaught exception');
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error({ reason, promise }, 'Unhandled promise rejection');
      gracefulShutdown('unhandledRejection');
    });
  }

  public async start(): Promise<void> {
    logger.info({
      nodeEnv: env.NODE_ENV,
      contractAddress: env.CONTRACT_ADDRESS,
      webhookUrl: env.WEBHOOK_URL,
      chainId: env.CHAIN_ID,
      rpcUrl: env.RPC_URL,
      httpRpcUrl: env.RPC_HTTP_URL
    }, 'Starting AgentRegistry listener application');

    try {
      // Start Express server
      this.app.listen(env.PORT, () => {
        logger.info({ port: env.PORT }, 'HTTP server started');
      });

      // Perform initial sync if enabled
      if (env.INITIAL_SYNC_ENABLED) {
        logger.info('Performing initial sync...');
        await this.syncService.performInitialSync();
        logger.info('Initial sync completed');
      }

      // Start real-time event listening
      logger.info('Starting real-time event listening...');
      await this.listener.startListening();

      logger.info('AgentRegistry listener is now running');
      
      // Start health monitoring in non-production
      if (env.NODE_ENV !== 'production') {
        this.startHealthMonitoring();
      }

    } catch (error: any) {
      logger.error({ 
        error: error.message || error,
        stack: error.stack,
        details: error.details 
      }, 'Failed to start application');
      throw error;
    }
  }

  private startHealthMonitoring(): void {
    setInterval(async () => {
      try {
        const memUsage = process.memoryUsage();
        const uptime = process.uptime();
        const latestBlock = await this.listener.getLatestBlock();
        
        logger.debug({
          uptime: Math.round(uptime),
          memory: {
            rss: Math.round(memUsage.rss / 1024 / 1024),
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024)
          },
          listening: this.listener.listening,
          latestBlock: latestBlock.toString(),
          lastSyncedBlock: this.syncService.getLastSyncedBlock().toString()
        }, 'Health check');
      } catch (error) {
        logger.error({ error }, 'Health check failed');
      }
    }, 60000); // Every minute
  }
}

async function bootstrap(): Promise<void> {
  try {
    const app = new AgentRegistryApplication();
    await app.start();
    
  } catch (error: any) {
    logger.error({ 
      error: error.message || error,
      stack: error.stack,
      details: error.details 
    }, 'Application bootstrap failed');
    process.exit(1);
  }
}

if (require.main === module) {
  bootstrap();
}

export default AgentRegistryApplication;