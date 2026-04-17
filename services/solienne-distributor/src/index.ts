import { config } from './config/env';
import { logger } from './config/logger';
import { EventListener } from './services/EventListener';
import { Distributor } from './services/Distributor';
import { DistributionTracker } from './services/DistributionTracker';
import { RetryManager } from './services/RetryManager';
import { ethers } from 'ethers';

class SolienneDistributor {
  private eventListener: EventListener;
  private distributor: Distributor;
  private tracker: DistributionTracker;
  private isShuttingDown = false;

  constructor() {
    this.eventListener = new EventListener();
    this.distributor = new Distributor();
    this.tracker = new DistributionTracker(config.redisUrl);
  }

  public async start(): Promise<void> {
    try {
      logger.info({
        environment: config.nodeEnv,
        chainId: config.chainId,
        v2ContractAddress: config.minterContractAddress,
        v1ContractAddress: config.subscribersAddressV1 || 'Not configured',
        msg: 'Starting Solienne Distributor',
      });

      // Validate wallet has balance
      await this.validateSetup();

      // Check if distribution needed on startup (backup for missed distributions)
      await this.checkStartupDistribution();

      // Register event handler
      this.eventListener.onSaleConfigured(async (event) => {
        await this.handleSaleConfigured(event);
      });

      // Start listening for events
      await this.eventListener.start();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      logger.info('Solienne Distributor is running and listening for events...');
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        msg: 'Failed to start Solienne Distributor',
      });
      process.exit(1);
    }
  }

  private async validateSetup(): Promise<void> {
    try {
      // Check wallet balance
      const balance = await this.distributor.getBalance();
      const balanceEth = ethers.formatEther(balance);

      logger.info({
        balance: balanceEth,
        msg: 'Wallet balance checked',
      });

      if (balance === 0n) {
        logger.warn('Wallet balance is 0. Please fund the wallet to pay for gas fees.');
      }

      // Check gas price
      const gasPrice = await this.distributor.getGasPrice();
      const gasPriceGwei = ethers.formatUnits(gasPrice, 'gwei');

      logger.info({
        gasPrice: gasPriceGwei,
        msg: 'Current gas price (Gwei)',
      });
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        msg: 'Setup validation failed',
      });
      throw error;
    }
  }

  /**
   * Catch up on any missed manifesto distributions on startup.
   * Seeds Redis with already-distributed IDs (1 through LAST_DISTRIBUTED_MANIFESTO_ID),
   * then iterates all manifesto IDs across contracts and distributes any that are missing.
   */
  private async checkStartupDistribution(): Promise<void> {
    try {
      logger.info('Starting startup catch-up distribution check...');

      // Seed Redis with already-distributed manifesto IDs (first deploy only)
      await this.tracker.seedDistributed(BigInt(config.lastDistributedManifestoId));

      // Get all manifesto IDs across all contracts
      const allManifestoIds = await this.distributor.getAllManifestoIds();

      if (allManifestoIds.length === 0) {
        logger.warn('No manifesto IDs found across any contracts');
        return;
      }

      // Find undistributed manifestos
      const undistributed: bigint[] = [];
      for (const manifestoId of allManifestoIds) {
        const alreadyDistributed = await this.tracker.isDistributed(manifestoId);
        if (!alreadyDistributed) {
          undistributed.push(manifestoId);
        }
      }

      if (undistributed.length === 0) {
        logger.info({
          totalManifestos: allManifestoIds.length,
          msg: 'All manifestos already distributed, nothing to catch up',
        });
        return;
      }

      logger.info({
        totalManifestos: allManifestoIds.length,
        undistributedCount: undistributed.length,
        undistributedIds: undistributed.map((id) => id.toString()),
        msg: 'Found undistributed manifestos, starting catch-up',
      });

      // Distribute each undistributed manifesto sequentially
      for (let idx = 0; idx < undistributed.length; idx++) {
        const manifestoId = undistributed[idx];

        logger.info({
          manifestoId: manifestoId.toString(),
          progress: `${idx + 1} of ${undistributed.length}`,
          msg: 'Distributing missed manifesto',
        });

        try {
          const result = await RetryManager.retry(
            async () => {
              return await this.distributor.distribute(manifestoId);
            },
            {
              maxRetries: config.maxRetries,
              delayMs: config.retryDelayMs,
              onRetry: (attempt, error) => {
                logger.warn({
                  manifestoId: manifestoId.toString(),
                  attempt,
                  error: error.message,
                  msg: 'Retrying catch-up distribution',
                });
              },
            }
          );

          if (result.success) {
            await this.tracker.markDistributed(manifestoId);
            await this.tracker.markDistributedToday(manifestoId);

            logger.info({
              manifestoId: manifestoId.toString(),
              transactionHash: result.transactionHash,
              gasUsed: result.gasUsed?.toString(),
              progress: `${idx + 1} of ${undistributed.length}`,
              msg: 'Catch-up distribution completed',
            });
          } else {
            logger.error({
              manifestoId: manifestoId.toString(),
              error: result.error,
              msg: 'Catch-up distribution failed',
            });
          }
        } catch (error) {
          logger.error({
            error: error instanceof Error ? error.message : String(error),
            manifestoId: manifestoId.toString(),
            msg: 'Catch-up distribution failed after all retries',
          });
        }
      }

      logger.info({
        undistributedCount: undistributed.length,
        msg: 'Startup catch-up distribution complete',
      });
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        msg: 'Error during startup catch-up distribution',
      });
      // Don't throw - continue with normal operation even if catch-up fails
    }
  }

  private async handleSaleConfigured(event: any): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('Shutdown in progress, ignoring new events');
      return;
    }

    const manifestoId = event.manifestoId;

    logger.info({
      manifestoId: manifestoId.toString(),
      saleId: event.saleId.toString(),
      msg: 'Processing SaleConfigured event',
    });

    try {
      // Use retry logic for distribution
      const result = await RetryManager.retry(
        async () => {
          return await this.distributor.distribute(manifestoId);
        },
        {
          maxRetries: config.maxRetries,
          delayMs: config.retryDelayMs,
          onRetry: (attempt, error) => {
            logger.warn({
              manifestoId: manifestoId.toString(),
              attempt,
              error: error.message,
              msg: 'Retrying distribution',
            });
          },
        }
      );

      if (result.success) {
        // Mark as distributed in Redis (both persistent set and daily key)
        await this.tracker.markDistributed(manifestoId);
        await this.tracker.markDistributedToday(manifestoId);

        logger.info({
          manifestoId: manifestoId.toString(),
          transactionHash: result.transactionHash,
          gasUsed: result.gasUsed?.toString(),
          msg: 'Distribution completed successfully',
        });
      } else {
        logger.warn({
          manifestoId: manifestoId.toString(),
          error: result.error,
          msg: '⚠️  Distribution skipped or failed',
        });
      }
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        manifestoId: manifestoId.toString(),
        msg: '❌ Distribution failed after all retries',
      });
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) {
        return;
      }

      this.isShuttingDown = true;

      logger.info({
        signal,
        msg: 'Received shutdown signal, gracefully shutting down...',
      });

      // Stop listening for new events
      this.eventListener.stop();

      // Close Redis connection
      await this.tracker.close();

      // Give time for pending operations to complete
      await new Promise((resolve) => setTimeout(resolve, 2000));

      logger.info('Shutdown complete');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error({
        error: error.message,
        stack: error.stack,
        msg: 'Uncaught exception',
      });
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      logger.error({
        reason: String(reason),
        msg: 'Unhandled promise rejection',
      });
      shutdown('unhandledRejection');
    });
  }
}

// Start the application
const app = new SolienneDistributor();
app.start();
