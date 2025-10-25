/**
 * 消息服务
 * 处理站内信、通知等消息功能
 */

import { DataService } from './dataService';
import {
  Message,
  CreateMessageRequest,
  MessageQueryParams,
  MessageListResponse,
  MessageStats,
  BatchMessageRequest,
  MessageCategory,
  MessagePriority,
  NotificationBadge,
  SystemReport
} from '@/types/message';

/**
 * 消息服务类
 */
class MessageService extends DataService {
  constructor() {
    super();
  }

  // ==================== 消息发送 ====================

  /**
   * 发送单条消息
   */
  async sendMessage(messageData: CreateMessageRequest): Promise<Message> {
    try {
      // 数据验证
      if (!messageData.title?.trim()) {
        throw new Error('消息标题不能为空');
      }
      if (!messageData.content?.trim()) {
        throw new Error('消息内容不能为空');
      }
      if (!messageData.recipients || messageData.recipients.length === 0) {
        throw new Error('收件人不能为空');
      }
      if (messageData.title.length > 255) {
        throw new Error('消息标题不能超过255个字符');
      }
      if (messageData.content.length > 10000) {
        throw new Error('消息内容不能超过10000个字符');
      }

      // 调用API发送消息
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          title: messageData.title.trim(),
          content: messageData.content.trim(),
          category: messageData.category,
          priority: messageData.priority,
          recipients: messageData.recipients,
          isGlobal: messageData.isGlobal || false,
          metadata: messageData.metadata || {},
          expiresAt: messageData.expiresAt
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '发送消息失败');
      }

