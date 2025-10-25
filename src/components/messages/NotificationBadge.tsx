'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellRing } from 'lucide-react';
import { useMessage } from '@/contexts/MessageContext';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationBadgeProps {
  className?: string;
  showIcon?: boolean;
  onClick?: () => void;
}

export default function NotificationBadge({ 
  className = '', 
  showIcon = true, 
  onClick 
}: NotificationBadgeProps) {
  const { state, refreshBadges } = useMessage();
  const { state: authState } = useAuth();

  // 定期刷新红点数据
  useEffect(() => {
    if (!authState.user) return;
    
    // 立即刷新一次
    refreshBadges();
    
    // 每30秒刷新一次
    const interval = setInterval(() => {
      refreshBadges();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [authState.user, refreshBadges]);

  const badge = state.badges?.[0];
  const hasUnread = badge && badge.unreadCount > 0;
  const hasUrgent = badge && badge.urgentCount > 0;

  if (!authState.user || !badge) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* 图标 */}
      {showIcon && (
        <button
          onClick={onClick}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative"
          title={hasUnread ? `${badge.unreadCount} 条未读消息` : '无未读消息'}
        >
          {hasUrgent ? (
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            >
              <BellRing className="w-5 h-5" />
            </motion.div>
          ) : (
            <Bell className="w-5 h-5" />
          )}
          
          {/* 红点 */}
          <AnimatePresence>
            {hasUnread && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-xs font-medium text-white rounded-full ${
                  hasUrgent ? 'bg-red-500' : 'bg-blue-500'
                }`}
              >
                {badge.unreadCount > 99 ? '99+' : badge.unreadCount}
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      )}
      
      {/* 仅红点模式 */}
      {!showIcon && hasUnread && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className={`min-w-[18px] h-[18px] flex items-center justify-center text-xs font-medium text-white rounded-full ${
            hasUrgent ? 'bg-red-500' : 'bg-blue-500'
          }`}
          onClick={onClick}
        >
          {badge.unreadCount > 99 ? '99+' : badge.unreadCount}
        </motion.div>
      )}
    </div>
  );
}

// 简化的红点组件，只显示数字
export function SimpleBadge({ count, urgent = false }: { count: number; urgent?: boolean }) {
  if (count <= 0) return null;
  
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      className={`min-w-[18px] h-[18px] flex items-center justify-center text-xs font-medium text-white rounded-full ${
        urgent ? 'bg-red-500' : 'bg-blue-500'
      }`}
    >
      {count > 99 ? '99+' : count}
    </motion.div>
  );
}

// 带文字的通知组件
export function NotificationText({ className = '' }: { className?: string }) {
  const { state } = useMessage();
  const { state: authState } = useAuth();

  const badge = state.badges?.[0];
  
  if (!authState.user || !badge || badge.unreadCount === 0) {
    return null;
  }
  const hasUrgent = badge.urgentCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
        hasUrgent 
          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
      } ${className}`}
    >
      {hasUrgent ? (
        <BellRing className="w-4 h-4" />
      ) : (
        <Bell className="w-4 h-4" />
      )}
      <span>
        {badge.unreadCount} 条未读消息
        {hasUrgent && ` (${badge.urgentCount} 条紧急)`}
      </span>
    </motion.div>
  );
}

// 消息分类红点
export function CategoryBadge({ 
  category, 
  count, 
  className = '' 
}: { 
  category: string; 
  count: number; 
  className?: string; 
}) {
  if (count <= 0) return null;
  
  const categoryColors = {
    system: 'bg-blue-500',
    notification: 'bg-green-500',
    reminder: 'bg-orange-500',
    announcement: 'bg-red-500'
  };
  
  const color = categoryColors[category as keyof typeof categoryColors] || 'bg-gray-500';
  
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      className={`min-w-[16px] h-[16px] flex items-center justify-center text-xs font-medium text-white rounded-full ${color} ${className}`}
    >
      {count > 9 ? '9+' : count}
    </motion.div>
  );
}