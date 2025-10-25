// 认证相关类型定义

// 用户角色枚举
export enum UserRole {
  MODERATOR = 'moderator',
  USER = 'user',
  MEMBER = 'member'
}

// 权限枚举
export enum Permission {
  // 用户管理权限
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  
  // 会员管理权限
  MEMBER_CREATE = 'member:create',
  MEMBER_READ = 'member:read',
  MEMBER_UPDATE = 'member:update',
  MEMBER_DELETE = 'member:delete',
  
  // 系统管理权限
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_LOGS = 'system:logs',
  SYSTEM_BACKUP = 'system:backup',
  
  // 数据统计权限
  STATS_VIEW = 'stats:view',
  STATS_EXPORT = 'stats:export',
  
  // 报表管理权限
  VIEW_REPORTS = 'reports:view',
  MANAGE_REPORTS = 'reports:manage',
  CREATE_REPORTS = 'reports:create',
  EDIT_REPORTS = 'reports:edit',
  DELETE_REPORTS = 'reports:delete',
  EXPORT_REPORTS = 'reports:export',
  
  // 论坛管理权限
  FORUM_MODERATE = 'forum:moderate', // 论坛审核
  FORUM_MANAGE_POSTS = 'forum:manage_posts', // 管理帖子
  FORUM_MANAGE_ACTIVITIES = 'forum:manage_activities', // 管理活动
  FORUM_CREATE_ACTIVITIES = 'forum:create_activities', // 创建活动
  FORUM_DELETE_POSTS = 'forum:delete_posts', // 删除帖子
  

}

// 用户组
export interface UserGroup {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

// 用户信息
export interface User {
  id: string;
  username: string;
  gameNickname?: string;
  email?: string;
  role: UserRole;
  groups: UserGroup[];
  permissions: Permission[];
  isDefaultPassword: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  requirePasswordChange?: boolean;
  avatarUrl?: string;
  token?: string; // JWT token for authentication
  // 用户主页相关字段
  uniqueId?: string; // 用户唯一ID，用于搜索和关注
  profile?: UserProfile;
  stats?: UserStats;
  privacySettings?: UserPrivacySettings;
  pokemonShowcase?: PokemonShowcase;
  teamShowcase?: UserTeamShowcase; // 配队展示
  // 兼容字段
  isActive?: boolean;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
}

// 用户资料
export interface UserProfile {
  userId: string; // 用户ID
  bio?: string; // 个人简介
  location?: string; // 地区
  website?: string; // 个人网站
  birthday?: Date; // 生日
  onlineTime: number; // 累计在线时长（分钟）
  joinedAt: Date; // 注册时间
}

// 用户统计信息
export interface UserStats {
  followersCount: number; // 粉丝数
  followingCount: number; // 关注数
  likesReceived: number; // 获得点赞数
  postsCount: number; // 发帖数
  repliesCount: number; // 回帖数
  lastActiveAt: Date; // 最后活跃时间
}

// 用户隐私设置
export interface UserPrivacySettings {
  showProfile: boolean; // 是否显示个人资料
  showStats: boolean; // 是否显示统计信息
  showOnlineTime: boolean; // 是否显示在线时长
  showPokemonShowcase: boolean; // 是否显示宝可梦展柜
  showTeamShowcase: boolean; // 是否显示配队展示
  showActivity: boolean; // 是否显示动态
  allowFollow: boolean; // 是否允许被关注
}

// 宝可梦展柜
export interface PokemonShowcase {
  id: string;
  title: string; // 展柜标题
  description?: string; // 展柜描述
  pokemons: PokemonCard[]; // 宝可梦卡片列表
  isPublic: boolean; // 是否公开
  createdAt: Date;
  updatedAt: Date;
}

// 宝可梦卡片
export interface PokemonCard {
  id: string;
  name: string; // 宝可梦名称
  level: number; // 等级
  nature?: string; // 性格
  ability?: string; // 特性
  moves?: string[]; // 技能
  stats?: PokemonStats; // 种族值
  imageUrl?: string; // 图片URL
  description?: string; // 描述
  isShiny: boolean; // 是否异色
  obtainedAt: Date; // 获得时间
  position: number; // 在展柜中的位置
  type1?: string; // 主属性
  type2?: string; // 副属性
}

// 宝可梦种族值
export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  spDefense: number;
  speed: number;
}

// 用户动态
export interface UserActivity {
  id: string;
  userId: string;
  type: ActivityType;
  title: string;
  content?: string;
  targetId?: string; // 关联的帖子/回复ID
  createdAt: Date;
}

