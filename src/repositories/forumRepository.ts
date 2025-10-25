/**
 * 论坛Repository实现
 * 处理论坛相关的数据访问逻辑
 */

import { BaseRepository, QueryParams, PaginatedResponse } from '@/lib/repository';
import { api } from '@/lib/api';
import { ForumPost, ForumReply, ForumCategory, ForumStats } from '@/types/forum';

/**
 * 论坛帖子查询参数
 */
export interface ForumPostQueryParams extends QueryParams {
  categoryId?: string;
  authorId?: string;
  isPinned?: boolean;
  isLocked?: boolean;
  hasReplies?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'replyCount' | 'likeCount';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 论坛回复查询参数
 */
export interface ForumReplyQueryParams extends QueryParams {
  postId?: string;
  authorId?: string;
  parentId?: string;
  sortBy?: 'createdAt' | 'likeCount';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 论坛帖子Repository类
 */
export class ForumPostRepository extends BaseRepository<ForumPost> {
  constructor() {
    super('/forum/posts', { enableCache: true, cacheTimeout: 5 * 60 * 1000 }); // 5分钟缓存
  }

  /**
   * 获取论坛帖子列表
   */
  async findAll(params?: ForumPostQueryParams): Promise<PaginatedResponse<ForumPost>> {
    const cacheKey = `${this.endpoint}_findAll_${JSON.stringify(params || {})}`;
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        const response = await api.get<PaginatedResponse<ForumPost>>(this.endpoint, { params });
        return response.data || {
          data: [],
          total: 0,
          page: 1,
          limit: 10,
          hasMore: false
        };
      },
      'findAll'
    );
  }

  /**
   * 根据分类获取帖子
   */
  async findByCategory(categoryId: string, params?: QueryParams): Promise<PaginatedResponse<ForumPost>> {
    const cacheKey = `${this.endpoint}_findByCategory_${categoryId}_${JSON.stringify(params || {})}`;
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        const response = await api.get<PaginatedResponse<ForumPost>>(`${this.endpoint}/category/${categoryId}`, { params });
        return response.data || {
          data: [],
          total: 0,
          page: 1,
          limit: 10,
          hasMore: false
        };
      },
      'findByCategory'
    );
  }

  /**
   * 根据作者获取帖子
   */
  async findByAuthor(authorId: string, params?: QueryParams): Promise<PaginatedResponse<ForumPost>> {
    const cacheKey = `${this.endpoint}_findByAuthor_${authorId}_${JSON.stringify(params || {})}`;
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        const response = await api.get<PaginatedResponse<ForumPost>>(`${this.endpoint}/author/${authorId}`, { params });
        return response.data || {
          data: [],
          total: 0,
          page: 1,
          limit: 10,
          hasMore: false
        };
      },
      'findByAuthor'
    );
  }

  /**
   * 获取热门帖子
   */
  async findPopular(params?: QueryParams): Promise<PaginatedResponse<ForumPost>> {
    const cacheKey = `${this.endpoint}_findPopular_${JSON.stringify(params || {})}`;
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        const response = await api.get<PaginatedResponse<ForumPost>>(`${this.endpoint}/popular`, { params });
        return response.data || {
          data: [],
          total: 0,
          page: 1,
          limit: 10,
          hasMore: false
        };
      },
      'findPopular',
      2 * 60 * 1000 // 2分钟缓存
    );
  }

  /**
   * 搜索帖子
   */
  async search(query: string, params?: QueryParams): Promise<PaginatedResponse<ForumPost>> {
    return this.executeWithLoading(
      async () => {
        const response = await api.get<PaginatedResponse<ForumPost>>(`${this.endpoint}/search`, {
          params: { q: query, ...params }
        });
        return response.data || {
          data: [],
          total: 0,
          page: 1,
          limit: 10,
          hasMore: false
        };
      },
      'search'
    );
  }

  /**
   * 点赞帖子
   */
  async likePost(postId: string): Promise<boolean> {
    return this.executeWithLoading(
      async () => {
        try {
          await api.post(`${this.endpoint}/${postId}/like`);
          
          // 清除相关缓存
          this.clearCache(`${this.endpoint}_findById_${postId}`);
          this.clearRelatedCache();
          
          return true;
        } catch (error) {
          return false;
        }
      },
      'likePost'
    );
  }

  /**
   * 取消点赞帖子
   */
  async unlikePost(postId: string): Promise<boolean> {
    return this.executeWithLoading(
      async () => {
        try {
          await api.delete(`${this.endpoint}/${postId}/like`);
          
          // 清除相关缓存
          this.clearCache(`${this.endpoint}_findById_${postId}`);
          this.clearRelatedCache();
          
          return true;
        } catch (error) {
          return false;
        }
      },
      'unlikePost'
    );
  }

  /**
   * 检查用户是否点赞了帖子
   */
  async hasUserLiked(postId: string, userId: string): Promise<boolean> {
    const cacheKey = `${this.endpoint}_hasUserLiked_${postId}_${userId}`;
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        try {
          const response = await api.get<{ liked: boolean }>(`${this.endpoint}/${postId}/like/status`, {
            params: { userId }
          });
          return response.data?.liked || false;
        } catch (error) {
          return false;
        }
      },
      'hasUserLiked',
      60 * 1000 // 1分钟缓存
    );
  }

  /**
   * 置顶帖子
   */
  async pinPost(postId: string): Promise<boolean> {
    return this.executeWithLoading(
      async () => {
        try {
          await api.patch(`${this.endpoint}/${postId}/pin`);
          
          // 清除相关缓存
          this.clearCache(`${this.endpoint}_findById_${postId}`);
          this.clearRelatedCache();
          
          return true;
        } catch (error) {
          return false;
        }
      },
      'pinPost'
    );
  }

  /**
   * 锁定帖子
   */
  async lockPost(postId: string): Promise<boolean> {
    return this.executeWithLoading(
      async () => {
        try {
          await api.patch(`${this.endpoint}/${postId}/lock`);
          
          // 清除相关缓存
          this.clearCache(`${this.endpoint}_findById_${postId}`);
          this.clearRelatedCache();
          
          return true;
        } catch (error) {
          return false;
        }
      },
      'lockPost'
    );
  }
}

