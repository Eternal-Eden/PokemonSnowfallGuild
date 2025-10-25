'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  Message,
  MessageCategory,
  MessagePriority,
  MessageStatus,
  CreateMessageRequest,
  BatchMessageRequest,
  MessageStats,
  MessageQueryParams,
  MessageListResponse,
  NotificationBadge
} from '@/types/message';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types/auth';

// 消息状态接口
interface MessageState {
  messages: Message[];
  loading: boolean;
  error: string | null;
  stats: MessageStats | null;
  badges: NotificationBadge[];
  currentPage: number;
  hasMore: boolean;
  total: number;
}

// 消息操作类型
type MessageAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_MESSAGES'; payload: { messages: Message[]; stats: MessageStats; total: number; hasMore: boolean; page: number } }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: Message }
  | { type: 'REMOVE_MESSAGE'; payload: string }
  | { type: 'SET_BADGES'; payload: NotificationBadge[] }
  | { type: 'RESET_MESSAGES' };

// 初始状态
const initialState: MessageState = {
  messages: [],
  loading: false,
  error: null,
  stats: null,
  badges: [],
  currentPage: 1,
  hasMore: false,
  total: 0
};

// Reducer
function messageReducer(state: MessageState, action: MessageAction): MessageState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload.messages,
        stats: action.payload.stats,
        total: action.payload.total,
        hasMore: action.payload.hasMore,
        currentPage: action.payload.page,
        loading: false,
        error: null
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [action.payload, ...state.messages],
        total: state.total + 1
      };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id ? action.payload : msg
        )
      };
    case 'REMOVE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter(msg => msg.id !== action.payload),
        total: Math.max(0, state.total - 1)
      };
    case 'SET_BADGES':
      return { ...state, badges: action.payload };
    case 'RESET_MESSAGES':
      return initialState;
    default:
      return state;
  }
}

// Context接口
interface MessageContextType {
  state: MessageState;
  // 用户消息操作
  loadUserMessages: (params?: MessageQueryParams) => Promise<void>;
  markAsRead: (messageId: string) => Promise<boolean>;
  batchUpdate: (request: BatchMessageRequest) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  refreshBadges: () => void;
  
  // 管理员消息操作
  createNewMessage: (request: CreateMessageRequest) => Promise<Message | null>;
  loadAllMessages: (params?: MessageQueryParams) => Promise<void>;
  deleteMessageById: (messageId: string) => Promise<boolean>;
  
  // 系统操作
  sendOverdueRemindersToUsers: () => Promise<Message[]>;
  sendSystemReport: () => Promise<Message | null>;
  sendBatchToOverdueUsers: (title: string, content: string) => Promise<Message[]>;
}

// 创建Context
const MessageContext = createContext<MessageContextType | undefined>(undefined);

