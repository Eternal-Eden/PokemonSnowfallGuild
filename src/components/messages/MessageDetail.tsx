'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  MailOpen,
  Archive,
  Trash2,
  Reply,
  Forward,
  Clock,
  User,
  Tag,
  AlertTriangle,
  Info,
  CheckCircle,
  Calendar
} from 'lucide-react';
import {
  Message,
  MessageCategory,
  MessagePriority,
  MessageStatus
} from '@/types/message';
import { useMessage } from '@/contexts/MessageContext';
import { useAuth } from '@/contexts/AuthContext';

// 消息分类图标映射
const categoryIcons = {
  [MessageCategory.SYSTEM]: Info,
  [MessageCategory.NOTIFICATION]: CheckCircle,
  [MessageCategory.REMINDER]: AlertTriangle,
  [MessageCategory.ANNOUNCEMENT]: Tag
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
  [MessagePriority.LOW]: 'text-gray-600 bg-gray-100',
  [MessagePriority.NORMAL]: 'text-blue-600 bg-blue-100',
  [MessagePriority.HIGH]: 'text-orange-600 bg-orange-100',
  [MessagePriority.URGENT]: 'text-red-600 bg-red-100'
};

// 消息分类中文名称
const categoryNames = {
  [MessageCategory.SYSTEM]: '系统消息',
  [MessageCategory.NOTIFICATION]: '通知消息',
  [MessageCategory.REMINDER]: '提醒消息',
  [MessageCategory.ANNOUNCEMENT]: '公告消息'
};

// 优先级中文名称
const priorityNames = {
  [MessagePriority.LOW]: '低',
  [MessagePriority.NORMAL]: '普通',
  [MessagePriority.HIGH]: '高',
  [MessagePriority.URGENT]: '紧急'
};

interface MessageDetailProps {
  message: Message;
  onClose: () => void;
}

export default function MessageDetail({ message, onClose }: MessageDetailProps) {
  const { markAsRead, batchUpdate } = useMessage();
  const { state: authState } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // 获取当前用户的消息状态
  const getCurrentUserRecipient = () => {
    if (!authState.user) return null;
    return message.recipients.find(r => r.username === authState.user!.username);
  };

  const recipient = getCurrentUserRecipient();
  const isUnread = recipient?.status === MessageStatus.UNREAD;
  const IconComponent = categoryIcons[message.category];

  // 标记为已读
  const handleMarkAsRead = async () => {
    if (!authState.user || !isUnread) return;
    
    setIsProcessing(true);
    try {
      await markAsRead(message.id);
    } finally {
      setIsProcessing(false);
    }
  };

  // 归档消息
  const handleArchive = async () => {
    setIsProcessing(true);
    try {
      await batchUpdate({
        messageIds: [message.id],
        action: 'archive'
      });
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  // 删除消息
  const handleDelete = async () => {
    if (!confirm('确定要删除这条消息吗？')) return;
    
    setIsProcessing(true);
    try {
      await batchUpdate({
        messageIds: [message.id],
        action: 'delete'
      });
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  // 格式化时间
  const formatDateTime = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 自动标记为已读
  useState(() => {
    if (isUnread) {
      handleMarkAsRead();
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            {/* 消息图标 */}
            <div className={`p-3 rounded-lg ${categoryColors[message.category]}`}>
              <IconComponent className="w-6 h-6" />
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {message.title}
              </h2>
              
              <div className="flex items-center space-x-4 mt-1">
                {/* 分类标签 */}
                <span className={`px-2 py-1 text-xs rounded-full ${categoryColors[message.category]}`}>
                  {categoryNames[message.category]}
                </span>
                
                {/* 优先级标签 */}
                <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[message.priority]}`}>
                  {priorityNames[message.priority]}
                </span>
                
                {/* 状态标识 */}
                {isUnread ? (
                  <span className="flex items-center space-x-1 text-blue-600">
                    <Mail className="w-4 h-4" />
                    <span className="text-xs">未读</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 text-gray-500">
                    <MailOpen className="w-4 h-4" />
                    <span className="text-xs">已读</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex items-center space-x-2">
            {/* 归档按钮 */}
            <button
              onClick={handleArchive}
              disabled={isProcessing}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
              title="归档"
            >
              <Archive className="w-5 h-5" />
            </button>
            
            {/* 删除按钮 */}
            <button
              onClick={handleDelete}
              disabled={isProcessing}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
              title="删除"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* 消息信息 */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* 发送者信息 */}
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">发送者:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {message.senderName}
              </span>
              <span className="text-xs text-gray-500 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                {message.senderType === 'system' ? '系统' : '版主'}
              </span>
            </div>
            
            {/* 发送时间 */}
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">发送时间:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatDateTime(message.createdAt)}
              </span>
            </div>
            
            {/* 接收者数量 */}
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">接收者:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {message.isGlobal ? '全体用户' : `${message.recipients.length} 人`}
              </span>
            </div>
            
            {/* 过期时间 */}
            {message.expiresAt && (
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">过期时间:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatDateTime(message.expiresAt)}
                </span>
              </div>
            )}
          </div>
          
          {/* 已读时间 */}
          {recipient?.readAt && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center space-x-2 text-sm text-green-700 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span>您已于 {formatDateTime(recipient.readAt)} 阅读此消息</span>
              </div>
            </div>
          )}
        </div>
        
        {/* 消息内容 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100 leading-relaxed">
              {message.content}
            </div>
          </div>
          
          {/* 元数据信息 */}
          {message.metadata && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                附加信息
              </h4>
              
              {/* 逾期用户信息 */}
              {message.metadata.overdueUserCount && (
                <div className="mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    逾期用户数量: 
                  </span>
                  <span className="text-sm font-medium text-red-600">
                    {message.metadata.overdueUserCount} 人
                  </span>
                </div>
              )}
              
              {/* 逾期用户列表 */}
              {message.metadata.overdueUsers && message.metadata.overdueUsers.length > 0 && (
                <div className="mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">
                    逾期用户列表:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {message.metadata.overdueUsers.map((username, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded"
                      >
                        {username}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 提醒类型 */}
              {message.metadata.reminderType && (
                <div className="mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    提醒类型: 
                  </span>
                  <span className="text-sm font-medium text-orange-600">
                    {message.metadata.reminderType === 'overdue' ? '逾期提醒' : '即将到期提醒'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 底部操作栏 */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              消息ID: {message.id}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleArchive}
                disabled={isProcessing}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <Archive className="w-4 h-4" />
                <span>归档</span>
              </button>
              
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}