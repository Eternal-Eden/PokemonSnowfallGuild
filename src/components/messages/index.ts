// 消息系统组件导出
export { default as MessageList } from './MessageList';
export { default as MessageDetail } from './MessageDetail';
export { default as MessageComposer } from './MessageComposer';
export { default as MessageManagement } from './MessageManagement';
export { default as NotificationBadge, SimpleBadge, NotificationText, CategoryBadge } from './NotificationBadge';

// 类型导出
export type {
  Message,
  MessageCategory,
  MessagePriority,
  MessageStatus,
  SenderType,
  MessageRecipient,
  CreateMessageRequest,
  BatchMessageRequest,
  MessageStats,
  OverdueUserInfo,
  SystemReport,
  MessageQueryParams,
  MessageListResponse,
  NotificationBadge as NotificationBadgeType,
  MessageSettings
} from '@/types/message';

// Context 导出
export { MessageProvider, useMessage } from '@/contexts/MessageContext';

// 工具函数导出
export {
  createMessage,
  getUserMessages,
  getAllMessages,
  markMessageAsRead,
  batchUpdateMessages,
  markAllMessagesAsRead,
  calculateUserMessageStats,
  getNotificationBadges,
  detectOverdueUsers,
  generateSystemReport,
  sendOverdueReminders,
  sendSystemReportToModerator,
  deleteMessage,
  sendBatchRemindersToOverdueUsers
} from '@/lib/messageSystem';