      return data.data.message;
    } catch (error) {
      console.error('发送消息失败:', error);
      throw error;
    }
  }

  /**
   * 批量操作消息
   */
  async batchOperateMessages(batchData: BatchMessageRequest): Promise<{ success: boolean; processedCount: number; failedCount: number }> {
    try {
      // 数据验证
      if (!batchData.messageIds || batchData.messageIds.length === 0) {
        throw new Error('消息ID列表不能为空');
      }
      if (!batchData.action || !['markRead', 'markUnread', 'archive', 'delete'].includes(batchData.action)) {
        throw new Error('操作类型无效');
      }
      if (batchData.messageIds.length > 100) {
        throw new Error('批量操作消息数量不能超过100条');
      }

      // 调用API进行批量操作
      const response = await fetch('/api/messages/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          messageIds: batchData.messageIds,
          action: batchData.action
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '批量操作失败');
      }

      return {
        success: true,
        processedCount: data.data.processedCount || 0,
        failedCount: data.data.failedCount || 0
      };
    } catch (error) {
      console.error('批量操作消息失败:', error);
      return {
        success: false,
        processedCount: 0,
        failedCount: batchData.messageIds.length
      };
    }
  }

  /**
   * 发送系统通知
   */
  async sendSystemNotification(
    receiverId: string,
    title: string,
    content: string,
    category: MessageCategory = MessageCategory.SYSTEM,
    priority: MessagePriority = MessagePriority.NORMAL
  ): Promise<Message> {
    try {
      // 数据验证
      if (!receiverId?.trim()) {
        throw new Error('接收者ID不能为空');
      }
      if (!title?.trim()) {
        throw new Error('通知标题不能为空');
      }
      if (!content?.trim()) {
        throw new Error('通知内容不能为空');
      }

      // 调用API发送系统通知
      const response = await fetch('/api/notifications/system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          receiverId: receiverId.trim(),
          title: title.trim(),
          content: content.trim(),
          category,
          priority
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '发送系统通知失败');
      }

      return data.data.notification;
    } catch (error) {
      console.error('发送系统通知失败:', error);
      throw error;
    }
  }

  // ==================== 消息查询 ====================

  /**
   * 获取用户消息列表
   */
  async getMessages(
    userId: string,
    params: MessageQueryParams = {}
  ): Promise<MessageListResponse> {
    try {
      // 数据验证
      if (!userId?.trim()) {
        throw new Error('用户ID不能为空');
      }

      // 构建查询参数
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.category) queryParams.append('category', params.category);
      if (params.priority) queryParams.append('priority', params.priority);
      if (params.status) queryParams.append('status', params.status);
      if (params.search) queryParams.append('search', params.search);
      if (params.startDate) queryParams.append('startDate', params.startDate.toISOString());
      if (params.endDate) queryParams.append('endDate', params.endDate.toISOString());

      // 调用API获取消息列表
      const response = await fetch(`/api/users/${userId}/messages?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '获取消息列表失败');
      }

      return data.data;
    } catch (error) {
      console.error('获取消息列表失败:', error);
      return {
        messages: [],
        total: 0,
        page: params.page || 1,
        limit: params.limit || 20,
        hasMore: false,
        stats: {
          total: 0,
          totalCount: 0,
          unread: 0,
          unreadCount: 0,
          read: 0,
          archived: 0,
          byCategory: {
            [MessageCategory.SYSTEM]: 0,
            [MessageCategory.NOTIFICATION]: 0,
            [MessageCategory.REMINDER]: 0,
            [MessageCategory.ANNOUNCEMENT]: 0
          },
          byPriority: {
            [MessagePriority.LOW]: 0,
            [MessagePriority.NORMAL]: 0,
            [MessagePriority.HIGH]: 0,
            [MessagePriority.URGENT]: 0
          }
        }
      };
    }
  }

  /**
   * 根据ID获取消息详情
   */
  async getMessageById(messageId: string): Promise<Message | null> {
    try {
      // 数据验证
      if (!messageId?.trim()) {
        throw new Error('消息ID不能为空');
      }

      // 调用API获取消息详情
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(data.message || '获取消息详情失败');
      }

      return data.data.message;
    } catch (error) {
      console.error('获取消息详情失败:', error);
      return null;
    }
  }

  /**
   * 获取未读消息数量
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      // 数据验证
      if (!userId?.trim()) {
        throw new Error('用户ID不能为空');
      }

      // 调用API获取未读消息数量
      const response = await fetch(`/api/users/${userId}/messages/unread-count`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '获取未读消息数量失败');
      }

      return data.data.count || 0;
    } catch (error) {
      console.error('获取未读消息数量失败:', error);
      return 0;
    }
  }

  /**
   * 获取通知徽章信息
   */
  async getNotificationBadge(userId: string): Promise<NotificationBadge> {
    try {
      // 数据验证
      if (!userId?.trim()) {
        throw new Error('用户ID不能为空');
      }

      // 调用API获取通知徽章信息
      const response = await fetch(`/api/users/${userId}/notification-badge`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '获取通知徽章失败');
      }

      return data.data.badge;
    } catch (error) {
      console.error('获取通知徽章失败:', error);
      return {
        category: MessageCategory.SYSTEM,
        count: 0,
        hasUrgent: false,
        hasUnread: false,
        unreadCount: 0,
        urgentCount: 0,
        showBadge: false
      };
    }
  }

  // ==================== 消息操作 ====================

  /**
   * 标记消息为已读
   */
  async markAsRead(messageId: string, userId: string): Promise<{ success: boolean }> {
    try {
      // 数据验证
      if (!messageId?.trim()) {
        throw new Error('消息ID不能为空');
      }
      if (!userId?.trim()) {
        throw new Error('用户ID不能为空');
      }

      // 调用API标记消息为已读
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '标记消息已读失败');
      }

      return { success: true };
    } catch (error) {
      console.error('标记消息已读失败:', error);
      return { success: false };
    }
  }

  /**
   * 批量标记消息为已读
   */
  async markBatchAsRead(messageIds: string[], userId: string): Promise<{ success: boolean; updatedCount: number }> {
    try {
      // 数据验证
      if (!messageIds || messageIds.length === 0) {
        throw new Error('消息ID列表不能为空');
      }
      if (!userId?.trim()) {
        throw new Error('用户ID不能为空');
      }
      if (messageIds.length > 100) {
        throw new Error('批量操作消息数量不能超过100条');
      }

      // 调用API批量标记消息为已读
      const response = await fetch('/api/messages/batch-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ messageIds, userId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '批量标记已读失败');
      }

      return {
        success: true,
        updatedCount: data.data.updatedCount || 0
      };
    } catch (error) {
      console.error('批量标记已读失败:', error);
      return {
        success: false,
        updatedCount: 0
      };
    }
  }

  /**
   * 标记所有消息为已读
   */
  async markAllAsRead(userId: string): Promise<{ success: boolean; updatedCount: number }> {
    try {
      // 数据验证
      if (!userId?.trim()) {
        throw new Error('用户ID不能为空');
      }

      // 调用API标记所有消息为已读
      const response = await fetch(`/api/users/${userId}/messages/mark-all-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '标记全部已读失败');
      }

      return {
        success: true,
        updatedCount: data.data.updatedCount || 0
      };
    } catch (error) {
      console.error('标记全部已读失败:', error);
      return {
        success: false,
        updatedCount: 0
      };
    }
  }

  /**
   * 收藏/取消收藏消息
   */
  async toggleStar(messageId: string, userId: string): Promise<{ success: boolean; isStarred: boolean }> {
    try {
      // 数据验证
      if (!messageId?.trim()) {
        throw new Error('消息ID不能为空');
      }
      if (!userId?.trim()) {
        throw new Error('用户ID不能为空');
      }

      // 调用API切换消息收藏状态
      const response = await fetch(`/api/messages/${messageId}/star`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '切换收藏状态失败');
      }

      return {
        success: true,
        isStarred: data.data.isStarred || false
      };
    } catch (error) {
      console.error('切换收藏状态失败:', error);
      return {
        success: false,
        isStarred: false
      };
    }
  }

  /**
   * 删除消息
   */
  async deleteMessage(messageId: string, userId: string): Promise<{ success: boolean }> {
    try {
      // 数据验证
      if (!messageId?.trim()) {
        throw new Error('消息ID不能为空');
      }
      if (!userId?.trim()) {
        throw new Error('用户ID不能为空');
      }

      // 调用API删除消息
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '删除消息失败');
      }

      return { success: true };
    } catch (error) {
      console.error('删除消息失败:', error);
      return { success: false };
    }
  }

  /**
   * 批量删除消息
   */
  async deleteBatchMessages(messageIds: string[], userId: string): Promise<{ success: boolean; deletedCount: number }> {
    try {
      // 数据验证
      if (!messageIds || messageIds.length === 0) {
        throw new Error('消息ID列表不能为空');
      }
      if (!userId?.trim()) {
        throw new Error('用户ID不能为空');
      }
      if (messageIds.length > 100) {
        throw new Error('批量删除消息数量不能超过100条');
      }

      // 调用API批量删除消息
      const response = await fetch('/api/messages/batch-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ messageIds, userId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '批量删除消息失败');
      }

      return {
        success: true,
        deletedCount: data.data.deletedCount || 0
      };
    } catch (error) {
      console.error('批量删除消息失败:', error);
      return {
        success: false,
        deletedCount: 0
      };
    }
  }

  // ==================== 统计信息 ====================

  /**
   * 获取用户消息统计
   */
  async getMessageStats(username: string): Promise<MessageStats> {
    try {
      // 数据验证
      if (!username?.trim()) {
        throw new Error('用户名不能为空');
      }

      // 调用API获取消息统计
      const response = await fetch(`/api/users/${username}/message-stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '获取消息统计失败');
      }

      return data.data.stats;
    } catch (error) {
      console.error('获取消息统计失败:', error);
      return {
        total: 0,
        totalCount: 0,
        unread: 0,
        unreadCount: 0,
        read: 0,
        archived: 0,
        byCategory: {
          [MessageCategory.SYSTEM]: 0,
          [MessageCategory.NOTIFICATION]: 0,
          [MessageCategory.REMINDER]: 0,
          [MessageCategory.ANNOUNCEMENT]: 0
        },
        byPriority: {
          [MessagePriority.LOW]: 0,
          [MessagePriority.NORMAL]: 0,
          [MessagePriority.HIGH]: 0,
          [MessagePriority.URGENT]: 0
        }
      };
    }
  }

  // ==================== 系统管理 ====================

  /**
   * 清理过期消息
   */
  async cleanupExpiredMessages(
    daysOld: number = 30
  ): Promise<{ success: boolean; deletedCount: number }> {
    try {
      // 数据验证
      if (daysOld < 1 || daysOld > 365) {
        throw new Error('清理天数必须在1-365之间');
      }

      // 调用API清理过期消息
      const response = await fetch('/api/messages/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ daysOld })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '清理过期消息失败');
      }

      return {
        success: true,
        deletedCount: data.data.deletedCount || 0
      };
    } catch (error) {
      console.error('清理过期消息失败:', error);
      return {
        success: false,
        deletedCount: 0
      };
    }
  }

  /**
   * 生成系统报告
   */
  async generateSystemReport(
    startDate: Date,
    endDate: Date
  ): Promise<SystemReport> {
    try {
      // 数据验证
      if (!startDate || !endDate) {
        throw new Error('开始日期和结束日期不能为空');
      }
      if (startDate >= endDate) {
        throw new Error('开始日期必须早于结束日期');
      }
      if (endDate.getTime() - startDate.getTime() > 365 * 24 * 60 * 60 * 1000) {
        throw new Error('报告时间范围不能超过365天');
      }

      // 调用API生成系统报告
      const response = await fetch('/api/system-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '生成系统报告失败');
      }

      return data.data.report;
    } catch (error) {
      console.error('生成系统报告失败:', error);
      return {
        reportDate: new Date(),
        overdueUsers: [],
        totalOverdue: 0,
        reportType: 'daily',
        totalMessages: 0,
        systemMessages: 0,
        userMessages: 0,
        notificationMessages: 0,
        period: {
          start: startDate,
          end: endDate
        }
      };
    }
  }
}

/**
 * 全局消息服务实例
 */
export const messageService = new MessageService();

// 重新导出常用方法以保持向后兼容
export const sendMessage = (messageData: CreateMessageRequest) => messageService.sendMessage(messageData);
export const batchOperateMessages = (batchData: BatchMessageRequest) => messageService.batchOperateMessages(batchData);
export const sendSystemNotification = (receiverId: string, title: string, content: string, category?: MessageCategory, priority?: MessagePriority) => 
  messageService.sendSystemNotification(receiverId, title, content, category, priority);
export const getMessages = (userId: string, params?: MessageQueryParams) => messageService.getMessages(userId, params);
export const getMessageById = (messageId: string) => messageService.getMessageById(messageId);
export const getUnreadCount = (userId: string) => messageService.getUnreadCount(userId);
export const getNotificationBadge = (userId: string) => messageService.getNotificationBadge(userId);
export const markAsRead = (messageId: string, userId: string) => messageService.markAsRead(messageId, userId);
export const markBatchAsRead = (messageIds: string[], userId: string) => messageService.markBatchAsRead(messageIds, userId);
export const markAllAsRead = (userId: string) => messageService.markAllAsRead(userId);
export const toggleStar = (messageId: string, userId: string) => messageService.toggleStar(messageId, userId);
export const deleteMessage = (messageId: string, userId: string) => messageService.deleteMessage(messageId, userId);
export const deleteBatchMessages = (messageIds: string[], userId: string) => messageService.deleteBatchMessages(messageIds, userId);
export const getMessageStats = (username: string) => messageService.getMessageStats(username);
export const cleanupExpiredMessages = (daysOld?: number) => messageService.cleanupExpiredMessages(daysOld);
export const generateSystemReport = (startDate: Date, endDate: Date) => messageService.generateSystemReport(startDate, endDate);

export default messageService;