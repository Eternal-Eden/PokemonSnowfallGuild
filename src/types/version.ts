/**
 * 版本管理相关类型定义
 */

export interface VersionConfig {
  version: string;
  buildTime: string;
  updatePolicy: UpdatePolicy;
  changelog: Record<string, ChangelogEntry>;
  api: VersionApiConfig;
}

export interface UpdatePolicy {
  checkInterval: number; // 检查间隔（毫秒）
  autoCheck: boolean; // 是否自动检查
  forceUpdate: boolean; // 是否强制更新
  updateTypes: Record<UpdateType, UpdateTypeConfig>;
}

export type UpdateType = 'major' | 'minor' | 'patch';

export type UpdatePriority = 'critical' | 'important' | 'normal';

export interface UpdateTypeConfig {
  priority: UpdatePriority;
  forceRefresh: boolean; // 是否强制刷新页面
  showChangelog: boolean; // 是否显示更新日志
}

export interface ChangelogEntry {
  date: string;
  type: UpdateType;
  title: string;
  description: string;
  features: string[];
  fixes: string[];
  breaking: string[];
}

export interface VersionApiConfig {
  versionEndpoint: string;
  updateCheckEndpoint: string;
}

export interface VersionCheckResponse {
  success: boolean;
  data: {
    currentVersion: string;
    latestVersion: string;
    hasUpdate: boolean;
    updateType: UpdateType;
    updatePriority: UpdatePriority;
    changelog?: ChangelogEntry;
    forceRefresh: boolean;
  };
  message?: string;
}

export interface UpdateNotificationConfig {
  show: boolean;
  type: UpdateType;
  priority: UpdatePriority;
  title: string;
  message: string;
  changelog?: ChangelogEntry;
  actions: {
    updateNow: boolean;
    remindLater: boolean;
    skipVersion: boolean;
  };
}

export interface UserUpdatePreferences {
  autoUpdate: boolean;
  notificationEnabled: boolean;
  skipVersions: string[];
  lastCheckTime: number;
  lastNotificationTime: number;
}

export interface UpdateState {
  isChecking: boolean;
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  updateType?: UpdateType;
  updatePriority?: UpdatePriority;
  changelog?: ChangelogEntry;
  lastCheckTime?: number;
  error?: string;
}

export interface UpdateContextType {
  state: UpdateState;
  checkForUpdates: () => Promise<void>;
  applyUpdate: () => void;
  dismissNotification: () => void;
  skipVersion: (version: string) => void;
  updatePreferences: (preferences: Partial<UserUpdatePreferences>) => void;
  preferences: UserUpdatePreferences;
}