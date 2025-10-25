/**
 * 用户资料服务
 * 处理用户资料、统计、活动等功能
 */

import { 
  userRepository, 
  userProfileRepository, 
  userStatsRepository, 
  userActivityRepository,
  pokemonShowcaseRepository,
  userPrivacyRepository
} from '@/repositories/userRepository';
import { api } from '@/lib/api';
import {
  UserProfile,
  UserStats,
  UserActivity,
  PokemonShowcase,
  UserPrivacySettings,
  UserFollow,
  ActivityType,
  PokemonCard
} from '@/types/auth';
import { handleError } from '@/lib/errorHandler';

/**
 * 用户资料服务类
 */
class UserProfileService {
  constructor() {
    // 初始化用户资料服务
  }

  // ==================== 用户资料管理 ====================

  /**
   * 初始化用户资料
   */
  async initializeUserProfile(
    userId: string,
    _gameNickname: string
  ): Promise<UserProfile> {
    try {
      const defaultProfile: UserProfile = {
        userId,
        bio: '',
        location: '',
        website: '',
        birthday: undefined,
        onlineTime: 0,
        joinedAt: new Date()
      };
      
      return await userProfileRepository.updateProfile(userId, defaultProfile) || defaultProfile;
    } catch (_error) {
      handleError(_error);
      throw _error;
    }
  }

