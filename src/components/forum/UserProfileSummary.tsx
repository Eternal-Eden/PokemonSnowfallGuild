'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Calendar, 
  Clock, 
  MessageSquare, 
  Heart, 
  Trophy,
  Star,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import UserAvatar from '@/components/UserAvatar';
import { getUserProfile, getUserStats } from '@/services/userProfileService';
import { UserProfile, UserStats } from '@/types/auth';

interface UserProfileSummaryProps {
  className?: string;
}

export default function UserProfileSummary({ className = '' }: UserProfileSummaryProps) {
  const { state } = useAuth();
  const router = useRouter();
  const user = state.user;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      const [profileData, statsData] = await Promise.all([
        getUserProfile(user.id),
        getUserStats()
      ]);
      
      // 处理getUserProfile返回的复杂对象
      if (profileData && typeof profileData === 'object' && 'profile' in profileData) {
        setProfile((profileData as any).profile || null);
      } else {
        setProfile(profileData as UserProfile | null);
      }
      
      setStats(statsData);
    } catch (error) {
      console.error('加载用户数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatOnlineTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}天${hours % 24}小时`;
    } else if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  };

  const formatJoinDate = (date: Date | string | null | undefined) => {
    if (!date) return '未知';
    
    // 确保date是Date对象
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // 检查日期是否有效
    if (isNaN(dateObj.getTime())) {
      return '未知';
    }
    
    return dateObj.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleProfileClick = () => {
    if (user) {
      router.push(`/profile/${user.id}`);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-4/5"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/5"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-4 text-center ${className}`}>
        <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">请先登录</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden ${className}`}
    >
      {/* 头部用户信息 */}
      <div className="p-4">
        <div className="flex items-center space-x-3">
          <UserAvatar
            user={{
              ...user,
              isOnline: true
            }}
            size="lg"
            showStatus
            showRoleBadge={false}
            clickable
            onClick={handleProfileClick}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {user.gameNickname || user.username}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              @{user.username}
            </p>
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {stats?.postsCount || 0}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">发帖数</div>
          </div>
          
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Heart className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-lg font-semibold text-red-600 dark:text-red-400">
              {stats?.likesReceived || 0}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">获赞数</div>
          </div>
        </div>

        {/* 详细信息 */}
        <div className="space-y-3 text-sm">
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              {formatJoinDate(profile?.joinedAt)} 加入
            </span>
          </div>
          
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              在线时长 {profile?.onlineTime ? formatOnlineTime(profile.onlineTime) : '0分钟'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <Trophy className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              声望值 {(stats as any)?.reputation || 0}
            </span>
          </div>
        </div>

        {/* 发帖按钮 */}
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              // 触发发帖功能
              const createPostEvent = new CustomEvent('openCreatePost');
              window.dispatchEvent(createPostEvent);
            }}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            <Settings className="w-4 h-4" />
            <span>发帖</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}