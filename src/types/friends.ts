// 好友系统相关类型定义

import { UserRole } from './auth';

// 好友请求状态
export enum FriendRequestStatus {
  PENDING = 'pending', // 待处理
  ACCEPTED = 'accepted', // 已接受
  REJECTED = 'rejected', // 已拒绝
  CANCELLED = 'cancelled' // 已取消
}

// 好友状态
export enum FriendStatus {
  ONLINE = 'online', // 在线
  OFFLINE = 'offline', // 离线
  BUSY = 'busy', // 忙碌
  AWAY = 'away' // 离开
}

// 好友信息
export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  friendName: string;
  friendAvatar?: string;
  friendRole: UserRole;
  status: FriendStatus;
  lastOnlineAt?: Date;
  addedAt: Date;
  nickname?: string; // 好友备注名
  isFavorite: boolean; // 是否为特别关心
  unreadMessageCount: number; // 未读私聊消息数
}

// 好友请求
export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: UserRole;
  receiverId: string;
  receiverName: string;
  status: FriendRequestStatus;
  message?: string; // 请求消息
  createdAt: Date;
  updatedAt: Date;
  respondedAt?: Date;
}

// 黑名单用户
export interface BlockedUser {
  id: string;
  userId: string; // 拉黑操作者
  blockedUserId: string;
  blockedUserName: string;
  blockedUserAvatar?: string;
  blockedUserRole: UserRole;
  reason?: string; // 拉黑原因
  blockedAt: Date;
}

// 私聊消息
export interface PrivateMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  receiverName: string;
  content: string;
  type: 'text' | 'image' | 'system';
  imageUrl?: string;
  isRead: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// 私聊会话
export interface PrivateConversation {
  id: string;
  participantIds: string[];
  participants: {
    userId: string;
    userName: string;
    userAvatar?: string;
    userRole: UserRole;
    status: FriendStatus;
  }[];
  lastMessage?: PrivateMessage;
  unreadCount: number; // 当前用户的未读消息数
  lastActiveAt: Date;
  createdAt: Date;
}

// 发送好友请求
export interface SendFriendRequestRequest {
  receiverId: string;
  message?: string;
}

// 响应好友请求
export interface RespondFriendRequestRequest {
  requestId: string;
  action: 'accept' | 'reject';
}

// 拉黑用户请求
export interface BlockUserRequest {
  blockedUserId: string;
  reason?: string;
}

// 发送私聊消息请求
export interface SendPrivateMessageRequest {
  receiverId: string;
  content: string;
  type?: 'text' | 'image';
  imageUrl?: string;
}

// 好友列表查询参数
export interface FriendsQueryParams {
  status?: FriendStatus;
  search?: string;
  sortBy?: 'name' | 'added' | 'lastOnline';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// 好友请求查询参数
export interface FriendRequestsQueryParams {
  type: 'sent' | 'received';
  status?: FriendRequestStatus;
  page?: number;
  limit?: number;
}

// 私聊消息查询参数
export interface PrivateMessagesQueryParams {
  conversationId?: string;
  participantId?: string;
  page?: number;
  limit?: number;
  before?: Date;
  after?: Date;
}

// 好友统计信息
export interface FriendStats {
  totalFriends: number;
  onlineFriends: number;
  pendingRequests: number;
  blockedUsers: number;
  unreadMessages: number;
}

// 用户交互菜单项
export interface UserInteractionMenuItem {
  id: string;
  label: string;
  icon: string;
  action: 'addFriend' | 'removeFriend' | 'blockUser' | 'unblockUser' | 'sendMessage' | 'viewProfile';
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}

// 用户交互上下文
export interface UserInteractionContext {
  targetUser: {
    id: string;
    name: string;
    gameNickname?: string;
    avatar?: string;
    role: UserRole;
  };
  currentUser?: {
    id: string;
    name: string;
  };
  relationship?: {
    isFriend: boolean;
    isBlocked: boolean;
    hasPendingRequest: boolean;
    requestSentByCurrentUser: boolean;
  };
  position: {
    x: number;
    y: number;
  };
  isOpen?: boolean;
}