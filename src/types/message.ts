// 站内信系统类型定义

// 消息分类枚举
export enum MessageCategory {
  SYSTEM = 'system',           // 系统消息
  NOTIFICATION = 'notification', // 通知消息
  REMINDER = 'reminder',       // 提醒消息
  ANNOUNCEMENT = 'announcement' // 公告消息
}

// 消息优先级
export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// 消息状态
export enum MessageStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived'
}

// 发送者类型
export enum SenderType {
  SYSTEM = 'system',
  MODERATOR = 'moderator'
}

// 消息接收者
export interface MessageRecipient {
  username: string;
  userId?: string;
  readAt?: Date;
  status: MessageStatus;
}

// 站内信消息
export interface Message {
  id: string;
  title: string;
  content: string;
  category: MessageCategory;
  priority: MessagePriority;
  senderType: SenderType;
  senderName: string;
  senderId?: string;
  recipients: MessageRecipient[];
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date; // 消息过期时间
  isGlobal: boolean; // 是否为全局消息
  metadata?: {
    overdueUserCount?: number; // 逾期用户数量（用于系统汇报消息）
    overdueUsers?: string[]; // 逾期用户列表
    reminderType?: 'overdue' | 'expiring'; // 提醒类型
    channelId?: string; // 频道ID（用于频道相关通知）
    messageId?: string; // 消息ID（用于频道消息通知）
    mentionType?: 'at_all' | 'mention'; // 提及类型
  };
}

// 创建消息请求
export interface CreateMessageRequest {
  title: string;
  content: string;
  category: MessageCategory;
  priority: MessagePriority;
  recipients: string[]; // 用户名数组
  isGlobal?: boolean;
  expiresAt?: Date;
  metadata?: Message['metadata'];
}

// 批量操作请求
export interface BatchMessageRequest {
  messageIds: string[];
  action: 'markRead' | 'markUnread' | 'archive' | 'delete';
}

// 消息统计
export interface MessageStats {
  total: number;
  totalCount: number;
  unread: number;
  unreadCount: number;
  read: number;
  archived: number;
  byCategory: Record<MessageCategory, number>;
  byPriority: Record<MessagePriority, number>;
}

// 逾期用户信息
export interface OverdueUserInfo {
  username: string;
  email?: string;
  overdueDate: Date;
  membershipType: string;
  daysOverdue: number;
}

// 系统汇报数据
export interface SystemReport {
  reportDate: Date;
  overdueUsers: OverdueUserInfo[];
  totalOverdue: number;
  reportType: 'monthly' | 'weekly' | 'daily';
  totalMessages: number;
  systemMessages: number;
  userMessages: number;
  notificationMessages: number;
  period: {
    start: Date;
    end: Date;
  };
}

// 消息查询参数
export interface MessageQueryParams {
  category?: MessageCategory;
  status?: MessageStatus;
  priority?: MessagePriority;
  senderType?: SenderType;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

// 消息列表响应
export interface MessageListResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  stats: MessageStats;
}

// 红点系统相关
export interface NotificationBadge {
  category: MessageCategory;
  count: number;
  hasUrgent: boolean;
  hasUnread: boolean;
  unreadCount: number;
  urgentCount: number;
  showBadge: boolean;
}

// 消息推送设置
export interface MessageSettings {
  enableNotifications: boolean;
  categories: Record<MessageCategory, boolean>;
  priorities: Record<MessagePriority, boolean>;
  emailNotifications: boolean;
  soundNotifications: boolean;
}