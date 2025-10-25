/**
 * 服务层统一导出文件
 * 提供所有服务的统一入口
 */

// 核心数据服务
export * from './dataService';

// 业务服务
export * from './authService';
export * from './userProfileService';
export * from './forumService';
export * from './messageService';
export * from './friendsService';


// 服务实例
export { dataService } from './dataService';
export { authService } from './authService';
export { userProfileService } from './userProfileService';
export { forumService } from './forumService';
export { messageService } from './messageService';
export { friendsService } from './friendsService';


// 工具函数
export {
  getCurrentDataSource,
  getDataServiceStatus
} from './dataService';

/**
 * 服务配置类型
 */
export interface ServiceConfig {
  networkDelay?: number;
}

/**
 * 全局服务配置
 */
const globalServiceConfig: ServiceConfig = {
  networkDelay: parseInt(process.env.NEXT_PUBLIC_MOCK_DELAY || '200')
};

/**
 * 获取全局服务配置
 */
export function getGlobalServiceConfig(): ServiceConfig {
  return { ...globalServiceConfig };
}

/**
 * 更新全局服务配置
 */
export function updateGlobalServiceConfig(config: Partial<ServiceConfig>): void {
  Object.assign(globalServiceConfig, config);
}

/**
 * 初始化所有服务
 */
export async function initializeServices(config?: Partial<ServiceConfig>): Promise<void> {
  if (config) {
    updateGlobalServiceConfig(config);
  }

  // 更新各个服务的配置
  const serviceConfig = getGlobalServiceConfig();
  
  // 更新数据服务配置
  const { dataService } = await import('./dataService');
  dataService.updateConfig({
    networkDelay: serviceConfig.networkDelay
  });

  // 更新其他服务配置
  const { authService } = await import('./authService');
  const { userProfileService } = await import('./userProfileService');
  const { forumService } = await import('./forumService');
  const { messageService } = await import('./messageService');
  const { friendsService } = await import('./friendsService');
  
  
  // Services are now using real API endpoints instead of mock data
  // No configuration update needed

  console.log('Services initialized with API config:', serviceConfig);
  console.log('Loaded services:', {
    authService: !!authService,
    userProfileService: !!userProfileService,
    forumService: !!forumService,
    messageService: !!messageService,
    friendsService: !!friendsService,

  });
}

/**
 * 服务健康检查
 */
export async function checkServicesHealth(): Promise<{
  dataService: boolean;
  authService: boolean;
  forumService: boolean;
  messageService: boolean;
  friendsService: boolean;

}> {
  const health = {
    dataService: true,
    authService: true,
    forumService: true,
    messageService: true,
    friendsService: true,

  };
  
  try {
    // 检查数据服务状态
    const { getDataServiceStatus } = await import('./dataService');
    const status = await getDataServiceStatus();
    health.dataService = status.isOnline;
  } catch {
    health.dataService = false;
  }
  
  return health;
}

/**
 * 服务统计信息
 */
export interface ServiceStats {
  totalUsers: number;
  totalPosts: number;
  totalMessages: number;
  onlineUsers: number;
}

/**
 * 获取服务统计信息
 */
export async function getServiceStats(): Promise<ServiceStats> {
  try {
    // 实现真实的API统计数据获取
    const response = await fetch('/api/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });

    if (!response.ok) {
      throw new Error('获取统计数据失败');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || '获取统计数据失败');
    }

    return data.data.stats;
  } catch (error) {
    console.error('获取服务统计失败:', error);
    // 返回默认值
    return {
      totalUsers: 0,
      totalPosts: 0,
      totalMessages: 0,
      onlineUsers: 0
    };
  }
}

/**
 * 重置所有服务数据（仅在开发环境使用）
 */
export async function resetAllServiceData(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Reset operation is only allowed in development environment');
  }
  
  try {
    // 实现真实的数据重置功能
    const response = await fetch('/api/reset-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });

    if (!response.ok) {
      throw new Error('重置数据失败');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || '重置数据失败');
    }

    console.log('数据重置成功');
  } catch (error) {
    console.error('重置服务数据失败:', error);
    throw error;
  }
}

/**
 * 导出服务数据（用于备份或迁移）
 */
export async function exportServiceData(): Promise<Record<string, unknown>> {
  try {
    // 实现真实的数据导出功能
    const response = await fetch('/api/export-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });

    if (!response.ok) {
      throw new Error('导出数据失败');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || '导出数据失败');
    }

    return data.data.exportData || {};
  } catch (error) {
    console.error('导出服务数据失败:', error);
    throw error;
  }
}

/**
 * 服务错误处理
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public service: string,
    public operation: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * 创建服务错误
 */
export function createServiceError(
  message: string,
  service: string,
  operation: string,
  originalError?: Error
): ServiceError {
  return new ServiceError(message, service, operation, originalError);
}

/**
 * 服务日志记录
 */
export function logServiceOperation(
  service: string,
  operation: string,
  success: boolean,
  duration?: number,
  error?: Error
): void {
  const logData = {
    service,
    operation,
    success,
    duration,
    timestamp: new Date().toISOString(),
    error: error?.message
  };
  
  if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
    console.log('Service Operation:', logData);
  }
}

/**
 * 服务性能监控装饰器
 */
export function withPerformanceMonitoring<T extends (...args: unknown[]) => Promise<unknown>>(
  serviceName: string,
  operationName: string,
  fn: T
): T {
  return (async (...args: unknown[]) => {
    const startTime = Date.now();
    let success = false;
    let error: Error | undefined;
    
    try {
      const result = await fn(...args);
      success = true;
      return result;
    } catch (err) {
      error = err as Error;
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      logServiceOperation(serviceName, operationName, success, duration, error);
    }
  }) as T;
}

/**
 * 服务重试装饰器
 */
export function withRetry<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  maxRetries: number = 3,
  delay: number = 1000
): T {
  return (async (...args: unknown[]) => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    
    throw lastError!;
  }) as T;
}

/**
 * 服务缓存装饰器
 */
const serviceCache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

export function withCache<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  ttl: number = 5 * 60 * 1000, // 默认5分钟
  keyGenerator?: (...args: unknown[]) => string
): T {
  return (async (...args: unknown[]) => {
    const cacheKey = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    const cached = serviceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    
    const result = await fn(...args);
    serviceCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
      ttl
    });
    
    return result;
  }) as T;
}

/**
 * 清除服务缓存
 */
export function clearServiceCache(pattern?: string): void {
  if (pattern) {
    const regex = new RegExp(pattern);
    for (const key of serviceCache.keys()) {
      if (regex.test(key)) {
        serviceCache.delete(key);
      }
    }
  } else {
    serviceCache.clear();
  }
}

// 默认初始化服务
if (typeof window !== 'undefined') {
  // 仅在客户端初始化
  initializeServices().catch(console.error);
}