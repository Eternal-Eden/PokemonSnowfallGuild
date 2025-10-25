// 论坛相关类型定义

import { UserRole } from './auth';

// 帖子类型枚举
export enum PostType {
  DISCUSSION = 'discussion', // 交流帖
  POKEMON_RENTAL = 'pokemon_rental' // 精灵租借帖
}

// 帖子状态
export enum PostStatus {
  PENDING = 'pending', // 待审核
  ACTIVE = 'active',
  REJECTED = 'rejected', // 审核拒绝
  CLOSED = 'closed',
  DELETED = 'deleted'
}

// 租借状态
export enum RentalStatus {
  AVAILABLE = 'available', // 可租借
  PENDING = 'pending', // 待确认
  RENTED = 'rented', // 已租借
  COMPLETED = 'completed', // 已完成
  CANCELLED = 'cancelled', // 已取消
  EXPIRED = 'expired' // 已过期
}

// 帖子附件
export interface PostAttachment {
  id: string;
  type: 'image' | 'video' | 'file';
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  thumbnailUrl?: string; // 缩略图URL（用于图片和视频）
}

// 帖子接口
export interface ForumPost {
  id: string;
  title: string;
  content: string; // 富文本内容
  type: PostType;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole?: UserRole; // 作者角色
  status: PostStatus;
  isSticky: boolean; // 是否置顶
  isLocked: boolean; // 是否锁定
  viewCount: number; // 浏览次数
  likeCount: number; // 点赞数
  replyCount: number; // 回复数
  lastReplyAt?: Date; // 最后回复时间
  lastReplyBy?: string; // 最后回复者
  createdAt: Date;
  updatedAt: Date;
  likedByCurrentUser?: boolean; // 当前用户是否已点赞
  
  // 精灵租借帖特有字段
  rentalInfo?: PokemonRentalInfo;
  
  // 标签
  tags?: string[];
  
  // 附件
  attachments?: PostAttachment[];
}

// 精灵租借信息
export interface PokemonRentalInfo {
  pokemonId: string;
  pokemonName: string;
  pokemonSpecies: string;
  pokemonLevel: number;
  pokemonImageUrl?: string;
  pokemonType1?: string;
  pokemonType2?: string;
  isShiny: boolean;
  
  // 租借条件
  rentalDuration: number; // 租借时长（小时）
  rentalPrice?: number; // 租借价格（可选）
  requirements?: string; // 租借要求
  
  // 租借状态
  status: RentalStatus;
  renterId?: string; // 租借者ID
  renterName?: string; // 租借者名称
  rentalStartAt?: Date; // 租借开始时间
  rentalEndAt?: Date; // 租借结束时间
  
  // 确认信息
  ownerConfirmed: boolean; // 出租方确认
  renterConfirmed: boolean; // 租借方确认
}

// 帖子回复
export interface ForumReply {
  id: string;
  postId: string;
  content: string; // 富文本内容
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole?: UserRole; // 作者角色
  parentReplyId?: string; // 父回复ID（用于嵌套回复）
  likeCount: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  likedByCurrentUser?: boolean; // 当前用户是否已点赞
  
  // 精灵租借回复特有字段
  rentalResponse?: RentalResponse;
}

// 租借回应
export interface RentalResponse {
  type: 'interest' | 'confirm' | 'cancel'; // 感兴趣 | 确认租借 | 取消租借
  proposedDuration?: number; // 提议的租借时长
  message?: string; // 附加消息
  isOwnerResponse: boolean; // 是否为出租方回应
}

// 论坛分类
export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  postCount: number;
  lastPostAt?: Date;
  lastPostTitle?: string;
  order: number; // 排序
  isActive: boolean;
}

// 帖子查询参数
export interface PostQueryParams {
  page?: number;
  limit?: number;
  type?: PostType;
  categoryId?: string;
  authorId?: string;
  status?: PostStatus;
  search?: string; // 搜索关键词
  sortBy?: 'createdAt' | 'updatedAt' | 'viewCount' | 'likeCount' | 'replyCount';
  sortOrder?: 'asc' | 'desc';
  tags?: string[];
}

