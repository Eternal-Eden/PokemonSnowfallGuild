import { 
  Message, 
  MessageCategory, 
  MessagePriority, 
  MessageStatus, 
  SenderType, 
  CreateMessageRequest, 
  MessageRecipient, 
  BatchMessageRequest, 
  MessageStats, 
  OverdueUserInfo, 
  SystemReport, 
  MessageQueryParams, 
  MessageListResponse, 
  NotificationBadge 
} from '@/types/message';
import { User, UserRole } from '@/types/auth';
import { getAllUsers } from '@/lib/auth';

// 模拟消息存储
let messages: Message[] = [];
let messageIdCounter = 1;

// 生成消息ID
function generateMessageId(): string {
  return `msg_${Date.now()}_${messageIdCounter++}`;
}

// 创建消息
export async function createMessage(
  request: CreateMessageRequest, 
  sender: User
): Promise<Message> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const recipients: MessageRecipient[] = [];
  
  if (request.isGlobal) {
    // 全局消息，发送给所有用户
    const allUsers = await getAllUsers();
    allUsers.forEach(user => {
      recipients.push({
        username: user.username,
        userId: user.id,
        status: MessageStatus.UNREAD
      });
    });
  } else {
    // 指定用户消息
    request.recipients.forEach(username => {
      recipients.push({
        username,
        status: MessageStatus.UNREAD
      });
    });
  }
  
  const message: Message = {
    id: generateMessageId(),
    title: request.title,
    content: request.content,
    category: request.category,
    priority: request.priority,
    senderType: sender.role === UserRole.MODERATOR ? SenderType.MODERATOR : SenderType.SYSTEM,
    senderName: sender.username,
    senderId: sender.id,
    recipients,
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: request.expiresAt,
    isGlobal: request.isGlobal || false,
    metadata: request.metadata
  };
  
  messages.push(message);
  return message;
}

// 系统自动创建消息
export async function createSystemMessage(
  request: CreateMessageRequest
): Promise<Message> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const recipients: MessageRecipient[] = request.recipients.map(username => ({
    username,
    status: MessageStatus.UNREAD
  }));
  
  const message: Message = {
    id: generateMessageId(),
    title: request.title,
    content: request.content,
    category: request.category,
    priority: request.priority,
    senderType: SenderType.SYSTEM,
    senderName: 'System',
    recipients,
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: request.expiresAt,
    isGlobal: request.isGlobal || false,
    metadata: request.metadata
  };
  
  messages.push(message);
  return message;
}

// 获取用户消息列表
export async function getUserMessages(
  username: string, 
  params: MessageQueryParams = {}
): Promise<MessageListResponse> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  let userMessages = messages.filter(message => 
    message.recipients.some(recipient => recipient.username === username)
  );
  
  // 应用过滤条件
  if (params.category) {
    userMessages = userMessages.filter(msg => msg.category === params.category);
  }
  
  if (params.status) {
    userMessages = userMessages.filter(msg => {
      const recipient = msg.recipients.find(r => r.username === username);
      return recipient?.status === params.status;
    });
  }
  
  if (params.priority) {
    userMessages = userMessages.filter(msg => msg.priority === params.priority);
  }
  
  if (params.senderType) {
    userMessages = userMessages.filter(msg => msg.senderType === params.senderType);
  }
  
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    userMessages = userMessages.filter(msg => 
      msg.title.toLowerCase().includes(searchLower) ||
      msg.content.toLowerCase().includes(searchLower)
    );
  }
  
  if (params.startDate) {
    userMessages = userMessages.filter(msg => msg.createdAt >= params.startDate!);
  }
  
  if (params.endDate) {
    userMessages = userMessages.filter(msg => msg.createdAt <= params.endDate!);
  }
  
  // 排序：优先级高的在前，然后按时间倒序
  userMessages.sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
    const aPriority = priorityOrder[a.priority];
    const bPriority = priorityOrder[b.priority];
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
  
  // 分页
  const page = params.page || 1;
  const limit = params.limit || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedMessages = userMessages.slice(startIndex, endIndex);
  
  // 计算统计信息
  const stats = calculateUserMessageStats(username);
  
  return {
    messages: paginatedMessages,
    total: userMessages.length,
    page,
    limit,
    hasMore: endIndex < userMessages.length,
    stats
  };
}

// 标记消息为已读
export async function markMessageAsRead(
  messageId: string, 
  username: string
): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const message = messages.find(msg => msg.id === messageId);
  if (!message) return false;
  
  const recipient = message.recipients.find(r => r.username === username);
  if (!recipient) return false;
  
  recipient.status = MessageStatus.READ;
  recipient.readAt = new Date();
  message.updatedAt = new Date();
  
  return true;
}

