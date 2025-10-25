/**
 * Loading状态管理系统
 * 提供全局loading状态管理、请求去重、超时处理和用户体验优化
 */

/**
 * Loading状态类型
 */
export enum LoadingType {
  GLOBAL = 'GLOBAL',
  PAGE = 'PAGE',
  COMPONENT = 'COMPONENT',
  BUTTON = 'BUTTON',
  FORM = 'FORM',
  API = 'API'
}

/**
 * Loading状态接口
 */
export interface LoadingState {
  id: string;
  type: LoadingType;
  message?: string;
  progress?: number;
  startTime: Date;
  timeout?: number;
  context?: {
    component?: string;
    action?: string;
    url?: string;
  };
}

/**
 * Loading配置接口
 */
export interface LoadingConfig {
  defaultTimeout: number;
  showDelay: number;
  minDuration: number;
  enableProgress: boolean;
  enableTimeout: boolean;
}

/**
 * Loading管理器类
 */
class LoadingManager {
  private loadingStates: Map<string, LoadingState> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  private showDelays: Map<string, NodeJS.Timeout> = new Map();
  private listeners: Set<(states: LoadingState[]) => void> = new Set();
  private config: LoadingConfig;

  constructor(config: Partial<LoadingConfig> = {}) {
    this.config = {
      defaultTimeout: 30000, // 30秒
      showDelay: 200, // 200ms后显示loading
      minDuration: 500, // 最小显示时间500ms
      enableProgress: true,
      enableTimeout: true,
      ...config
    };
  }

  /**
   * 开始loading
   */
  start(
    id: string,
    type: LoadingType = LoadingType.GLOBAL,
    options: {
      message?: string;
      timeout?: number;
      showDelay?: number;
      context?: LoadingState['context'];
    } = {}
  ): void {
    const loadingState: LoadingState = {
      id,
      type,
      message: options.message,
      progress: 0,
      startTime: new Date(),
      timeout: options.timeout || this.config.defaultTimeout,
      context: options.context
    };

    // 设置显示延迟
    const showDelay = options.showDelay ?? this.config.showDelay;
    if (showDelay > 0) {
      const delayTimeout = setTimeout(() => {
        this.loadingStates.set(id, loadingState);
        this.notifyListeners();
        this.showDelays.delete(id);
      }, showDelay);
      
      this.showDelays.set(id, delayTimeout);
    } else {
      this.loadingStates.set(id, loadingState);
      this.notifyListeners();
    }

    // 设置超时
    if (this.config.enableTimeout && loadingState.timeout) {
      const timeoutId = setTimeout(() => {
        this.handleTimeout(id);
      }, loadingState.timeout);
      
      this.timeouts.set(id, timeoutId);
    }

    console.log(`Loading started: ${id} (${type})`);
  }

  /**
   * 停止loading
   */
  stop(id: string, force = false): void {
    const loadingState = this.loadingStates.get(id);
    
    // 清除显示延迟
    const showDelay = this.showDelays.get(id);
    if (showDelay) {
      clearTimeout(showDelay);
      this.showDelays.delete(id);
      // 如果还在延迟期间，直接返回，不显示loading
      return;
    }

    if (!loadingState) {
      return;
    }

    const duration = Date.now() - loadingState.startTime.getTime();
    const minDuration = this.config.minDuration;

    // 如果未达到最小显示时间且不是强制停止，延迟停止
    if (!force && duration < minDuration) {
      setTimeout(() => {
        this.performStop(id);
      }, minDuration - duration);
    } else {
      this.performStop(id);
    }
  }

  /**
   * 执行停止操作
   */
  private performStop(id: string): void {
    // 清除超时
    const timeoutId = this.timeouts.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(id);
    }

    // 移除loading状态
    this.loadingStates.delete(id);
    this.notifyListeners();

