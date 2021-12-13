import Redis from 'ioredis';
import Redlock, { Lock } from 'redlock';
import Cache, { State } from './Cache';

export default class RedisCache implements Cache {
  private client;
  private redLock: Redlock;
  private lock: Record<string, Lock>;
  constructor(host: string, port: number, password?: string) {
    this.client = new Redis(port, host, {
      password,
    });
    this.redLock = new Redlock([this.client], {
      retryCount: 120,

      // the time in ms between attempts
      retryDelay: 1000,
    });
    this.lock = {};
  }

  private generateKey(plate: string) {
    return `plate:${plate}`;
  }

  public async manageLock(plate: string, op: 'acquire' | 'release') {
    const key = `lock:${plate}`;

    if (this.lock[key] && op === 'release') {
      await this.lock[key].release();
    } else if (op === 'acquire') {
      const lock = await this.redLock.acquire([key], 5000);
      this.lock[key] = lock;
    }
  }

  public async getPrice(plate: string) {
    try {
      const key = this.generateKey(plate);
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : undefined;
    } finally {
    }
  }

  public async setPrice(plate: string, state: State, price?: number) {
    try {
      const key = this.generateKey(plate);
      const value = JSON.stringify({
        plate,
        state,
        price,
      });
      await this.client.set(key, value);
    } finally {
    }
  }

  public async clear() {
    await this.client.flushall();
  }

  public async close() {
    await this.client.quit();
  }
}
