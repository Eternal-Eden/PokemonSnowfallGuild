'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  MailOpen,
  Bell,
  BellRing,
  AlertTriangle,
  Info,
  CheckCircle,
  Megaphone,
  Shield,
  Settings,
  Eye,
  ArrowRight
} from 'lucide-react';
import { useMessage } from '@/contexts/MessageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Message, MessageCategory, MessagePriority, MessageStatus } from '@/types/message';
import { Module } from '@/lib/moduleLoader';

// 消息分类图标映射
const categoryIcons = {
  [MessageCategory.SYSTEM]: Settings,
  [MessageCategory.NOTIFICATION]: CheckCircle,
  [MessageCategory.REMINDER]: AlertTriangle,
  [MessageCategory.ANNOUNCEMENT]: Megaphone
};

// 消息分类颜色映射
const categoryColors = {
  [MessageCategory.SYSTEM]: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  [MessageCategory.NOTIFICATION]: 'text-green-600 bg-green-100 dark:bg-green-900/30',
  [MessageCategory.REMINDER]: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
  [MessageCategory.ANNOUNCEMENT]: 'text-red-600 bg-red-100 dark:bg-red-900/30'
};

// 优先级颜色映射
const priorityColors = {
  [MessagePriority.LOW]: 'border-l-gray-400',
  [MessagePriority.NORMAL]: 'border-l-blue-400',
  [MessagePriority.HIGH]: 'border-l-orange-400',
  [MessagePriority.URGENT]: 'border-l-red-500'
};

interface MessageSummaryProps {
  onViewAll?: () => void;
}

function MessageSummaryComponent({ onViewAll }: MessageSummaryProps) {
  const { state, loadUserMessages, markAsRead } = useMessage();
  const { state: authState } = useAuth();
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (authState.user) {
      loadUserMessages({ limit: 5 });
    }
  }, [authState.user, loadUserMessages]);

  useEffect(() => {
    // 获取最近的5条消息
    const recent = state.messages.slice(0, 5);
    setRecentMessages(recent);
  }, [state.messages]);

  // 获取消息状态
  const getMessageStatus = (message: Message): MessageStatus => {
    if (!authState.user) return MessageStatus.UNREAD;
    const recipient = message.recipients.find(r => r.username === authState.user!.username);
    return recipient?.status || MessageStatus.UNREAD;
  };

  // 处理消息点击
  const handleMessageClick = async (message: Message) => {
    if (!authState.user) return;
    
    const recipient = message.recipients.find(r => r.username === authState.user!.username);
    if (recipient && recipient.status === MessageStatus.UNREAD) {
      await markAsRead(message.id);
    }
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  // 统计信息
  const stats = {
    total: state.messages.length,
    unread: state.messages.filter(m => {
      if (!authState.user) return false;
      const recipient = m.recipients.find(r => r.username === authState.user!.username);
      return recipient?.status === MessageStatus.UNREAD;
    }).length,
    urgent: state.messages.filter(m => {
      if (!authState.user) return false;
      const recipient = m.recipients.find(r => r.username === authState.user!.username);
      return recipient?.status === MessageStatus.UNREAD && m.priority === MessagePriority.URGENT;
    }).length
  };

  if (!authState.user) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      {/* 头部 */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              站内信
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              消息通知与提醒
            </p>
          </div>
        </div>
        
        {/* 统计信息 */}
        <div className="flex items-center space-x-4">
          {stats.urgent > 0 && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
              <BellRing className="w-4 h-4" />
              <span className="text-xs font-medium">{stats.urgent} 紧急</span>
            </div>
          )}
          
          {stats.unread > 0 && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
              <Bell className="w-4 h-4" />
              <span className="text-xs font-medium">{stats.unread} 未读</span>
            </div>
          )}
          
          <button
            onClick={onViewAll}
            className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            <span>查看全部</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* 消息列表 */}
      <div className="p-6">
        {state.loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : recentMessages.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">暂无消息</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentMessages.map((message) => {
              const status = getMessageStatus(message);
              const isUnread = status === MessageStatus.UNREAD;
              const IconComponent = categoryIcons[message.category];
              
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    priorityColors[message.priority]
                  } ${
                    isUnread ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-gray-50 dark:bg-gray-700/30'
                  }`}
                  onClick={() => handleMessageClick(message)}
                >
                  <div className="flex items-start space-x-3">
                    {/* 消息图标 */}
                    <div className={`p-2 rounded-lg ${categoryColors[message.category]}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    
                    {/* 消息内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className={`text-sm font-medium truncate ${
                          isUnread ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {message.title}
                        </h4>
                        
                        {isUnread && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                        
                        {message.priority === MessagePriority.URGENT && (
                          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-2">
                        {message.content}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                        <span>来自: {message.senderName}</span>
                        <span>{formatTime(message.createdAt)}</span>
                      </div>
                    </div>
                    
                    {/* 状态图标 */}
                    <div className="flex-shrink-0">
                      {isUnread ? (
                        <Mail className="w-4 h-4 text-blue-500" />
                      ) : (
                        <MailOpen className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        
        {/* 底部操作 */}
        {recentMessages.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onViewAll}
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>查看所有消息</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// 使用装饰器注册模块
export default Module({
  id: 'message-summary',
  name: '站内信摘要',
  position: 'sidebar',
  order: 2
})(MessageSummaryComponent);