// Provider组件
export function MessageProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(messageReducer, initialState);
  const { state: authState } = useAuth();

  // 获取认证头部
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // 加载用户消息
  const loadUserMessages = useCallback(async (params: MessageQueryParams = {}) => {
    if (!authState.user) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const queryString = new URLSearchParams(params as any).toString();
      const response = await fetch(`/api/messages/user?${queryString}`, {
        headers: getAuthHeaders()
      });
      
      const result = await response.json();
      
      if (result.success) {
        dispatch({
          type: 'SET_MESSAGES',
          payload: {
            messages: result.data.messages || [],
            stats: result.data.stats || { total: 0, unread: 0, read: 0 },
            total: result.data.total || 0,
            hasMore: result.data.hasMore || false,
            page: result.data.page || 1
          }
        });
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.message || '加载消息失败' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: '加载消息失败' });
    }
  }, [authState.user]);

  // 刷新红点通知
  const refreshBadges = useCallback(async () => {
    if (!authState.user) return;
    
    try {
      const response = await fetch('/api/messages/badges', {
        headers: getAuthHeaders()
      });
      
      const result = await response.json();
      
      if (result.success) {
        dispatch({ type: 'SET_BADGES', payload: result.data || [] });
      }
    } catch (error) {
      console.error('刷新红点失败:', error);
    }
  }, [authState.user]);

  // 初始化时加载红点
  useEffect(() => {
    if (authState.user) {
      refreshBadges();
    }
  }, [authState.user, refreshBadges]);

  // 标记消息为已读
  const markAsRead = useCallback(async (messageId: string): Promise<boolean> => {
    if (!authState.user) return false;
    
    try {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 更新本地状态
        const updatedMessage = state.messages.find(msg => msg.id === messageId);
        if (updatedMessage) {
          const recipient = updatedMessage.recipients.find(r => r.username === authState.user!.username);
          if (recipient) {
            recipient.status = MessageStatus.READ;
            recipient.readAt = new Date();
            dispatch({ type: 'UPDATE_MESSAGE', payload: updatedMessage });
          }
        }
        // 刷新红点
        refreshBadges();
        return true;
      }
      return false;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: '标记已读失败' });
      return false;
    }
  }, [authState.user, state.messages, refreshBadges]);

  // 批量更新消息
  const batchUpdate = async (request: BatchMessageRequest): Promise<boolean> => {
    if (!authState.user) return false;
    
    try {
      const response = await fetch('/api/messages/batch', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 重新加载消息
        await loadUserMessages();
        refreshBadges();
        return true;
      }
      return false;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: '批量操作失败' });
      return false;
    }
  };

  // 一键已读
  const markAllAsRead = async (): Promise<boolean> => {
    if (!authState.user) return false;
    
    try {
      const response = await fetch('/api/messages/read-all', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 更新本地状态
        const updatedMessages = state.messages.map(message => {
          const recipient = message.recipients.find(r => r.username === authState.user!.username);
          if (recipient && recipient.status === MessageStatus.UNREAD) {
            recipient.status = MessageStatus.READ;
            recipient.readAt = new Date();
          }
          return message;
        });
        
        dispatch({
          type: 'SET_MESSAGES',
          payload: {
            messages: updatedMessages,
            stats: state.stats!,
            total: state.total,
            hasMore: state.hasMore,
            page: state.currentPage
          }
        });
        
        refreshBadges();
        return true;
      }
      return false;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: '一键已读失败' });
      return false;
    }
  };

  // 创建新消息（管理员）
  const createNewMessage = useCallback(async (request: CreateMessageRequest): Promise<Message | null> => {
    if (!authState.user) return null;
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request)
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        dispatch({ type: 'ADD_MESSAGE', payload: result.data });
        return result.data;
      }
      return null;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: '创建消息失败' });
      return null;
    }
  }, [authState.user]);

  // 加载所有消息（管理员）
  const loadAllMessages = useCallback(async (params: MessageQueryParams = {}) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const queryString = new URLSearchParams(params as any).toString();
      const response = await fetch(`/api/messages?${queryString}`, {
        headers: getAuthHeaders()
      });
      
      const result = await response.json();
      
      if (result.success) {
        dispatch({
          type: 'SET_MESSAGES',
          payload: {
            messages: result.data.messages || [],
            stats: result.data.stats || { total: 0, unread: 0, read: 0 },
            total: result.data.total || 0,
            hasMore: result.data.hasMore || false,
            page: result.data.page || 1
          }
        });
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.message || '加载消息失败' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: '加载消息失败' });
    }
  }, []);

  // 删除消息（管理员）
  const deleteMessageById = useCallback(async (messageId: string): Promise<boolean> => {
    if (!authState.user) return false;
    
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      const result = await response.json();
      
      if (result.success) {
        dispatch({ type: 'REMOVE_MESSAGE', payload: messageId });
        return true;
      }
      return false;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: '删除消息失败' });
      return false;
    }
  }, [authState.user]);

  // 发送逾期提醒
  const sendOverdueRemindersToUsers = useCallback(async (): Promise<Message[]> => {
    if (!authState.user) return [];
    
    try {
      const response = await fetch('/api/messages/overdue-reminders', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      return [];
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: '发送提醒失败' });
      return [];
    }
  }, [authState.user]);

  // 发送系统汇报
  const sendSystemReport = useCallback(async (): Promise<Message | null> => {
    if (!authState.user) return null;
    
    try {
      const response = await fetch('/api/messages/system-report', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        dispatch({ type: 'ADD_MESSAGE', payload: result.data });
        return result.data;
      }
      return null;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: '发送系统汇报失败' });
      return null;
    }
  }, [authState.user]);

  // 批量发送给逾期用户
  const sendBatchToOverdueUsers = useCallback(async (title: string, content: string): Promise<Message[]> => {
    if (!authState.user) return [];
    
    try {
      const response = await fetch('/api/messages/batch-overdue', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title, content })
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        result.data.forEach((message: Message) => {
          dispatch({ type: 'ADD_MESSAGE', payload: message });
        });
        return result.data;
      }
      return [];
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: '批量发送失败' });
      return [];
    }
  }, [authState.user]);

  const value: MessageContextType = {
    state,
    loadUserMessages,
    markAsRead,
    batchUpdate,
    markAllAsRead,
    refreshBadges,
    createNewMessage,
    loadAllMessages,
    deleteMessageById,
    sendOverdueRemindersToUsers,
    sendSystemReport,
    sendBatchToOverdueUsers
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
}

// 使用消息上下文的Hook
export function useMessage() {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
}

export default MessageContext;