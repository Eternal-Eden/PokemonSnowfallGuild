/**
 * 好友服务
 * 处理好友关系、私聊、黑名单等功能
 */

import { DataService } from './dataService';
import { UserRole } from '@/types/auth';
import {
  Friend,
  FriendRequest,
  PrivateMessage,
  PrivateConversation,
  BlockedUser,
  FriendStats,
  UserInteractionContext,
  FriendRequestsQueryParams
} from '@/types/friends';

/**
 * 好友服务类
 */
class FriendsService extends DataService {
  constructor() {
    super();
  }

  // ==================== 好友管理 ====================

  /**
   * 获取好友列表
   */
  async getFriends(
    userId: string,
    params?: {
      search?: string;
      status?: 'online' | 'offline' | 'all';
      sortBy?: 'name' | 'lastActive' | 'addedDate';
      page?: number;
      limit?: number;
    }
  ): Promise<Friend[]> {
    try {
      const {
        search = '',
        status = 'all',
        sortBy = 'name',
        page = 1,
        limit = 20
      } = params || {};

      const response = await this.fetchData<{
        friends: Friend[];
        total: number;
      }>(`/api/friends?userId=${userId}&search=${encodeURIComponent(search)}&status=${status}&sortBy=${sortBy}&page=${page}&limit=${limit}`);

      return response.friends || [];
    } catch (error) {
      console.error('获取好友列表失败:', error);
      return [];
    }
  }

