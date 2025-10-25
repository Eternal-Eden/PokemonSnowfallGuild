'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  MailOpen,
  Archive,
  Trash2,
  Filter,
  Search,
  CheckSquare,
  Square,
  MoreVertical,
  Bell,
  AlertTriangle,
  Info,
  Megaphone,
  Settings,
  RefreshCw,
  Eye,
  EyeOff,
  Shield
} from 'lucide-react';
import {
  Message,
  MessageCategory,
  MessagePriority,
  MessageStatus,
  MessageQueryParams,
  NotificationBadge
} from '@/types/message';
import { useMessage } from '@/contexts/MessageContext';
import { useAuth } from '@/contexts/AuthContext';

// 消息分类图标映射
const categoryIcons = {
  [MessageCategory.SYSTEM]: Settings,
  [MessageCategory.NOTIFICATION]: Bell,
  [MessageCategory.REMINDER]: AlertTriangle,
  [MessageCategory.ANNOUNCEMENT]: Megaphone
};

// 消息分类颜色映射
const categoryColors = {
  [MessageCategory.SYSTEM]: 'text-blue-600 bg-blue-100',
  [MessageCategory.NOTIFICATION]: 'text-green-600 bg-green-100',
  [MessageCategory.REMINDER]: 'text-orange-600 bg-orange-100',
  [MessageCategory.ANNOUNCEMENT]: 'text-red-600 bg-red-100'
};

// 优先级颜色映射
const priorityColors = {
  [MessagePriority.LOW]: 'border-l-gray-400',
  [MessagePriority.NORMAL]: 'border-l-blue-400',
  [MessagePriority.HIGH]: 'border-l-orange-400',
  [MessagePriority.URGENT]: 'border-l-red-500'
};

// 消息分类中文名称
const categoryNames = {
  [MessageCategory.SYSTEM]: '系统消息',
  [MessageCategory.NOTIFICATION]: '通知消息',
  [MessageCategory.REMINDER]: '提醒消息',
  [MessageCategory.ANNOUNCEMENT]: '公告消息'
};

interface MessageListProps {
  onMessageClick?: (message: Message) => void;
}

