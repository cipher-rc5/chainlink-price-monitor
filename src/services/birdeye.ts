// file: src/services/birdeye.ts
// description: Birdeye WebSocket client for real-time OHLC price monitoring
// reference: Birdeye WebSocket API specification

import type { BirdeyeMessage, BirdeyePriceData } from '@/types/index.ts';
import WebSocket from 'ws';

export class BirdeyeService {
  private ws: WebSocket | null = null;
  private readonly ws_url: string;
  private price_callbacks: Map<string, (price: BirdeyePriceData) => void>;
  private reconnect_attempts = 0;
  private readonly max_reconnect_attempts = 5;
  private readonly reconnect_delay_ms = 5000;

  constructor (ws_url?: string) {
    this.ws_url = ws_url ?? process.env.BIRDEYE_WS_URL ?? 'wss://public-api.birdeye.so/socket';
    this.price_callbacks = new Map();
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.ws_url);

        this.ws.on('open', () => {
          console.log('Birdeye WebSocket connected');
          this.reconnect_attempts = 0;
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          this.handle_message(data);
        });

        this.ws.on('error', (error: Error) => {
          console.error('Birdeye WebSocket error:', error);
          reject(error);
        });

        this.ws.on('close', () => {
          console.log('Birdeye WebSocket disconnected');
          this.attempt_reconnect();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private attempt_reconnect(): void {
    if (this.reconnect_attempts >= this.max_reconnect_attempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnect_attempts++;
    console.log(`Attempting to reconnect (${this.reconnect_attempts}/${this.max_reconnect_attempts})...`);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, this.reconnect_delay_ms);
  }

  private handle_message(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString()) as BirdeyeMessage;

      if (message.type === 'PRICE_DATA') {
        const price_data: BirdeyePriceData = {
          address: message.data.address,
          value: message.data.value,
          timestamp: message.data.timestamp,
          chart_type: '1m'
        };

        const callback = this.price_callbacks.get(price_data.address);
        if (callback) {
          callback(price_data);
        }
      }
    } catch (error) {
      console.error('Failed to parse Birdeye message:', error);
    }
  }

  subscribe_price(token_addresses: string[], callback: (price: BirdeyePriceData) => void): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    for (const address of token_addresses) {
      this.price_callbacks.set(address, callback);
    }

    const query_parts = token_addresses.map((addr) => `(address = ${addr} AND chartType = 1m AND currency = usd)`);
    const query = query_parts.join(' OR ');

    const subscription_message: BirdeyeMessage = { type: 'SUBSCRIBE_PRICE', data: { queryType: 'complex', query } };

    this.ws.send(JSON.stringify(subscription_message));
    console.log('Subscribed to Birdeye price feeds');
  }

  unsubscribe_price(token_address: string): void {
    this.price_callbacks.delete(token_address);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.price_callbacks.clear();
  }

  is_connected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
