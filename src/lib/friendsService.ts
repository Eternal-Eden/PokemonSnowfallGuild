// 好友系统服务 - 提供好友管理、黑名单管理和私聊功能

import {
  Friend,
  FriendRequest,
  BlockedUser,
  PrivateMessage,
  PrivateConversation,
  FriendRequestStatus,
  FriendStatus,
  SendFriendRequestRequest,
  RespondFriendRequestRequest,
  BlockUserRequest,
  SendPrivateMessageRequest,
  FriendsQueryParams,
  FriendRequestsQueryParams,
  PrivateMessagesQueryParams,
  FriendStats,
  UserInteractionContext
} from '@/types/friends';
import { UserRole } from '@/types/auth';

// 模拟数据存储
let friends: Friend[] = [];
let friendRequests: FriendRequest[] = [];
let blockedUsers: BlockedUser[] = [];
let privateMessages: PrivateMessage[] = [];
let conversations: PrivateConversation[] = [];

// 生成唯一ID
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// 获取当前时间
function now(): Date {
  return new Date();
}

// ==================== 好友管理 ====================

// 获取好友列表
export async function getFriends(userId: string, params?: FriendsQueryParams): Promise<Friend[]> {
  let userFriends = friends.filter(f => f.userId === userId);
  
  // 应用筛选
  if (params?.status) {
    userFriends = userFriends.filter(f => f.status === params.status);
  }
  
  if (params?.search) {
    const search = params.search.toLowerCase();
    userFriends = userFriends.filter(f => 
      f.friendName.toLowerCase().includes(search) ||
      (f.nickname && f.nickname.toLowerCase().includes(search))
    );
  }
  
  // 排序
  if (params?.sortBy) {
    userFriends.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (params.sortBy) {
        case 'name':
          aValue = a.nickname || a.friendName;
          bValue = b.nickname || b.friendName;
          break;
        case 'added':
          aValue = a.addedAt;
          bValue = b.addedAt;
          break;
        case 'lastOnline':
          aValue = a.lastOnlineAt || new Date(0);
          bValue = b.lastOnlineAt || new Date(0);
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return params.sortOrder === 'desc' ? 1 : -1;
      if (aValue > bValue) return params.sortOrder === 'desc' ? -1 : 1;
      return 0;
    });
  }
  
  return userFriends;
}

// 发送好友请求
export async function sendFriendRequest(senderId: string, request: SendFriendRequestRequest): Promise<FriendRequest> {
  // 检查是否已经是好友
  const existingFriend = friends.find(f => 
    (f.userId === senderId && f.friendId === request.receiverId) ||
    (f.userId === request.receiverId && f.friendId === senderId)
  );
  
  if (existingFriend) {
    throw new Error('已经是好友关系');
  }
  
  // 检查是否已有待处理的请求
  const existingRequest = friendRequests.find(r => 
    r.senderId === senderId && 
    r.receiverId === request.receiverId && 
    r.status === FriendRequestStatus.PENDING
  );
  
  if (existingRequest) {
    throw new Error('已有待处理的好友请求');
  }
  
  // 检查是否被拉黑
  const isBlocked = blockedUsers.find(b => 
    b.userId === request.receiverId && b.blockedUserId === senderId
  );
  
  if (isBlocked) {
    throw new Error('无法发送好友请求');
  }
  
  // 模拟获取用户信息
  const senderInfo = await getUserInfo(senderId);
  const receiverInfo = await getUserInfo(request.receiverId);
  
  const friendRequest: FriendRequest = {
    id: generateId(),
    senderId,
    senderName: senderInfo.name,
    senderAvatar: senderInfo.avatar,
    senderRole: senderInfo.role,
    receiverId: request.receiverId,
    receiverName: receiverInfo.name,
    status: FriendRequestStatus.PENDING,
    message: request.message,
    createdAt: now(),
    updatedAt: now()
  };
  
  friendRequests.push(friendRequest);
  return friendRequest;
}

