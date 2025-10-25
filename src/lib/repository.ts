/**
 * Repository模式实现
 * 提供数据访问层的抽象，分离业务逻辑和数据访问逻辑
 */

import { api, ApiResponse } from './api';
import { errorHandler } from './errorHandler';
import { loadingManager, LoadingType } from './loadingManager';

/**
 * 查询参数接口
 */
export interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
}

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Repository配置接口
 */
export interface RepositoryConfig {
  enableCache: boolean;
  cacheTimeout: number;
  enableLoading: boolean;
  enableErrorHandling: boolean;
  retryCount: number;
}

/**
 * 缓存项接口
 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

/**
 * 基础Repository抽象类
 */
export abstract class BaseRepository<T, ID = string> {
  protected endpoint: string;
  protected config: RepositoryConfig;
  private cache: Map<string, CacheItem<unknown>> = new Map();

  constructor(endpoint: string, config: Partial<RepositoryConfig> = {}) {
    this.endpoint = endpoint;
    this.config = {
      enableCache: true,
      cacheTimeout: 5 * 60 * 1000, // 5分钟
      enableLoading: true,
      enableErrorHandling: true,
      retryCount: 3,
      ...config
    };
  }

  /**
   * 获取所有记录
   */
  async findAll(params?: QueryParams): Promise<PaginatedResponse<T>> {
    const cacheKey = `${this.endpoint}_findAll_${JSON.stringify(params || {})}`;
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        const response = await api.get<PaginatedResponse<T>>(this.endpoint, { params });
        return response.data || {
          data: [],
          total: 0,
          page: 1,
          limit: 10,
          hasMore: false
        };
      },
      'findAll'
    );
  }

  /**
   * 根据ID获取单个记录
   */
  async findById(id: ID): Promise<T | null> {
    const cacheKey = `${this.endpoint}_findById_${id}`;
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        try {
          const response = await api.get<T>(`${this.endpoint}/${id}`);
          return response.data || null;
        } catch (error) {
          return null;
        }
      },
      'findById'
    );
  }

  /**
   * 创建新记录
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    return this.executeWithLoading(
      async () => {
        const response = await api.post<T>(this.endpoint, data);
        if (!response.data) {
          throw new Error('创建失败');
        }
        
        // 清除相关缓存
        this.clearRelatedCache();
        
        return response.data;
      },
      'create'
    );
  }

  /**
   * 更新记录
   */
  async update(id: ID, data: Partial<T>): Promise<T | null> {
    return this.executeWithLoading(
      async () => {
        try {
          const response = await api.put<T>(`${this.endpoint}/${id}`, data);
          
          // 清除相关缓存
          this.clearRelatedCache();
          this.clearCache(`${this.endpoint}_findById_${id}`);
          
          return response.data || null;
        } catch (error) {
          return null;
        }
      },
      'update'
    );
  }

  /**
   * 删除记录
   */
  async delete(id: ID): Promise<boolean> {
    return this.executeWithLoading(
      async () => {
        try {
          await api.delete(`${this.endpoint}/${id}`);
          
          // 清除相关缓存
          this.clearRelatedCache();
          this.clearCache(`${this.endpoint}_findById_${id}`);
          
          return true;
        } catch (error) {
          return false;
        }
      },
      'delete'
    );
  }

  /**
   * 搜索记录
   */
  async search(query: string, params?: QueryParams): Promise<PaginatedResponse<T>> {
    const searchParams = { ...params, search: query };
    const cacheKey = `${this.endpoint}_search_${JSON.stringify(searchParams)}`;
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        const response = await api.get<PaginatedResponse<T>>(`${this.endpoint}/search`, {
          params: searchParams
        });
        return response.data || {
          data: [],
          total: 0,
          page: 1,
          limit: 10,
          hasMore: false
        };
      },
      'search'
    );
  }

  /**
   * 批量操作
   */
  async bulkCreate(items: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T[]> {
    return this.executeWithLoading(
      async () => {
        const response = await api.post<T[]>(`${this.endpoint}/bulk`, { items });
        
        // 清除相关缓存
        this.clearRelatedCache();
        
        return response.data || [];
      },
      'bulkCreate'
    );
  }

  /**
   * 批量更新
   */
  async bulkUpdate(updates: Array<{ id: ID; data: Partial<T> }>): Promise<T[]> {
    return this.executeWithLoading(
      async () => {
        const response = await api.put<T[]>(`${this.endpoint}/bulk`, { updates });
        
        // 清除相关缓存
        this.clearRelatedCache();
        updates.forEach(update => {
          this.clearCache(`${this.endpoint}_findById_${update.id}`);
        });
        
        return response.data || [];
      },
      'bulkUpdate'
    );
  }

  /**
   * 批量删除
   */
  async bulkDelete(ids: ID[]): Promise<boolean> {
    return this.executeWithLoading(
      async () => {
        try {
          await api.delete(`${this.endpoint}/bulk`, { data: { ids } });
          
          // 清除相关缓存
          this.clearRelatedCache();
          ids.forEach(id => {
            this.clearCache(`${this.endpoint}_findById_${id}`);
          });
          
          return true;
        } catch (error) {
          return false;
        }
      },
      'bulkDelete'
    );
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<Record<string, number>> {
    const cacheKey = `${this.endpoint}_stats`;
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        const response = await api.get<Record<string, number>>(`${this.endpoint}/stats`);
        return response.data || {};
      },
      'getStats',
      60000 // 1分钟缓存
    );
  }

  /**
   * 带缓存执行
   */
  protected async executeWithCache<R>(
    cacheKey: string,
    operation: () => Promise<R>,
    operationName: string,
    customTimeout?: number
  ): Promise<R> {
    // 检查缓存
    if (this.config.enableCache) {
      const cached = this.getFromCache<R>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    // 执行操作
    const result = await this.executeWithLoading(operation, operationName);
    
    // 存储到缓存
    if (this.config.enableCache) {
      this.setCache(cacheKey, result, customTimeout);
    }
    
    return result;
  }

  /**
   * 带Loading执行
   */
  protected async executeWithLoading<R>(
    operation: () => Promise<R>,
    operationName: string
  ): Promise<R> {
    const loadingId = `${this.endpoint}_${operationName}_${Date.now()}`;
    
    try {
      if (this.config.enableLoading) {
        loadingManager.start(loadingId, LoadingType.API, {
          message: `${operationName}...`,
          context: {
            component: this.constructor.name,
            action: operationName
          }
        });
      }

      const result = await operation();
      return result;
    } catch (error) {
      if (this.config.enableErrorHandling) {
        errorHandler.handleError(error);
      }
      throw error;
    } finally {
      if (this.config.enableLoading) {
        loadingManager.stop(loadingId);
      }
    }
  }

  /**
   * 从缓存获取数据
   */
  private getFromCache<R>(key: string): R | null {
    const item = this.cache.get(key) as CacheItem<R> | undefined;
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  /**
   * 设置缓存
   */
  private setCache<R>(key: string, data: R, customTimeout?: number): void {
    const timeout = customTimeout || this.config.cacheTimeout;
    const item: CacheItem<R> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + timeout
    };
    
    this.cache.set(key, item);
  }

  /**
   * 清除特定缓存
   */
  protected clearCache(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清除相关缓存
   */
  protected clearRelatedCache(): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${this.endpoint}_findAll`) || 
          key.startsWith(`${this.endpoint}_search`) ||
          key.startsWith(`${this.endpoint}_stats`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * 清除所有缓存
   */
  clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<RepositoryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取配置
   */
  getConfig(): RepositoryConfig {
    return { ...this.config };
  }
}

/**
 * Repository工厂
 */
export class RepositoryFactory {
  private static repositories: Map<string, BaseRepository<unknown>> = new Map();

  /**
   * 创建或获取Repository实例
   */
  static create<T, ID = string>(
    endpoint: string,
    repositoryClass: new (endpoint: string, config?: Partial<RepositoryConfig>) => BaseRepository<T, ID>,
    config?: Partial<RepositoryConfig>
  ): BaseRepository<T, ID> {
    const key = `${endpoint}_${repositoryClass.name}`;
    
    if (!this.repositories.has(key)) {
      const repository = new repositoryClass(endpoint, config);
      this.repositories.set(key, repository as BaseRepository<unknown>);
    }
    
    return this.repositories.get(key) as BaseRepository<T, ID>;
  }

  /**
   * 清除所有Repository缓存
   */
  static clearAllCaches(): void {
    this.repositories.forEach(repository => {
      repository.clearAllCache();
    });
  }

  /**
   * 获取所有Repository实例
   */
  static getAllRepositories(): BaseRepository<unknown>[] {
    return Array.from(this.repositories.values());
  }
}

export default BaseRepository;