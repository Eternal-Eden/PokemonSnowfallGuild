'use client';

import { useEffect } from 'react';
import { initPerformanceMonitor, destroyPerformanceMonitor } from '@/utils/performanceMonitor';

interface PerformanceMonitorProviderProps {
  children: React.ReactNode;
}

export default function PerformanceMonitorProvider({ children }: PerformanceMonitorProviderProps) {
  useEffect(() => {
    // 初始化性能监控
    const monitor = initPerformanceMonitor();
    
    // 页面可见性变化时更新停留时长
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // 页面隐藏时更新停留时长
        if (monitor) {
          monitor.updatePageStayDuration();
        }
      }
    };
    
    // 页面卸载前更新停留时长
    const handleBeforeUnload = () => {
      if (monitor) {
        monitor.updatePageStayDuration();
      }
    };
    
    // 添加事件监听器
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // 清理函数
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      destroyPerformanceMonitor();
    };
  }, []);
  
  return <>{children}</>;
}