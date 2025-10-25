/**
 * 更新系统本地存储管理
 * 提供用户偏好设置、版本信息、缓存数据的存储和管理
 */

import { UserUpdatePreferences, VersionCheckResponse } from '@/types/version';

// 存储键名常量
const STORAGE_KEYS = {
  UPDATE_PREFERENCES: 'update-preferences',
  SKIPPED_VERSIONS: 'skipped-versions',
  LAST_CHECK_TIME: 'last-check-time',
  LAST_NOTIFICATION_TIME: 'last-notification-time',
  FORCE_REFRESH_VERSION: 'force-refresh-version',
  UPDATE_CACHE: 'update-cache',
  USER_DISMISSED_VERSIONS: 'user-dismissed-versions',
  UPDATE_STATISTICS: 'update-statistics'
} as const;

// 缓存过期时间（毫秒）
const CACHE_EXPIRY = {
  UPDATE_CHECK: 5 * 60 * 1000, // 5分钟
  PREFERENCES: 24 * 60 * 60 * 1000, // 24小时
  STATISTICS: 7 * 24 * 60 * 60 * 1000 // 7天
} as const;

// 缓存数据接口
interface CachedData<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

// 更新统计数据
interface UpdateStatistics {
  totalChecks: number;
  totalUpdates: number;
  lastUpdateTime: number;
  averageCheckInterval: number;
  updatesByType: Record<string, number>;
}

class UpdateStorage {
  private static instance: UpdateStorage;
  private isAvailable: boolean;

  private constructor() {
    this.isAvailable = this.checkStorageAvailability();
  }

  public static getInstance(): UpdateStorage {
    if (!UpdateStorage.instance) {
      UpdateStorage.instance = new UpdateStorage();
    }
    return UpdateStorage.instance;
  }

