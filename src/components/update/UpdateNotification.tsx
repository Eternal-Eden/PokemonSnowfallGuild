'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Download,
  RefreshCw,
  X,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Settings
} from 'lucide-react';
import { useUpdate } from '@/contexts/UpdateContext';
import { UpdatePriority } from '@/types/version';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UpdateNotificationProps {
  className?: string;
}

export default function UpdateNotification({ className = '' }: UpdateNotificationProps) {
  const { state, applyUpdate, dismissNotification, skipVersion, preferences, updatePreferences } = useUpdate();
  const [showDetails, setShowDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 获取优先级配置
  const getPriorityConfig = (priority: UpdatePriority) => {
    switch (priority) {
      case 'critical':
        return {
          icon: AlertTriangle,
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          badgeVariant: 'destructive' as const,
          title: '重要更新',
          urgency: '需要立即更新'
        };
      case 'important':
        return {
          icon: AlertCircle,
          color: 'text-orange-500',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          borderColor: 'border-orange-200 dark:border-orange-800',
          badgeVariant: 'secondary' as const,
          title: '功能更新',
          urgency: '建议尽快更新'
        };
      default:
        return {
          icon: Info,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          badgeVariant: 'outline' as const,
          title: '常规更新',
          urgency: '可选择更新'
        };
    }
  };

  // 处理更新
  const handleUpdate = async () => {
    setIsUpdating(true);
    
    // 显示倒计时
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          applyUpdate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 处理稍后提醒
  const handleRemindLater = () => {
    dismissNotification();
    // 设置下次提醒时间（30分钟后）
    updatePreferences({
      lastNotificationTime: Date.now() + 30 * 60 * 1000
    });
  };

  // 处理跳过版本
  const handleSkipVersion = () => {
    if (state.latestVersion) {
      skipVersion(state.latestVersion);
    }
  };

  // 如果没有更新或用户禁用了通知，不显示
  if (!state.hasUpdate || !preferences.notificationEnabled) {
    return null;
  }

  const priorityConfig = getPriorityConfig(state.updatePriority || 'normal');
  const Icon = priorityConfig.icon;

  return (
    <>
      <AnimatePresence>
        {state.hasUpdate && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`fixed top-4 right-4 z-50 max-w-md ${className}`}
          >
            <div className={`rounded-lg border-2 shadow-lg backdrop-blur-sm ${priorityConfig.bgColor} ${priorityConfig.borderColor}`}>
              <div className="p-4">
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 ${priorityConfig.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {priorityConfig.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant={priorityConfig.badgeVariant} className="text-xs">
                          v{state.latestVersion}
                        </Badge>
                        <button
                          onClick={dismissNotification}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      {priorityConfig.urgency}
                    </p>
                    
                    {state.changelog && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                        {state.changelog.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={handleUpdate}
                        disabled={isUpdating}
                        className="flex items-center space-x-1"
                      >
                        {isUpdating ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>{countdown > 0 ? `${countdown}s` : '更新中...'}</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3 h-3" />
                            <span>立即更新</span>
                          </>
                        )}
                      </Button>
                      
                      {state.changelog && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowDetails(true)}
                        >
                          查看详情
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleRemindLater}
                        className="text-xs"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        稍后
                      </Button>
                      
                      {state.updatePriority !== 'critical' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleSkipVersion}
                          className="text-xs text-gray-500"
                        >
                          跳过
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 更新详情对话框 */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Icon className={`w-5 h-5 ${priorityConfig.color}`} />
              <span>版本更新详情</span>
              <Badge variant={priorityConfig.badgeVariant}>
                v{state.currentVersion} → v{state.latestVersion}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              {state.changelog?.title}
            </DialogDescription>
          </DialogHeader>
          
          {state.changelog && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {state.changelog.description}
                </p>
              </div>
              
              {state.changelog.features.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    新功能
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    {state.changelog.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {state.changelog.fixes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center">
                    <Settings className="w-4 h-4 mr-1" />
                    问题修复
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    {state.changelog.fixes.map((fix, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        {fix}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {state.changelog.breaking.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    重要变更
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    {state.changelog.breaking.map((change, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-xs text-gray-500">
                  发布时间: {state.changelog.date}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetails(false)}
                  >
                    稍后更新
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDetails(false);
                      handleUpdate();
                    }}
                    disabled={isUpdating}
                  >
                    {isUpdating ? '更新中...' : '立即更新'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}