// 批量操作消息
export async function batchUpdateMessages(
  request: BatchMessageRequest, 
  username: string
): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  for (const messageId of request.messageIds) {
    const message = messages.find(msg => msg.id === messageId);
    if (!message) continue;
    
    const recipient = message.recipients.find(r => r.username === username);
    if (!recipient) continue;
    
    switch (request.action) {
      case 'markRead':
        recipient.status = MessageStatus.READ;
        recipient.readAt = new Date();
        break;
      case 'markUnread':
        recipient.status = MessageStatus.UNREAD;
        recipient.readAt = undefined;
        break;
      case 'archive':
        recipient.status = MessageStatus.ARCHIVED;
        break;
      case 'delete':
        // 从接收者列表中移除该用户
        const index = message.recipients.indexOf(recipient);
        if (index > -1) {
          message.recipients.splice(index, 1);
        }
        break;
    }
    
    message.updatedAt = new Date();
  }
  
  return true;
}

// 一键已读所有消息
export async function markAllMessagesAsRead(username: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  messages.forEach(message => {
    const recipient = message.recipients.find(r => r.username === username);
    if (recipient && recipient.status === MessageStatus.UNREAD) {
      recipient.status = MessageStatus.READ;
      recipient.readAt = new Date();
      message.updatedAt = new Date();
    }
  });
  
  return true;
}

// 计算用户消息统计
export function calculateUserMessageStats(username: string): MessageStats {
  const userMessages = messages.filter(message => 
    message.recipients.some(recipient => recipient.username === username)
  );
  
  const stats: MessageStats = {
    total: userMessages.length,
    totalCount: userMessages.length,
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
  
  userMessages.forEach(message => {
    const recipient = message.recipients.find(r => r.username === username);
    if (!recipient) return;
    
    // 统计状态
    switch (recipient.status) {
      case MessageStatus.UNREAD:
        stats.unread++;
        stats.unreadCount++;
        break;
      case MessageStatus.READ:
        stats.read++;
        break;
      case MessageStatus.ARCHIVED:
        stats.archived++;
        break;
    }
    
    // 统计分类
    stats.byCategory[message.category]++;
    
    // 统计优先级
    stats.byPriority[message.priority]++;
  });
  
  return stats;
}

// 获取红点通知数据
export function getNotificationBadges(username: string): NotificationBadge[] {
  const userMessages = messages.filter(message => 
    message.recipients.some(recipient => 
      recipient.username === username && recipient.status === MessageStatus.UNREAD
    )
  );
  
  const badges: Record<MessageCategory, NotificationBadge> = {
    [MessageCategory.SYSTEM]: { category: MessageCategory.SYSTEM, count: 0, hasUrgent: false, hasUnread: false, unreadCount: 0, urgentCount: 0, showBadge: false },
    [MessageCategory.NOTIFICATION]: { category: MessageCategory.NOTIFICATION, count: 0, hasUrgent: false, hasUnread: false, unreadCount: 0, urgentCount: 0, showBadge: false },
    [MessageCategory.REMINDER]: { category: MessageCategory.REMINDER, count: 0, hasUrgent: false, hasUnread: false, unreadCount: 0, urgentCount: 0, showBadge: false },
    [MessageCategory.ANNOUNCEMENT]: { category: MessageCategory.ANNOUNCEMENT, count: 0, hasUrgent: false, hasUnread: false, unreadCount: 0, urgentCount: 0, showBadge: false }
  };
  
  let totalUnread = 0;
  let totalUrgent = 0;
  
  userMessages.forEach(message => {
    badges[message.category].count++;
    badges[message.category].hasUnread = true;
    badges[message.category].showBadge = true;
    totalUnread++;
    if (message.priority === MessagePriority.URGENT) {
      badges[message.category].hasUrgent = true;
      badges[message.category].urgentCount++;
      totalUrgent++;
    }
  });
  
  // 设置总的未读和紧急计数
  Object.values(badges).forEach(badge => {
    badge.unreadCount = totalUnread;
    badge.urgentCount = totalUrgent;
  });
  
  return Object.values(badges).filter(badge => badge.count > 0);
}

// 检测逾期用户（模拟）
export async function detectOverdueUsers(): Promise<OverdueUserInfo[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 实际应用中应从数据库查询逾期用户
  const overdueUsers: OverdueUserInfo[] = [];
  
  return overdueUsers;
}

// 生成系统汇报消息
export async function generateSystemReport(): Promise<SystemReport> {
  const overdueUsers = await detectOverdueUsers();
  
  return {
    reportDate: new Date(),
    overdueUsers,
    totalOverdue: overdueUsers.length,
    reportType: 'monthly',
    totalMessages: 0,
    systemMessages: 0,
    userMessages: 0,
    notificationMessages: 0,
    period: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      end: new Date()
    }
  };
}

