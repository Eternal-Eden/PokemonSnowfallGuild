'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  Gift, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Activity
} from 'lucide-react';
import { ForumActivity, ActivityRestrictionType } from '@/types/forum';
import { getForumActivities, getHistoryForumActivities, registerForActivity } from '@/lib/forumService';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ActivityDetailModal from './ActivityDetailModal';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface IntegratedActivitySectionProps {
  className?: string;
}

export default function IntegratedActivitySection({ className = '' }: IntegratedActivitySectionProps) {
  const { state } = useAuth();
  const user = state.user;
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [currentActivities, setCurrentActivities] = useState<ForumActivity[]>([]);
  const [historyActivities, setHistoryActivities] = useState<ForumActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ForumActivity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const [currentData, historyData] = await Promise.all([
        getForumActivities(),
        getHistoryForumActivities()
      ]);
      setCurrentActivities(currentData);
      setHistoryActivities(historyData);
    } catch (error) {
      console.error('加载活动失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (activityId: string) => {
    if (!user) {
      setMessage({ type: 'error', text: '请先登录' });
      return;
    }

    setRegistering(activityId);
    try {
      const result = await registerForActivity(
        user.id,
        user.username,
        user.avatarUrl || '/avatars/default.png',
        user.role,
        { activityId }
      );

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        await loadActivities();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '报名失败，请稍后重试' });
    } finally {
      setRegistering(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleActivityClick = (activity: ForumActivity) => {
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  const formatDeadline = (deadline: Date) => {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) {
      return '已截止';
    } else if (days === 0) {
      return '今日截止';
    } else if (days === 1) {
      return '明日截止';
    } else {
      return `${days}天后截止`;
    }
  };

  const getRestrictionText = (restriction: any) => {
    if (!restriction || restriction.type === ActivityRestrictionType.NONE) {
      return '无限制';
    }
    
    switch (restriction.type) {
      case ActivityRestrictionType.ROLE:
        return `${restriction.minRole || ''}角色限制`;
      case ActivityRestrictionType.LEVEL:
        return `等级${restriction.minLevel || 0}+`;
      case ActivityRestrictionType.CUSTOM:
        return restriction.customRequirement || '自定义限制';
      default:
        return '无限制';
    }
  };

  // 分页逻辑
  const getCurrentActivity = () => {
    const allActivities = activeTab === 'current' ? currentActivities : historyActivities;
    return allActivities[currentPage] || null;
  };
  
  const getTotalPages = () => {
    const allActivities = activeTab === 'current' ? currentActivities : historyActivities;
    return allActivities.length;
  };
  
  const handlePageChange = (direction: 'prev' | 'next') => {
    const totalPages = getTotalPages();
    if (direction === 'prev' && currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else if (direction === 'next' && currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  // 切换标签页时重置页码
  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab]);

  if (loading) {
    return (
      <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">活动中心</h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  const currentActivity = getCurrentActivity();
  const totalPages = getTotalPages();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden ${className}`}
      >
        {/* 头部和标签页 */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-purple-600" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">活动中心</h3>
            </div>
            
            {/* 分页控制 */}
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange('prev')}
                  disabled={currentPage === 0}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {currentPage + 1}/{totalPages}
                </span>
                <button
                  onClick={() => handlePageChange('next')}
                  disabled={currentPage === totalPages - 1}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          {/* 标签页 */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('current')}
              className={`flex-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'current'
                  ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              进行中 ({currentActivities.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              历史活动 ({historyActivities.length})
            </button>
          </div>
        </div>

        {/* 消息提示 */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mx-4 mt-4 p-3 rounded-lg flex items-center ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
                  : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <AlertCircle className="w-4 h-4 mr-2" />
              )}
              <span className="text-sm">{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 内容区域 - 单个活动显示 */}
        <div className="p-3">
          <AnimatePresence mode="wait">
            {!currentActivity ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-6 text-gray-500 dark:text-gray-400"
              >
                {activeTab === 'current' ? (
                  <>
                    <Gift className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm">暂无进行中的活动</p>
                  </>
                ) : (
                  <>
                    <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm">暂无历史活动</p>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key={`${activeTab}-${currentPage}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="cursor-pointer"
                onClick={() => handleActivityClick(currentActivity)}
              >
                {activeTab === 'current' ? (
                  // 进行中的活动
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:shadow-md transition-shadow">
                    <div className="mb-2">
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1 line-clamp-1">
                        {currentActivity.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {currentActivity.description}
                      </p>
                    </div>

                    <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span className={new Date() > currentActivity.registrationDeadline ? 'text-red-500' : ''}>
                          {formatDeadline(currentActivity.registrationDeadline)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          <span>
                            {currentActivity.currentParticipants}
                            {currentActivity.maxParticipants && `/${currentActivity.maxParticipants}`}
                            人已报名
                          </span>
                        </div>
                        
                        {(() => {
                          const isDeadlinePassed = new Date() > currentActivity.registrationDeadline;
                          const isFull = currentActivity.maxParticipants && currentActivity.currentParticipants >= currentActivity.maxParticipants;
                          const canRegister = !isDeadlinePassed && !isFull;
                          
                          return canRegister && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRegister(currentActivity.id);
                              }}
                              disabled={registering === currentActivity.id}
                              className="h-5 px-2 text-xs"
                            >
                              {registering === currentActivity.id ? '报名中...' : '立即报名'}
                            </Button>
                          );
                        })()}
                      </div>
                    </div>

                    {currentActivity.rewards.length > 0 && (
                      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                        <div className="text-xs text-yellow-700 dark:text-yellow-400 font-medium mb-1">奖励:</div>
                        <div className="text-xs text-yellow-600 dark:text-yellow-500">
                          {currentActivity.rewards.slice(0, 2).map((reward, index) => (
                            <span key={index}>
                              {reward.name}
                              {index < Math.min(currentActivity.rewards.length, 2) - 1 && ', '}
                            </span>
                          ))}
                          {currentActivity.rewards.length > 2 && ' 等'}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // 历史活动
                  <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm line-clamp-1 text-gray-900 dark:text-white">
                        {currentActivity.title}
                      </h4>
                      <Badge variant="secondary" className="text-xs ml-2">
                        已结束
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {currentActivity.description}
                    </p>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(currentActivity.startTime), 'MM月dd日', { locale: zhCN })}
                          {' - '}
                          {format(new Date(currentActivity.endTime), 'MM月dd日', { locale: zhCN })}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Users className="h-3 w-3" />
                          <span>{currentActivity.currentParticipants}人参与</span>
                        </div>
                        
                        {currentActivity.rewards && currentActivity.rewards.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-500">
                            <Gift className="h-3 w-3" />
                            <span>{currentActivity.rewards.length}个奖励</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      
      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedActivity(null);
        }}
        currentUserId={user?.id}
      />
    </>
  );
}