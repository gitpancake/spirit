import { createLogger } from '../config/logger';
import { config } from '../config/env';

const logger = createLogger('RetryManager');

export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Retry manager with exponential backoff
 */
export class RetryManager {
  /**
   * Execute a function with retry logic
   */
  public static async retry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = config.maxRetries,
      delayMs = config.retryDelayMs,
      backoffMultiplier = 2,
      onRetry,
    } = options;

    let lastError: Error;
    let currentDelay = delayMs;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === maxRetries) {
          logger.error({
            attempt: attempt + 1,
            maxRetries: maxRetries + 1,
            error: lastError.message,
            msg: 'All retry attempts exhausted',
          });
          throw lastError;
        }

        logger.warn({
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          error: lastError.message,
          nextRetryDelayMs: currentDelay,
          msg: 'Retry attempt failed, waiting before next attempt',
        });

        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }

        // Wait before retrying
        await this.delay(currentDelay);

        // Exponential backoff
        currentDelay *= backoffMultiplier;
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError!;
  }

  /**
   * Delay execution for specified milliseconds
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