/**
 * 论坛回复Repository类
 */
export class ForumReplyRepository extends BaseRepository<ForumReply> {
  constructor() {
    super('/forum/replies', { enableCache: true, cacheTimeout: 3 * 60 * 1000 }); // 3分钟缓存
  }

  /**
   * 根据帖子ID获取回复
   */
  async findByPost(postId: string, params?: ForumReplyQueryParams): Promise<PaginatedResponse<ForumReply>> {
    const cacheKey = `${this.endpoint}_findByPost_${postId}_${JSON.stringify(params || {})}`;
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        const response = await api.get<PaginatedResponse<ForumReply>>(`${this.endpoint}/post/${postId}`, { params });
        return response.data || {
          data: [],
          total: 0,
          page: 1,
          limit: 10,
          hasMore: false
        };
      },
      'findByPost'
    );
  }

  /**
   * 根据父回复ID获取子回复
   */
  async findByParent(parentId: string, params?: QueryParams): Promise<PaginatedResponse<ForumReply>> {
    const cacheKey = `${this.endpoint}_findByParent_${parentId}_${JSON.stringify(params || {})}`;
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        const response = await api.get<PaginatedResponse<ForumReply>>(`${this.endpoint}/parent/${parentId}`, { params });
        return response.data || {
          data: [],
          total: 0,
          page: 1,
          limit: 10,
          hasMore: false
        };
      },
      'findByParent'
    );
  }

  /**
   * 点赞回复
   */
  async likeReply(replyId: string): Promise<boolean> {
    return this.executeWithLoading(
      async () => {
        try {
          await api.post(`${this.endpoint}/${replyId}/like`);
          
          // 清除相关缓存
          this.clearCache(`${this.endpoint}_findById_${replyId}`);
          this.clearRelatedCache();
          
          return true;
        } catch (error) {
          return false;
        }
      },
      'likeReply'
    );
  }

  /**
   * 取消点赞回复
   */
  async unlikeReply(replyId: string): Promise<boolean> {
    return this.executeWithLoading(
      async () => {
        try {
          await api.delete(`${this.endpoint}/${replyId}/like`);
          
          // 清除相关缓存
          this.clearCache(`${this.endpoint}_findById_${replyId}`);
          this.clearRelatedCache();
          
          return true;
        } catch (error) {
          return false;
        }
      },
      'unlikeReply'
    );
  }

  /**
   * 检查用户是否点赞了回复
   */
  async hasUserLiked(replyId: string, userId: string): Promise<boolean> {
    const cacheKey = `${this.endpoint}_hasUserLiked_${replyId}_${userId}`;
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        try {
          const response = await api.get<{ liked: boolean }>(`${this.endpoint}/${replyId}/like/status`, {
            params: { userId }
          });
          return response.data?.liked || false;
        } catch (error) {
          return false;
        }
      },
      'hasUserLiked',
      60 * 1000 // 1分钟缓存
    );
  }
}