// 响应好友请求
export async function respondToFriendRequest(userId: string, request: RespondFriendRequestRequest): Promise<void> {
  const friendRequest = friendRequests.find(r => r.id === request.requestId && r.receiverId === userId);
  
  if (!friendRequest) {
    throw new Error('好友请求不存在');
  }
  
  if (friendRequest.status !== FriendRequestStatus.PENDING) {
    throw new Error('好友请求已处理');
  }
  
  friendRequest.status = request.action === 'accept' ? FriendRequestStatus.ACCEPTED : FriendRequestStatus.REJECTED;
  friendRequest.updatedAt = now();
  friendRequest.respondedAt = now();
  
  // 如果接受请求，创建好友关系
  if (request.action === 'accept') {
    const senderInfo = await getUserInfo(friendRequest.senderId);
    const receiverInfo = await getUserInfo(friendRequest.receiverId);
    
    // 为双方创建好友记录
    const friend1: Friend = {
      id: generateId(),
      userId: friendRequest.senderId,
      friendId: friendRequest.receiverId,
      friendName: receiverInfo.name,
      friendAvatar: receiverInfo.avatar,
      friendRole: receiverInfo.role,
      status: FriendStatus.ONLINE,
      addedAt: now(),
      isFavorite: false,
      unreadMessageCount: 0
    };
    
    const friend2: Friend = {
      id: generateId(),
      userId: friendRequest.receiverId,
      friendId: friendRequest.senderId,
      friendName: senderInfo.name,
      friendAvatar: senderInfo.avatar,
      friendRole: senderInfo.role,
      status: FriendStatus.ONLINE,
      addedAt: now(),
      isFavorite: false,
      unreadMessageCount: 0
    };
    
    friends.push(friend1, friend2);
    
    // 创建私聊会话
    const conversation: PrivateConversation = {
      id: generateId(),
      participantIds: [friendRequest.senderId, friendRequest.receiverId],
      participants: [
        {
          userId: friendRequest.senderId,
          userName: senderInfo.name,
          userAvatar: senderInfo.avatar,
          userRole: senderInfo.role,
          status: FriendStatus.ONLINE
        },
        {
          userId: friendRequest.receiverId,
          userName: receiverInfo.name,
          userAvatar: receiverInfo.avatar,
          userRole: receiverInfo.role,
          status: FriendStatus.ONLINE
        }
      ],
      unreadCount: 0,
      lastActiveAt: now(),
      createdAt: now()
    };
    
    conversations.push(conversation);
  }
}

// 删除好友
export async function removeFriend(userId: string, friendId: string): Promise<void> {
  // 删除双方的好友记录
  friends = friends.filter(f => 
    !((f.userId === userId && f.friendId === friendId) ||
      (f.userId === friendId && f.friendId === userId))
  );
  
  // 删除私聊会话
  conversations = conversations.filter(c => 
    !(c.participantIds.includes(userId) && c.participantIds.includes(friendId))
  );
}

// ==================== 黑名单管理 ====================

// 获取黑名单
export async function getBlockedUsers(userId: string): Promise<BlockedUser[]> {
  return blockedUsers.filter(b => b.userId === userId);
}

// 拉黑用户
export async function blockUser(userId: string, request: BlockUserRequest): Promise<BlockedUser> {
  // 检查是否已经拉黑
  const existingBlock = blockedUsers.find(b => 
    b.userId === userId && b.blockedUserId === request.blockedUserId
  );
  
  if (existingBlock) {
    throw new Error('用户已在黑名单中');
  }
  
  // 获取被拉黑用户信息
  const blockedUserInfo = await getUserInfo(request.blockedUserId);
  
  const blockedUser: BlockedUser = {
    id: generateId(),
    userId,
    blockedUserId: request.blockedUserId,
    blockedUserName: blockedUserInfo.name,
    blockedUserAvatar: blockedUserInfo.avatar,
    blockedUserRole: blockedUserInfo.role,
    reason: request.reason,
    blockedAt: now()
  };
  
  blockedUsers.push(blockedUser);
  
  // 如果是好友，删除好友关系
  await removeFriend(userId, request.blockedUserId);
  
  // 删除相关的好友请求
  friendRequests = friendRequests.filter(r => 
    !((r.senderId === userId && r.receiverId === request.blockedUserId) ||
      (r.senderId === request.blockedUserId && r.receiverId === userId))
  );
  
  return blockedUser;
}

