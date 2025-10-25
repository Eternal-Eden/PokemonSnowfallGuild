// API响应基础类型
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 分页响应类型
export interface PaginatedResponse<T> {
  success: boolean
  data: T
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
  error?: string
  message?: string
}

// 用户相关类型
export interface User {
  id: string
  username: string
  gameNickname?: string
  email: string
  role: 'USER' | 'MODERATOR' | 'MEMBER'
  isActive: boolean
  createdAt: string
  lastLoginAt?: string
  profile?: UserProfile
  _count?: {
    posts: number
    comments: number
  }
}

export interface UserProfile {
  avatar?: string
  bio?: string
  location?: string
  website?: string
  phone?: string
}

// 帖子相关类型
export interface Post {
  id: string
  title: string
  content: string
  authorId: string
  authorName: string
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'CLOSED' | 'DELETED'
  viewCount: number
  likeCount: number
  createdAt: string
  updatedAt: string
  author?: {
    id: string
    username: string
    gameNickname?: string
    profile?: {
      avatar?: string
    }
  }
  _count?: {
    comments: number
    likes: number
  }
}

// 评论相关类型
export interface Comment {
  id: string
  postId: string
  content: string
  authorId: string
  authorName: string
  likeCount: number
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'CLOSED' | 'DELETED'
  createdAt: string
  updatedAt: string
  author?: {
    id: string
    username: string
    gameNickname?: string
    profile?: {
      avatar?: string
    }
  }
}

// 举报相关类型
export interface Report {
  id: string
  reporterId: string
  reportedUserId?: string
  targetId: string
  targetType: 'POST' | 'COMMENT' | 'USER' | 'CHANNEL_MESSAGE' | 'OTHER'
  category: 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE_CONTENT' | 'VIOLENCE' | 'HATE_SPEECH' | 'MISINFORMATION' | 'COPYRIGHT' | 'PRIVACY' | 'FRAUD' | 'OTHER'
  reason: string
  description?: string
  evidenceUrls: string[]
  status: 'PENDING' | 'PROCESSING' | 'RESOLVED' | 'REJECTED' | 'CLOSED'
  result?: 'NO_ACTION' | 'WARNING' | 'CONTENT_REMOVED' | 'USER_SUSPENDED' | 'USER_BANNED' | 'OTHER'
  handlerId?: string
  handlerReason?: string
  action?: string
  createdAt: string
  updatedAt: string
  handledAt?: string
  reporter?: {
    id: string
    username: string
    gameNickname?: string
  }
  reportedUser?: {
    id: string
    username: string
    gameNickname?: string
  }
  handler?: {
    id: string
    username: string
    gameNickname?: string
  }
}



// 活动相关类型
export interface ActivityReward {
  type: 'POINTS' | 'BADGE' | 'ITEM' | 'TITLE';
  value: string | number;
  description?: string;
}

export interface ActivityRestriction {
  type: 'LEVEL' | 'RANK' | 'MEMBERSHIP' | 'REGION';
  value: string | number;
  description?: string;
}

export interface Activity {
  id: string
  title: string
  description: string
  type: 'TOURNAMENT' | 'WORKSHOP' | 'MEETUP' | 'COMPETITION' | 'EVENT'
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'
  startTime: string
  endTime: string
  registrationDeadline: string
  location?: string
  maxParticipants?: number
  currentParticipants: number
  rewards?: ActivityReward[]
  restrictions?: ActivityRestriction[]
  organizerId: string
  organizerName: string
  createdAt: string
  updatedAt: string
}

// 操作日志类型
export interface OperationLog {
  id: string
  operatorId: string
  action: string
  module: string
  description: string
  targetId?: string
  targetType?: string
  oldData?: Record<string, unknown>
  newData?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  createdAt: string
  operator?: {
    username: string
    gameNickname?: string
  }
}

// 统计数据类型
export interface DashboardStats {
  users: {
    total: number
    active: number
    newToday: number
    banned: number
  }
  content: {
    posts: number
    comments: number
    reports: number
    pendingReports: number
  }
  activities: {
    total: number
    active: number
    completed: number
  }
  system: {
    onlineUsers: number
    serverLoad: number
    diskUsage: number
    memoryUsage: number
  }
}

// 系统设置类型
export interface SystemSetting {
  id: string
  category: string
  key: string
  value: string
  type: 'string' | 'number' | 'boolean' | 'json' | 'text'
  description?: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

// 敏感词类型
export interface SensitiveWord {
  id: string
  word: string
  category: 'PROFANITY' | 'SPAM' | 'POLITICAL' | 'VIOLENCE' | 'ADULT' | 'DISCRIMINATION' | 'HARASSMENT' | 'ILLEGAL' | 'CUSTOM' | 'OTHER'
  replacement?: string
  level: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}