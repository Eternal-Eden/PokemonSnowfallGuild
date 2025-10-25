'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Download,
  Settings,
  ChevronUp,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useUpdate } from '@/contexts/UpdateContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UpdateSettings from './UpdateSettings';
import { cn } from '@/lib/utils';

interface UpdateIndicatorProps {
  position?: 'bottom-left' | 'bottom-right' | 'bottom-center';
  className?: string;
}

export default function UpdateIndicator({ 
  position = 'bottom-right', 
  className = '' 
}: UpdateIndicatorProps) {
  const { state, checkForUpdates, applyUpdate, preferences } = useUpdate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // 监听网络状态
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 获取位置样式
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
      default:
        return 'bottom-4 right-4';
    }
  };

  // 获取状态配置
  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        color: 'text-gray-500',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        status: '离线',
        description: '网络连接已断开'
      };
    }

    if (state.isChecking) {
      return {
        icon: RefreshCw,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        status: '检查中',
        description: '正在检查更新...'
      };
    }

    if (state.error) {
      return {
        icon: AlertCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        status: '错误',
        description: state.error
      };
    }

    if (state.hasUpdate) {
      return {
        icon: Download,
        color: 'text-orange-500',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        status: '有更新',
        description: `v${state.latestVersion} 可用`
      };
    }

    return {
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      status: '最新',
      description: `v${state.currentVersion}`
    };
  };

  const statusConfig = getStatusConfig();
  const Icon = statusConfig.icon;

  // 如果用户禁用了通知且没有错误，不显示指示器
  if (!preferences.notificationEnabled && !state.error && !state.hasUpdate) {
    return null;
  }

  return (
    <div className={cn('fixed z-40', getPositionClasses(), className)}>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          {/* 展开的面板 */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'absolute bottom-full mb-2 min-w-64 rounded-lg border shadow-lg backdrop-blur-sm',
                  statusConfig.bgColor,
                  position === 'bottom-center' ? 'left-1/2 transform -translate-x-1/2' : 
                  position === 'bottom-left' ? 'left-0' : 'right-0'
                )}
              >
                <div className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Icon className={cn('w-5 h-5', statusConfig.color, {
                      'animate-spin': state.isChecking
                    })} />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {statusConfig.status}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {statusConfig.description}
                      </p>
                    </div>
                    {state.hasUpdate && (
                      <Badge variant="secondary" className="text-xs">
                        v{state.latestVersion}
                      </Badge>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center space-x-2">
                    {state.hasUpdate && (
                      <Button
                        size="sm"
                        onClick={applyUpdate}
                        className="flex-1"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        更新
                      </Button>
                    )}
                    
                    {!state.isChecking && isOnline && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={checkForUpdates}
                        className={state.hasUpdate ? '' : 'flex-1'}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        检查
                      </Button>
                    )}
                    
                    <UpdateSettings
                      trigger={
                        <Button size="sm" variant="ghost">
                          <Settings className="w-3 h-3" />
                        </Button>
                      }
                    />
                  </div>

                  {/* 网络状态提示 */}
                  {!isOnline && (
                    <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
                      <div className="flex items-center space-x-1">
                        <WifiOff className="w-3 h-3" />
                        <span>网络连接已断开，无法检查更新</span>
                      </div>
                    </div>
                  )}

                  {/* 最后检查时间 */}
                  {state.lastCheckTime && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      上次检查: {new Date(state.lastCheckTime).toLocaleTimeString('zh-CN')}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 主按钮 */}
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'flex items-center space-x-2 px-3 py-2 rounded-full border shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl',
              statusConfig.bgColor,
              'hover:scale-105 active:scale-95'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon className={cn('w-4 h-4', statusConfig.color, {
              'animate-spin': state.isChecking
            })} />
            
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {statusConfig.status}
            </span>
            
            {state.hasUpdate && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                !
              </Badge>
            )}
            
            <ChevronUp className={cn(
              'w-3 h-3 text-gray-500 transition-transform duration-200',
              isExpanded ? 'rotate-180' : ''
            )} />
          </motion.button>

          {/* 网络状态指示器 */}
          <div className="absolute -top-1 -right-1">
            <div className={cn(
              'w-3 h-3 rounded-full border-2 border-white dark:border-gray-800',
              isOnline ? 'bg-green-500' : 'bg-red-500'
            )} />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}