// 取消拉黑
export async function unblockUser(userId: string, blockedUserId: string): Promise<void> {
  blockedUsers = blockedUsers.filter(b => 
    !(b.userId === userId && b.blockedUserId === blockedUserId)
  );
}

// ==================== 私聊功能 ====================

// 获取私聊会话列表
export async function getConversations(userId: string): Promise<PrivateConversation[]> {
  return conversations
    .filter(c => c.participantIds.includes(userId))
    .sort((a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime());
}

// 获取私聊消息
export async function getPrivateMessages(userId: string, params: PrivateMessagesQueryParams): Promise<PrivateMessage[]> {
  let messages = privateMessages;
  
  if (params.conversationId) {
    const conversation = conversations.find(c => c.id === params.conversationId);
    if (conversation && conversation.participantIds.includes(userId)) {
      messages = messages.filter(m => 
        conversation.participantIds.includes(m.senderId) &&
        conversation.participantIds.includes(m.receiverId)
      );
    } else {
      return [];
    }
  } else if (params.participantId) {
    messages = messages.filter(m => 
      (m.senderId === userId && m.receiverId === params.participantId) ||
      (m.senderId === params.participantId && m.receiverId === userId)
    );
  } else {
    messages = messages.filter(m => 
      m.senderId === userId || m.receiverId === userId
    );
  }
  
  // 时间筛选
  if (params.before) {
    messages = messages.filter(m => m.createdAt < params.before!);
  }
  
  if (params.after) {
    messages = messages.filter(m => m.createdAt > params.after!);
  }
  
  // 排序
  messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  // 分页
  const limit = params.limit || 50;
  const page = params.page || 1;
  const start = (page - 1) * limit;
  
  return messages.slice(start, start + limit);
}

// 发送私聊消息
export async function sendPrivateMessage(senderId: string, request: SendPrivateMessageRequest): Promise<PrivateMessage> {
  // 检查是否被拉黑
  const isBlocked = blockedUsers.find(b => 
    b.userId === request.receiverId && b.blockedUserId === senderId
  );
  
  if (isBlocked) {
    throw new Error('无法发送消息');
  }
  
  // 获取用户信息
  const senderInfo = await getUserInfo(senderId);
  const receiverInfo = await getUserInfo(request.receiverId);
  
  const message: PrivateMessage = {
    id: generateId(),
    senderId,
    senderName: senderInfo.name,
    senderAvatar: senderInfo.avatar,
    receiverId: request.receiverId,
    receiverName: receiverInfo.name,
    content: request.content,
    type: request.type || 'text',
    imageUrl: request.imageUrl,
    isRead: false,
    isDeleted: false,
    createdAt: now(),
    updatedAt: now()
  };
  
  privateMessages.push(message);
  
  // 更新会话
  let conversation = conversations.find(c => 
    c.participantIds.includes(senderId) && c.participantIds.includes(request.receiverId)
  );
  
  if (conversation) {
    conversation.lastMessage = message;
    conversation.lastActiveAt = now();
    conversation.unreadCount += 1;
  }
  
  // 更新好友未读消息数
  const friend = friends.find(f => f.userId === request.receiverId && f.friendId === senderId);
  if (friend) {
    friend.unreadMessageCount += 1;
  }
  
  return message;
}

// 标记消息为已读
export async function markMessagesAsRead(userId: string, conversationId: string): Promise<void> {
  const conversation = conversations.find(c => c.id === conversationId);
  if (!conversation || !conversation.participantIds.includes(userId)) {
    return;
  }
  
  // 标记消息为已读
  privateMessages
    .filter(m => 
      conversation.participantIds.includes(m.senderId) &&
      conversation.participantIds.includes(m.receiverId) &&
      m.receiverId === userId &&
      !m.isRead
    )
    .forEach(m => m.isRead = true);
  
  // 重置会话未读数
  conversation.unreadCount = 0;
  
  // 重置好友未读消息数
  const otherUserId = conversation.participantIds.find(id => id !== userId);
  if (otherUserId) {
    const friend = friends.find(f => f.userId === userId && f.friendId === otherUserId);
    if (friend) {
      friend.unreadMessageCount = 0;
    }
  }
}

// ==================== 好友请求管理 ====================

// 获取好友请求列表
export async function getFriendRequests(userId: string, params: FriendRequestsQueryParams): Promise<FriendRequest[]> {
  let requests = friendRequests;
  
  if (params.type === 'sent') {
    requests = requests.filter(r => r.senderId === userId);
  } else {
    requests = requests.filter(r => r.receiverId === userId);
  }
  
  if (params.status) {
    requests = requests.filter(r => r.status === params.status);
  }
  
  return requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// ==================== 统计信息 ====================

// 获取好友统计
export async function getFriendStats(userId: string): Promise<FriendStats> {
  const userFriends = friends.filter(f => f.userId === userId);
  const onlineFriends = userFriends.filter(f => f.status === FriendStatus.ONLINE);
  const pendingRequests = friendRequests.filter(r => 
    r.receiverId === userId && r.status === FriendRequestStatus.PENDING
  );
  const userBlockedUsers = blockedUsers.filter(b => b.userId === userId);
  const unreadMessages = userFriends.reduce((sum, f) => sum + f.unreadMessageCount, 0);
  
  return {
    totalFriends: userFriends.length,
    onlineFriends: onlineFriends.length,
    pendingRequests: pendingRequests.length,
    blockedUsers: userBlockedUsers.length,
    unreadMessages
  };
}

// ==================== 用户关系检查 ====================

// 检查用户关系
export async function getUserRelationship(currentUserId: string, targetUserId: string): Promise<{
  isFriend: boolean;
  isBlocked: boolean;
  hasPendingRequest: boolean;
  requestSentByCurrentUser: boolean;
}> {
  const isFriend = friends.some(f => 
    f.userId === currentUserId && f.friendId === targetUserId
  );
  
  const isBlocked = blockedUsers.some(b => 
    (b.userId === currentUserId && b.blockedUserId === targetUserId) ||
    (b.userId === targetUserId && b.blockedUserId === currentUserId)
  );
  
  const pendingRequest = friendRequests.find(r => 
    ((r.senderId === currentUserId && r.receiverId === targetUserId) ||
     (r.senderId === targetUserId && r.receiverId === currentUserId)) &&
    r.status === FriendRequestStatus.PENDING
  );
  
  return {
    isFriend,
    isBlocked,
    hasPendingRequest: !!pendingRequest,
    requestSentByCurrentUser: pendingRequest?.senderId === currentUserId || false
  };
}

// ==================== 辅助函数 ====================

// 模拟获取用户信息
async function getUserInfo(userId: string): Promise<{
  id: string;
  name: string;
  avatar?: string;
  role: UserRole;
}> {
  // 这里应该从实际的用户服务获取用户信息
  // 现在返回模拟数据
  return {
    id: userId,
    name: `用户${userId.slice(-4)}`,
    avatar: undefined,
    role: UserRole.USER
  };
}

// 初始化模拟数据
export function initializeMockData() {
  // 可以在这里添加一些初始的模拟数据
  console.log('好友系统服务已初始化');
}