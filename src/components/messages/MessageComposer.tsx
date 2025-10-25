'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  X,
  Users,
  User,
  Globe,
  AlertTriangle,
  Info,
  CheckCircle,
  Tag,
  Calendar,
  Plus,
  Minus
} from 'lucide-react';
import {
  MessageCategory,
  MessagePriority,
  CreateMessageRequest
} from '@/types/message';
import { useMessage } from '@/contexts/MessageContext';
import { useAuth } from '@/contexts/AuthContext';

// 消息分类选项
const categoryOptions = [
  {
    value: MessageCategory.NOTIFICATION,
    label: '通知消息',
    icon: CheckCircle,
    color: 'text-green-600 bg-green-100'
  },
  {
    value: MessageCategory.REMINDER,
    label: '提醒消息',
    icon: AlertTriangle,
    color: 'text-orange-600 bg-orange-100'
  },
  {
    value: MessageCategory.ANNOUNCEMENT,
    label: '公告消息',
    icon: Tag,
    color: 'text-red-600 bg-red-100'
  }
];

// 优先级选项
const priorityOptions = [
  {
    value: MessagePriority.LOW,
    label: '低优先级',
    color: 'text-gray-600 bg-gray-100'
  },
  {
    value: MessagePriority.NORMAL,
    label: '普通优先级',
    color: 'text-blue-600 bg-blue-100'
  },
  {
    value: MessagePriority.HIGH,
    label: '高优先级',
    color: 'text-orange-600 bg-orange-100'
  },
  {
    value: MessagePriority.URGENT,
    label: '紧急优先级',
    color: 'text-red-600 bg-red-100'
  }
];

interface MessageComposerProps {
  onClose: () => void;
  onSent?: () => void;
}

export default function MessageComposer({ onClose, onSent }: MessageComposerProps) {
  const { createNewMessage } = useMessage();
  const { state: authState } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: MessageCategory.NOTIFICATION,
    priority: MessagePriority.NORMAL,
    isGlobal: false,
    recipients: [''],
    expiresAt: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 验证表单
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = '请输入消息标题';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = '请输入消息内容';
    }
    
    if (!formData.isGlobal) {
      const validRecipients = formData.recipients.filter(r => r.trim());
      if (validRecipients.length === 0) {
        newErrors.recipients = '请至少指定一个接收者或选择全体发送';
      }
    }
    
    if (formData.expiresAt) {
      const expiryDate = new Date(formData.expiresAt);
      if (expiryDate <= new Date()) {
        newErrors.expiresAt = '过期时间必须晚于当前时间';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const messageData: CreateMessageRequest = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        priority: formData.priority,
        isGlobal: formData.isGlobal,
        recipients: formData.isGlobal ? [] : formData.recipients.filter(r => r.trim()),
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined
      };
      
      await createNewMessage(messageData);
      onSent?.();
      onClose();
    } catch (error) {
      console.error('发送消息失败:', error);
      setErrors({ submit: '发送消息失败，请重试' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 添加接收者
  const addRecipient = () => {
    setFormData(prev => ({
      ...prev,
      recipients: [...prev.recipients, '']
    }));
  };

  // 移除接收者
  const removeRecipient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  // 更新接收者
  const updateRecipient = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.map((r, i) => i === index ? value : r)
    }));
  };

  // 检查是否为版主
  const isModerator = authState.user?.role === 'moderator';
  
  if (!isModerator) {
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
          className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              权限不足
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              只有版主或超级管理员才能发送站内信
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              确定
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            发送站内信
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* 消息标题 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                消息标题 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="请输入消息标题"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>
            
            {/* 消息分类和优先级 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 消息分类 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  消息分类
                </label>
                <div className="space-y-2">
                  {categoryOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <label
                        key={option.value}
                        className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <input
                          type="radio"
                          name="category"
                          value={option.value}
                          checked={formData.category === option.value}
                          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as MessageCategory }))}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div className={`p-2 rounded-lg ${option.color}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {option.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
              
              {/* 优先级 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  优先级
                </label>
                <div className="space-y-2">
                  {priorityOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={option.value}
                        checked={formData.priority === option.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as MessagePriority }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`px-2 py-1 text-xs rounded-full ${option.color}`}>
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 接收者设置 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                接收者设置
              </label>
              
              {/* 全体发送选项 */}
              <div className="mb-4">
                <label className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.isGlobal}
                    onChange={(e) => setFormData(prev => ({ ...prev, isGlobal: e.target.checked }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <Globe className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    发送给全体用户
                  </span>
                </label>
              </div>
              
              {/* 指定用户 */}
              {!formData.isGlobal && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      指定接收用户（用户名）
                    </span>
                    <button
                      type="button"
                      onClick={addRecipient}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>添加</span>
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {formData.recipients.map((recipient, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          value={recipient}
                          onChange={(e) => updateRecipient(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          placeholder="请输入用户名"
                        />
                        {formData.recipients.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRecipient(index)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {errors.recipients && (
                    <p className="mt-1 text-sm text-red-600">{errors.recipients}</p>
                  )}
                </div>
              )}
            </div>
            
            {/* 过期时间 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                过期时间（可选）
              </label>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              {errors.expiresAt && (
                <p className="mt-1 text-sm text-red-600">{errors.expiresAt}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                设置后消息将在指定时间自动过期
              </p>
            </div>
            
            {/* 消息内容 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                消息内容 *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-vertical"
                placeholder="请输入消息内容..."
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content}</p>
              )}
            </div>
            
            {/* 提交错误 */}
            {errors.submit && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
              </div>
            )}
          </div>
          
          {/* 底部操作栏 */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? '发送中...' : '发送消息'}</span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}