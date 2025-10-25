'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, MailOpen, Clock, User, ChevronRight } from 'lucide-react';

interface InternalMessage {
  id: string;
  title: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  isRead: boolean;
  createdAt: Date;
  type: 'system' | 'user' | 'moderator';
}

interface MessageSectionProps {
  className?: string;
}

// 模拟站内信数据
const mockMessages: InternalMessage[] = [
  {
    id: 'msg-1',
    title: '欢迎加入落雪公会！',
    content: '欢迎您加入落雪公会！请仔细阅读公会规则，积极参与论坛讨论。如有任何问题，请随时联系管理员。',
    senderId: 'system',
    senderName: '系统消息',
    receiverId: 'user1',
    isRead: false,
    createdAt: new Date('2024-01-16T10:30:00'),
    type: 'system'
  },
  {
    id: 'msg-2',
    title: '您的宝可梦租借申请已通过',
    content: '您申请租借的皮卡丘已经通过审核，请及时联系出租方完成交接。租借期限为3天，请按时归还。',
    senderId: 'moderator',
    senderName: '版主',
    senderAvatar: '/avatars/default.png',
    receiverId: 'user1',
    isRead: true,
    createdAt: new Date('2024-01-15T14:20:00'),
    type: 'moderator'
  },
  {
    id: 'msg-3',
    title: '活动报名确认',
    content: '您已成功报名参加"新年宝可梦对战大赛"，请关注活动详情和时间安排。',
    senderId: 'system',
    senderName: '系统消息',
    receiverId: 'user1',
    isRead: false,
    createdAt: new Date('2024-01-14T16:45:00'),
    type: 'system'
  },
  {
    id: 'msg-4',
    title: '好友申请',
    content: '用户"小霞"向您发送了好友申请，是否同意？',
    senderId: 'user3',
    senderName: '小霞',
    senderAvatar: '/avatars/user4.png',
    receiverId: 'user1',
    isRead: true,
    createdAt: new Date('2024-01-13T11:20:00'),
    type: 'user'
  }
];

export default function MessageSection({ className = '' }: MessageSectionProps) {
  const { state } = useAuth();
  const user = state.user;
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<InternalMessage | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [user]);

  const loadMessages = async () => {
    if (!user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 过滤当前用户的消息
    const userMessages = mockMessages
      .filter(msg => msg.receiverId === user.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    setMessages(userMessages);
    setLoading(false);
  };

  const handleMessageClick = (message: InternalMessage) => {
    setSelectedMessage(message);
    setShowDetail(true);
    
    // 标记为已读
    if (!message.isRead) {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === message.id ? { ...msg, isRead: true } : msg
        )
      );
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  const getMessageIcon = (type: string, isRead: boolean) => {
    const iconClass = `w-4 h-4 ${
      type === 'system' ? 'text-blue-500' :
      type === 'moderator' ? 'text-red-500' :
      'text-green-500'
    }`;
    
    return isRead ? <MailOpen className={iconClass} /> : <Mail className={iconClass} />;
  };

  const unreadCount = messages.filter(msg => !msg.isRead).length;

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Mail className="w-5 h-5 mr-2 text-blue-600" />
          站内信
        </h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (showDetail && selectedMessage) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowDetail(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ← 返回
            </button>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Mail className="w-5 h-5 mr-2 text-blue-600" />
              消息详情
            </h3>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">{selectedMessage.title}</h4>
            <div className="flex items-center text-sm text-gray-500 mb-3">
              <div className="flex items-center mr-4">
                {selectedMessage.senderAvatar ? (
                  <img 
                    src={selectedMessage.senderAvatar} 
                    alt={selectedMessage.senderName}
                    className="w-4 h-4 rounded-full mr-1"
                  />
                ) : (
                  <User className="w-4 h-4 mr-1" />
                )}
                <span>{selectedMessage.senderName}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>{formatTime(selectedMessage.createdAt)}</span>
              </div>
            </div>
          </div>
          
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed">{selectedMessage.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center justify-between">
          <div className="flex items-center">
            <Mail className="w-5 h-5 mr-2 text-blue-600" />
            站内信
          </div>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {!user ? (
          <div className="p-4 text-center text-gray-500">
            <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>请先登录查看站内信</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无站内信</p>
          </div>
        ) : (
          <div className="divide-y">
            {messages.slice(0, 5).map((message) => (
              <div
                key={message.id}
                onClick={() => handleMessageClick(message)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !message.isRead ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-1">
                      {getMessageIcon(message.type, message.isRead)}
                      <h4 className={`ml-2 text-sm truncate ${
                        !message.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                      }`}>
                        {message.title}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-500 truncate mb-1">
                      来自: {message.senderName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                </div>
              </div>
            ))}
            
            {messages.length > 5 && (
              <div className="p-4 text-center">
                <button className="text-sm text-blue-600 hover:text-blue-700">
                  查看更多消息
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}