import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {
    const redisConfig = this.configService.get('redis');
    this.client = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password || undefined,
      db: redisConfig.db || 0,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });

    this.client.connect().then(() => {
      this.logger.log('Redis connected successfully.');
    }).catch((err) => {
      this.logger.error(`Redis connection failed: ${err.message}`, err.stack);
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`, err.stack);
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, seconds?: number): Promise<'OK' | null> {
    if (seconds) {
      return await this.client.set(key, value, 'EX', seconds);
    }
    return await this.client.set(key, value);
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return await this.client.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
