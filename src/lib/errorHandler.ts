/**
 * 统一错误处理系统
 * 提供全局错误处理、错误分类、错误恢复和用户友好的错误提示
 */

import { ApiError } from './api';

/**
 * 错误类型枚举
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

/**
 * 错误严重程度
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * 应用错误接口
 */
export interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: unknown;
  timestamp: Date;
  context?: {
    component?: string;
    action?: string;
    userId?: string;
    url?: string;
  };
  recoverable: boolean;
  retryable: boolean;
  userMessage: string;
}

/**
 * 错误处理配置
 */
export interface ErrorHandlerConfig {
  enableLogging: boolean;
  enableReporting: boolean;
  enableToast: boolean;
  maxRetries: number;
  retryDelay: number;
  reportingEndpoint?: string;
}

/**
 * 错误恢复策略
 */
export interface RecoveryStrategy {
  type: 'retry' | 'redirect' | 'refresh' | 'fallback' | 'ignore';
  params?: {
    url?: string;
    maxRetries?: number;
    delay?: number;
    fallbackData?: unknown;
  };
}

/**
 * 错误处理器类
 */
class ErrorHandler {
  private config: ErrorHandlerConfig;
  private errorQueue: AppError[] = [];
  private retryCount: Map<string, number> = new Map();
  private listeners: Set<(error: AppError) => void> = new Set();

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      enableLogging: true,
      enableReporting: true,
      enableToast: true,
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };

    this.setupGlobalErrorHandlers();
  }

  /**
   * 设置全局错误处理器
   */
  private setupGlobalErrorHandlers(): void {
    // 处理未捕获的Promise错误
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(this.createErrorFromRejection(event.reason));
      });

      // 处理JavaScript运行时错误
      window.addEventListener('error', (event) => {
        this.handleError(this.createErrorFromEvent(event));
      });

      // 处理API错误事件
      window.addEventListener('api-error', (event: Event) => {
        const customEvent = event as CustomEvent;
        this.handleApiError(customEvent.detail.error);
      });
    }
  }

  /**
   * 处理错误
   */
  handleError(error: AppError | Error | unknown): void {
    const appError = this.normalizeError(error);
    
    // 记录错误
    if (this.config.enableLogging) {
      this.logError(appError);
    }

    // 添加到错误队列
    this.errorQueue.push(appError);

    // 通知监听器
    this.notifyListeners(appError);

    // 显示用户提示
    if (this.config.enableToast && appError.severity !== ErrorSeverity.LOW) {
      this.showErrorToast(appError);
    }

    // 错误上报
    if (this.config.enableReporting && appError.severity === ErrorSeverity.CRITICAL) {
      this.reportError(appError);
    }

    // 尝试恢复
    this.attemptRecovery(appError);
  }

  /**
   * 处理API错误
   */
  handleApiError(apiError: ApiError): void {
    const appError = this.createErrorFromApiError(apiError);
    this.handleError(appError);
  }

  /**
   * 标准化错误对象
   */
  private normalizeError(error: unknown): AppError {
    if (this.isAppError(error)) {
      return error;
    }

    if (error instanceof Error) {
      return this.createErrorFromError(error);
    }

    return this.createErrorFromUnknown(error);
  }

  /**
   * 检查是否为应用错误
   */
  private isAppError(error: unknown): error is AppError {
    return typeof error === 'object' && error !== null && 'id' in error && 'type' in error;
  }

  /**
   * 从Error对象创建应用错误
   */
  private createErrorFromError(error: Error): AppError {
    return {
      id: this.generateErrorId(),
      type: this.classifyError(error),
      severity: ErrorSeverity.MEDIUM,
      message: error.message,
      details: {
        name: error.name,
        stack: error.stack
      },
      timestamp: new Date(),
      recoverable: true,
      retryable: false,
      userMessage: this.getUserFriendlyMessage(error.message)
    };
  }

  /**
   * 从API错误创建应用错误
   */
  private createErrorFromApiError(apiError: ApiError): AppError {
    return {
      id: this.generateErrorId(),
      type: this.classifyApiError(apiError),
      severity: this.getSeverityFromStatus(apiError.status),
      message: apiError.message,
      details: apiError.details,
      timestamp: new Date(),
      recoverable: true,
      retryable: this.isRetryableStatus(apiError.status),
      userMessage: this.getUserFriendlyMessage(apiError.message)
    };
  }

  /**
   * 从Promise rejection创建错误
   */
  private createErrorFromRejection(reason: unknown): AppError {
    return {
      id: this.generateErrorId(),
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      message: String(reason),
      details: reason,
      timestamp: new Date(),
      recoverable: true,
      retryable: false,
      userMessage: '操作失败，请稍后重试'
    };
  }

  /**
   * 从错误事件创建错误
   */
  private createErrorFromEvent(event: ErrorEvent): AppError {
    return {
      id: this.generateErrorId(),
      type: ErrorType.CLIENT,
      severity: ErrorSeverity.HIGH,
      message: event.message,
      details: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      },
      timestamp: new Date(),
      recoverable: false,
      retryable: false,
      userMessage: '页面出现错误，请刷新页面重试'
    };
  }

  /**
   * 从未知错误创建应用错误
   */
  private createErrorFromUnknown(error: unknown): AppError {
    return {
      id: this.generateErrorId(),
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.LOW,
      message: String(error),
      details: error,
      timestamp: new Date(),
      recoverable: true,
      retryable: false,
      userMessage: '发生未知错误'
    };
  }

  /**
   * 错误分类
   */
  private classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK;
    }
    
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return ErrorType.AUTHENTICATION;
    }
    
    if (message.includes('forbidden') || message.includes('permission')) {
      return ErrorType.AUTHORIZATION;
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }
    
    return ErrorType.CLIENT;
  }

  /**
   * API错误分类
   */
  private classifyApiError(apiError: ApiError): ErrorType {
    const status = apiError.status;
    
    if (!status) {
      return ErrorType.NETWORK;
    }
    
    if (status === 401) {
      return ErrorType.AUTHENTICATION;
    }
    
    if (status === 403) {
      return ErrorType.AUTHORIZATION;
    }
    
    if (status >= 400 && status < 500) {
      return ErrorType.VALIDATION;
    }
    
    if (status >= 500) {
      return ErrorType.SERVER;
    }
    
    return ErrorType.UNKNOWN;
  }

  /**
   * 根据状态码获取严重程度
   */
  private getSeverityFromStatus(status?: number): ErrorSeverity {
    if (!status) {
      return ErrorSeverity.MEDIUM;
    }
    
    if (status >= 500) {
      return ErrorSeverity.HIGH;
    }
    
    if (status === 401 || status === 403) {
      return ErrorSeverity.MEDIUM;
    }
    
    return ErrorSeverity.LOW;
  }

  /**
   * 检查状态码是否可重试
   */
  private isRetryableStatus(status?: number): boolean {
    if (!status) {
      return true; // 网络错误可重试
    }
    
    // 5xx错误和429错误可重试
    return status >= 500 || status === 429;
  }

  /**
   * 获取用户友好的错误消息
   */
  private getUserFriendlyMessage(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return '网络连接失败，请检查网络设置';
    }
    
    if (lowerMessage.includes('unauthorized')) {
      return '登录已过期，请重新登录';
    }
    
    if (lowerMessage.includes('forbidden')) {
      return '没有权限执行此操作';
    }
    
    if (lowerMessage.includes('not found')) {
      return '请求的资源不存在';
    }
    
    if (lowerMessage.includes('timeout')) {
      return '请求超时，请稍后重试';
    }
    
    if (lowerMessage.includes('server')) {
      return '服务器错误，请稍后重试';
    }
    
    return message || '操作失败，请稍后重试';
  }

  /**
   * 记录错误
   */
  private logError(error: AppError): void {
    const logLevel = this.getLogLevel(error.severity);
    const logMessage = `[${error.type}] ${error.message}`;
    
    console[logLevel](logMessage, {
      id: error.id,
      severity: error.severity,
      details: error.details,
      context: error.context,
      timestamp: error.timestamp
    });
  }

  /**
   * 获取日志级别
   */
  private getLogLevel(severity: ErrorSeverity): 'log' | 'warn' | 'error' {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'log';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return 'error';
      default:
        return 'log';
    }
  }

  /**
   * 显示错误提示
   */
  private showErrorToast(error: AppError): void {
    // 触发toast显示事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('show-error-toast', {
        detail: {
          message: error.userMessage,
          type: error.severity === ErrorSeverity.HIGH ? 'error' : 'warning',
          duration: this.getToastDuration(error.severity)
        }
      }));
    }
  }

  /**
   * 获取Toast显示时长
   */
  private getToastDuration(severity: ErrorSeverity): number {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 3000;
      case ErrorSeverity.MEDIUM:
        return 5000;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return 8000;
      default:
        return 5000;
    }
  }

  /**
   * 上报错误
   */
  private async reportError(error: AppError): Promise<void> {
    if (!this.config.reportingEndpoint) {
      return;
    }

    try {
      await fetch(this.config.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: {
            id: error.id,
            type: error.type,
            severity: error.severity,
            message: error.message,
            details: error.details,
            context: error.context,
            timestamp: error.timestamp
          },
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (reportError) {
      console.warn('Failed to report error:', reportError);
    }
  }

  /**
   * 尝试错误恢复
   */
  private attemptRecovery(error: AppError): void {
    if (!error.recoverable) {
      return;
    }

    const strategy = this.getRecoveryStrategy(error);
    this.executeRecoveryStrategy(strategy, error);
  }

  /**
   * 获取恢复策略
   */
  private getRecoveryStrategy(error: AppError): RecoveryStrategy {
    switch (error.type) {
      case ErrorType.AUTHENTICATION:
        return {
          type: 'redirect',
          params: { url: '/auth/login' }
        };
      
      case ErrorType.NETWORK:
        if (error.retryable) {
          return {
            type: 'retry',
            params: {
              maxRetries: this.config.maxRetries,
              delay: this.config.retryDelay
            }
          };
        }
        break;
      
      case ErrorType.SERVER:
        if (error.retryable) {
          return {
            type: 'retry',
            params: {
              maxRetries: 2,
              delay: this.config.retryDelay * 2
            }
          };
        }
        break;
    }

    return { type: 'ignore' };
  }

  /**
   * 执行恢复策略
   */
  private executeRecoveryStrategy(strategy: RecoveryStrategy, error: AppError): void {
    switch (strategy.type) {
      case 'retry':
        this.scheduleRetry(error, strategy.params?.maxRetries, strategy.params?.delay);
        break;
      
      case 'redirect':
        if (strategy.params?.url && typeof window !== 'undefined') {
          window.location.href = strategy.params.url;
        }
        break;
      
      case 'refresh':
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
        break;
      
      case 'fallback':
        // 触发fallback数据事件
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('error-fallback', {
            detail: {
              errorId: error.id,
              fallbackData: strategy.params?.fallbackData
            }
          }));
        }
        break;
      
      case 'ignore':
      default:
        // 不执行任何恢复操作
        break;
    }
  }

  /**
   * 安排重试
   */
  private scheduleRetry(error: AppError, maxRetries = 3, delay = 1000): void {
    const currentRetries = this.retryCount.get(error.id) || 0;
    
    if (currentRetries >= maxRetries) {
      console.warn(`Max retries exceeded for error ${error.id}`);
      return;
    }

    this.retryCount.set(error.id, currentRetries + 1);

    setTimeout(() => {
      // 触发重试事件
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('error-retry', {
          detail: {
            errorId: error.id,
            retryCount: currentRetries + 1,
            maxRetries
          }
        }));
      }
    }, delay * Math.pow(2, currentRetries)); // 指数退避
  }

  /**
   * 生成错误ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 通知监听器
   */
  private notifyListeners(error: AppError): void {
    this.listeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.warn('Error in error listener:', listenerError);
      }
    });
  }

  /**
   * 添加错误监听器
   */
  addListener(listener: (error: AppError) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 获取错误队列
   */
  getErrorQueue(): AppError[] {
    return [...this.errorQueue];
  }

  /**
   * 清除错误队列
   */
  clearErrorQueue(): void {
    this.errorQueue = [];
    this.retryCount.clear();
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// 创建全局错误处理器实例
export const errorHandler = new ErrorHandler();

// 便捷方法
export const handleError = (error: unknown) => errorHandler.handleError(error);
export const addErrorListener = (listener: (error: AppError) => void) => errorHandler.addListener(listener);
export const clearErrors = () => errorHandler.clearErrorQueue();

export default errorHandler;