/**
 * 论坛服务
 * 处理论坛相关的业务逻辑
 */

import {
  forumPostRepository,
  forumReplyRepository,
  forumCategoryRepository,
  forumStatsRepository
} from '@/repositories/forumRepository';
import { ForumPost, ForumReply, ForumCategory, ForumStats, RentalStatus } from '@/types/forum';
import { handleError } from '@/lib/errorHandler';

/**
 * 论坛服务类
 */
class ForumService {
  constructor() {
    // 初始化论坛服务
  }

  // ==================== 论坛帖子管理 ====================

  /**
   * 获取论坛帖子列表
   */
  async getForumPosts(
    page: number = 1,
    limit: number = 10,
    categoryId?: string
  ): Promise<{ posts: ForumPost[]; total: number; hasMore: boolean }> {
    try {
      const params = { page, limit };
      if (categoryId) {
        const result = await forumPostRepository.findByCategory(categoryId, params);
        return { posts: result.data, total: result.total, hasMore: result.hasMore };
      } else {
        const result = await forumPostRepository.findAll(params);
        return { posts: result.data, total: result.total, hasMore: result.hasMore };
      }
    } catch (error) {
      handleError(error);
      return { posts: [], total: 0, hasMore: false };
    }
  }

  /**
   * 根据ID获取帖子详情
   */
  async getForumPostById(postId: string): Promise<ForumPost | null> {
    try {
      return await forumPostRepository.findById(postId);
    } catch (error) {
      handleError(error);
      return null;
    }
  }

  /**
   * 创建新帖子
   */
  async createForumPost(postData: Omit<ForumPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<ForumPost | null> {
    try {
      return await forumPostRepository.create(postData);
    } catch (error) {
      handleError(error);
      return null;
    }
  }

  /**
   * 更新帖子
   */
  async updateForumPost(postId: string, updates: Partial<ForumPost>): Promise<ForumPost | null> {
    try {
      return await forumPostRepository.update(postId, updates);
    } catch (error) {
      handleError(error);
      return null;
    }
  }

  /**
   * 删除帖子
   */
  async deleteForumPost(postId: string): Promise<boolean> {
    try {
      return await forumPostRepository.delete(postId);
    } catch (error) {
      handleError(error);
      return false;
    }
  }

  /**
   * 切换帖子点赞状态
   */
  async togglePostLike(
    postId: string,
    userId: string
  ): Promise<{ success: boolean; liked: boolean; likeCount: number }> {
    try {
      // 使用repository处理点赞逻辑
      const isLiked = await forumPostRepository.hasUserLiked(postId, userId);
      
      if (isLiked) {
        await forumPostRepository.unlikePost(postId);
      } else {
        await forumPostRepository.likePost(postId);
      }
      
      const post = await forumPostRepository.findById(postId);
      
      return {
        success: true,
        liked: !isLiked,
        likeCount: post?.likeCount || 0
      };
    } catch (error) {
      handleError(error);
      return {
        success: false,
        liked: false,
        likeCount: 0
      };
    }
  }

  // ==================== 论坛回复管理 ====================

  /**
   * 获取帖子回复列表
   */
  async getForumReplies(
    postId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ replies: ForumReply[]; total: number; hasMore: boolean }> {
    try {
      const result = await forumReplyRepository.findByPost(postId, { page, limit });
      return { replies: result.data, total: result.total, hasMore: result.hasMore };
    } catch (error) {
      handleError(error);
      return { replies: [], total: 0, hasMore: false };
    }
  }

  /**
   * 创建论坛回复
   */
  async createForumReply(
    replyData: Omit<ForumReply, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ForumReply | null> {
    try {
      return await forumReplyRepository.create(replyData);
    } catch (error) {
      handleError(error);
      return null;
    }
  }

  /**
   * 更新回复
   */
  async updateForumReply(
    replyId: string,
    updates: Partial<ForumReply>
  ): Promise<ForumReply | null> {
    try {
      return await forumReplyRepository.update(replyId, updates);
    } catch (error) {
      handleError(error);
      return null;
    }
  }

  /**
   * 删除回复
   */
  async deleteForumReply(replyId: string): Promise<boolean> {
    try {
      return await forumReplyRepository.delete(replyId);
    } catch (error) {
      handleError(error);
      return false;
    }
  }

  /**
   * 切换回复点赞状态
   */
  async toggleReplyLike(
    replyId: string,
    userId: string
  ): Promise<{ success: boolean; liked: boolean; likeCount: number }> {
    try {
      // 使用repository处理回复点赞逻辑
      const isLiked = await forumReplyRepository.hasUserLiked(replyId, userId);
      
      if (isLiked) {
        await forumReplyRepository.unlikeReply(replyId);
      } else {
        await forumReplyRepository.likeReply(replyId);
      }
      
      const reply = await forumReplyRepository.findById(replyId);
      
      return {
        success: true,
        liked: !isLiked,
        likeCount: reply?.likeCount || 0
      };
    } catch (error) {
      handleError(error);
      return {
        success: false,
        liked: false,
        likeCount: 0
      };
    }
  }

  // ==================== 论坛分类管理 ====================

  /**
   * 获取论坛分类列表
   */
  async getForumCategories(): Promise<ForumCategory[]> {
    try {
      const result = await forumCategoryRepository.findAll();
      return result.data;
    } catch (error) {
      handleError(error);
      return [];
    }
  }

  /**
   * 获取分类层级结构
   */
  async getForumCategoriesWithHierarchy(): Promise<ForumCategory[]> {
    try {
      return await forumCategoryRepository.findAllWithHierarchy();
    } catch (error) {
      handleError(error);
      return [];
    }
  }

  /**
   * 创建论坛分类
   */
  async createForumCategory(
    categoryData: Omit<ForumCategory, 'id' | 'postCount' | 'lastPostAt' | 'lastPostTitle'>
  ): Promise<ForumCategory> {
    try {
      const createData = {
        ...categoryData,
        postCount: 0,
        lastPostAt: undefined,
        lastPostTitle: undefined
      };
      return await forumCategoryRepository.create(createData);
    } catch (error) {
      handleError(error);
      // 返回默认分类对象
      return {
        id: `category_${Date.now()}`,
        name: categoryData.name,
        description: categoryData.description,
        icon: categoryData.icon,
        color: categoryData.color,
        postCount: 0,
        lastPostAt: undefined,
        lastPostTitle: undefined,
        order: categoryData.order,
        isActive: categoryData.isActive
      };
    }
  }

  // ==================== 宝可梦租借相关 ====================

  /**
   * 确认租借
   */
  async confirmRental(
    postId: string,
    _confirmData: Record<string, unknown>
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const post = await forumPostRepository.findById(postId);
      if (!post || !post.rentalInfo) {
        return { success: false, message: '租借帖子不存在' };
      }

      // 更新租借状态
      const updatedRentalInfo = {
        ...post.rentalInfo,
        status: RentalStatus.RENTED,
        ownerConfirmed: true,
        renterConfirmed: true
      };

      await forumPostRepository.update(postId, {
        rentalInfo: updatedRentalInfo
      });

      return { success: true, message: '租借确认成功' };
    } catch (error) {
      handleError(error);
      return { success: false, message: '租借确认失败' };
    }
  }

  /**
   * 取消租借
   */
  async cancelRental(
    postId: string,
    _reason?: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const post = await forumPostRepository.findById(postId);
      if (!post || !post.rentalInfo) {
        return { success: false, message: '租借帖子不存在' };
      }

      // 更新租借状态
      const updatedRentalInfo = {
        ...post.rentalInfo,
        status: RentalStatus.CANCELLED,
        ownerConfirmed: false,
        renterConfirmed: false
      };

      await forumPostRepository.update(postId, {
        rentalInfo: updatedRentalInfo
      });

      return { success: true, message: '租借取消成功' };
    } catch (error) {
      handleError(error);
      return { success: false, message: '租借取消失败' };
    }
  }

