'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Calendar,
  Tag,
  Plus,
  Bug,
  AlertTriangle,
  CheckCircle,
  Settings,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Download
} from 'lucide-react';
import { ChangelogEntry, UpdateType, VersionConfig } from '@/types/version';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import versionConfig from '@/config/version.json';

interface ChangelogViewerProps {
  trigger?: React.ReactNode;
  className?: string;
  maxVersions?: number;
  showOnlyLatest?: boolean;
}

export default function ChangelogViewer({ 
  trigger, 
  className = '',
  maxVersions = 10,
  showOnlyLatest = false
}: ChangelogViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [changelog, setChangelog] = useState<Record<string, ChangelogEntry>>({});

  // 加载更新日志
  useEffect(() => {
    const config = versionConfig as VersionConfig;
    setChangelog(config.changelog);
    
    // 默认展开最新版本
    if (Object.keys(config.changelog).length > 0) {
      const latestVersion = Object.keys(config.changelog).sort((a, b) => 
        compareVersions(b, a)
      )[0];
      setExpandedVersions(new Set([latestVersion]));
    }
  }, []);

  // 版本比较函数
  const compareVersions = (version1: string, version2: string): number => {
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
  };

  // 获取排序后的版本列表
  const getSortedVersions = (): string[] => {
    const versions = Object.keys(changelog).sort((a, b) => compareVersions(b, a));
    
    if (showOnlyLatest) {
      return versions.slice(0, 1);
    }
    
    return versions.slice(0, maxVersions);
  };

  // 切换版本展开状态
  const toggleVersion = (version: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(version)) {
      newExpanded.delete(version);
    } else {
      newExpanded.add(version);
    }
    setExpandedVersions(newExpanded);
  };

  // 获取更新类型配置
  const getUpdateTypeConfig = (type: UpdateType) => {
    switch (type) {
      case 'major':
        return {
          icon: Sparkles,
          color: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          borderColor: 'border-purple-200 dark:border-purple-800',
          label: '重大更新',
          badgeVariant: 'default' as const
        };
      case 'minor':
        return {
          icon: Plus,
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          label: '功能更新',
          badgeVariant: 'secondary' as const
        };
      case 'patch':
        return {
          icon: Bug,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          label: '修复更新',
          badgeVariant: 'outline' as const
        };
      default:
        return {
          icon: Settings,
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          label: '其他更新',
          badgeVariant: 'outline' as const
        };
    }
  };

  // 渲染变更项目
  const renderChangeItems = (items: string[], icon: React.ComponentType<any>, color: string, title: string) => {
    if (items.length === 0) return null;

    const Icon = icon;
    
    return (
      <div className="space-y-2">
        <h4 className={`text-sm font-semibold flex items-center ${color}`}>
          <Icon className="w-4 h-4 mr-2" />
          {title} ({items.length})
        </h4>
        <ul className="space-y-1">
          {items.map((item, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start text-sm text-gray-600 dark:text-gray-300"
            >
              <span className={`${color} mr-2 mt-1`}>•</span>
              <span>{item}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    );
  };

  // 渲染版本条目
  const renderVersionEntry = (version: string, entry: ChangelogEntry) => {
    const typeConfig = getUpdateTypeConfig(entry.type);
    const Icon = typeConfig.icon;
    const isExpanded = expandedVersions.has(version);
    
    const hasChanges = entry.features.length > 0 || entry.fixes.length > 0 || entry.breaking.length > 0;
    
    return (
      <motion.div
        key={version}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'border rounded-lg overflow-hidden',
          typeConfig.borderColor,
          typeConfig.bgColor
        )}
      >
        <div
          className="p-4 cursor-pointer hover:bg-opacity-80 transition-colors"
          onClick={() => hasChanges && toggleVersion(version)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Icon className={cn('w-5 h-5', typeConfig.color)} />
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    v{version}
                  </h3>
                  <Badge variant={typeConfig.badgeVariant} className="text-xs">
                    {typeConfig.label}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {entry.title}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="w-3 h-3 mr-1" />
                  {entry.date}
                </div>
                {hasChanges && (
                  <div className="text-xs text-gray-400 mt-1">
                    {entry.features.length + entry.fixes.length + entry.breaking.length} 项变更
                  </div>
                )}
              </div>
              
              {hasChanges && (
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </motion.div>
              )}
            </div>
          </div>
          
          {entry.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 pl-8">
              {entry.description}
            </p>
          )}
        </div>
        
        <AnimatePresence>
          {isExpanded && hasChanges && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-gray-200 dark:border-gray-700"
            >
              <div className="p-4 space-y-4">
                {renderChangeItems(
                  entry.features,
                  CheckCircle,
                  'text-green-600 dark:text-green-400',
                  '新功能'
                )}
                
                {renderChangeItems(
                  entry.fixes,
                  Settings,
                  'text-blue-600 dark:text-blue-400',
                  '问题修复'
                )}
                
                {renderChangeItems(
                  entry.breaking,
                  AlertTriangle,
                  'text-red-600 dark:text-red-400',
                  '重要变更'
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const sortedVersions = getSortedVersions();
  
  const defaultTrigger = (
    <Button variant="outline" size="sm" className="flex items-center space-x-2">
      <FileText className="w-4 h-4" />
      <span>更新日志</span>
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className={cn('max-w-4xl max-h-[80vh]', className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>更新日志</span>
            <Badge variant="outline" className="text-xs">
              {sortedVersions.length} 个版本
            </Badge>
          </DialogTitle>
          <DialogDescription>
            查看应用的版本历史和功能变更
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            {sortedVersions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  暂无更新日志
                </p>
              </div>
            ) : (
              sortedVersions.map((version) => 
                renderVersionEntry(version, changelog[version])
              )
            )}
          </div>
        </ScrollArea>
        
        <Separator />
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            显示最近 {sortedVersions.length} 个版本
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // 展开所有版本
                setExpandedVersions(new Set(sortedVersions));
              }}
            >
              展开全部
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // 收起所有版本
                setExpandedVersions(new Set());
              }}
            >
              收起全部
            </Button>
            
            <Button
              onClick={() => setIsOpen(false)}
            >
              关闭
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}