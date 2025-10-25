/**
 * Redis客户端配置和缓存管理
 */

import Redis from 'ioredis';
import { logger } from './logger';

// Redis配置接口
interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  lazyConnect: boolean;
}

// 缓存键前缀
export const CACHE_KEYS = {
  USER_SESSION: 'session:',
  USER_STATS: 'user:stats:',
  FORUM_POSTS: 'forum:posts:',
  FORUM_POST: 'forum:post:',
  ONLINE_USERS: 'online:users',
  LOGIN_ATTEMPTS: 'login:attempts:',
  RATE_LIMIT: 'rate:limit:',
  FORUM_CATEGORIES: 'forum:categories',
  USER_PROFILE: 'user:profile:',
  MONITORING_EVENTS: 'monitoring:events',
  MONITORING_STATS: 'monitoring:stats',
} as const;

// 缓存过期时间（秒）
export const CACHE_TTL = {
  SESSION: 24 * 60 * 60, // 24小时
  USER_STATS: 5 * 60, // 5分钟
  FORUM_POSTS: 2 * 60, // 2分钟
  FORUM_POST: 10 * 60, // 10分钟
  ONLINE_USERS: 30, // 30秒
  LOGIN_ATTEMPTS: 15 * 60, // 15分钟
  RATE_LIMIT: 60, // 1分钟
  FORUM_CATEGORIES: 30 * 60, // 30分钟
  USER_PROFILE: 15 * 60, // 15分钟
} as const;

class RedisClient {
  private client: Redis | null = null;
  private isConnected = false;
  private isInitialized = false;

  constructor() {
    // 延迟初始化，避免在模块加载时立即连接
  }

  private initializeClient(): void {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    
    const config: RedisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 0, // 不重试，避免阻塞
      lazyConnect: true
    };

