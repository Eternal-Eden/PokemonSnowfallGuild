'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Plus,
  Settings,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  Archive,
  Trash2,
  RefreshCw,
  Filter,
  Search,
  Bell,
  BellOff
} from 'lucide-react';
import { useMessage } from '@/contexts/MessageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Message, MessageCategory, MessageStatus } from '@/types/message';
import MessageList from './MessageList';
import MessageDetail from './MessageDetail';
import MessageComposer from './MessageComposer';

// 快捷操作卡片
const QuickActionCard = ({ 
  icon: Icon, 
  title, 
  description, 
  color, 
  onClick, 
  disabled = false 
}: {
  icon: any;
  title: string;
  description: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}) => {
  // 从color中提取颜色名称，例如从'border-blue-500'提取'blue'
  const colorName = color.split('-')[1];
  const bgColorClass = `bg-${colorName}-100 dark:bg-${colorName}-900/20`;
  const textColorClass = `text-${colorName}-600 dark:text-${colorName}-400`;
  const hoverBorderClass = `hover:border-${colorName}-500`;
  
  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`p-6 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
        disabled 
          ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-50 cursor-not-allowed'
          : `border-gray-200 dark:border-gray-700 ${hoverBorderClass} hover:bg-${colorName}-50 dark:hover:bg-${colorName}-900/10`
      }`}
      onClick={disabled ? undefined : onClick}
    >
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-lg ${
          disabled 
            ? 'bg-gray-200 dark:bg-gray-700' 
            : bgColorClass
        }`}>
          <Icon className={`w-6 h-6 ${
            disabled 
              ? 'text-gray-400' 
              : textColorClass
          }`} />
        </div>
        <div>
          <h3 className={`font-semibold ${disabled ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
            {title}
          </h3>
          <p className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default function MessageManagement() {
  const { 
    state, 
    loadUserMessages, 
    loadAllMessages,
    markAllAsRead, 
    sendOverdueRemindersToUsers,
    sendSystemReport,
    sendBatchToOverdueUsers,
    refreshBadges
  } = useMessage();
  const { state: authState } = useAuth();
  
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [activeTab, setActiveTab] = useState<'received' | 'all'>('received');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<MessageCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<MessageStatus | 'all'>('all');

  // 检查是否为版主
  const isModerator = authState.user?.role === 'moderator';

  // 加载消息
  useEffect(() => {
    if (activeTab === 'received') {
      loadUserMessages();
    } else if (activeTab === 'all' && isModerator) {
      loadAllMessages();
    }
  }, [activeTab, loadUserMessages, loadAllMessages, isModerator]);

  // 刷新红点
  useEffect(() => {
    refreshBadges();
  }, [refreshBadges]);

  // 一键已读
  const handleMarkAllAsRead = async () => {
    setIsProcessing(true);
    try {
      await markAllAsRead();
    } finally {
      setIsProcessing(false);
    }
  };

  // 发送逾期提醒
  const handleSendOverdueReminders = async () => {
    if (!confirm('确定要发送逾期提醒吗？这将向所有逾期用户发送提醒消息。')) return;
    
    setIsProcessing(true);
    try {
      await sendOverdueRemindersToUsers();
      alert('逾期提醒已发送');
    } catch (error) {
      alert('发送逾期提醒失败');
    } finally {
      setIsProcessing(false);
    }
  };

  // 发送系统汇报
  const handleSendSystemReport = async () => {
    if (!confirm('确定要生成并发送系统汇报吗？')) return;
    
    setIsProcessing(true);
    try {
      await sendSystemReport();
      alert('系统汇报已发送');
    } catch (error) {
      alert('发送系统汇报失败');
    } finally {
      setIsProcessing(false);
    }
  };

  // 批量发送提醒
  const handleBatchSendReminders = async () => {
    const title = prompt('请输入提醒标题：');
    if (!title) return;
    
    const content = prompt('请输入提醒消息内容：');
    if (!content) return;
    
    if (!confirm('确定要向所有逾期用户发送提醒吗？')) return;
    
    setIsProcessing(true);
    try {
      await sendBatchToOverdueUsers(title, content);
      alert('批量提醒已发送');
    } catch (error) {
      alert('发送批量提醒失败');
    } finally {
      setIsProcessing(false);
    }
  };

  // 过滤消息
  const filteredMessages = state.messages.filter(message => {
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!message.title.toLowerCase().includes(query) && 
          !message.content.toLowerCase().includes(query) &&
          !message.senderName.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // 分类过滤
    if (filterCategory !== 'all' && message.category !== filterCategory) {
      return false;
    }
    
    // 状态过滤（仅对接收的消息有效）
    if (activeTab === 'received' && filterStatus !== 'all' && authState.user) {
      const recipient = message.recipients.find(r => r.username === authState.user!.username);
      if (!recipient || recipient.status !== filterStatus) {
        return false;
      }
    }
    
    return true;
  });

  // 统计信息
  const stats = {
    total: state.messages.length,
    unread: state.messages.filter(m => {
      if (!authState.user) return false;
      const recipient = m.recipients.find(r => r.username === authState.user!.username);
      return recipient?.status === MessageStatus.UNREAD;
    }).length,
    archived: state.messages.filter(m => {
      if (!authState.user) return false;
      const recipient = m.recipients.find(r => r.username === authState.user!.username);
      return recipient?.status === MessageStatus.ARCHIVED;
    }).length
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 头部 */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Mail className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  站内信管理
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  消息通知与管理系统
                </p>
              </div>
            </div>
            
            {/* 红点通知 */}
            <div className="flex items-center space-x-4">
              {state.badges && state.badges[0] && state.badges[0].unreadCount > 0 && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                  <Bell className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {state.badges[0].unreadCount} 条未读
                  </span>
                </div>
              )}
              
              {isModerator && (
                <button
                  onClick={() => setShowComposer(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>发送消息</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">总消息数</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Bell className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">未读消息</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {stats.unread}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Archive className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">已归档</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {stats.archived}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 快捷操作 */}
        {isModerator && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              快捷操作
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickActionCard
                icon={Send}
                title="发送消息"
                description="向指定用户发送站内信"
                color="border-blue-500"
                onClick={() => setShowComposer(true)}
              />
              
              <QuickActionCard
                icon={AlertTriangle}
                title="逾期提醒"
                description="向逾期用户发送提醒"
                color="border-orange-500"
                onClick={handleSendOverdueReminders}
                disabled={isProcessing}
              />
              
              <QuickActionCard
                icon={Users}
                title="系统汇报"
                description="生成并发送系统汇报"
                color="border-purple-500"
                onClick={handleSendSystemReport}
                disabled={isProcessing}
              />
              
              <QuickActionCard
                icon={Send}
                title="批量提醒"
                description="批量发送提醒消息"
                color="border-green-500"
                onClick={handleBatchSendReminders}
                disabled={isProcessing}
              />
            </div>
          </div>
        )}
        
        {/* 消息列表区域 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {/* 标签页和操作栏 */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4">
              {/* 标签页 */}
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('received')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'received'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  收到的消息
                </button>
                
                {isModerator && (
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === 'all'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    所有消息
                  </button>
                )}
              </div>
              
              {/* 操作按钮 */}
              <div className="flex items-center space-x-2">
                {activeTab === 'received' && stats.unread > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={isProcessing}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>一键已读</span>
                  </button>
                )}
                
                <button
                  onClick={() => {
                    if (activeTab === 'received') {
                      loadUserMessages();
                    } else {
                      loadAllMessages();
                    }
                  }}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="刷新"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* 搜索和过滤 */}
            <div className="px-4 pb-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* 搜索框 */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索消息标题、内容或发送者..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                
                {/* 分类过滤 */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as MessageCategory | 'all')}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">所有分类</option>
                  <option value={MessageCategory.SYSTEM}>系统消息</option>

                  <option value={MessageCategory.NOTIFICATION}>通知消息</option>
                  <option value={MessageCategory.REMINDER}>提醒消息</option>
                  <option value={MessageCategory.ANNOUNCEMENT}>公告消息</option>
                </select>
                
                {/* 状态过滤（仅接收的消息） */}
                {activeTab === 'received' && (
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as MessageStatus | 'all')}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="all">所有状态</option>
                    <option value={MessageStatus.UNREAD}>未读</option>
                    <option value={MessageStatus.READ}>已读</option>
                    <option value={MessageStatus.ARCHIVED}>已归档</option>
                  </select>
                )}
              </div>
            </div>
          </div>
          
          {/* 消息列表 */}
          <MessageList
            onMessageClick={setSelectedMessage}
          />
        </div>
      </div>
      
      {/* 消息详情弹窗 */}
      <AnimatePresence>
        {selectedMessage && (
          <MessageDetail
            message={selectedMessage}
            onClose={() => setSelectedMessage(null)}
          />
        )}
      </AnimatePresence>
      
      {/* 消息编写弹窗 */}
      <AnimatePresence>
        {showComposer && (
          <MessageComposer
            onClose={() => setShowComposer(false)}
            onSent={() => {
              // 刷新消息列表
              if (activeTab === 'received') {
                loadUserMessages();
              } else {
                loadAllMessages();
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}