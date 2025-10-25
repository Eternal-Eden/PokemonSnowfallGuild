import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Auto update configuration options
 */
export interface AutoUpdateOptions {
  /**
   * Whether to enable automatic checking
   */
  enabled?: boolean;
  
  /**
   * Check interval (milliseconds)
   * @default 300000 (5 minutes)
   */
  checkInterval?: number;
  
  /**
   * Whether to check immediately on page load
   */
  checkOnMount?: boolean;
  
  /**
   * Whether to check when page regains focus
   */
  checkOnFocus?: boolean;
  
  /**
   * Whether to check when network reconnects
   */
  checkOnReconnect?: boolean;
  
  /**
   * Auto update priority threshold
   * Only updates reaching this priority will be automatically applied
   */
  autoUpdateThreshold?: 'low' | 'medium' | 'high';
  
  /**
   * Auto update delay (milliseconds)
   * @default 5000 (5 seconds)
   */
  autoUpdateDelay?: number;
  
  /**
   * Callback before update
   */
  onBeforeUpdate?: (version: string) => void;
  
  /**
   * Callback when update check completes
   */
  onUpdateCheck?: (hasUpdate: boolean, version?: string) => void;
  
  /**
   * Error handling callback
   */
  onError?: (error: Error) => void;
}

export interface AutoUpdateReturn {
  /**
   * Manually check for updates
   */
  checkForUpdates: () => Promise<void>;
  
  /**
   * Apply update immediately
   */
  applyUpdate: () => Promise<void>;
  
  /**
   * Pause auto checking
   */
  pauseAutoCheck: () => void;
  
  /**
   * Resume auto checking
   */
  resumeAutoCheck: () => void;
  
  /**
   * Whether currently checking for updates
   */
  isChecking: boolean;
  
  /**
   * Whether updates are available
   */
  hasUpdate: boolean;
  
  /**
   * Current version
   */
  currentVersion: string;
  
  /**
   * Latest version
   */
  latestVersion: string;
  
  /**
   * Update priority
   */
  updatePriority: 'low' | 'medium' | 'high' | null;
  
  /**
   * Error message
   */
  error: string | null;
}

/**
 * Auto update Hook
 * Provides automatic update checking, automatic update application, and other features
 */
export function useAutoUpdate(options: AutoUpdateOptions = {}): AutoUpdateReturn {
  const {
    enabled = true,
    checkInterval = 300000, // 5 minutes
    checkOnMount = true,
    checkOnFocus = true,
    checkOnReconnect = true,
    autoUpdateThreshold = 'medium',
    autoUpdateDelay = 5000, // 5 seconds
    onBeforeUpdate,
    onUpdateCheck,
    onError
  } = options;

  const [isChecking, setIsChecking] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('1.0.0');
  const [latestVersion, setLatestVersion] = useState('1.0.0');
  const [updatePriority, setUpdatePriority] = useState<'low' | 'medium' | 'high' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastCheckRef = useRef<number>(0);

  // Cleanup timer
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  // Check for updates
  const checkForUpdates = useCallback(async () => {
    if (isChecking || !enabled) return;

    try {
      setIsChecking(true);
      setError(null);

      // Simulate API call to check for updates
      // In actual implementation, this would be a real API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate update check result
      const hasNewUpdate = Math.random() > 0.8; // 20% chance of update
      const newVersion = hasNewUpdate ? '1.0.1' : currentVersion;
      const priority: 'low' | 'medium' | 'high' = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any;

      setHasUpdate(hasNewUpdate);
      setLatestVersion(newVersion);
      setUpdatePriority(hasNewUpdate ? priority : null);
      lastCheckRef.current = Date.now();

      onUpdateCheck?.(hasNewUpdate, newVersion);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Update check failed';
      setError(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, enabled, currentVersion, onUpdateCheck, onError]);

  // Apply update
  const applyUpdate = useCallback(async () => {
    try {
      onBeforeUpdate?.(latestVersion);
      // Simulate update application
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCurrentVersion(latestVersion);
      setHasUpdate(false);
      setUpdatePriority(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Update application failed';
      setError(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [latestVersion, onBeforeUpdate, onError]);

  // Pause auto checking
  const pauseAutoCheck = useCallback(() => {
    setIsPaused(true);
    clearTimer();
  }, [clearTimer]);

  // Resume auto checking
  const resumeAutoCheck = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Start auto checking
  const startAutoCheck = useCallback(() => {
    if (!enabled || isPaused) return;

    clearTimer();
    
    // Set periodic checking
    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        checkForUpdates();
      }
    }, checkInterval);
  }, [enabled, isPaused, checkInterval, checkForUpdates, clearTimer]);

  // Handle auto update
  const handleAutoUpdate = useCallback(() => {
    if (!hasUpdate || !updatePriority) return;

    // Check if auto update threshold is met
    const priorityLevels = { low: 1, medium: 2, high: 3 };
    const currentPriorityLevel = priorityLevels[updatePriority];
    const thresholdLevel = priorityLevels[autoUpdateThreshold];

    if (currentPriorityLevel >= thresholdLevel) {
      console.log(`Auto update triggered for ${updatePriority} priority update`);
      
      // Delay auto update to give user time to see notification
      setTimeout(() => {
        applyUpdate();
      }, autoUpdateDelay);
    }
  }, [hasUpdate, updatePriority, autoUpdateThreshold, autoUpdateDelay, applyUpdate]);

  // Page load check
  useEffect(() => {
    if (checkOnMount && enabled) {
      // Delay a bit to ensure component is fully loaded
      setTimeout(() => {
        checkForUpdates();
      }, 1000);
    }
  }, [checkOnMount, enabled, checkForUpdates]);

  // Page focus change check
  useEffect(() => {
    if (!checkOnFocus || !enabled) return;

    const handleFocus = () => {
      // Avoid frequent checking, at least 30 seconds interval
      const now = Date.now();
      if (now - lastCheckRef.current > 30000) {
        checkForUpdates();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleFocus();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkOnFocus, enabled, checkForUpdates]);

  // Network reconnection check
  useEffect(() => {
    if (!checkOnReconnect || !enabled) return;

    const handleOnline = () => {
      // Wait a bit after network recovery before checking
      setTimeout(() => {
        checkForUpdates();
      }, 2000);
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [checkOnReconnect, enabled, checkForUpdates]);

  // Start/stop auto checking
  useEffect(() => {
    if (enabled && !isPaused) {
      startAutoCheck();
    } else {
      clearTimer();
    }

    return clearTimer;
  }, [enabled, isPaused, startAutoCheck, clearTimer]);

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  // Handle auto update
  useEffect(() => {
    handleAutoUpdate();
  }, [handleAutoUpdate]);

  return {
    checkForUpdates,
    applyUpdate,
    pauseAutoCheck,
    resumeAutoCheck,
    isChecking,
    hasUpdate,
    currentVersion,
    latestVersion,
    updatePriority,
    error
  };
}

/**
 * Simplified auto update Hook
 * Uses default configuration, suitable for most scenarios
 */
export function useSimpleAutoUpdate() {
  return useAutoUpdate({
    enabled: true,
    checkOnMount: true,
    checkOnFocus: true,
    autoUpdateThreshold: 'medium'
  });
}