export enum ActivityType {
  POST_CREATED = 'post_created', // 发帖
  REPLY_CREATED = 'reply_created', // 回帖
  POKEMON_ADDED = 'pokemon_added', // 添加宝可梦
  SHOWCASE_UPDATED = 'showcase_updated', // 更新展柜
  PROFILE_UPDATED = 'profile_updated' // 更新资料
}

// 关注关系
export interface UserFollow {
  id: string;
  followerId: string; // 关注者ID
  followingId: string; // 被关注者ID
  createdAt: Date;
}

// 登录请求
export interface LoginRequest {
  username: string;
  password: string;
  email: string; // 邮箱（新用户注册时必填）
  twoFactorCode?: string; // 二次验证码
}

// 双因素验证请求
export interface TwoFactorVerifyRequest {
  code: string;
  token?: string;
}

// 登录响应
export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  requirePasswordChange?: boolean;
  message?: string;
  expiresAt?: Date;
  requiresTwoFactor?: boolean;
}

// 密码修改请求
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// 密码强度验证结果
export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isValid: boolean;
}

// 注册请求
export interface RegisterRequest {
  username: string;
  email?: string;
  password: string;
  confirmPassword: string;
  avatar?: File | null;
}

// 注册响应
export interface RegisterResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

// 认证状态
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// 创建用户请求
export interface CreateUserRequest {
  username: string;
  email?: string;
  role: UserRole;
  groupIds: string[];
  additionalPermissions?: Permission[];
  initialPassword?: string;
}

// 审核状态枚举
export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

// 审核请求
export interface ApprovalRequest {
  id: string;
  type: 'USER_UPDATE' | 'USER_DELETE' | 'PASSWORD_RESET' | 'member_update' | 'member_create' | 'member_delete';
  requesterId: string;
  requesterName: string;
  requesterRole: UserRole;
  targetUserId: string;
  targetUserName: string;
  changes: Record<string, unknown>;
  reason: string;
  status: ApprovalStatus;
  createdAt: Date;
  reviewedAt?: Date;
  reviewerId?: string;
  reviewerName?: string;
  reviewComment?: string;
  // 兼容旧字段
  requestedBy?: string;
  requestedAt?: Date;
  data?: Record<string, unknown>;
  originalData?: Record<string, unknown>;
  reviewedBy?: string;
}



// 角色标识配置
export interface RoleBadge {
  role: UserRole;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

// 宝可梦队伍成员
export interface TeamPokemon {
  id: string;
  name: string; // 宝可梦昵称
  level: number; // 等级
  nature?: string; // 性格
  ability?: string; // 特性
  moves: string[]; // 技能列表（最多4个）
  stats?: PokemonStats; // 种族值
  ivs?: PokemonIVs; // 个体值
  evs?: PokemonEVs; // 努力值
  item?: string; // 携带道具
  imageUrl?: string; // 图片URL
  type1: string; // 主属性
  type2?: string; // 副属性
  isShiny: boolean; // 是否异色
  gender?: 'male' | 'female' | 'genderless'; // 性别
  position: number; // 在队伍中的位置（0-5）
  description?: string; // 描述
}

// 宝可梦个体值
export interface PokemonIVs {
  hp: number; // 0-31
  attack: number; // 0-31
  defense: number; // 0-31
  specialAttack: number; // 0-31
  spDefense: number; // 0-31
  speed: number; // 0-31
}

// 宝可梦努力值
export interface PokemonEVs {
  hp: number; // 0-252
  attack: number; // 0-252
  defense: number; // 0-252
  specialAttack: number; // 0-252
  spDefense: number; // 0-252
  speed: number; // 0-252
}

// 宝可梦队伍
export interface PokemonTeam {
  id: string;
  name: string; // 队伍名称
  description?: string; // 队伍描述
  pokemons: TeamPokemon[]; // 队伍成员（最多6只）
  isPublic: boolean; // 是否公开
  tags: string[]; // 标签（如：对战塔、竞技场、娱乐等）
  winRate?: number; // 胜率
  totalBattles?: number; // 总对战次数
  createdAt: Date;
  updatedAt: Date;
}

// 用户配队展示
export interface UserTeamShowcase {
  id: string;
  userId: string;
  teams: PokemonTeam[]; // 最多6个队伍
  isPublic: boolean; // 是否公开展示
  createdAt: Date;
  updatedAt: Date;
}