  // ==================== 用户论坛统计 ====================

  /**
   * 获取用户论坛统计
   */
  async getUserForumStats(userId: string): Promise<ForumStats | null> {
    try {
      return await forumStatsRepository.getUserStats(userId);
    } catch (error) {
      handleError(error);
      return null;
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 点赞帖子
   */
  async likeForumPost(postId: string): Promise<boolean> {
    try {
      return await forumPostRepository.likePost(postId);
    } catch (error) {
      handleError(error);
      return false;
    }
  }

  /**
   * 取消点赞帖子
   */
  async unlikeForumPost(postId: string): Promise<boolean> {
    try {
      return await forumPostRepository.unlikePost(postId);
    } catch (error) {
      handleError(error);
      return false;
    }
  }

  /**
   * 检查用户是否点赞了帖子
   */
  async hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
    try {
      return await forumPostRepository.hasUserLiked(postId, userId);
    } catch (error) {
      handleError(error);
      return false;
    }
  }

  /**
   * 点赞回复
   */
  async likeForumReply(replyId: string): Promise<boolean> {
    try {
      return await forumReplyRepository.likeReply(replyId);
    } catch (error) {
      handleError(error);
      return false;
    }
  }

  /**
   * 取消点赞回复
   */
  async unlikeForumReply(replyId: string): Promise<boolean> {
    try {
      return await forumReplyRepository.unlikeReply(replyId);
    } catch (error) {
      handleError(error);
      return false;
    }
  }

  /**
   * 检查用户是否点赞了回复
   */
  async hasUserLikedReply(replyId: string, userId: string): Promise<boolean> {
    try {
      return await forumReplyRepository.hasUserLiked(replyId, userId);
    } catch (error) {
      handleError(error);
      return false;
    }
  }
}

/**
 * 全局论坛服务实例
 */
export const forumService = new ForumService();

// 重新导出常用方法以保持向后兼容
export const getForumPosts = (page?: number, limit?: number, categoryId?: string) => forumService.getForumPosts(page, limit, categoryId);
export const getForumPostById = (id: string) => forumService.getForumPostById(id);
export const createForumPost = (postData: Omit<ForumPost, 'id' | 'createdAt' | 'updatedAt'>) => forumService.createForumPost(postData);
export const updateForumPost = (postId: string, updates: Partial<ForumPost>) => forumService.updateForumPost(postId, updates);
export const deleteForumPost = (postId: string) => forumService.deleteForumPost(postId);
export const togglePostLike = (postId: string, userId: string) => forumService.togglePostLike(postId, userId);
export const getForumReplies = (postId: string, page?: number, limit?: number) => forumService.getForumReplies(postId, page, limit);
export const createForumReply = (replyData: Omit<ForumReply, 'id' | 'createdAt' | 'updatedAt'>) => forumService.createForumReply(replyData);
export const toggleReplyLike = (replyId: string, userId: string) => forumService.toggleReplyLike(replyId, userId);
export const getForumCategories = () => forumService.getForumCategories();
export const confirmRental = (postId: string, confirmData: Record<string, unknown>) => forumService.confirmRental(postId, confirmData);
export const cancelRental = (postId: string, reason?: string) => forumService.cancelRental(postId, reason);
export const getUserForumStats = (userId: string) => forumService.getUserForumStats(userId);