  /**
   * 获取用户资料
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const profile = await userProfileRepository.getProfile(userId);
      return profile || { userId, onlineTime: 0, joinedAt: new Date() };
    } catch (_error) {
      handleError(_error);
      // 如果用户资料不存在，返回默认资料
      return { userId, onlineTime: 0, joinedAt: new Date() };
    }
  }

  /**
   * 更新用户资料
   */
  async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const profile = await userProfileRepository.updateProfile(userId, data);
      return profile || { userId, onlineTime: 0, joinedAt: new Date() };
    } catch (_error) {
      handleError(_error);
      throw _error;
    }
  }

  // ==================== 用户统计 ====================

  /**
   * 获取用户统计信息
   */
  async getUserStats(): Promise<UserStats | null> {
    try {
      const stats = await userStatsRepository.getCurrentUserStats();
      if (!stats) return null;
      
      // 确保返回正确的UserStats类型
      return {
        followersCount: stats.followersCount || 0,
        followingCount: stats.followingCount || 0,
        likesReceived: stats.likesReceived || 0,
        postsCount: stats.postsCount || 0,
        repliesCount: stats.repliesCount || 0,
        lastActiveAt: stats.lastActiveAt ? new Date(stats.lastActiveAt) : new Date()
      };
    } catch (_error) {
      handleError(_error);
      return null;
    }
  }

  /**
   * 更新用户统计
   */
  async updateUserStats(id: string, data: Partial<UserStats>): Promise<UserStats> {
    try {
      const stats = await userStatsRepository.updateStats(id, data);
      return stats || {
        followersCount: 0,
        followingCount: 0,
        likesReceived: 0,
        postsCount: 0,
        repliesCount: 0,
        lastActiveAt: new Date()
      };
    } catch (_error) {
      handleError(_error);
      throw _error;
    }
  }

  // ==================== 用户活动 ====================

  /**
   * 记录用户活动
   */
  async recordUserActivity(
    userId: string,
    activityType: string,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<UserActivity> {
    try {
      const activity: Omit<UserActivity, 'id' | 'createdAt'> = {
        userId,
        type: activityType as ActivityType,
        title: description,
        content: description,
        targetId: metadata?.targetId as string | undefined
      };
      
      const result = await userActivityRepository.createActivity(activity);
      if (!result) {
        throw new Error('Failed to create user activity');
      }
      return result;
    } catch (_error) {
      handleError(_error);
      throw _error;
    }
  }

  /**
   * 获取用户活动列表
   */
  async getUserActivities(
    userId: string,
    limit: number = 10
  ): Promise<UserActivity[]> {
    try {
      const result = await userActivityRepository.getUserActivities(userId, { limit });
      return result.data || [];
    } catch (_error) {
      handleError(_error);
      return [];
    }
  }

  // ==================== 宝可梦展示 ====================

  /**
   * 获取用户宝可梦展示
   */
  async getPokemonShowcase(userId: string): Promise<PokemonShowcase | null> {
    try {
      return await pokemonShowcaseRepository.getUserShowcase(userId);
    } catch (_error) {
      handleError(_error);
      return null;
    }
  }

  /**
   * 更新宝可梦展示
   */
  async updatePokemonShowcase(
    userId: string,
    showcase: Partial<PokemonShowcase>
  ): Promise<PokemonShowcase> {
    try {
      const result = await pokemonShowcaseRepository.updateShowcase(userId, showcase);
      if (!result) {
        throw new Error('Failed to update pokemon showcase');
      }
      return result;
    } catch (_error) {
      handleError(_error);
      throw _error;
    }
  }

  /**
   * 添加宝可梦到展示
   */
  async addPokemonToShowcase(
    userId: string,
    pokemon: Record<string, unknown>
  ): Promise<PokemonShowcase> {
    try {
      let showcase = await pokemonShowcaseRepository.getUserShowcase(userId);
      
      if (!showcase) {
        showcase = {
          id: `showcase_${userId}`,
          title: '我的宝可梦展柜',
          pokemons: [],
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
      
      showcase.pokemons.push(pokemon as unknown as PokemonCard);
      showcase.updatedAt = new Date();
      
      const result = await pokemonShowcaseRepository.updateShowcase(userId, showcase);
      if (!result) {
        throw new Error('Failed to add pokemon to showcase');
      }
      return result;
    } catch (_error) {
      handleError(_error);
      throw _error;
    }
  }

  /**
   * 从展示中移除宝可梦
   */
  async removePokemonFromShowcase(
    userId: string,
    pokemonId: string
  ): Promise<PokemonShowcase> {
    try {
      const showcase = await pokemonShowcaseRepository.getUserShowcase(userId);
      if (!showcase) {
        throw new Error('展示不存在');
      }
      
      showcase.pokemons = showcase.pokemons.filter(
         (pokemon: PokemonCard) => pokemon.id !== pokemonId
       );
      showcase.updatedAt = new Date();
      
      const result = await pokemonShowcaseRepository.updateShowcase(userId, showcase);
      if (!result) {
        throw new Error('Failed to remove pokemon from showcase');
      }
      return result;
    } catch (_error) {
      handleError(_error);
      throw _error;
    }
  }

  // ==================== 隐私设置 ====================

  /**
   * 获取用户隐私设置
   */
  async getUserPrivacySettings(userId: string): Promise<UserPrivacySettings | null> {
    try {
      return await userPrivacyRepository.getPrivacySettings(userId);
    } catch (_error) {
      handleError(_error);
      return null;
    }
  }

  /**
   * 更新隐私设置
   */
  async updatePrivacySettings(
    userId: string,
    settings: Partial<UserPrivacySettings>
  ): Promise<UserPrivacySettings> {
    try {
      const result = await userPrivacyRepository.updatePrivacySettings(userId, settings);
      if (!result) {
        throw new Error('Failed to update privacy settings');
      }
      return result;
    } catch (_error) {
      handleError(_error);
      throw _error;
    }
  }

  // ==================== 关注系统 ====================

  /**
   * 关注用户
   */
  async followUser(
    followerId: string,
    followingId: string
  ): Promise<{ success: boolean }> {
    await api.post('/users/follow', { followerId, followingId });
    return { success: true };
  }

  /**
   * 取消关注用户
   */
  async unfollowUser(
    followerId: string,
    followingId: string
  ): Promise<{ success: boolean }> {
    await api.post('/users/unfollow', { followerId, followingId });
    return { success: true };
  }

  /**
   * 获取关注列表
   */
  async getFollowing(userId: string): Promise<UserFollow[]> {
    const response = await api.get<UserFollow[]>(`/users/${userId}/following`);
    return response.data || [];
  }

  /**
   * 获取粉丝列表
   */
  async getFollowers(userId: string): Promise<UserFollow[]> {
    const response = await api.get<UserFollow[]>(`/users/${userId}/followers`);
    return response.data || [];
  }

  /**
   * 检查是否关注
   */
  async isFollowing(
    followerId: string,
    followingId: string
  ): Promise<boolean> {
    try {
      const response = await api.get<{ isFollowing: boolean }>(`/users/${followerId}/following/${followingId}`);
      return response.data?.isFollowing || false;
    } catch {
      return false;
    }
  }

  // ==================== 私有方法 ====================

  /**
    * 检查用户是否在线
    */
   async isUserOnline(userId: string): Promise<boolean> {
     try {
       // 实现真实的在线状态检查逻辑
       // 1. 检查用户是否存在
       const user = await userRepository.findById(userId);
       if (!user) {
         return false;
       }

       // 2. 检查用户最后活跃时间
       const response = await api.get<{ isOnline?: boolean }>(`/users/${userId}/online-status`);
       if (response.data && 'isOnline' in response.data && response.data.isOnline !== undefined) {
         return response.data.isOnline;
       }

       // 3. 如果API调用失败，检查最后登录时间
       if (user.lastLoginAt) {
         const lastLoginTime = new Date(user.lastLoginAt).getTime();
         const currentTime = new Date().getTime();
         const timeDifference = currentTime - lastLoginTime;
         
         // 如果最后登录时间在15分钟内，认为用户在线
         const ONLINE_THRESHOLD = 15 * 60 * 1000; // 15分钟
         return timeDifference <= ONLINE_THRESHOLD;
       }

       return false;
     } catch (error) {
       console.warn('检查用户在线状态失败:', error);
       return false;
     }
   }

   /**
    * 更新用户在线状态
    */
   async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<boolean> {
     try {
       return await userRepository.updateStatus(userId, isOnline);
     } catch (error) {
       handleError(error);
       return false;
     }
   }
}

/**
 * 全局用户资料服务实例
 */
export const userProfileService = new UserProfileService();

// 重新导出常用方法以保持向后兼容
export const initializeUserProfile = (userId: string, gameNickname: string) => 
  userProfileService.initializeUserProfile(userId, gameNickname);
export const getUserProfile = (userId: string) => userProfileService.getUserProfile(userId);
export const updateUserProfile = (userId: string, updates: Partial<UserProfile>) => 
  userProfileService.updateUserProfile(userId, updates);
export const getUserStats = () => userProfileService.getUserStats();
export const updateUserStats = (userId: string, updates: Partial<UserStats>) => 
  userProfileService.updateUserStats(userId, updates);
export const recordUserActivity = (userId: string, activityType: string, description: string, metadata?: Record<string, unknown>) => 
  userProfileService.recordUserActivity(userId, activityType, description, metadata);
export const getUserActivities = (userId: string, limit?: number) => 
  userProfileService.getUserActivities(userId, limit);
export const getPokemonShowcase = (userId: string) => userProfileService.getPokemonShowcase(userId);
export const updatePokemonShowcase = (userId: string, showcase: Partial<PokemonShowcase>) => 
  userProfileService.updatePokemonShowcase(userId, showcase);
export const addPokemonToShowcase = (userId: string, pokemon: Record<string, unknown>) => 
  userProfileService.addPokemonToShowcase(userId, pokemon);
export const removePokemonFromShowcase = (userId: string, pokemonId: string) => 
  userProfileService.removePokemonFromShowcase(userId, pokemonId);
export const getUserPrivacySettings = (userId: string) => userProfileService.getUserPrivacySettings(userId);
export const updatePrivacySettings = (userId: string, settings: Partial<UserPrivacySettings>) => 
  userProfileService.updatePrivacySettings(userId, settings);
export const followUser = (followerId: string, followingId: string) => 
  userProfileService.followUser(followerId, followingId);
export const unfollowUser = (followerId: string, followingId: string) => 
  userProfileService.unfollowUser(followerId, followingId);
export const getFollowing = (userId: string) => userProfileService.getFollowing(userId);
export const getFollowers = (userId: string) => userProfileService.getFollowers(userId);
export const isFollowing = (followerId: string, followingId: string) => 
  userProfileService.isFollowing(followerId, followingId);