/**
 * 统一的API客户端配置
 * 提供axios实例、请求拦截器、响应拦截器和错误处理
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * API响应数据结构
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: number;
}

/**
 * API错误类型
 */
export interface ApiError {
  message: string;
  code?: number;
  status?: number;
  details?: unknown;
}

/**
 * 请求配置扩展
 */
export interface RequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  skipErrorHandler?: boolean;
  retryCount?: number;
}

/**
 * API客户端类
 */
class ApiClient {
  private instance: AxiosInstance;
  private baseURL: string;
  private timeout: number;
  private retryCount: number;
  private retryDelay: number;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || '/api';
    this.timeout = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000');
    this.retryCount = parseInt(process.env.NEXT_PUBLIC_API_RETRY_COUNT || '3');
    this.retryDelay = parseInt(process.env.NEXT_PUBLIC_API_RETRY_DELAY || '1000');

    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * 设置请求和响应拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const requestConfig = config as RequestConfig;
        // 添加认证token
        if (!requestConfig.skipAuth) {
          const token = this.getAuthToken();
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        // 添加请求ID用于追踪
        if (config.headers) {
          config.headers['X-Request-ID'] = this.generateRequestId();
        }

        // 记录请求日志
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          data: config.data,
        });

        return config;
      },
      (error: unknown) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // 记录响应日志
        console.log(`[API Response] ${response.status} ${response.config.url}`, {
          data: response.data,
        });

        return response;
      },
      async (error: AxiosError) => {
        const config = error.config as RequestConfig;
        
        // 记录错误日志
        console.error('[API Response Error]', {
          status: error.response?.status,
          message: error.message,
          url: config?.url,
          data: error.response?.data,
        });

        // 处理认证错误
        if (error.response?.status === 401) {
          this.handleAuthError();
        }

        // 重试机制
        if (this.shouldRetry(error, config)) {
          return this.retryRequest(config);
        }

        // 统一错误处理
        if (!config?.skipErrorHandler) {
          this.handleError(error);
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  /**
   * 获取认证token
   */
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      // 优先使用auth_token，这是AuthContext中保存的令牌
      return localStorage.getItem('auth_token') || localStorage.getItem('token') || sessionStorage.getItem('auth_token');
    }
    return null;
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 处理认证错误
   */
  private handleAuthError(): void {
    // 清除本地存储的token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      
      // 重定向到登录页面
      window.location.href = '/auth/login';
    }
  }

  /**
   * 判断是否应该重试
   */
  private shouldRetry(error: AxiosError, config?: RequestConfig): boolean {
    if (!config || config.retryCount === 0) return false;
    
    // 只对网络错误和5xx错误重试
    const status = error.response?.status;
    return !status || status >= 500;
  }

  /**
   * 重试请求
   */
  private async retryRequest(config: RequestConfig): Promise<AxiosResponse> {
    const retryCount = (config.retryCount || this.retryCount) - 1;
    
    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
    
    const retryConfig: RequestConfig = {
      ...config,
      retryCount,
    };
    
    return this.instance.request(retryConfig);
  }

  /**
   * 统一错误处理
   */
  private handleError(error: AxiosError): void {
    const message = this.getErrorMessage(error);
    
    // 这里可以集成toast通知或其他错误提示机制
    console.error('[API Error]', message);
    
    // 可以触发全局错误事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api-error', {
        detail: { error, message }
      }));
    }
  }

  /**
   * 获取错误消息
   */
  private getErrorMessage(error: AxiosError): string {
    if (error.response?.data) {
      const data = error.response.data as ApiResponse;
      return data.message || data.error || '请求失败';
    }
    
    if (error.code === 'NETWORK_ERROR') {
      return '网络连接失败，请检查网络设置';
    }
    
    if (error.code === 'TIMEOUT') {
      return '请求超时，请稍后重试';
    }
    
    return error.message || '未知错误';
  }

  /**
   * 格式化错误对象
   */
  private formatError(error: AxiosError): ApiError {
    return {
      message: this.getErrorMessage(error),
      code: error.response?.status,
      status: error.response?.status,
      details: error.response?.data,
    };
  }

  /**
   * GET请求
   */
  async get<T = unknown>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  /**
   * POST请求
   */
  async post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * PUT请求
   */
  async put<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * PATCH请求
   */
  async patch<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * DELETE请求
   */
  async delete<T = unknown>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  /**
   * 上传文件
   */
  async upload<T = unknown>(url: string, file: File, config?: RequestConfig): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await this.instance.post<ApiResponse<T>>(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
    
    return response.data;
  }

  /**
   * 设置认证token
   */
  setAuthToken(token: string, persistent = false): void {
    if (typeof window !== 'undefined') {
      if (persistent) {
        localStorage.setItem('auth_token', token);
      } else {
        sessionStorage.setItem('auth_token', token);
      }
    }
  }

  /**
   * 清除认证token
   */
  clearAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
    }
  }

  /**
   * 获取axios实例（用于特殊需求）
   */
  getInstance(): AxiosInstance {
    return this.instance;
  }
}

// 创建全局API客户端实例
export const apiClient = new ApiClient();

// 导出便捷方法
export const api = {
  get: <T = unknown>(url: string, config?: RequestConfig) => apiClient.get<T>(url, config),
  post: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) => apiClient.post<T>(url, data, config),
  put: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) => apiClient.put<T>(url, data, config),
  patch: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) => apiClient.patch<T>(url, data, config),
  delete: <T = unknown>(url: string, config?: RequestConfig) => apiClient.delete<T>(url, config),
  upload: <T = unknown>(url: string, file: File, config?: RequestConfig) => apiClient.upload<T>(url, file, config),
  setAuthToken: (token: string, persistent?: boolean) => apiClient.setAuthToken(token, persistent),
  clearAuthToken: () => apiClient.clearAuthToken(),
};

export default apiClient;