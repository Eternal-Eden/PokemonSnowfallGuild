'use client';

import React, { useState, useEffect } from 'react';
import { ForumActivity, ActivityRestrictionType } from '@/types/forum';
import { getForumActivities, registerForActivity } from '@/lib/forumService';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Users, Gift, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import ActivityDetailModal from './ActivityDetailModal';

interface ActivitySectionProps {
  className?: string;
}

export default function ActivitySection({ className = '' }: ActivitySectionProps) {
  const { state } = useAuth();
  const user = state.user;
  const [activities, setActivities] = useState<ForumActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ForumActivity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const data = await getForumActivities();
      setActivities(data);
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
        // 重新加载活动数据
        await loadActivities();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '报名失败，请稍后重试' });
    } finally {
      setRegistering(null);
      // 3秒后清除消息
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

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Gift className="w-5 h-5 mr-2 text-purple-600" />
          活动报名
        </h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Gift className="w-5 h-5 mr-2 text-purple-600" />
          活动报名
        </h3>
      </div>

      {message && (
        <div className={`mx-4 mt-4 p-3 rounded-lg flex items-center ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 mr-2" />
          ) : (
            <AlertCircle className="w-4 h-4 mr-2" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      <div className="p-4 space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Gift className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无活动</p>
          </div>
        ) : (
          activities.map((activity) => {
            const isDeadlinePassed = new Date() > activity.registrationDeadline;
            const isFull = activity.maxParticipants && activity.currentParticipants >= activity.maxParticipants;
            const canRegister = !isDeadlinePassed && !isFull;
            
            return (
              <div 
                key={activity.id} 
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleActivityClick(activity)}
              >
                <div className="mb-3">
                  <h4 className="font-medium text-gray-900 mb-1">{activity.title}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">{activity.description}</p>
                </div>

                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span className={isDeadlinePassed ? 'text-red-500' : ''}>
                      {formatDeadline(activity.registrationDeadline)}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    <span>
                      {activity.currentParticipants}
                      {activity.maxParticipants && `/${activity.maxParticipants}`}
                      人已报名
                    </span>
                  </div>

                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>限制: {getRestrictionText(activity.restrictions)}</span>
                  </div>
                </div>

                {activity.rewards.length > 0 && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                    <div className="text-xs text-yellow-700 font-medium mb-1">奖励:</div>
                    <div className="text-xs text-yellow-600">
                      {activity.rewards.map((reward, index) => (
                        <span key={index}>
                          {reward.name} x{reward.quantity}
                          {index < activity.rewards.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-3">
                  {!user ? (
                    <button 
                      disabled
                      className="w-full py-2 px-3 text-sm bg-gray-100 text-gray-400 rounded cursor-not-allowed"
                    >
                      请先登录
                    </button>
                  ) : !canRegister ? (
                    <button 
                      disabled
                      className="w-full py-2 px-3 text-sm bg-gray-100 text-gray-400 rounded cursor-not-allowed"
                    >
                      {isDeadlinePassed ? '报名已截止' : isFull ? '报名已满' : '无法报名'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegister(activity.id)}
                      disabled={registering === activity.id}
                      className="w-full py-2 px-3 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {registering === activity.id ? '报名中...' : '立即报名'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <ActivityDetailModal
         activity={selectedActivity}
         isOpen={isModalOpen}
         onClose={() => setIsModalOpen(false)}
         onRegister={handleRegister}
         isRegistering={registering !== null}
         currentUserId={user?.id}
       />
    </div>
  );
}