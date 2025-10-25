/**
 * 版本管理服务
 * 提供版本检测、更新通知、本地存储等功能
 */

import { 
  VersionConfig, 
  VersionCheckResponse, 
  UpdateState, 
  UserUpdatePreferences,
  UpdateType,
  UpdatePriority,
  ChangelogEntry
} from '@/types/version';
import versionConfig from '@/config/version.json';

class VersionManager {
  private static instance: VersionManager;
  private config: VersionConfig;
  private checkTimer: NodeJS.Timeout | null = null;
  private listeners: Set<(state: UpdateState) => void> = new Set();
  private currentState: UpdateState;

  private constructor() {
    this.config = versionConfig as VersionConfig;
    this.currentState = {
      isChecking: false,
      hasUpdate: false,
      currentVersion: this.config.version,
      latestVersion: this.config.version
    };
  }

  public static getInstance(): VersionManager {
    if (!VersionManager.instance) {
      VersionManager.instance = new VersionManager();
    }
    return VersionManager.instance;
  }

  /**
   * 获取当前版本信息
   */
  public getCurrentVersion(): string {
    return this.config.version;
  }

  /**
   * 获取版本配置
   */
  public getConfig(): VersionConfig {
    return this.config;
  }

  /**
   * 获取当前状态
   */
  public getState(): UpdateState {
    return { ...this.currentState };
  }

  /**
   * 订阅状态变化
   */
  public subscribe(listener: (state: UpdateState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 通知状态变化
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentState));
  }

  /**
   * 更新状态
   */
  private updateState(updates: Partial<UpdateState>): void {
    this.currentState = { ...this.currentState, ...updates };
    this.notifyListeners();
  }

  /**
   * 检查更新
   */
  public async checkForUpdates(): Promise<VersionCheckResponse> {
    this.updateState({ isChecking: true, error: undefined });

    try {
      const response = await fetch(this.config.api.updateCheckEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Current-Version': this.config.version
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: VersionCheckResponse = await response.json();
      
      if (result.success && result.data) {
        const { latestVersion, hasUpdate, updateType, updatePriority, changelog, forceRefresh } = result.data;
        
        this.updateState({
          isChecking: false,
          hasUpdate,
          latestVersion,
          updateType,
          updatePriority,
          changelog,
          lastCheckTime: Date.now()
        });

        // 如果有更新且需要强制刷新，记录到本地存储
        if (hasUpdate && forceRefresh) {
          this.setForceRefreshFlag(latestVersion);
        }
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '检查更新失败';
      this.updateState({ 
        isChecking: false, 
        error: errorMessage,
        lastCheckTime: Date.now()
      });
      
      return {
        success: false,
        data: {
          currentVersion: this.config.version,
          latestVersion: this.config.version,
          hasUpdate: false,
          updateType: 'patch' as UpdateType,
          updatePriority: 'normal' as UpdatePriority,
          forceRefresh: false
        },
        message: errorMessage
      };
    }
  }

  /**
   * 开始自动检查
   */
  public startAutoCheck(): void {
    if (!this.config.updatePolicy.autoCheck) {
      return;
    }

    this.stopAutoCheck();
    
    const interval = this.config.updatePolicy.checkInterval;
    this.checkTimer = setInterval(() => {
      this.checkForUpdates();
    }, interval);

    // 立即执行一次检查
    this.checkForUpdates();
  }

  /**
   * 停止自动检查
   */
  public stopAutoCheck(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  /**
   * 应用更新（刷新页面）
   */
  public applyUpdate(): void {
    // 清除强制刷新标记
    this.clearForceRefreshFlag();
    
    // 刷新页面
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  /**
   * 比较版本号
   */
  public compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    const maxLength = Math.max(v1Parts.length, v2Parts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }
    
    return 0;
  }

  /**
   * 获取更新类型
   */
  public getUpdateType(currentVersion: string, latestVersion: string): UpdateType {
    const current = currentVersion.split('.').map(Number);
    const latest = latestVersion.split('.').map(Number);
    
    if (latest[0] > current[0]) return 'major';
    if (latest[1] > current[1]) return 'minor';
    return 'patch';
  }

  /**
   * 获取用户偏好设置
   */
  public getUserPreferences(): UserUpdatePreferences {
    if (typeof window === 'undefined') {
      return this.getDefaultPreferences();
    }

    try {
      const stored = localStorage.getItem('update-preferences');
      if (stored) {
        return { ...this.getDefaultPreferences(), ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load update preferences:', error);
    }
    
    return this.getDefaultPreferences();
  }

  /**
   * 保存用户偏好设置
   */
  public saveUserPreferences(preferences: Partial<UserUpdatePreferences>): void {
    if (typeof window === 'undefined') return;

    try {
      const current = this.getUserPreferences();
      const updated = { ...current, ...preferences };
      localStorage.setItem('update-preferences', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save update preferences:', error);
    }
  }

  /**
   * 跳过版本
   */
  public skipVersion(version: string): void {
    const preferences = this.getUserPreferences();
    if (!preferences.skipVersions.includes(version)) {
      preferences.skipVersions.push(version);
      this.saveUserPreferences(preferences);
    }
  }

  /**
   * 检查版本是否被跳过
   */
  public isVersionSkipped(version: string): boolean {
    const preferences = this.getUserPreferences();
    return preferences.skipVersions.includes(version);
  }

  /**
   * 设置强制刷新标记
   */
  private setForceRefreshFlag(version: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('force-refresh-version', version);
    } catch (error) {
      console.error('Failed to set force refresh flag:', error);
    }
  }

  /**
   * 清除强制刷新标记
   */
  private clearForceRefreshFlag(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem('force-refresh-version');
    } catch (error) {
      console.error('Failed to clear force refresh flag:', error);
    }
  }

  /**
   * 检查是否需要强制刷新
   */
  public shouldForceRefresh(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const flaggedVersion = localStorage.getItem('force-refresh-version');
      return flaggedVersion !== null && flaggedVersion !== this.config.version;
    } catch (error) {
      console.error('Failed to check force refresh flag:', error);
      return false;
    }
  }

  /**
   * 获取默认偏好设置
   */
  private getDefaultPreferences(): UserUpdatePreferences {
    return {
      autoUpdate: false,
      notificationEnabled: true,
      skipVersions: [],
      lastCheckTime: 0,
      lastNotificationTime: 0
    };
  }

  /**
   * 销毁实例
   */
  public destroy(): void {
    this.stopAutoCheck();
    this.listeners.clear();
  }
}

export default VersionManager;
export const versionManager = VersionManager.getInstance();