import Redis from 'ioredis';
import { createLogger } from '../config/logger';

const logger = createLogger('DistributionTracker');

export class DistributionTracker {
  private redis: Redis;
  private static readonly DISTRIBUTED_SET_KEY = 'distributed:manifesto_ids';

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);

    this.redis.on('connect', () => {
      logger.info('Connected to Redis for distribution tracking');
    });

    this.redis.on('error', (error) => {
      logger.error({
        error: error.message,
        msg: 'Redis connection error',
      });
    });
  }

  /**
   * Seed the persistent set with manifesto IDs 1 through upTo (inclusive)
   * Only seeds if the set is currently empty (first deploy)
   */
  public async seedDistributed(upTo: bigint): Promise<void> {
    try {
      const size = await this.redis.scard(DistributionTracker.DISTRIBUTED_SET_KEY);
      if (size > 0) {
        logger.info({
          existingCount: size,
          msg: 'Persistent distribution set already populated, skipping seed',
        });
        return;
      }

      const members: string[] = [];
      for (let i = 1n; i <= upTo; i++) {
        members.push(i.toString());
      }

      if (members.length > 0) {
        await this.redis.sadd(DistributionTracker.DISTRIBUTED_SET_KEY, ...members);
      }

      logger.info({
        seededCount: members.length,
        upTo: upTo.toString(),
        msg: 'Seeded persistent distribution set with already-distributed manifesto IDs',
      });
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        msg: 'Error seeding persistent distribution set',
      });
    }
  }

  /**
   * Check if a manifesto has been distributed (persistent, no TTL)
   */
  public async isDistributed(manifestoId: bigint): Promise<boolean> {
    try {
      const result = await this.redis.sismember(
        DistributionTracker.DISTRIBUTED_SET_KEY,
        manifestoId.toString()
      );
      return result === 1;
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        manifestoId: manifestoId.toString(),
        msg: 'Error checking persistent distribution set',
      });
      // Return false on error to allow distribution to proceed
      return false;
    }
  }

  /**
   * Mark a manifesto as distributed (persistent, no TTL)
   */
  public async markDistributed(manifestoId: bigint): Promise<void> {
    try {
      await this.redis.sadd(DistributionTracker.DISTRIBUTED_SET_KEY, manifestoId.toString());
      logger.info({
        manifestoId: manifestoId.toString(),
        msg: 'Marked manifesto as distributed in persistent set',
      });
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        manifestoId: manifestoId.toString(),
        msg: 'Error marking manifesto in persistent set',
      });
    }
  }

  /**
   * Check if a distribution happened today
   * @returns manifestoId if distributed today, null if not
   */
  public async getDistributionForToday(): Promise<bigint | null> {
    try {
      const today = this.getTodayKey();
      const value = await this.redis.get(today);

      if (value === null) {
        logger.debug({ date: today, msg: 'No distribution found for today' });
        return null;
      }

      const manifestoId = BigInt(value);
      logger.debug({
        date: today,
        manifestoId: manifestoId.toString(),
        msg: 'Distribution found for today',
      });

      return manifestoId;
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        msg: 'Error checking distribution for today',
      });
      // Return null on error to allow distribution to proceed
      return null;
    }
  }

  /**
   * Mark that a distribution happened today for a specific manifestoId
   */
  public async markDistributedToday(manifestoId: bigint): Promise<void> {
    try {
      const today = this.getTodayKey();

      // Store for 48 hours (in case of timezone issues, we keep 2 days)
      await this.redis.setex(today, 48 * 60 * 60, manifestoId.toString());

      logger.info({
        date: today,
        manifestoId: manifestoId.toString(),
        msg: 'Marked distribution as completed for today',
      });
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        manifestoId: manifestoId.toString(),
        msg: 'Error marking distribution in Redis',
      });
      // Don't throw - distribution succeeded, just tracking failed
    }
  }

  /**
   * Get Redis key for today's date (UTC)
   * Format: distribution:YYYY-MM-DD
   */
  private getTodayKey(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');

    return `distribution:${year}-${month}-${day}`;
  }

  /**
   * Close Redis connection (for graceful shutdown)
   */
  public async close(): Promise<void> {
    try {
      await this.redis.quit();
      logger.info('Closed Redis connection');
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        msg: 'Error closing Redis connection',
      });
    }
  }
}
