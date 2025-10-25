/**
 * Socket.IO客户端配置
 * 提供实时通信功能，包括频道聊天和私聊
 */

import { io, Socket } from 'socket.io-client';

/**
 * Socket事件类型定义
 */
export interface SocketEvents {
  // 连接事件
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;
  
  // 认证事件
  authenticated: (data: { userId: string; username: string }) => void;
  authentication_error: (error: string) => void;
  
  // 频道消息事件
  channel_message: (message: ChannelMessage) => void;
  channel_message_sent: (message: ChannelMessage) => void;
  channel_message_error: (error: string) => void;
  
  // 私聊消息事件
  private_message: (message: PrivateMessage) => void;
  private_message_sent: (message: PrivateMessage) => void;
  private_message_error: (error: string) => void;
  
  // 用户状态事件
  user_online: (data: { userId: string; username: string }) => void;
  user_offline: (data: { userId: string; username: string }) => void;
  user_typing: (data: { userId: string; channelId?: string; conversationId?: string }) => void;
  user_stop_typing: (data: { userId: string; channelId?: string; conversationId?: string }) => void;
  
  // 频道事件
  channel_joined: (data: { channelId: string; userId: string }) => void;
  channel_left: (data: { channelId: string; userId: string }) => void;
  channel_updated: (channel: Channel) => void;
  
  // 通知事件
  notification: (notification: Notification) => void;
}

/**
 * 频道消息接口
 */
export interface ChannelMessage {
  id: string;
  channelId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  createdAt: Date;
  updatedAt?: Date;
  isEdited?: boolean;
  isDeleted?: boolean;
}

/**
 * 私聊消息接口
 */
export interface PrivateMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  content: string;
  messageType: 'text' | 'image' | 'file';
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  isRead: boolean;
  createdAt: Date;
  updatedAt?: Date;
  isEdited?: boolean;
  isDeleted?: boolean;
}

/**
 * 频道接口
 */
export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: string;
  memberCount: number;
  isPrivate: boolean;
}

/**
 * 通知接口
 */
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Socket客户端类
 */
class SocketClient {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventListeners: Map<string, Set<Function>> = new Map();

  /**
   * 连接到Socket服务器
   */
  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      const serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
      
      this.socket = io(serverUrl, {
        auth: {
          token: token || this.getAuthToken()
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.setupEventHandlers();

      this.socket.on('connect', () => {
        console.log('[Socket] Connected to server');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('connect_error', (error: Error) => {
        console.error('[Socket] Connection error:', error);
        this.isConnected = false;
        reject(error);
      });

      this.socket.on('authenticated', (data: { userId: string; username: string }) => {
        console.log('[Socket] Authenticated:', data);
        this.emit('authenticated', data);
      });

      this.socket.on('authentication_error', (error: string) => {
        console.error('[Socket] Authentication error:', error);
        this.emit('authentication_error', error);
      });
    });
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('[Socket] Disconnected from server');
    }
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason: string) => {
      console.log('[Socket] Disconnected:', reason);
      this.isConnected = false;
      this.emit('disconnect', reason);
    });

    // 频道消息事件
    this.socket.on('channel_message', (message: ChannelMessage) => {
      console.log('[Socket] Channel message received:', message);
      this.emit('channel_message', message);
    });

    this.socket.on('channel_message_sent', (message: ChannelMessage) => {
      console.log('[Socket] Channel message sent:', message);
      this.emit('channel_message_sent', message);
    });

    // 私聊消息事件
    this.socket.on('private_message', (message: PrivateMessage) => {
      console.log('[Socket] Private message received:', message);
      this.emit('private_message', message);
    });

    this.socket.on('private_message_sent', (message: PrivateMessage) => {
      console.log('[Socket] Private message sent:', message);
      this.emit('private_message_sent', message);
    });

    // 用户状态事件
    this.socket.on('user_online', (data: { userId: string; username: string }) => {
      this.emit('user_online', data);
    });

    this.socket.on('user_offline', (data: { userId: string; username: string }) => {
      this.emit('user_offline', data);
    });

    this.socket.on('user_typing', (data: { userId: string; channelId?: string; conversationId?: string }) => {
      this.emit('user_typing', data);
    });

    this.socket.on('user_stop_typing', (data: { userId: string; channelId?: string; conversationId?: string }) => {
      this.emit('user_stop_typing', data);
    });

    // 频道事件
    this.socket.on('channel_joined', (data: { channelId: string; userId: string }) => {
      this.emit('channel_joined', data);
    });

    this.socket.on('channel_left', (data: { channelId: string; userId: string }) => {
      this.emit('channel_left', data);
    });

    this.socket.on('channel_updated', (channel: Channel) => {
      this.emit('channel_updated', channel);
    });

    // 通知事件
    this.socket.on('notification', (notification: Notification) => {
      this.emit('notification', notification);
    });
  }

  /**
   * 获取认证token
   */
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }
    return null;
  }

  /**
   * 发送频道消息
   */
  sendChannelMessage(channelId: string, content: string, messageType: string = 'text'): void {
    if (!this.socket?.connected) {
      console.error('[Socket] Not connected to server');
      return;
    }

    this.socket.emit('send_channel_message', {
      channelId,
      content,
      messageType,
    });
  }

  /**
   * 发送私聊消息
   */
  sendPrivateMessage(receiverId: string, content: string, messageType: string = 'text'): void {
    if (!this.socket?.connected) {
      console.error('[Socket] Not connected to server');
      return;
    }

    this.socket.emit('send_private_message', {
      receiverId,
      content,
      messageType,
    });
  }

  /**
   * 加入频道
   */
  joinChannel(channelId: string): void {
    if (!this.socket?.connected) {
      console.error('[Socket] Not connected to server');
      return;
    }

    this.socket.emit('join_channel', { channelId });
  }

  /**
   * 离开频道
   */
  leaveChannel(channelId: string): void {
    if (!this.socket?.connected) {
      console.error('[Socket] Not connected to server');
      return;
    }

    this.socket.emit('leave_channel', { channelId });
  }

  /**
   * 发送正在输入状态
   */
  startTyping(channelId?: string, conversationId?: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('start_typing', {
      channelId,
      conversationId,
    });
  }

  /**
   * 停止输入状态
   */
  stopTyping(channelId?: string, conversationId?: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('stop_typing', {
      channelId,
      conversationId,
    });
  }

  /**
   * 添加事件监听器
   */
  on<K extends keyof SocketEvents>(event: K, listener: SocketEvents[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * 移除事件监听器
   */
  off<K extends keyof SocketEvents>(event: K, listener: SocketEvents[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * 触发事件
   */
  private emit<K extends keyof SocketEvents>(event: K, ...args: Parameters<SocketEvents[K]>): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          (listener as Function)(...args);
        } catch (error) {
          console.error(`[Socket] Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * 获取连接状态
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * 获取Socket实例
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// 创建全局Socket客户端实例
export const socketClient = new SocketClient();

/**
 * 初始化Socket.IO服务器
 * 用于服务器端Socket.IO配置
 */
export async function initializeSocket(server: any) {
  try {
    // 动态导入socket.io，避免在客户端环境中出错
    const { Server } = await import('socket.io');
    
    const io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });
    
    // 基本的连接处理
    io.on('connection', (socket: any) => {
      console.log('User connected:', socket.id);
      
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });
    
    console.log('Socket.IO server initialized');
    return io;
  } catch (error: any) {
    console.warn('Socket.IO not available, skipping initialization:', error?.message || error);
    return null;
  }
}

export default socketClient;