  /**
   * 检查localStorage是否可用
   */
  private checkStorageAvailability(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn('LocalStorage is not available:', error);
      return false;
    }
  }

  /**
   * 安全地获取存储数据
   */
  private safeGet<T>(key: string, defaultValue: T): T {
    if (!this.isAvailable) {
      return defaultValue;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item);
    } catch (error) {
      console.error(`Failed to get storage item '${key}':`, error);
      return defaultValue;
    }
  }

  /**
   * 安全地设置存储数据
   */
  private safeSet<T>(key: string, value: T): boolean {
    if (!this.isAvailable) {
      return false;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to set storage item '${key}':`, error);
      
      // 如果存储空间不足，尝试清理过期数据
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.cleanupExpiredData();
        
        // 再次尝试存储
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch (retryError) {
          console.error(`Failed to set storage item '${key}' after cleanup:`, retryError);
        }
      }
      
      return false;
    }
  }

  /**
   * 安全地删除存储数据
   */
  private safeRemove(key: string): boolean {
    if (!this.isAvailable) {
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove storage item '${key}':`, error);
      return false;
    }
  }

  /**
   * 获取带缓存的数据
   */
  private getCachedData<T>(key: string): T | null {
    const cached = this.safeGet<CachedData<T> | null>(key, null);
    
    if (!cached) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > cached.timestamp + cached.expiry) {
      this.safeRemove(key);
      return null;
    }

    return cached.data;
  }

  /**
   * 设置带缓存的数据
   */
  private setCachedData<T>(key: string, data: T, expiry: number): boolean {
    const cachedData: CachedData<T> = {
      data,
      timestamp: Date.now(),
      expiry
    };

    return this.safeSet(key, cachedData);
  }

  /**
   * 获取用户更新偏好设置
   */
  public getUserPreferences(): UserUpdatePreferences {
    const defaultPreferences: UserUpdatePreferences = {
      autoUpdate: false,
      notificationEnabled: true,
      skipVersions: [],
      lastCheckTime: 0,
      lastNotificationTime: 0
    };

    return this.safeGet(STORAGE_KEYS.UPDATE_PREFERENCES, defaultPreferences);
  }

  /**
   * 保存用户更新偏好设置
   */
  public saveUserPreferences(preferences: UserUpdatePreferences): boolean {
    return this.safeSet(STORAGE_KEYS.UPDATE_PREFERENCES, preferences);
  }

  /**
   * 更新用户偏好设置（部分更新）
   */
  public updateUserPreferences(updates: Partial<UserUpdatePreferences>): boolean {
    const current = this.getUserPreferences();
    const updated = { ...current, ...updates };
    return this.saveUserPreferences(updated);
  }

  /**
   * 获取跳过的版本列表
   */
  public getSkippedVersions(): string[] {
    return this.safeGet(STORAGE_KEYS.SKIPPED_VERSIONS, []);
  }

  /**
   * 添加跳过的版本
   */
  public addSkippedVersion(version: string): boolean {
    const skipped = this.getSkippedVersions();
    if (!skipped.includes(version)) {
      skipped.push(version);
      return this.safeSet(STORAGE_KEYS.SKIPPED_VERSIONS, skipped);
    }
    return true;
  }

  /**
   * 移除跳过的版本
   */
  public removeSkippedVersion(version: string): boolean {
    const skipped = this.getSkippedVersions();
    const filtered = skipped.filter(v => v !== version);
    return this.safeSet(STORAGE_KEYS.SKIPPED_VERSIONS, filtered);
  }

  /**
   * 清除所有跳过的版本
   */
  public clearSkippedVersions(): boolean {
    return this.safeSet(STORAGE_KEYS.SKIPPED_VERSIONS, []);
  }

  /**
   * 检查版本是否被跳过
   */
  public isVersionSkipped(version: string): boolean {
    return this.getSkippedVersions().includes(version);
  }

  /**
   * 获取最后检查时间
   */
  public getLastCheckTime(): number {
    return this.safeGet(STORAGE_KEYS.LAST_CHECK_TIME, 0);
  }

  /**
   * 设置最后检查时间
   */
  public setLastCheckTime(timestamp: number = Date.now()): boolean {
    return this.safeSet(STORAGE_KEYS.LAST_CHECK_TIME, timestamp);
  }

  /**
   * 获取最后通知时间
   */
  public getLastNotificationTime(): number {
    return this.safeGet(STORAGE_KEYS.LAST_NOTIFICATION_TIME, 0);
  }

  /**
   * 设置最后通知时间
   */
  public setLastNotificationTime(timestamp: number = Date.now()): boolean {
    return this.safeSet(STORAGE_KEYS.LAST_NOTIFICATION_TIME, timestamp);
  }

  /**
   * 获取强制刷新版本标记
   */
  public getForceRefreshVersion(): string | null {
    return this.safeGet(STORAGE_KEYS.FORCE_REFRESH_VERSION, null);
  }

  /**
   * 设置强制刷新版本标记
   */
  public setForceRefreshVersion(version: string): boolean {
    return this.safeSet(STORAGE_KEYS.FORCE_REFRESH_VERSION, version);
  }

  /**
   * 清除强制刷新版本标记
   */
  public clearForceRefreshVersion(): boolean {
    return this.safeRemove(STORAGE_KEYS.FORCE_REFRESH_VERSION);
  }

  /**
   * 获取缓存的更新检查结果
   */
  public getCachedUpdateCheck(): VersionCheckResponse | null {
    return this.getCachedData<VersionCheckResponse>(STORAGE_KEYS.UPDATE_CACHE);
  }

  /**
   * 缓存更新检查结果
   */
  public setCachedUpdateCheck(result: VersionCheckResponse): boolean {
    return this.setCachedData(STORAGE_KEYS.UPDATE_CACHE, result, CACHE_EXPIRY.UPDATE_CHECK);
  }

  /**
   * 清除更新检查缓存
   */
  public clearUpdateCheckCache(): boolean {
    return this.safeRemove(STORAGE_KEYS.UPDATE_CACHE);
  }

  /**
   * 获取用户忽略的版本列表
   */
  public getDismissedVersions(): string[] {
    return this.safeGet(STORAGE_KEYS.USER_DISMISSED_VERSIONS, []);
  }

  /**
   * 添加用户忽略的版本
   */
  public addDismissedVersion(version: string): boolean {
    const dismissed = this.getDismissedVersions();
    if (!dismissed.includes(version)) {
      dismissed.push(version);
      return this.safeSet(STORAGE_KEYS.USER_DISMISSED_VERSIONS, dismissed);
    }
    return true;
  }

  /**
   * 获取更新统计数据
   */
  public getUpdateStatistics(): UpdateStatistics {
    const defaultStats: UpdateStatistics = {
      totalChecks: 0,
      totalUpdates: 0,
      lastUpdateTime: 0,
      averageCheckInterval: 0,
      updatesByType: {}
    };

    return this.safeGet(STORAGE_KEYS.UPDATE_STATISTICS, defaultStats);
  }

  /**
   * 更新统计数据
   */
  public updateStatistics(updates: Partial<UpdateStatistics>): boolean {
    const current = this.getUpdateStatistics();
    const updated = { ...current, ...updates };
    return this.safeSet(STORAGE_KEYS.UPDATE_STATISTICS, updated);
  }

  /**
   * 记录检查更新事件
   */
  public recordUpdateCheck(): boolean {
    const stats = this.getUpdateStatistics();
    const now = Date.now();
    
    // 计算平均检查间隔
    if (stats.totalChecks > 0 && stats.lastUpdateTime > 0) {
      const interval = now - stats.lastUpdateTime;
      stats.averageCheckInterval = (stats.averageCheckInterval * stats.totalChecks + interval) / (stats.totalChecks + 1);
    }
    
    stats.totalChecks++;
    stats.lastUpdateTime = now;
    
    return this.updateStatistics(stats);
  }

  /**
   * 记录应用更新事件
   */
  public recordUpdate(updateType: string): boolean {
    const stats = this.getUpdateStatistics();
    
    stats.totalUpdates++;
    stats.updatesByType[updateType] = (stats.updatesByType[updateType] || 0) + 1;
    
    return this.updateStatistics(stats);
  }

  /**
   * 清理过期数据
   */
  public cleanupExpiredData(): void {
    if (!this.isAvailable) {
      return;
    }

    try {
      const keysToCheck = [
        STORAGE_KEYS.UPDATE_CACHE,
        STORAGE_KEYS.UPDATE_STATISTICS
      ];

      keysToCheck.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const parsed = JSON.parse(item) as CachedData<any>;
            if (parsed.timestamp && parsed.expiry) {
              if (Date.now() > parsed.timestamp + parsed.expiry) {
                localStorage.removeItem(key);
              }
            }
          } catch (error) {
            // 如果解析失败，删除该项
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error('Failed to cleanup expired data:', error);
    }
  }

  /**
   * 清除所有更新相关数据
   */
  public clearAllData(): boolean {
    if (!this.isAvailable) {
      return false;
    }

    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Failed to clear all update data:', error);
      return false;
    }
  }

  /**
   * 获取存储使用情况
   */
  public getStorageUsage(): { used: number; total: number; percentage: number } {
    if (!this.isAvailable) {
      return { used: 0, total: 0, percentage: 0 };
    }

    try {
      let used = 0;
      Object.values(STORAGE_KEYS).forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          used += item.length;
        }
      });

      // 估算总可用空间（通常为5-10MB）
      const total = 5 * 1024 * 1024; // 5MB
      const percentage = (used / total) * 100;

      return { used, total, percentage };
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return { used: 0, total: 0, percentage: 0 };
    }
  }

  /**
   * 导出所有更新数据
   */
  public exportData(): Record<string, any> {
    const data: Record<string, any> = {};
    
    Object.values(STORAGE_KEYS).forEach(key => {
      const value = this.safeGet(key, null);
      if (value !== null) {
        data[key] = value;
      }
    });

    return data;
  }

  /**
   * 导入更新数据
   */
  public importData(data: Record<string, any>): boolean {
    try {
      Object.entries(data).forEach(([key, value]) => {
        if (Object.values(STORAGE_KEYS).includes(key as any)) {
          this.safeSet(key, value);
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to import update data:', error);
      return false;
    }
  }
}

// 导出单例实例
export const updateStorage = UpdateStorage.getInstance();
export default updateStorage;