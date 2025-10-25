'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { 
  UpdateState, 
  UpdateContextType, 
  UserUpdatePreferences,
  VersionCheckResponse 
} from '@/types/version';
import { versionManager } from '@/lib/versionManager';

// 更新状态的Action类型
type UpdateAction = 
  | { type: 'SET_CHECKING'; payload: boolean }
  | { type: 'SET_UPDATE_AVAILABLE'; payload: VersionCheckResponse['data'] }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'DISMISS_NOTIFICATION' }
  | { type: 'SET_PREFERENCES'; payload: UserUpdatePreferences };

// 初始状态
const initialState: UpdateState = {
  isChecking: false,
  hasUpdate: false,
  currentVersion: '',
  latestVersion: ''
};

// Reducer函数
function updateReducer(state: UpdateState, action: UpdateAction): UpdateState {
  switch (action.type) {
    case 'SET_CHECKING':
      return { ...state, isChecking: action.payload, error: undefined };
    
    case 'SET_UPDATE_AVAILABLE':
      return {
        ...state,
        isChecking: false,
        hasUpdate: action.payload.hasUpdate,
        currentVersion: action.payload.currentVersion,
        latestVersion: action.payload.latestVersion,
        updateType: action.payload.updateType,
        updatePriority: action.payload.updatePriority,
        changelog: action.payload.changelog,
        lastCheckTime: Date.now(),
        error: undefined
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        isChecking: false,
        error: action.payload,
        lastCheckTime: Date.now()
      };
    
    case 'CLEAR_ERROR':
      return { ...state, error: undefined };
    
    case 'DISMISS_NOTIFICATION':
      return { ...state, hasUpdate: false };
    
    case 'SET_PREFERENCES':
      return { ...state };
    
    default:
      return state;
  }
}

// Context创建
const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

// Provider组件属性
interface UpdateProviderProps {
  children: ReactNode;
}

// Provider组件
export function UpdateProvider({ children }: UpdateProviderProps) {
  const [state, dispatch] = useReducer(updateReducer, {
    ...initialState,
    currentVersion: versionManager.getCurrentVersion()
  });
  
  const [preferences, setPreferences] = React.useState<UserUpdatePreferences>(
    versionManager.getUserPreferences()
  );

  // 检查更新
  const checkForUpdates = useCallback(async () => {
    dispatch({ type: 'SET_CHECKING', payload: true });
    
    try {
      const result = await versionManager.checkForUpdates();
      
      if (result.success && result.data) {
        // 检查是否跳过了这个版本
        if (result.data.hasUpdate && !versionManager.isVersionSkipped(result.data.latestVersion)) {
          dispatch({ type: 'SET_UPDATE_AVAILABLE', payload: result.data });
        } else {
          dispatch({ type: 'SET_UPDATE_AVAILABLE', payload: {
            ...result.data,
            hasUpdate: false
          }});
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.message || '检查更新失败' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '检查更新失败';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, []);

  // 应用更新
  const applyUpdate = useCallback(() => {
    versionManager.applyUpdate();
  }, []);

  // 忽略通知
  const dismissNotification = useCallback(() => {
    dispatch({ type: 'DISMISS_NOTIFICATION' });
  }, []);

  // 跳过版本
  const skipVersion = useCallback((version: string) => {
    versionManager.skipVersion(version);
    dispatch({ type: 'DISMISS_NOTIFICATION' });
  }, []);

  // 更新偏好设置
  const updatePreferences = useCallback((newPreferences: Partial<UserUpdatePreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    versionManager.saveUserPreferences(updated);
    dispatch({ type: 'SET_PREFERENCES', payload: updated });
  }, [preferences]);

  // 监听版本管理器状态变化
  useEffect(() => {
    const unsubscribe = versionManager.subscribe((vmState) => {
      if (vmState.isChecking !== state.isChecking) {
        dispatch({ type: 'SET_CHECKING', payload: vmState.isChecking });
      }
      
      if (vmState.hasUpdate && vmState.latestVersion) {
        dispatch({ type: 'SET_UPDATE_AVAILABLE', payload: {
          currentVersion: vmState.currentVersion,
          latestVersion: vmState.latestVersion,
          hasUpdate: vmState.hasUpdate,
          updateType: vmState.updateType!,
          updatePriority: vmState.updatePriority!,
          changelog: vmState.changelog,
          forceRefresh: false // 这个值需要从API响应中获取
        }});
      }
      
      if (vmState.error) {
        dispatch({ type: 'SET_ERROR', payload: vmState.error });
      }
    });

    return unsubscribe;
  }, [state.isChecking]);

  // 初始化和自动检查
  useEffect(() => {
    // 检查是否需要强制刷新
    if (versionManager.shouldForceRefresh()) {
      // 显示强制刷新提示
      checkForUpdates();
    }

    // 如果启用了自动检查，开始自动检查
    if (preferences.autoUpdate && preferences.notificationEnabled) {
      versionManager.startAutoCheck();
    }

    // 组件卸载时清理
    return () => {
      versionManager.stopAutoCheck();
    };
  }, [preferences.autoUpdate, preferences.notificationEnabled, checkForUpdates]);

  // 定期检查（基于用户偏好）
  useEffect(() => {
    if (!preferences.notificationEnabled) {
      return;
    }

    // 如果上次检查时间超过配置的间隔，执行检查
    const config = versionManager.getConfig();
    const now = Date.now();
    const lastCheck = preferences.lastCheckTime;
    const interval = config.updatePolicy.checkInterval;

    if (now - lastCheck > interval) {
      checkForUpdates();
    }

    // 设置定期检查
    const timer = setInterval(() => {
      if (preferences.notificationEnabled) {
        checkForUpdates();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [preferences.notificationEnabled, preferences.lastCheckTime, checkForUpdates]);

  const contextValue: UpdateContextType = {
    state,
    checkForUpdates,
    applyUpdate,
    dismissNotification,
    skipVersion,
    updatePreferences,
    preferences
  };

  return (
    <UpdateContext.Provider value={contextValue}>
      {children}
    </UpdateContext.Provider>
  );
}

// Hook for using the update context
export function useUpdate(): UpdateContextType {
  const context = useContext(UpdateContext);
  if (context === undefined) {
    throw new Error('useUpdate must be used within an UpdateProvider');
  }
  return context;
}

// Hook for checking if updates are available
export function useUpdateAvailable(): boolean {
  const { state } = useUpdate();
  return state.hasUpdate;
}

// Hook for getting current version
export function useCurrentVersion(): string {
  const { state } = useUpdate();
  return state.currentVersion;
}

// Hook for getting update preferences
export function useUpdatePreferences(): [UserUpdatePreferences, (preferences: Partial<UserUpdatePreferences>) => void] {
  const { preferences, updatePreferences } = useUpdate();
  return [preferences, updatePreferences];
}