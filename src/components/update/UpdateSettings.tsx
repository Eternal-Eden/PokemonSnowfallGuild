'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Bell,
  BellOff,
  RefreshCw,
  Clock,
  Shield,
  Info,
  CheckCircle,
  X,
  Download
} from 'lucide-react';
import { useUpdate } from '@/contexts/UpdateContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface UpdateSettingsProps {
  trigger?: React.ReactNode;
  className?: string;
}

export default function UpdateSettings({ trigger, className = '' }: UpdateSettingsProps) {
  const { state, checkForUpdates, preferences, updatePreferences } = useUpdate();
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // 检查间隔选项
  const intervalOptions = [
    { value: '300000', label: '5分钟' },
    { value: '600000', label: '10分钟' },
    { value: '1800000', label: '30分钟' },
    { value: '3600000', label: '1小时' },
    { value: '21600000', label: '6小时' },
    { value: '86400000', label: '24小时' }
  ];

  // 手动检查更新
  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      await checkForUpdates();
    } finally {
      setIsChecking(false);
    }
  };

  // 清除跳过的版本
  const clearSkippedVersions = () => {
    updatePreferences({ skipVersions: [] });
  };

  // 重置所有设置
  const resetSettings = () => {
    updatePreferences({
      autoUpdate: false,
      notificationEnabled: true,
      skipVersions: [],
      lastCheckTime: 0,
      lastNotificationTime: 0
    });
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    if (!timestamp) return '从未';
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  // 格式化间隔时间
  const formatInterval = (ms: number) => {
    const option = intervalOptions.find(opt => opt.value === ms.toString());
    return option?.label || `${ms / 1000 / 60}分钟`;
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="flex items-center space-x-2">
      <Settings className="w-4 h-4" />
      <span>更新设置</span>
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className={`max-w-2xl max-h-[80vh] overflow-y-auto ${className}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>更新设置</span>
          </DialogTitle>
          <DialogDescription>
            配置应用更新检查和通知偏好
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 当前版本信息 */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                版本信息
              </h3>
              <Badge variant="outline">
                v{state.currentVersion}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">当前版本:</span>
                <span className="ml-2 font-medium">{state.currentVersion}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">最新版本:</span>
                <span className="ml-2 font-medium">{state.latestVersion}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">上次检查:</span>
                <span className="ml-2 font-medium">{formatTime(state.lastCheckTime || 0)}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">更新状态:</span>
                <span className="ml-2">
                  {state.hasUpdate ? (
                    <Badge variant="secondary" className="text-xs">
                      有更新
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      最新
                    </Badge>
                  )}
                </span>
              </div>
            </div>
            
            <div className="mt-4">
              <Button
                onClick={handleManualCheck}
                disabled={isChecking || state.isChecking}
                size="sm"
                className="w-full"
              >
                {isChecking || state.isChecking ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    检查中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    手动检查更新
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* 通知设置 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
              <Bell className="w-4 h-4 mr-2" />
              通知设置
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="notifications">启用更新通知</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    当有新版本时显示通知
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={preferences.notificationEnabled}
                  onCheckedChange={(checked: boolean) => 
                    updatePreferences({ notificationEnabled: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-update">自动检查更新</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    定期自动检查新版本
                  </p>
                </div>
                <Switch
                  id="auto-update"
                  checked={preferences.autoUpdate}
                  onCheckedChange={(checked: boolean) => 
                    updatePreferences({ autoUpdate: checked })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* 检查频率设置 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              检查频率
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="check-interval">检查间隔</Label>
              <Select
                value="300000" // 默认5分钟，这里应该从配置中读取
                onValueChange={(value: string) => {
                  // 这里需要更新配置文件或通过API更新
                  console.log('Update check interval:', value);
                }}
                disabled={!preferences.autoUpdate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择检查间隔" />
                </SelectTrigger>
                <SelectContent>
                  {intervalOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                设置自动检查更新的时间间隔
              </p>
            </div>
          </div>

          <Separator />

          {/* 跳过的版本 */}
          {preferences.skipVersions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                跳过的版本
              </h3>
              
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {preferences.skipVersions.map((version) => (
                    <Badge key={version} variant="secondary" className="flex items-center space-x-1">
                      <span>v{version}</span>
                      <button
                        onClick={() => {
                          const updated = preferences.skipVersions.filter(v => v !== version);
                          updatePreferences({ skipVersions: updated });
                        }}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSkippedVersions}
                  className="text-xs"
                >
                  清除所有跳过的版本
                </Button>
              </div>
            </div>
          )}

          <Separator />

          {/* 操作按钮 */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={resetSettings}
              className="text-sm"
            >
              重置设置
            </Button>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                取消
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                保存
              </Button>
            </div>
          </div>

          {/* 帮助信息 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">关于更新检查</p>
                <ul className="text-xs space-y-1 text-blue-600 dark:text-blue-400">
                  <li>• 重要更新会强制显示通知，无法跳过</li>
                  <li>• 跳过的版本不会再次提醒，直到有新版本</li>
                  <li>• 自动检查仅在页面活跃时进行</li>
                  <li>• 更新会刷新页面，请保存未完成的工作</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}