/**
 * 数据访问层服务
 * 提供统一的数据访问接口，使用本地模拟数据
 */

// Mock data removed - using real API

/**
 * 数据访问配置
 */
export interface DataServiceConfig {
  networkDelay?: number;
}

/**
 * 默认配置
 */
const defaultConfig: DataServiceConfig = {
  networkDelay: 200
};

/**
 * 数据访问层基类
 */
export class DataService {
  private config: DataServiceConfig;

  constructor(config: Partial<DataServiceConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * 获取配置
   */
  getConfig(): DataServiceConfig {
    return this.config;
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<DataServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 模拟网络延迟
   */
  protected async simulateNetworkDelay(): Promise<void> {
    const ms = this.config.networkDelay || 200;
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  // Mock data methods removed



  /**
   * 统一的数据获取方法
   */
  protected async fetchData<T>(endpoint: string, options?: RequestInit): Promise<T> {
    await this.simulateNetworkDelay();
    
    try {
      // 获取认证token
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      // 合并默认选项和传入的选项
      const defaultOptions: RequestInit = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      };

      const finalOptions: RequestInit = {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options?.headers
        }
      };

      // 实现真实的API调用
      const response = await fetch(endpoint, finalOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // 如果响应包含success字段，检查是否成功
      if (data.hasOwnProperty('success') && !data.success) {
        throw new Error(data.message || 'API调用失败');
      }

      // 返回数据部分或整个响应
      return data.data || data;
    } catch (error) {
      console.error(`API调用失败 [${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * 统一的数据提交方法
   */
  protected async submitData<T, R>(
    data: T,
    mockHandler: (data: T) => Promise<R>
  ): Promise<R> {
    await this.simulateNetworkDelay();
    return mockHandler(data);
  }

  /**
   * 统一的数据更新方法
   */
  protected async updateData<T, R>(
    id: string,
    data: T,
    mockHandler: (id: string, data: T) => Promise<R>
  ): Promise<R> {
    await this.simulateNetworkDelay();
    return mockHandler(id, data);
  }

  /**
   * 统一的数据删除方法
   */
  protected async deleteData<R>(
    id: string,
    mockHandler: (id: string) => Promise<R>
  ): Promise<R> {
    await this.simulateNetworkDelay();
    return mockHandler(id);
  }
}

/**
 * 全局数据服务实例
 */
export const dataService = new DataService();

/**
 * 数据服务工厂函数
 */
export function createDataService(config?: Partial<DataServiceConfig>): DataService {
  return new DataService(config);
}

/**
 * 获取当前数据源类型
 */
export function getCurrentDataSource(): 'mock' {
  return 'mock';
}

/**
 * 数据服务状态
 */
export interface DataServiceStatus {
  dataSource: 'mock';
  isOnline: boolean;
}

/**
 * 获取数据服务状态
 */
export async function getDataServiceStatus(): Promise<DataServiceStatus> {
  return {
    dataSource: 'mock',
    isOnline: true
  };
}