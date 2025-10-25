/**
 * 用户Repository实现
 * 处理用户相关的数据访问逻辑
 */

import { BaseRepository, QueryParams, PaginatedResponse } from '@/lib/repository';
import { api } from '@/lib/api';
import { User, UserProfile, UserStats, UserPrivacySettings, PokemonShowcase, UserActivity } from '@/types/auth';

/**
 * 用户查询参数
 */
export interface UserQueryParams extends QueryParams {
  role?: string;
  isActive?: boolean;
  isOnline?: boolean;
}

/**
 * 用户Repository类
 */
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('/users');
  }

  /**
   * 根据用户名查找用户
   */
  async findByUsername(username: string): Promise<User | null> {
    const cacheKey = `${this.endpoint}_findByUsername_${username}`;
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        try {
          const response = await api.get<User>(`${this.endpoint}/username/${username}`);
          return response.data || null;
        } catch (error) {
          return null;
        }
      },
      'findByUsername'
    );
  }

  /**
   * 根据邮箱查找用户
   */
  async findByEmail(email: string): Promise<User | null> {
    const cacheKey = `${this.endpoint}_findByEmail_${email}`;
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        try {
          const response = await api.get<User>(`${this.endpoint}/email/${email}`);
          return response.data || null;
        } catch (error) {
          return null;
        }
      },
      'findByEmail'
    );
  }

  /**
   * 获取在线用户
   */
  async findOnlineUsers(params?: QueryParams): Promise<PaginatedResponse<User>> {
    const cacheKey = `${this.endpoint}_findOnlineUsers_${JSON.stringify(params || {})}`;
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        const response = await api.get<PaginatedResponse<User>>(`${this.endpoint}/online`, { params });
        return response.data || {
          data: [],
          total: 0,
          page: 1,
          limit: 10,
          hasMore: false
        };
      },
      'findOnlineUsers',
      30000 // 30秒缓存
    );
  }

  /**
   * 更新用户状态
   */
  async updateStatus(userId: string, isOnline: boolean): Promise<boolean> {
    return this.executeWithLoading(
      async () => {
        try {
          await api.patch(`${this.endpoint}/${userId}/status`, { isOnline });
          
          // 清除相关缓存
          this.clearCache(`${this.endpoint}_findById_${userId}`);
          this.clearRelatedCache();
          
          return true;
        } catch (error) {
          return false;
        }
      },
      'updateStatus'
    );
  }
}

/**
 * 用户资料Repository类
 */
export class UserProfileRepository extends BaseRepository<UserProfile> {
  constructor() {
    super('/users', { enableCache: true, cacheTimeout: 10 * 60 * 1000 }); // 10分钟缓存
  }

  /**
   * 获取用户资料
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    const cacheKey = `${this.endpoint}_profile_${userId}`;
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        try {
          const response = await api.get<UserProfile>(`${this.endpoint}/${userId}/profile`);
          return response.data || null;
        } catch (error) {
          return null;
        }
      },
      'getProfile'
    );
  }

  /**
   * 更新用户资料
   */
  async updateProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile | null> {
    return this.executeWithLoading(
      async () => {
        try {
          const response = await api.put<UserProfile>(`${this.endpoint}/${userId}/profile`, profile);
          
          // 清除缓存
          this.clearCache(`${this.endpoint}_profile_${userId}`);
          
          return response.data || null;
        } catch (error) {
          return null;
        }
      },
      'updateProfile'
    );
  }
}

/**
 * 用户统计Repository类
 */
export class UserStatsRepository extends BaseRepository<UserStats> {
  constructor() {
    super('/users', { enableCache: true, cacheTimeout: 5 * 60 * 1000 }); // 5分钟缓存
  }

  /**
   * 获取当前用户统计
   */
  async getCurrentUserStats(): Promise<UserStats | null> {
    const cacheKey = `${this.endpoint}_me_stats`;
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        try {
          const response = await api.get<UserStats>(`${this.endpoint}/me/stats`);
          return response.data || null;
        } catch (error) {
          return null;
        }
      },
      'getStats'
    );
  }

  /**
   * 获取用户统计
   */
  async getUserStats(userId: string): Promise<UserStats | null> {
    const cacheKey = `${this.endpoint}_stats_${userId}`;
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        try {
          const response = await api.get<UserStats>(`${this.endpoint}/${userId}/stats`);
          return response.data || null;
        } catch (error) {
          return null;
        }
      },
      'getStats'
    );
  }

  /**
   * 更新用户统计
   */
  async updateStats(userId: string, stats: Partial<UserStats>): Promise<UserStats | null> {
    return this.executeWithLoading(
      async () => {
        try {
          const response = await api.put<UserStats>(`${this.endpoint}/${userId}/stats`, stats);
          
          // 清除缓存
          this.clearCache(`${this.endpoint}_stats_${userId}`);
          
          return response.data || null;
        } catch (error) {
          return null;
        }
      },
      'updateStats'
    );
  }

  /**
   * 增加统计数值
   */
  async incrementStats(userId: string, field: keyof UserStats, value = 1): Promise<UserStats | null> {
    return this.executeWithLoading(
      async () => {
        try {
          const response = await api.patch<UserStats>(`${this.endpoint}/${userId}/stats/increment`, {
            field,
            value
          });
          
          // 清除缓存
          this.clearCache(`${this.endpoint}_stats_${userId}`);
          
          return response.data || null;
        } catch (error) {
          return null;
        }
      },
      'incrementStats'
    );
  }
}

