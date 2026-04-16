import axios, { AxiosResponse } from 'axios';
import crypto from 'crypto';
import env from '../config/env';
import logger from '../utils/logger';

export interface WebhookPayload {
  event: string;
  contractAddress: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  data: any;
  timestamp: number;
}

export class WebhookService {
  private async createSignature(payload: string): Promise<string> {
    return crypto
      .createHmac('sha256', env.WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private sanitizePayload(payload: any): any {
    // Deep clone and convert BigInt to string
    return JSON.parse(JSON.stringify(payload, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
  }

  public async sendWebhook(payload: WebhookPayload, customUrl?: string, retryCount = 0): Promise<void> {
    // Convert BigInt values to strings before serialization
    const sanitizedPayload = this.sanitizePayload(payload);
    const payloadString = JSON.stringify(sanitizedPayload);
    const signature = await this.createSignature(payloadString);
    const webhookUrl = customUrl || env.WEBHOOK_URL;

    try {
      const response: AxiosResponse = await axios.post(webhookUrl, sanitizedPayload, {
        timeout: env.WEBHOOK_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
          'X-Signature-256': `sha256=${signature}`,
          'User-Agent': 'contract-listener/1.0.0'
        },
      });

      if (response.status >= 200 && response.status < 300) {
        logger.info({ 
          event: payload.event, 
          blockNumber: payload.blockNumber,
          status: response.status,
          retryCount 
        }, 'Webhook sent successfully');
        return;
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error: any) {
      const isLastAttempt = retryCount >= env.WEBHOOK_MAX_RETRIES;
      
      logger.error({ 
        error: error.message,
        event: payload.event,
        blockNumber: payload.blockNumber,
        retryCount,
        isLastAttempt
      }, 'Webhook failed');

      if (!isLastAttempt) {
        const delay = env.WEBHOOK_RETRY_DELAY * Math.pow(2, retryCount);
        logger.info({ delay, retryCount: retryCount + 1 }, 'Retrying webhook');
        
        await this.sleep(delay);
        return this.sendWebhook(payload, customUrl, retryCount + 1);
      }

      throw new Error(`Webhook failed after ${env.WEBHOOK_MAX_RETRIES + 1} attempts: ${error.message}`);
    }
  }

  public async sendBatchWebhooks(payloads: WebhookPayload[]): Promise<void> {
    logger.info({ count: payloads.length }, 'Sending batch webhooks');
    
    const promises = payloads.map(payload => 
      this.sendWebhook(payload).catch(error => {
        logger.error({ 
          error: error.message,
          event: payload.event,
          blockNumber: payload.blockNumber 
        }, 'Batch webhook item failed');
        return null;
      })
    );

    await Promise.allSettled(promises);
  }
}