export default function MessageList({ onMessageClick }: MessageListProps) {
  const { state, loadUserMessages, markAsRead, batchUpdate, markAllAsRead, refreshBadges } = useMessage();
  const { state: authState } = useAuth();
  
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<MessageCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<MessageStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<MessagePriority | 'all'>('all');
  const [actionMenuMessage, setActionMenuMessage] = useState<string | null>(null);

  // 加载消息
  useEffect(() => {
    if (authState.user) {
      loadMessages();
    }
  }, [authState.user, categoryFilter, statusFilter, priorityFilter, searchTerm]);

  const loadMessages = () => {
    const params: MessageQueryParams = {
      page: 1,
      limit: 50
    };
    
    if (categoryFilter !== 'all') {
      params.category = categoryFilter;
    }
    
    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }
    
    if (priorityFilter !== 'all') {
      params.priority = priorityFilter;
    }
    
    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }
    
    loadUserMessages(params);
  };

  // 处理消息点击
  const handleMessageClick = async (message: Message) => {
    if (!authState.user) return;
    
    const recipient = message.recipients.find(r => r.username === authState.user!.username);
    if (recipient && recipient.status === MessageStatus.UNREAD) {
      await markAsRead(message.id);
    }
    
    onMessageClick?.(message);
  };

  // 处理选择消息
  const handleSelectMessage = (messageId: string) => {
    setSelectedMessages(prev => 
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedMessages.length === state.messages.length) {
      setSelectedMessages([]);
    } else {
      setSelectedMessages(state.messages.map(msg => msg.id));
    }
  };

  // 批量操作
  const handleBatchAction = async (action: 'markRead' | 'markUnread' | 'archive' | 'delete') => {
    if (selectedMessages.length === 0) return;
    
    await batchUpdate({
      messageIds: selectedMessages,
      action
    });
    
    setSelectedMessages([]);
  };

  // 一键已读
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  // 获取消息状态
  const getMessageStatus = (message: Message): MessageStatus => {
    if (!authState.user) return MessageStatus.UNREAD;
    
    const recipient = message.recipients.find(r => r.username === authState.user!.username);
    return recipient?.status || MessageStatus.UNREAD;
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

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* 头部工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            站内信
          </h2>
          
          {/* 红点通知 */}
          {state.badges.length > 0 && (
            <div className="flex space-x-2">
              {state.badges.map(badge => {
                const IconComponent = categoryIcons[badge.category];
                return (
                  <div key={badge.category} className="relative">
                    <IconComponent className={`w-5 h-5 ${categoryColors[badge.category]}`} />
                    <span className={`absolute -top-2 -right-2 min-w-[18px] h-[18px] text-xs font-bold text-white rounded-full flex items-center justify-center ${
                      badge.hasUrgent ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
                    }`}>
                      {badge.count > 99 ? '99+' : badge.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索消息..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* 筛选按钮 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border transition-colors ${
              showFilters
                ? 'bg-blue-50 border-blue-300 text-blue-600'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
          
          {/* 刷新按钮 */}
          <button
            onClick={loadMessages}
            disabled={state.loading}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${state.loading ? 'animate-spin' : ''}`} />
          </button>
          
          {/* 一键已读 */}
          <button
            onClick={handleMarkAllAsRead}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            一键已读
          </button>
        </div>
      </div>
      
      {/* 筛选面板 */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
          >
            <div className="p-4 flex flex-wrap gap-4">
              {/* 分类筛选 */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">分类:</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as MessageCategory | 'all')}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">全部</option>
                  {Object.entries(categoryNames).map(([key, name]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
              </div>
              
              {/* 状态筛选 */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">状态:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as MessageStatus | 'all')}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">全部</option>
                  <option value={MessageStatus.UNREAD}>未读</option>
                  <option value={MessageStatus.READ}>已读</option>
                  <option value={MessageStatus.ARCHIVED}>已归档</option>
                </select>
              </div>
              
              {/* 优先级筛选 */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">优先级:</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as MessagePriority | 'all')}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">全部</option>
                  <option value={MessagePriority.LOW}>低</option>
                  <option value={MessagePriority.NORMAL}>普通</option>
                  <option value={MessagePriority.HIGH}>高</option>
                  <option value={MessagePriority.URGENT}>紧急</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 批量操作工具栏 */}
      <AnimatePresence>
        {selectedMessages.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20"
          >
            <div className="p-3 flex items-center justify-between">
              <span className="text-sm text-blue-600 dark:text-blue-400">
                已选择 {selectedMessages.length} 条消息
              </span>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBatchAction('markRead')}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  标记已读
                </button>
                <button
                  onClick={() => handleBatchAction('markUnread')}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  标记未读
                </button>
                <button
                  onClick={() => handleBatchAction('archive')}
                  className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                >
                  归档
                </button>
                <button
                  onClick={() => handleBatchAction('delete')}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  删除
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto">
        {state.loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : state.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Mail className="w-16 h-16 mb-4" />
            <p className="text-lg">暂无消息</p>
            <p className="text-sm">您的消息将在这里显示</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {/* 全选按钮 */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800 flex items-center">
              <button
                onClick={handleSelectAll}
                className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                {selectedMessages.length === state.messages.length ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                <span>全选</span>
              </button>
            </div>
            
            {state.messages.map((message) => {
              const status = getMessageStatus(message);
              const isUnread = status === MessageStatus.UNREAD;
              const isSelected = selectedMessages.includes(message.id);
              const IconComponent = categoryIcons[message.category];
              
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-l-4 ${
                    priorityColors[message.priority]
                  } ${isUnread ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''} ${
                    isSelected ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                  }`}
                  onClick={() => handleMessageClick(message)}
                >
                  <div className="flex items-start space-x-3">
                    {/* 选择框 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectMessage(message.id);
                      }}
                      className="mt-1"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    
                    {/* 消息图标 */}
                    <div className={`p-2 rounded-lg ${categoryColors[message.category]}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    
                    {/* 消息内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <h3 className={`text-sm font-medium truncate ${
                            isUnread ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {message.title}
                          </h3>
                          
                          {/* 优先级标识 */}
                          {message.priority === MessagePriority.URGENT && (
                            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                              紧急
                            </span>
                          )}
                          
                          {message.priority === MessagePriority.HIGH && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">
                              重要
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {formatTime(message.createdAt)}
                          </span>
                          
                          {/* 状态图标 */}
                          {isUnread ? (
                            <Mail className="w-4 h-4 text-blue-600" />
                          ) : (
                            <MailOpen className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      
                      <p className={`text-sm truncate ${
                        isUnread ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'
                      }`}>
                        {message.content}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            来自: {message.senderName}
                          </span>
                          
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            categoryColors[message.category]
                          }`}>
                            {categoryNames[message.category]}
                          </span>
                        </div>
                        
                        {/* 操作菜单 */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuMessage(
                                actionMenuMessage === message.id ? null : message.id
                              );
                            }}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                          
                          {/* 操作菜单下拉 */}
                          <AnimatePresence>
                            {actionMenuMessage === message.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]"
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(message.id);
                                    setActionMenuMessage(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                                >
                                  {isUnread ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                  <span>{isUnread ? '标记已读' : '标记未读'}</span>
                                </button>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    batchUpdate({
                                      messageIds: [message.id],
                                      action: 'archive'
                                    });
                                    setActionMenuMessage(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                                >
                                  <Archive className="w-4 h-4" />
                                  <span>归档</span>
                                </button>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    batchUpdate({
                                      messageIds: [message.id],
                                      action: 'delete'
                                    });
                                    setActionMenuMessage(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>删除</span>
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* 统计信息 */}
      {state.stats && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>总计: {state.stats.total} 条消息</span>
            <div className="flex space-x-4">
              <span>未读: {state.stats.unread}</span>
              <span>已读: {state.stats.read}</span>
              <span>已归档: {state.stats.archived}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}