    console.log(`Loading stopped: ${id}`);
  }

  /**
   * 更新loading进度
   */
  updateProgress(id: string, progress: number, message?: string): void {
    const loadingState = this.loadingStates.get(id);
    if (!loadingState) {
      return;
    }

    loadingState.progress = Math.max(0, Math.min(100, progress));
    if (message) {
      loadingState.message = message;
    }

    this.loadingStates.set(id, loadingState);
    this.notifyListeners();
  }

  /**
   * 更新loading消息
   */
  updateMessage(id: string, message: string): void {
    const loadingState = this.loadingStates.get(id);
    if (!loadingState) {
      return;
    }

    loadingState.message = message;
    this.loadingStates.set(id, loadingState);
    this.notifyListeners();
  }

  /**
   * 检查是否正在loading
   */
  isLoading(id?: string, type?: LoadingType): boolean {
    if (id) {
      return this.loadingStates.has(id);
    }

    if (type) {
      return Array.from(this.loadingStates.values()).some(state => state.type === type);
    }

    return this.loadingStates.size > 0;
  }

  /**
   * 获取loading状态
   */
  getLoadingState(id: string): LoadingState | undefined {
    return this.loadingStates.get(id);
  }

  /**
   * 获取所有loading状态
   */
  getAllLoadingStates(): LoadingState[] {
    return Array.from(this.loadingStates.values());
  }

  /**
   * 获取指定类型的loading状态
   */
  getLoadingStatesByType(type: LoadingType): LoadingState[] {
    return Array.from(this.loadingStates.values()).filter(state => state.type === type);
  }

  /**
   * 清除所有loading状态
   */
  clearAll(type?: LoadingType): void {
    if (type) {
      // 清除指定类型的loading
      const statesToClear = Array.from(this.loadingStates.entries())
        .filter(([, state]) => state.type === type)
        .map(([id]) => id);
      
      statesToClear.forEach(id => this.stop(id, true));
    } else {
      // 清除所有loading
      const allIds = Array.from(this.loadingStates.keys());
      allIds.forEach(id => this.stop(id, true));
    }
  }

  /**
   * 处理超时
   */
  private handleTimeout(id: string): void {
    const loadingState = this.loadingStates.get(id);
    if (!loadingState) {
      return;
    }

    console.warn(`Loading timeout: ${id}`);
    
    // 触发超时事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('loading-timeout', {
        detail: {
          id,
          loadingState
        }
      }));
    }

    // 强制停止loading
    this.stop(id, true);
  }

  /**
   * 添加监听器
   */
  addListener(listener: (states: LoadingState[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 通知监听器
   */
  private notifyListeners(): void {
    const states = this.getAllLoadingStates();
    this.listeners.forEach(listener => {
      try {
        listener(states);
      } catch (error) {
        console.warn('Error in loading listener:', error);
      }
    });
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<LoadingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取配置
   */
  getConfig(): LoadingConfig {
    return { ...this.config };
  }

  /**
   * 包装异步函数，自动管理loading状态
   */
  wrap<T>(
    fn: () => Promise<T>,
    options: {
      id?: string;
      type?: LoadingType;
      message?: string;
      timeout?: number;
      context?: LoadingState['context'];
    } = {}
  ): Promise<T> {
    const id = options.id || `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.start(id, options.type, {
      message: options.message,
      timeout: options.timeout,
      context: options.context
    });

    return fn()
      .finally(() => {
        this.stop(id);
      });
  }

  /**
   * 创建loading装饰器
   */
  createDecorator(
    options: {
      type?: LoadingType;
      message?: string;
      timeout?: number;
    } = {}
  ) {
    return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: unknown[]) {
        const targetObj = target as any;
        const id = `${targetObj.constructor.name}.${propertyKey}_${Date.now()}`;
        const loadingManager = new LoadingManager();
        
        loadingManager.start(id, options.type, {
          message: options.message,
          timeout: options.timeout,
          context: {
            component: targetObj.constructor.name,
            action: propertyKey
          }
        });

        try {
          return await originalMethod.apply(this, args);
        } finally {
          loadingManager.stop(id);
        }
      };

      return descriptor;
    };
  }
}

// 创建全局loading管理器实例
export const loadingManager = new LoadingManager();

// 便捷方法
export const startLoading = (
  id: string,
  type?: LoadingType,
  options?: Parameters<LoadingManager['start']>[2]
) => loadingManager.start(id, type, options);

export const stopLoading = (id: string, force?: boolean) => loadingManager.stop(id, force);

export const updateLoadingProgress = (id: string, progress: number, message?: string) => 
  loadingManager.updateProgress(id, progress, message);

export const updateLoadingMessage = (id: string, message: string) => 
  loadingManager.updateMessage(id, message);

export const isLoading = (id?: string, type?: LoadingType) => 
  loadingManager.isLoading(id, type);

export const clearAllLoading = (type?: LoadingType) => 
  loadingManager.clearAll(type);

export const wrapWithLoading = <T>(
  fn: () => Promise<T>,
  options?: Parameters<LoadingManager['wrap']>[1]
) => loadingManager.wrap(fn, options);

export const addLoadingListener = (listener: (states: LoadingState[]) => void) => 
  loadingManager.addListener(listener);

// Loading装饰器
export const Loading = (options?: Parameters<LoadingManager['createDecorator']>[0]) => 
  loadingManager.createDecorator(options);

export default loadingManager;