/**
 * 论坛分类Repository类
 */
export class ForumCategoryRepository extends BaseRepository<ForumCategory> {
  constructor() {
    super('/forum/categories', { enableCache: true, cacheTimeout: 30 * 60 * 1000 }); // 30分钟缓存
  }

  /**
   * 获取所有分类（带层级结构）
   */
  async findAllWithHierarchy(): Promise<ForumCategory[]> {
    const cacheKey = `${this.endpoint}_findAllWithHierarchy`;
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        const response = await api.get<ForumCategory[]>(`${this.endpoint}/hierarchy`);
        return response.data || [];
      },
      'findAllWithHierarchy'
    );
  }

  /**
   * 根据父分类获取子分类
   */
  async findByParent(parentId: string): Promise<ForumCategory[]> {
    const cacheKey = `${this.endpoint}_findByParent_${parentId}`;
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        const response = await api.get<ForumCategory[]>(`${this.endpoint}/parent/${parentId}`);
        return response.data || [];
      },
      'findByParent'
    );
  }

  /**
   * 获取根分类
   */
  async findRootCategories(): Promise<ForumCategory[]> {
    const cacheKey = `${this.endpoint}_findRootCategories`;
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        const response = await api.get<ForumCategory[]>(`${this.endpoint}/root`);
        return response.data || [];
      },
      'findRootCategories'
    );
  }
}

/**
 * 论坛统计Repository类
 */
export class ForumStatsRepository extends BaseRepository<ForumStats> {
  constructor() {
    super('/forum/stats', { enableCache: true, cacheTimeout: 5 * 60 * 1000 }); // 5分钟缓存
  }

  /**
   * 获取用户论坛统计
   */
  async getUserStats(userId: string): Promise<ForumStats | null> {
    const cacheKey = `${this.endpoint}_getUserStats_${userId}`;
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        try {
          const response = await api.get<ForumStats>(`${this.endpoint}/user/${userId}`);
          return response.data || null;
        } catch (error) {
          return null;
        }
      },
      'getUserStats'
    );
  }

  /**
   * 获取分类统计
   */
  async getCategoryStats(categoryId: string): Promise<ForumStats | null> {
    const cacheKey = `${this.endpoint}_getCategoryStats_${categoryId}`;
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        try {
          const response = await api.get<ForumStats>(`${this.endpoint}/category/${categoryId}`);
          return response.data || null;
        } catch (error) {
          return null;
        }
      },
      'getCategoryStats'
    );
  }

  /**
   * 获取全局论坛统计
   */
  async getGlobalStats(): Promise<ForumStats | null> {
    const cacheKey = `${this.endpoint}_getGlobalStats`;
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        try {
          const response = await api.get<ForumStats>(`${this.endpoint}/global`);
          return response.data || null;
        } catch (error) {
          return null;
        }
      },
      'getGlobalStats'
    );
  }
}

// 创建Repository实例
export const forumPostRepository = new ForumPostRepository();
export const forumReplyRepository = new ForumReplyRepository();
export const forumCategoryRepository = new ForumCategoryRepository();
export const forumStatsRepository = new ForumStatsRepository();

// 默认导出
export default {
  forumPostRepository,
  forumReplyRepository,
  forumCategoryRepository,
  forumStatsRepository
};