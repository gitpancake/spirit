import WebSocket from 'ws';
import { EventEmitter } from 'events';
import env from '../config/env';
import logger from '../utils/logger';

export interface WebSocketManagerEvents {
  'connected': () => void;
  'disconnected': () => void;
  'message': (data: any) => void;
  'error': (error: Error) => void;
}

export class WebSocketManager extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private pongTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private shouldReconnect = true;

  constructor(private readonly url: string) {
    super();
    this.connect();
  }

  private connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    logger.info({ url: this.url, attempt: this.reconnectAttempts + 1 }, 'Connecting to WebSocket');

    try {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
    } catch (error) {
      logger.error({ error }, 'Failed to create WebSocket connection');
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.on('open', () => {
      logger.info('WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.startPing();
      this.emit('connected');
    });

    this.ws.on('close', (code, reason) => {
      logger.warn({ code, reason: reason.toString() }, 'WebSocket disconnected');
      this.cleanup();
      this.emit('disconnected');
      
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    });

    this.ws.on('error', (error) => {
      logger.error({ error }, 'WebSocket error');
      this.emit('error', error);
    });

    this.ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        this.emit('message', parsed);
      } catch (error) {
        logger.error({ error, data: data.toString() }, 'Failed to parse WebSocket message');
      }
    });

    this.ws.on('pong', () => {
      if (this.pongTimer) {
        clearTimeout(this.pongTimer);
        this.pongTimer = null;
      }
    });
  }

  private startPing(): void {
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
        
        this.pongTimer = setTimeout(() => {
          logger.warn('Pong timeout - closing connection');
          this.ws?.terminate();
        }, env.WS_PONG_TIMEOUT);
      }
    }, env.WS_PING_INTERVAL);
  }

  private cleanup(): void {
    this.isConnecting = false;
    
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || !this.shouldReconnect) return;

    if (this.reconnectAttempts >= env.WS_MAX_RECONNECT_ATTEMPTS) {
      logger.error('Max reconnection attempts reached');
      this.emit('error', new Error('Max reconnection attempts reached'));
      return;
    }

    const delay = Math.min(env.WS_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    logger.info({ delay, attempt: this.reconnectAttempts }, 'Scheduling reconnection');

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  public send(data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'));
        return;
      }

      this.ws.send(JSON.stringify(data), (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  public close(): void {
    this.shouldReconnect = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.cleanup();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}