  /**
   * 发送好友请求
   */
  async sendFriendRequest(
    senderId: string,
    targetUsername: string,
    message?: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // 验证用户名不能为空
      if (!targetUsername?.trim()) {
        return { success: false, message: '用户名不能为空' };
      }

      // 验证不能添加自己为好友
      if (senderId === targetUsername) {
        return { success: false, message: '不能添加自己为好友' };
      }

      const response = await this.fetchData<{ success: boolean; message: string }>('/api/friends/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId,
          targetUsername,
          message: message?.trim() || ''
        })
      });

      return {
        success: response.success,
        message: response.message || '好友请求已发送'
      };
    } catch (error) {
      console.error('发送好友请求失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '发送好友请求失败'
      };
    }
  }

  /**
   * 响应好友请求
   */
  async respondToFriendRequest(
    requestId: string,
    action: 'accept' | 'reject'
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // 验证请求ID
      if (!requestId?.trim()) {
        return { success: false, message: '请求ID不能为空' };
      }

      // 验证操作类型
      if (!['accept', 'reject'].includes(action)) {
        return { success: false, message: '无效的操作类型' };
      }

      const response = await this.fetchData<{ success: boolean; message: string }>(`/api/friends/requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      });

      return {
        success: response.success,
        message: response.message || (action === 'accept' ? '已接受好友请求' : '已拒绝好友请求')
      };
    } catch (error) {
      console.error('响应好友请求失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '操作失败'
      };
    }
  }

  /**
   * 获取好友请求列表
   */
  async getFriendRequests(userId: string, params?: FriendRequestsQueryParams): Promise<FriendRequest[]> {
    try {
      if (!userId?.trim()) {
        return [];
      }

      const {
        type = 'received',
        status,
        page = 1,
        limit = 20
      } = params || {};

      const queryParams = new URLSearchParams({
        userId,
        type,
        page: page.toString(),
        limit: limit.toString()
      });

      if (status) {
        queryParams.append('status', status);
      }

      const response = await this.fetchData<{
        requests: FriendRequest[];
        total: number;
      }>(`/api/friends/requests?${queryParams.toString()}`);

      return response.requests || [];
    } catch (error) {
      console.error('获取好友请求列表失败:', error);
      return [];
    }
  }

  /**
   * 删除好友
   */
  async removeFriend(
    userId: string,
    friendId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // 验证参数
      if (!userId?.trim() || !friendId?.trim()) {
        return { success: false, message: '用户ID不能为空' };
      }

      // 验证不能删除自己
      if (userId === friendId) {
        return { success: false, message: '不能删除自己' };
      }

      const response = await this.fetchData<{ success: boolean; message: string }>(`/api/friends/${friendId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      return {
        success: response.success,
        message: response.message || '好友删除成功'
      };
    } catch (error) {
      console.error('删除好友失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '删除好友失败'
      };
    }
  }

  /**
   * 设置好友昵称
   */
  async setFriendNickname(
    userId: string,
    friendId: string,
    nickname: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // 验证参数
      if (!userId?.trim() || !friendId?.trim()) {
        return { success: false, message: '用户ID不能为空' };
      }

      // 验证昵称长度
      const trimmedNickname = nickname?.trim() || '';
      if (trimmedNickname.length > 20) {
        return { success: false, message: '昵称长度不能超过20个字符' };
      }

      const response = await this.fetchData<{ success: boolean; message: string }>(`/api/friends/${friendId}/nickname`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          nickname: trimmedNickname
        })
      });

      return {
        success: response.success,
        message: response.message || '昵称设置成功'
      };
    } catch (error) {
      console.error('设置好友昵称失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '设置昵称失败'
      };
    }
  }

  /**
   * 设置特别关心
   */
  async toggleFriendFavorite(
    userId: string,
    friendId: string
  ): Promise<{ success: boolean; isFavorite: boolean }> {
    try {
      // 验证参数
      if (!userId?.trim() || !friendId?.trim()) {
        return { success: false, isFavorite: false };
      }

      const response = await this.fetchData<{ success: boolean; isFavorite: boolean; message?: string }>(`/api/friends/${friendId}/favorite`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      return {
        success: response.success,
        isFavorite: response.isFavorite || false
      };
    } catch (error) {
      console.error('设置特别关心失败:', error);
      return {
        success: false,
        isFavorite: false
      };
    }
  }

  // ==================== 私聊管理 ====================

  /**
   * 获取私聊会话列表
   */
  async getConversations(userId: string): Promise<PrivateConversation[]> {
    try {
      if (!userId?.trim()) {
        return [];
      }

      const response = await this.fetchData<{
        conversations: PrivateConversation[];
        total: number;
      }>(`/api/conversations?userId=${userId}`);

      return response.conversations || [];
    } catch (error) {
      console.error('获取私聊会话列表失败:', error);
      return [];
    }
  }

  /**
   * 获取私聊消息
   */
  async getConversationMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ messages: PrivateMessage[]; hasMore: boolean }> {
    try {
      if (!conversationId?.trim()) {
        return { messages: [], hasMore: false };
      }

      const response = await this.fetchData<{
        messages: PrivateMessage[];
        total: number;
        hasMore: boolean;
      }>(`/api/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);

      return {
        messages: response.messages || [],
        hasMore: response.hasMore || false
      };
    } catch (error) {
      console.error('获取私聊消息失败:', error);
      return { messages: [], hasMore: false };
    }
  }

  /**
   * 发送私聊消息
   */
  async sendPrivateMessage(
    senderId: string,
    conversationId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text'
  ): Promise<{ success: boolean; message?: PrivateMessage }> {
    try {
      // 验证参数
      if (!senderId?.trim() || !conversationId?.trim()) {
        return { success: false };
      }

      if (!content?.trim()) {
        return { success: false };
      }

      // 验证消息长度
      if (content.length > 1000) {
        return { success: false };
      }

      const response = await this.fetchData<{
        success: boolean;
        message?: PrivateMessage;
        error?: string;
      }>(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId,
          content: content.trim(),
          type: messageType
        })
      });

      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      console.error('发送私聊消息失败:', error);
      return { success: false };
    }
  }

  /**
   * 标记消息为已读
   */
  async markConversationAsRead(
    conversationId: string,
    userId: string
  ): Promise<{ success: boolean }> {
    try {
      // 验证参数
      if (!conversationId?.trim() || !userId?.trim()) {
        return { success: false };
      }

      const response = await this.fetchData<{
        success: boolean;
        message?: string;
      }>(`/api/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      return { success: response.success };
    } catch (error) {
      console.error('标记消息为已读失败:', error);
      return { success: false };
    }
  }

  /**
   * 删除私聊消息
   */
  async deletePrivateMessage(
    messageId: string,
    userId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // 验证参数
      if (!messageId?.trim() || !userId?.trim()) {
        return { success: false, message: '参数不能为空' };
      }

      const response = await this.fetchData<{
        success: boolean;
        message: string;
      }>(`/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      return {
        success: response.success,
        message: response.message || '消息删除成功'
      };
    } catch (error) {
      console.error('删除私聊消息失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '删除消息失败'
      };
    }
  }

  // ==================== 黑名单管理 ====================

  /**
   * 拉黑用户
   */
  async blockUser(
    userId: string,
    targetUserId: string,
    reason?: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // 验证参数
      if (!userId?.trim() || !targetUserId?.trim()) {
        return { success: false, message: '用户ID不能为空' };
      }

      // 验证不能拉黑自己
      if (userId === targetUserId) {
        return { success: false, message: '不能拉黑自己' };
      }

      // 验证拉黑原因长度
      const trimmedReason = reason?.trim() || '';
      if (trimmedReason.length > 100) {
        return { success: false, message: '拉黑原因不能超过100个字符' };
      }

      const response = await this.fetchData<{
        success: boolean;
        message: string;
      }>('/api/users/block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          targetUserId,
          reason: trimmedReason
        })
      });

      return {
        success: response.success,
        message: response.message || '用户已拉黑'
      };
    } catch (error) {
      console.error('拉黑用户失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '拉黑用户失败'
      };
    }
  }

  /**
   * 取消拉黑
   */
  async unblockUser(
    userId: string,
    targetUserId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // 验证参数
      if (!userId?.trim() || !targetUserId?.trim()) {
        return { success: false, message: '用户ID不能为空' };
      }

      const response = await this.fetchData<{
        success: boolean;
        message: string;
      }>(`/api/users/unblock/${targetUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      return {
        success: response.success,
        message: response.message || '已取消拉黑'
      };
    } catch (error) {
      console.error('取消拉黑失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '取消拉黑失败'
      };
    }
  }

  /**
   * 获取黑名单
   */
  async getBlockedUsers(userId: string): Promise<BlockedUser[]> {
    try {
      if (!userId?.trim()) {
        return [];
      }

      const response = await this.fetchData<{
        blockedUsers: BlockedUser[];
        total: number;
      }>(`/api/users/blocked?userId=${userId}`);

      return response.blockedUsers || [];
    } catch (error) {
      console.error('获取黑名单失败:', error);
      return [];
    }
  }

  // ==================== 统计信息 ====================

  /**
   * 获取好友统计
   */
  async getFriendStats(userId: string): Promise<FriendStats> {
    try {
      if (!userId?.trim()) {
        return {
          totalFriends: 0,
          onlineFriends: 0,
          pendingRequests: 0,
          blockedUsers: 0,
          unreadMessages: 0
        };
      }

      const response = await this.fetchData<{
        stats: FriendStats;
      }>(`/api/friends/stats?userId=${userId}`);

      return response.stats || {
        totalFriends: 0,
        onlineFriends: 0,
        pendingRequests: 0,
        blockedUsers: 0,
        unreadMessages: 0
      };
    } catch (error) {
      console.error('获取好友统计失败:', error);
      return {
        totalFriends: 0,
        onlineFriends: 0,
        pendingRequests: 0,
        blockedUsers: 0,
        unreadMessages: 0
      };
    }
  }

  /**
   * 获取用户交互上下文
   */
  async getUserInteractionContext(
    currentUserId: string,
    targetUserId: string
  ): Promise<UserInteractionContext> {
    try {
      // 验证参数
      if (!currentUserId?.trim() || !targetUserId?.trim()) {
        return {
          targetUser: {
            id: targetUserId || '',
            name: '',
            role: UserRole.USER
          },
          currentUser: {
            id: currentUserId || '',
            name: ''
          },
          relationship: {
            isFriend: false,
            isBlocked: false,
            hasPendingRequest: false,
            requestSentByCurrentUser: false
          },
          position: { x: 0, y: 0 },
          isOpen: false
        };
      }

      const response = await this.fetchData<{
        context: UserInteractionContext;
      }>(`/api/users/interaction-context?currentUserId=${currentUserId}&targetUserId=${targetUserId}`);

      return response.context || {
        targetUser: {
          id: targetUserId,
          name: '',
          role: UserRole.USER
        },
        currentUser: {
          id: currentUserId,
          name: ''
        },
        relationship: {
          isFriend: false,
          isBlocked: false,
          hasPendingRequest: false,
          requestSentByCurrentUser: false
        },
        position: { x: 0, y: 0 },
        isOpen: false
      };
    } catch (error) {
      console.error('获取用户交互上下文失败:', error);
      return {
        targetUser: {
          id: targetUserId,
          name: '',
          role: UserRole.USER
        },
        currentUser: {
          id: currentUserId,
          name: ''
        },
        relationship: {
          isFriend: false,
          isBlocked: false,
          hasPendingRequest: false,
          requestSentByCurrentUser: false
        },
        position: { x: 0, y: 0 },
        isOpen: false
      };
    }
  }
}

/**
 * 全局好友服务实例
 */
export const friendsService = new FriendsService();

// 重新导出常用方法以保持向后兼容
export const getFriends = (userId: string, params?: {
  search?: string;
  status?: 'online' | 'offline' | 'all';
  sortBy?: 'name' | 'lastActive' | 'addedDate';
  page?: number;
  limit?: number;
}) => friendsService.getFriends(userId, params);
export const sendFriendRequest = (senderId: string, targetUsername: string, message?: string) => 
  friendsService.sendFriendRequest(senderId, targetUsername, message);
export const respondToFriendRequest = (requestId: string, action: 'accept' | 'reject') => 
  friendsService.respondToFriendRequest(requestId, action);
export const getFriendRequests = (userId: string, params?: FriendRequestsQueryParams) => 
  friendsService.getFriendRequests(userId, params);
export const removeFriend = (userId: string, friendId: string) => 
  friendsService.removeFriend(userId, friendId);
export const setFriendNickname = (userId: string, friendId: string, nickname: string) => 
  friendsService.setFriendNickname(userId, friendId, nickname);
export const toggleFriendFavorite = (userId: string, friendId: string) => 
  friendsService.toggleFriendFavorite(userId, friendId);
export const getConversations = (userId: string) => friendsService.getConversations(userId);
export const getConversationMessages = (conversationId: string, page?: number, limit?: number) => 
  friendsService.getConversationMessages(conversationId, page, limit);
export const sendPrivateMessage = (senderId: string, conversationId: string, content: string, messageType?: 'text' | 'image' | 'file') => 
  friendsService.sendPrivateMessage(senderId, conversationId, content, messageType);
export const markConversationAsRead = (conversationId: string, userId: string) => 
  friendsService.markConversationAsRead(conversationId, userId);
export const deletePrivateMessage = (messageId: string, userId: string) => 
  friendsService.deletePrivateMessage(messageId, userId);
export const blockUser = (userId: string, targetUserId: string, reason?: string) => 
  friendsService.blockUser(userId, targetUserId, reason);
export const unblockUser = (userId: string, targetUserId: string) => 
  friendsService.unblockUser(userId, targetUserId);
export const getBlockedUsers = (userId: string) => friendsService.getBlockedUsers(userId);
export const getFriendStats = (userId: string) => friendsService.getFriendStats(userId);
export const getUserInteractionContext = (currentUserId: string, targetUserId: string) => 
  friendsService.getUserInteractionContext(currentUserId, targetUserId);

export default friendsService;