    try {
      this.client = new Redis(config);
      this.setupEventHandlers();
      logger.info('Redis客户端初始化成功（延迟连接模式）');
    } catch (error) {
      logger.warn('Redis客户端初始化失败，将使用降级模式:', error);
      this.client = null;
    }
  }

  /**
   * 自动连接Redis（非阻塞）
   */
  private async autoConnect(): Promise<void> {
    try {
      // 延迟一点时间再连接，避免阻塞应用启动
      setTimeout(async () => {
        try {
          // 检查连接状态，避免重复连接
          if (!this.isConnected && this.client && this.client.status !== 'connecting' && this.client.status !== 'ready') {
            await this.client.connect();
          }
        } catch (error) {
          // 如果是已经连接的错误，忽略它
          if (error instanceof Error && error.message.includes('already connecting/connected')) {
            logger.debug('Redis已经连接或正在连接中');
          } else {
            logger.warn('Redis自动连接失败，将在后续操作时重试:', error);
          }
        }
      }, 100);
    } catch (error) {
      logger.warn('Redis自动连接初始化失败:', error);
    }
  }

  private setupEventHandlers(): void {
    if (!this.client) return;
    
    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis连接成功');
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      logger.warn('Redis连接错误，应用将继续运行但缓存功能不可用:', error);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      logger.warn('Redis连接已关闭');
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis正在重连...');
    });
  }

  /**
   * 连接到Redis
   */
  async connect(): Promise<void> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }
    try {
      await this.client.connect();
    } catch (error) {
      logger.error('Redis连接失败:', error);
      throw error;
    }
  }

  /**
   * 断开Redis连接
   */
  async disconnect(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.disconnect();
      this.isConnected = false;
    } catch (error) {
      logger.error('Redis断开连接失败:', error);
    }
  }

  /**
   * 检查连接状态
   */
  isReady(): boolean {
    if (!this.isInitialized) {
      this.initializeClient();
    }
    return !!(this.client && this.isConnected && this.client.status === 'ready');
  }

  /**
   * 设置缓存
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        this.initializeClient();
      }
      
      if (!this.isReady() || !this.client) {
        logger.warn('Redis未连接，跳过缓存设置');
        return false;
      }

      const serializedValue = JSON.stringify(value);
      
      if (ttl) {
        await this.client.setex(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      
      return true;
    } catch (error) {
      logger.error('Redis设置缓存失败:', error);
      return false;
    }
  }

  /**
   * 获取缓存
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      if (!this.isInitialized) {
        this.initializeClient();
      }
      
      if (!this.isReady() || !this.client) {
        logger.warn('Redis未连接，跳过缓存获取');
        return null;
      }

      const value = await this.client.get(key);
      
      if (value === null) {
        return null;
      }
      
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Redis获取缓存失败:', error);
      return null;
    }
  }

  /**
   * 删除缓存
   */
  async del(key: string | string[]): Promise<boolean> {
    try {
      if (!this.client || !this.isReady()) {
        logger.warn('Redis未连接，跳过缓存删除');
        return false;
      }

      if (Array.isArray(key)) {
        if (key.length > 0) {
          await this.client.del(...key);
        }
      } else {
        await this.client.del(key);
      }
      return true;
    } catch (error) {
      logger.error('Redis删除缓存失败:', error);
      return false;
    }
  }

  /**
   * 检查键是否存在
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.client || !this.isReady()) {
        return false;
      }
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis检查键存在失败:', error);
      return false;
    }
  }

  /**
   * 设置键的过期时间
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      if (!this.client || !this.isReady()) {
        return false;
      }
      const result = await this.client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      logger.error('Redis设置过期时间失败:', error);
      return false;
    }
  }

  /**
   * 增加计数器
   */
  async incr(key: string): Promise<number> {
    try {
      if (!this.client || !this.isReady()) {
        return 0;
      }
      return await this.client.incr(key);
    } catch (error) {
      logger.error('Redis增加计数器失败:', error);
      return 0;
    }
  }

  /**
   * 减少计数器
   */
  async decr(key: string): Promise<number> {
    try {
      if (!this.client || !this.isReady()) {
        return 0;
      }
      return await this.client.decr(key);
    } catch (error) {
      logger.error('Redis减少计数器失败:', error);
      return 0;
    }
  }

  /**
   * 获取匹配模式的键列表
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      if (!this.client || !this.isReady()) {
        return [];
      }
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error('Redis获取键列表失败:', error);
      return [];
    }
  }

  /**
   * 清除匹配模式的所有缓存
   */
  async clearPattern(pattern: string): Promise<boolean> {
    try {
      if (!this.client || !this.isReady()) {
        return false;
      }
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error('Redis清空模式缓存失败:', error);
      return false;
    }
  }

  /**
   * 获取哈希表所有字段
   */
  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      if (!this.client || !this.isReady()) {
        return {};
      }
      return await this.client.hgetall(key);
    } catch (error) {
      logger.error('Redis hgetall失败:', error);
      return {};
    }
  }

  /**
   * 增加哈希表字段值
   */
  async hincrby(key: string, field: string, increment: number): Promise<number> {
    try {
      if (!this.client || !this.isReady()) {
        return 0;
      }
      return await this.client.hincrby(key, field, increment);
    } catch (error) {
      logger.error('Redis hincrby失败:', error);
      return 0;
    }
  }

  /**
   * 向列表左侧推入元素
   */
  async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      if (!this.client || !this.isReady()) {
        return 0;
      }
      return await this.client.lpush(key, ...values);
    } catch (error) {
      logger.error('Redis lpush失败:', error);
      return 0;
    }
  }

  /**
   * 获取列表指定范围的元素
   */
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      if (!this.client || !this.isReady()) {
        return [];
      }
      return await this.client.lrange(key, start, stop);
    } catch (error) {
      logger.error('Redis lrange失败:', error);
      return [];
    }
  }

  /**
   * 修剪列表，只保留指定范围的元素
   */
  async ltrim(key: string, start: number, stop: number): Promise<boolean> {
    try {
      if (!this.client || !this.isReady()) {
        return false;
      }
      await this.client.ltrim(key, start, stop);
      return true;
    } catch (error) {
      logger.error('Redis ltrim失败:', error);
      return false;
    }
  }

  /**
   * 设置键值并指定过期时间（秒）
   */
  async setex(key: string, seconds: number, value: string): Promise<boolean> {
    try {
      if (!this.client || !this.isReady()) {
        return false;
      }
      await this.client.setex(key, seconds, value);
      return true;
    } catch (error) {
      logger.error('Redis setex失败:', error);
      return false;
    }
  }

  /**
   * 获取原始Redis客户端（用于高级操作）
   */
  getClient(): Redis | null {
    if (!this.isInitialized) {
      this.initializeClient();
    }
    return this.client;
  }
}

// 创建Redis客户端实例
export const redis = new RedisClient();

// 缓存工具函数
export class CacheManager {
  /**
   * 带缓存的数据获取
   */
  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = CACHE_TTL.FORUM_POSTS
  ): Promise<T> {
    try {
      // 尝试从缓存获取
      const cached = await redis.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // 缓存未命中，获取数据
      const data = await fetcher();
      
      // 设置缓存
      await redis.set(key, data, ttl);
      
      return data;
    } catch (error) {
      logger.error('缓存获取或设置失败:', error);
      // 缓存失败时直接返回数据
      return await fetcher();
    }
  }

  /**
   * 清除用户相关缓存
   */
  static async clearUserCache(userId: string): Promise<void> {
    try {
      await Promise.all([
        redis.del(`${CACHE_KEYS.USER_SESSION}${userId}`),
        redis.del(`${CACHE_KEYS.USER_STATS}${userId}`),
        redis.del(`${CACHE_KEYS.USER_PROFILE}${userId}`),
        redis.clearPattern(`${CACHE_KEYS.FORUM_POSTS}*`), // 清除论坛帖子缓存
      ]);
    } catch (error) {
      logger.error('清除用户缓存失败:', error);
    }
  }

  /**
   * 清除论坛相关缓存
   */
  static async clearForumCache(): Promise<void> {
    try {
      await Promise.all([
        redis.clearPattern(`${CACHE_KEYS.FORUM_POSTS}*`),
        redis.clearPattern(`${CACHE_KEYS.FORUM_POST}*`),
        redis.del(CACHE_KEYS.FORUM_CATEGORIES),
      ]);
    } catch (error) {
      logger.error('清除论坛缓存失败:', error);
    }
  }
}

export default redis;