// 发送逾期提醒消息
export async function sendOverdueReminders(): Promise<Message[]> {
  const overdueUsers = await detectOverdueUsers();
  const sentMessages: Message[] = [];
  
  for (const user of overdueUsers) {
    const message = await createSystemMessage({
      title: '会员续费提醒',
      content: `尊敬的 ${user.username}，您的${user.membershipType}已逾期${user.daysOverdue}天，请及时续费以继续享受会员服务。`,
      category: MessageCategory.REMINDER,
      priority: MessagePriority.HIGH,
      recipients: [user.username],
      metadata: {
        reminderType: 'overdue'
      }
    });
    
    sentMessages.push(message);
  }
  
  return sentMessages;
}

// 发送系统汇报给超管
export async function sendSystemReportToModerator(): Promise<Message | null> {
  const report = await generateSystemReport();
  
  if (report.overdueUsers.length === 0) {
    return null; // 没有逾期用户，不发送汇报
  }
  
  const content = `系统月度汇报\n\n逾期用户统计：\n总计：${report.totalOverdue}人\n\n详细信息：\n${report.overdueUsers.map(user => 
    `- ${user.username} (${user.membershipType})：逾期${user.daysOverdue}天`
  ).join('\n')}`;
  
  // 获取所有版主
  const allUsers = await getAllUsers();
  const moderators = allUsers.filter(user => user.role === UserRole.MODERATOR);
  
  if (moderators.length === 0) {
    return null;
  }
  
  const message = await createSystemMessage({
    title: `系统汇报 - ${report.reportDate.toLocaleDateString()} 逾期用户统计`,
    content,
    category: MessageCategory.SYSTEM,
    priority: MessagePriority.NORMAL,
    recipients: moderators.map(moderator => moderator.username),
    metadata: {
      overdueUserCount: report.totalOverdue,
      overdueUsers: report.overdueUsers.map(u => u.username)
    }
  });
  
  return message;
}

// 获取所有消息（管理员用）
export async function getAllMessages(
  params: MessageQueryParams = {}
): Promise<MessageListResponse> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  let filteredMessages = [...messages];
  
  // 应用过滤条件
  if (params.category) {
    filteredMessages = filteredMessages.filter(msg => msg.category === params.category);
  }
  
  if (params.senderType) {
    filteredMessages = filteredMessages.filter(msg => msg.senderType === params.senderType);
  }
  
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filteredMessages = filteredMessages.filter(msg => 
      msg.title.toLowerCase().includes(searchLower) ||
      msg.content.toLowerCase().includes(searchLower) ||
      msg.senderName.toLowerCase().includes(searchLower)
    );
  }
  
  // 排序
  filteredMessages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  // 分页
  const page = params.page || 1;
  const limit = params.limit || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedMessages = filteredMessages.slice(startIndex, endIndex);
  
  // 计算全局统计
  const stats = calculateGlobalMessageStats();
  
  return {
    messages: paginatedMessages,
    total: filteredMessages.length,
    page,
    limit,
    hasMore: endIndex < filteredMessages.length,
    stats
  };
}

// 计算全局消息统计
function calculateGlobalMessageStats(): MessageStats {
  const stats: MessageStats = {
    total: messages.length,
    totalCount: messages.length,
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
  
  messages.forEach(message => {
    // 统计分类
    stats.byCategory[message.category]++;
    
    // 统计优先级
    stats.byPriority[message.priority]++;
    
    // 统计状态（基于所有接收者）
    message.recipients.forEach(recipient => {
      switch (recipient.status) {
        case MessageStatus.UNREAD:
          stats.unread++;
          stats.unreadCount++;
          break;
        case MessageStatus.READ:
          stats.read++;
          break;
        case MessageStatus.ARCHIVED:
          stats.archived++;
          break;
      }
    });
  });
  
  return stats;
}

// 删除消息（管理员用）
export async function deleteMessage(messageId: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const index = messages.findIndex(msg => msg.id === messageId);
  if (index === -1) return false;
  
  messages.splice(index, 1);
  return true;
}

// 批量发送消息给逾期用户
export async function sendBatchRemindersToOverdueUsers(
  title: string,
  content: string,
  sender: User
): Promise<Message[]> {
  const overdueUsers = await detectOverdueUsers();
  const sentMessages: Message[] = [];
  
  if (overdueUsers.length === 0) {
    return sentMessages;
  }
  
  const message = await createMessage({
    title,
    content,
    category: MessageCategory.REMINDER,
    priority: MessagePriority.HIGH,
    recipients: overdueUsers.map(user => user.username),
    metadata: {
      reminderType: 'overdue',
      overdueUserCount: overdueUsers.length,
      overdueUsers: overdueUsers.map(u => u.username)
    }
  }, sender);
  
  sentMessages.push(message);
  return sentMessages;
}