/**
 * 用户活动Repository类
 */
export class UserActivityRepository extends BaseRepository<UserActivity> {
  constructor() {
    super('/users', { enableCache: false }); // 活动数据不缓存
  }

  /**
   * 获取用户活动
   */
  async getUserActivities(userId: string, params?: QueryParams): Promise<PaginatedResponse<UserActivity>> {
    return this.executeWithLoading(
      async () => {
        const response = await api.get<PaginatedResponse<UserActivity>>(`${this.endpoint}/${userId}/activities`, { params });
        return response.data || {
          data: [],
          total: 0,
          page: 1,
          limit: 10,
          hasMore: false
        };
      },
      'getUserActivities'
    );
  }

  /**
   * 创建用户活动
   */
  async createActivity(activity: Omit<UserActivity, 'id' | 'createdAt'>): Promise<UserActivity | null> {
    return this.executeWithLoading(
      async () => {
        try {
          const response = await api.post<UserActivity>('/users/activities', activity);
          return response.data || null;
        } catch (error) {
          return null;
        }
      },
      'createActivity'
    );
  }
}

/**
 * 宝可梦展柜Repository类
 */
export class PokemonShowcaseRepository extends BaseRepository<PokemonShowcase> {
  constructor() {
    super('/users');
  }

  /**
   * 获取用户展柜
   */
  async getUserShowcase(userId: string): Promise<PokemonShowcase | null> {
    const cacheKey = `${this.endpoint}_showcase_${userId}`;
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        try {
          const response = await api.get<PokemonShowcase>(`${this.endpoint}/${userId}/pokemon-showcase`);
          return response.data || null;
        } catch (error) {
          return null;
        }
      },
      'getUserShowcase'
    );
  }

  /**
   * 更新用户展柜
   */
  async updateShowcase(userId: string, showcase: Partial<PokemonShowcase>): Promise<PokemonShowcase | null> {
    return this.executeWithLoading(
      async () => {
        try {
          const response = await api.put<PokemonShowcase>(`${this.endpoint}/${userId}/pokemon-showcase`, showcase);
          
          // 清除缓存
          this.clearCache(`${this.endpoint}_showcase_${userId}`);
          
          return response.data || null;
        } catch (error) {
          return null;
        }
      },
      'updateShowcase'
    );
  }
}

/**
 * 用户隐私设置Repository类
 */
export class UserPrivacyRepository extends BaseRepository<UserPrivacySettings> {
  constructor() {
    super('/users');
  }

  /**
   * 获取隐私设置
   */
  async getPrivacySettings(userId: string): Promise<UserPrivacySettings | null> {
    const cacheKey = `${this.endpoint}_privacy_${userId}`;
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        try {
          const response = await api.get<UserPrivacySettings>(`${this.endpoint}/${userId}/privacy-settings`);
          return response.data || null;
        } catch (error) {
          return null;
        }
      },
      'getPrivacySettings'
    );
  }

  /**
   * 更新隐私设置
   */
  async updatePrivacySettings(userId: string, settings: Partial<UserPrivacySettings>): Promise<UserPrivacySettings | null> {
    return this.executeWithLoading(
      async () => {
        try {
          const response = await api.put<UserPrivacySettings>(`${this.endpoint}/${userId}/privacy-settings`, settings);
          
          // 清除缓存
          this.clearCache(`${this.endpoint}_privacy_${userId}`);
          
          return response.data || null;
        } catch (error) {
          return null;
        }
      },
      'updatePrivacySettings'
    );
  }
}

// 创建Repository实例
export const userRepository = new UserRepository();
export const userProfileRepository = new UserProfileRepository();
export const userStatsRepository = new UserStatsRepository();
export const userActivityRepository = new UserActivityRepository();
export const pokemonShowcaseRepository = new PokemonShowcaseRepository();
export const userPrivacyRepository = new UserPrivacyRepository();

// 默认导出
export default {
  userRepository,
  userProfileRepository,
  userStatsRepository,
  userActivityRepository,
  pokemonShowcaseRepository,
  userPrivacyRepository
};