// 帖子列表响应
export interface PostListResponse {
  posts: ForumPost[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// 创建帖子请求
export interface CreatePostRequest {
  title: string;
  content: string;
  type: PostType;
  categoryId?: string;
  tags?: string[];
  
  // 精灵租借帖特有字段
  rentalInfo?: Omit<PokemonRentalInfo, 'status' | 'ownerConfirmed' | 'renterConfirmed'>;
}

// 创建回复请求
export interface CreateReplyRequest {
  postId: string;
  content: string;
  parentReplyId?: string;
  
  // 租借回应
  rentalResponse?: RentalResponse;
}

// 租借确认请求
export interface RentalConfirmRequest {
  postId: string;
  replyId?: string;
  duration?: number; // 确认的租借时长
  startTime?: Date; // 开始时间（可选，默认为当前时间）
  renterUserId?: string; // 租借者用户ID
  confirmationType: 'owner' | 'renter'; // 确认类型：出租方或租借方
}

// 用户论坛统计
export interface UserForumStats {
  postsCount: number;
  repliesCount: number;
  likesReceived: number;
  likesGiven: number;
  rentalOffered: number; // 提供租借次数
  rentalRented: number; // 租借次数
  reputation: number; // 声誉值
}

// 论坛通知
export interface ForumNotification {
  id: string;
  userId: string;
  type: 'reply' | 'like' | 'rental_interest' | 'rental_confirm' | 'rental_complete';
  title: string;
  content: string;
  relatedPostId?: string;
  relatedReplyId?: string;
  isRead: boolean;
  createdAt: Date;
}

// 精灵展柜状态更新
export interface PokemonShowcaseUpdate {
  pokemonId: string;
  isRented: boolean;
  rentedUntil?: Date;
  renterName?: string;
}

// 活动系统相关类型
export enum ActivityStatus {
  UPCOMING = 'upcoming', // 即将开始
  ACTIVE = 'active', // 进行中
  ENDED = 'ended', // 已结束
  COMPLETED = 'completed', // 已完成
  CANCELLED = 'cancelled' // 已取消
}

export enum ActivityRestrictionType {
  NONE = 'none', // 无限制
  ROLE = 'role', // 角色限制
  LEVEL = 'level', // 等级限制
  BADGE = 'badge', // 徽章限制
  POINTS = 'points', // 积分限制
  CUSTOM = 'custom' // 自定义限制
}

export interface ActivityReward {
  id: string;
  type: 'pokemon' | 'item' | 'badge' | 'title' | 'points';
  name: string;
  description: string;
  imageUrl?: string;
  quantity: number;
}

export interface ActivityRestriction {
  type: ActivityRestrictionType;
  minRole?: UserRole; // 最低角色要求
  minLevel?: number; // 最低等级要求
  minPoints?: number; // 最低积分要求
  requiredBadge?: string; // 需要的徽章
  maxParticipants?: number; // 最大参与人数
  customRequirement?: string; // 自定义要求描述
  value?: number; // 通用数值字段
  description?: string; // 通用描述字段
}

export interface ForumActivity {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  imageUrls?: string[]; // 活动配图数组，最多10张
  organizerId: string; // 组织者ID
  organizerName: string;
  status: ActivityStatus;
  startTime: Date;
  endTime: Date;
  registrationDeadline: Date;
  maxParticipants?: number;
  currentParticipants: number;
  rewards: ActivityReward[];
  restrictions: ActivityRestriction[];
  location?: string; // 活动地点（可选）
  requirements?: string; // 额外要求
  createdAt: Date;
  updatedAt: Date;
  isHighlighted: boolean; // 是否高亮显示
  participants?: ActivityParticipant[]; // 参与者列表
}

export interface ActivityParticipant {
  id: string;
  activityId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: UserRole;
  registeredAt: Date;
  status: 'registered' | 'confirmed' | 'cancelled';
  note?: string; // 报名备注
  membershipType?: 'free' | 'monthly' | 'yearly'; // 会费类型
  membershipExpiry?: Date; // 会费到期时间
  isExpired?: boolean; // 是否逾期
}

export interface CreateActivityRequest {
  title: string;
  description: string;
  imageUrl?: string;
  imageUrls?: string[]; // 活动配图数组，最多10张
  startTime: Date;
  endTime: Date;
  registrationDeadline: Date;
  maxParticipants?: number;
  rewards: Omit<ActivityReward, 'id'>[];
  restrictions: ActivityRestriction[];
  location?: string;
  requirements?: string;
  isHighlighted?: boolean;
}

export interface ActivityRegistrationRequest {
  activityId: string;
  note?: string;
}

// 帖子审核相关接口
export interface PostModerationRequest {
  postId: string;
  action: 'approve' | 'reject';
  reason?: string; // 拒绝原因
  moderatorNote?: string; // 审核备注
}

export interface PostModerationLog {
  id: string;
  postId: string;
  moderatorId: string;
  moderatorName: string;
  action: 'approve' | 'reject' | 'delete';
  reason?: string;
  note?: string;
  createdAt: Date;
}

// 活动帖子类型
export enum ActivityPostType {
  EVENT = 'event' // 活动帖
}

// 扩展帖子类型
export const ExtendedPostType = {
  ...PostType,
  EVENT: 'event' as const
} as const;

export type AllPostType = PostType | ActivityPostType;



// 论坛统计信息
export interface ForumStats {
  totalPosts: number;
  totalReplies: number;
  totalUsers: number;
  totalCategories: number;
  dailyPosts: number;
  weeklyPosts: number;
  monthlyPosts: number;
  topPosters: {
    userId: string;
    userName: string;
    postCount: number;
  }[];
  topCategories: {
    categoryId: string;
    categoryName: string;
    postCount: number;
  }[];
}



// 未读消息信息
export interface UnreadMessageInfo {
  channelId: string;
  messageId: string;
  count: number; // 该消息之后的未读消息数
  lastReadAt?: Date;
}

// 频道用户设置
export interface ChannelUserSettings {
  userId: string;
  channelId: string;
  backgroundImageUrl?: string; // 用户自定义背景图
  lastReadMessageId?: string; // 最后阅读的消息ID
  lastReadAt?: Date; // 最后阅读时间
  notificationEnabled: boolean; // 是否启用通知
  mentionNotificationEnabled: boolean; // 是否启用@通知
}

// 频道通知类型
export interface ChannelNotification {
  id: string;
  userId: string;
  channelId: string;
  channelName: string;
  type: 'mention' | 'reply' | 'pin' | 'mute' | 'unmute' | 'new_message' | 'at_all';
  title: string;
  content: string;
  relatedMessageId?: string;
  relatedChannelId?: string; // 关联的频道ID（用于跳转）
  mentionedBy?: string; // @的发起者
  isRead: boolean;
  createdAt: Date;
}