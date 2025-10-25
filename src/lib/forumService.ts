// 论坛服务 - 提供论坛相关的数据操作功能

import { 
  ForumPost, 
  ForumReply, 
  ForumCategory, 
  PostType, 
  PostStatus, 
  RentalStatus,
  PostQueryParams,
  PostListResponse,
  CreatePostRequest,
  CreateReplyRequest,
  RentalConfirmRequest,
  PokemonRentalInfo,
  UserForumStats,
  ForumActivity,
  ActivityStatus,
  ActivityRestrictionType,
  CreateActivityRequest,
  ActivityRegistrationRequest,
  ActivityParticipant,
  PostModerationRequest,
  PostModerationLog,
  ActivityPostType,
  AllPostType
} from '@/types/forum';
import { PokemonCard, UserRole } from '@/types/auth';

// 模拟数据存储
let pendingPosts: ForumPost[] = [];

// 审核日志
let moderationLogs: PostModerationLog[] = [];

// 用户点赞记录
let userLikes: { [userId: string]: { posts: Set<string>; replies: Set<string> } } = {};

// 帖子数据已迁移到数据库，通过API获取

// 回复数据已迁移到数据库，通过API获取

// 分类数据已迁移到数据库，通过API获取

// 获取论坛帖子列表
export async function getForumPosts(params: PostQueryParams = {}, userId?: string): Promise<PostListResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.type) queryParams.append('type', params.type);
    if (params.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params.authorId) queryParams.append('authorId', params.authorId);
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.tags && params.tags.length > 0) {
      params.tags.forEach(tag => queryParams.append('tags', tag));
    }
    
    const response = await fetch(`/api/forum/posts?${queryParams.toString()}`);
    const data = await response.json();
    
    if (!response.ok) {
      // 区分不同类型的错误
      if (response.status === 400) {
        console.error('请求参数错误:', data.message, data.details);
        // 参数错误时仍然返回空列表，而不是抛出错误
        return {
          posts: [],
          total: 0,
          page: params.page || 1,
          limit: params.limit || 10,
          hasMore: false
        };
      }
      throw new Error(data.message || '获取帖子列表失败');
    }
    
    // 确保返回正确的数据结构
    if (data.success && data.data) {
      const { posts, pagination } = data.data;
      return {
        posts: posts || [],
        total: pagination?.total || 0,
        page: pagination?.page || params.page || 1,
        limit: pagination?.limit || params.limit || 10,
        hasMore: pagination ? pagination.page < pagination.totalPages : false
      };
    }
    
    // 如果数据格式不正确，返回空列表
    return {
      posts: [],
      total: 0,
      page: params.page || 1,
      limit: params.limit || 10,
      hasMore: false
    };
  } catch (error) {
    console.error('获取论坛帖子列表失败:', error);
    // 网络错误或其他错误时返回空列表
    return {
      posts: [],
      total: 0,
      page: params.page || 1,
      limit: params.limit || 10,
      hasMore: false
    };
  }
}

// 获取单个帖子详情
export async function getForumPost(postId: string, userId?: string): Promise<ForumPost | null> {
  try {
    const response = await fetch(`/api/forum/posts/${postId}`);
    const data = await response.json();
    
    if (!response.ok) {
      return null;
    }
    
    return data.success ? data.data.post : null;
  } catch (error) {
    console.error('获取帖子详情失败:', error);
    return null;
  }
}

// 获取帖子回复
export async function getPostReplies(postId: string, userId?: string): Promise<ForumReply[]> {
  try {
    const response = await fetch(`/api/forum/posts/${postId}/replies`);
    const data = await response.json();
    
    if (!response.ok) {
      return [];
    }
    
    return data.success ? data.data.replies : [];
  } catch (error) {
    console.error('获取帖子回复失败:', error);
    return [];
  }
}

// 获取论坛分类
export async function getForumCategories(): Promise<ForumCategory[]> {
  try {
    const response = await fetch('/api/forum/categories');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '获取分类列表失败');
    }
    
    return data.success ? data.data.categories : [];
  } catch (error) {
    console.error('获取论坛分类失败:', error);
    return [];
  }
}

// 创建帖子
export async function createForumPost(
  authorId: string, 
  authorName: string, 
  authorRole: UserRole,
  postData: CreatePostRequest
): Promise<ForumPost> {
  try {
    // 数据验证
    if (!postData.title?.trim()) {
      throw new Error('帖子标题不能为空');
    }
    if (!postData.content?.trim()) {
      throw new Error('帖子内容不能为空');
    }
    if (postData.title.length > 255) {
      throw new Error('帖子标题不能超过255个字符');
    }
    if (postData.content.length > 50000) {
      throw new Error('帖子内容不能超过50000个字符');
    }

    // 普通用户发帖需要审核，管理员发帖直接通过
    const needsModeration = authorRole === UserRole.USER;
    const status = needsModeration ? PostStatus.PENDING : PostStatus.ACTIVE;
    
    // 准备租借信息
    const rentalInfo = postData.rentalInfo ? {
      ...postData.rentalInfo,
      status: RentalStatus.AVAILABLE,
      ownerConfirmed: false,
      renterConfirmed: false
    } : undefined;

    // 调用API创建帖子
    const response = await fetch('/api/forum/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      },
      body: JSON.stringify({
        title: postData.title.trim(),
        content: postData.content.trim(),
        type: postData.type,
        categoryId: postData.categoryId,
        tags: postData.tags || [],
        rentalInfo,
        authorId,
        authorName,
        authorRole,
        status
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '创建帖子失败');
    }

    const newPost = data.data.post;

    // 如果需要审核，发送通知给管理员
    if (needsModeration) {
      try {
        await fetch('/api/notifications/moderation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
          },
          body: JSON.stringify({
            type: 'post_pending_review',
            postId: newPost.id,
            authorName,
            title: postData.title
          })
        });
      } catch (notificationError) {
        console.warn('发送审核通知失败:', notificationError);
      }
    }

    return newPost;
  } catch (error) {
    console.error('创建帖子失败:', error);
    throw error;
  }
}

// 创建回复
export async function createPostReply(
  authorId: string,
  authorName: string,
  authorRole: UserRole,
  replyData: CreateReplyRequest
): Promise<ForumReply> {
  return createForumReply(authorId, authorName, authorRole, replyData);
}

export async function createForumReply(
  authorId: string,
  authorName: string,
  authorRole: UserRole,
  replyData: CreateReplyRequest
): Promise<ForumReply> {
  try {
    // 数据验证
    if (!replyData.content?.trim()) {
      throw new Error('回复内容不能为空');
    }
    if (replyData.content.length > 10000) {
      throw new Error('回复内容不能超过10000个字符');
    }
    if (!replyData.postId) {
      throw new Error('帖子ID不能为空');
    }

    // 调用API创建回复
    const response = await fetch(`/api/forum/posts/${replyData.postId}/replies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      },
      body: JSON.stringify({
        content: replyData.content.trim(),
        parentReplyId: replyData.parentReplyId,
        rentalResponse: replyData.rentalResponse,
        authorId,
        authorName,
        authorRole
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '创建回复失败');
    }

    const newReply = data.data.reply;

    // 发送通知给帖子作者（如果不是自己回复自己的帖子）
    try {
      const postResponse = await fetch(`/api/forum/posts/${replyData.postId}`);
      const postData = await postResponse.json();
      
      if (postData.success && postData.data.post.authorId !== authorId) {
        await fetch('/api/notifications/reply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
          },
          body: JSON.stringify({
            type: 'post_reply',
            postId: replyData.postId,
            replyId: newReply.id,
            authorName,
            recipientId: postData.data.post.authorId,
            postTitle: postData.data.post.title
          })
        });
      }

      // 如果是回复某个回复，也通知被回复的用户
      if (replyData.parentReplyId) {
        const parentReplyResponse = await fetch(`/api/forum/replies/${replyData.parentReplyId}`);
        const parentReplyData = await parentReplyResponse.json();
        
        if (parentReplyData.success && parentReplyData.data.reply.authorId !== authorId) {
          await fetch('/api/notifications/reply', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
            },
            body: JSON.stringify({
              type: 'reply_reply',
              postId: replyData.postId,
              replyId: newReply.id,
              parentReplyId: replyData.parentReplyId,
              authorName,
              recipientId: parentReplyData.data.reply.authorId
            })
          });
        }
      }
    } catch (notificationError) {
      console.warn('发送回复通知失败:', notificationError);
    }

    return newReply;
  } catch (error) {
    console.error('创建回复失败:', error);
    throw error;
  }
}

// 确认租借
export async function confirmRental(
  userId: string,
  confirmData: RentalConfirmRequest
): Promise<{ success: boolean; message: string }> {
  try {
    // 数据验证
    if (!confirmData.postId) {
      throw new Error('帖子ID不能为空');
    }
    if (!confirmData.confirmationType || !['owner', 'renter'].includes(confirmData.confirmationType)) {
      throw new Error('确认类型无效');
    }

    // 获取帖子信息验证权限
    const postResponse = await fetch(`/api/forum/posts/${confirmData.postId}`);
    const postData = await postResponse.json();
    
    if (!postResponse.ok || !postData.success) {
      throw new Error('帖子不存在或已被删除');
    }

    const post = postData.data.post;
    
    // 验证权限
    if (confirmData.confirmationType === 'owner' && post.authorId !== userId) {
      throw new Error('只有帖子作者可以进行出租方确认');
    }
    
    if (confirmData.confirmationType === 'renter' && !post.rentalInfo?.renterId) {
      throw new Error('尚未有用户申请租借');
    }
    
    if (confirmData.confirmationType === 'renter' && post.rentalInfo?.renterId !== userId) {
      throw new Error('只有申请租借的用户可以进行租借方确认');
    }

    // 调用API确认租借
    const response = await fetch(`/api/forum/posts/${confirmData.postId}/rental/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({
        confirmationType: confirmData.confirmationType,
        userId
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '租借确认失败');
    }

    // 发送通知
    try {
      const notificationType = confirmData.confirmationType === 'owner' ? 'rental_owner_confirmed' : 'rental_renter_confirmed';
      const recipientId = confirmData.confirmationType === 'owner' ? post.rentalInfo?.renterId : post.authorId;
      
      if (recipientId) {
        await fetch('/api/notifications/rental', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({
            type: notificationType,
            postId: confirmData.postId,
            recipientId,
            postTitle: post.title
          })
        });
      }
    } catch (notificationError) {
      console.warn('发送租借通知失败:', notificationError);
    }

    return { 
      success: true, 
      message: confirmData.confirmationType === 'owner' ? '出租方确认成功' : '租借方确认成功'
    };
  } catch (error) {
    console.error('租借确认失败:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : '租借确认失败'
    };
  }
}

// 点赞帖子
export async function likePost(postId: string, userId: string): Promise<ForumPost> {
  try {
    // 数据验证
    if (!postId) {
      throw new Error('帖子ID不能为空');
    }
    if (!userId) {
      throw new Error('用户ID不能为空');
    }

    // 获取当前帖子信息
    const postResponse = await fetch(`/api/forum/posts/${postId}`);
    const postData = await postResponse.json();
    
    if (!postResponse.ok || !postData.success) {
      throw new Error('帖子不存在或已被删除');
    }

    const currentPost = postData.data.post;
    
    // 检查是否已经点赞
    const likeCheckResponse = await fetch(`/api/forum/posts/${postId}/likes/${userId}`);
    const isAlreadyLiked = likeCheckResponse.ok;

    // 调用API切换点赞状态
    const response = await fetch(`/api/forum/posts/${postId}/like`, {
      method: isAlreadyLiked ? 'DELETE' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({ userId })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '点赞操作失败');
    }

    const updatedPost = data.data.post;

    // 如果是点赞（不是取消点赞）且不是自己的帖子，发送通知
    if (!isAlreadyLiked && currentPost.authorId !== userId) {
      try {
        await fetch('/api/notifications/like', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
          },
          body: JSON.stringify({
            type: 'post_liked',
            postId,
            recipientId: currentPost.authorId,
            likerName: data.data.likerName || '某用户',
            postTitle: currentPost.title
          })
        });
      } catch (notificationError) {
        console.warn('发送点赞通知失败:', notificationError);
      }
    }

    return updatedPost;
  } catch (error) {
    console.error('点赞帖子失败:', error);
    throw error;
  }
}

// 点赞回复
export async function likeReply(replyId: string, userId: string): Promise<ForumReply> {
  try {
    // 数据验证
    if (!replyId) {
      throw new Error('回复ID不能为空');
    }
    if (!userId) {
      throw new Error('用户ID不能为空');
    }

    // 获取当前回复信息
    const replyResponse = await fetch(`/api/forum/replies/${replyId}`);
    const replyData = await replyResponse.json();
    
    if (!replyResponse.ok || !replyData.success) {
      throw new Error('回复不存在或已被删除');
    }

    const currentReply = replyData.data.reply;
    
    // 检查是否已经点赞
    const likeCheckResponse = await fetch(`/api/forum/replies/${replyId}/likes/${userId}`);
    const isAlreadyLiked = likeCheckResponse.ok;

    // 调用API切换点赞状态
    const response = await fetch(`/api/forum/replies/${replyId}/like`, {
      method: isAlreadyLiked ? 'DELETE' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      },
      body: JSON.stringify({ userId })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '点赞操作失败');
    }

    const updatedReply = data.data.reply;

    // 如果是点赞（不是取消点赞）且不是自己的回复，发送通知
    if (!isAlreadyLiked && currentReply.authorId !== userId) {
      try {
        await fetch('/api/notifications/like', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
          },
          body: JSON.stringify({
            type: 'reply_liked',
            replyId,
            postId: currentReply.postId,
            recipientId: currentReply.authorId,
            likerName: data.data.likerName || '某用户'
          })
        });
      } catch (notificationError) {
        console.warn('发送点赞通知失败:', notificationError);
      }
    }

    return updatedReply;
  } catch (error) {
    console.error('点赞回复失败:', error);
    throw error;
  }
}

// 获取用户论坛统计
export async function getUserForumStats(userId: string): Promise<UserForumStats> {
  try {
    // 使用API客户端，自动包含Authorization头
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`/api/users/${userId}/forum-stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || ''}`
      }
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '获取用户统计失败');
    }
    
    return data.success ? data.data.stats : {
      postsCount: 0,
      repliesCount: 0,
      likesReceived: 0,
      likesGiven: 0,
      rentalOffered: 0,
      rentalRented: 0,
      reputation: 0
    };
  } catch (error) {
    console.error('获取用户论坛统计失败:', error);
    return {
      postsCount: 0,
      repliesCount: 0,
      likesReceived: 0,
      likesGiven: 0,
      rentalOffered: 0,
      rentalRented: 0,
      reputation: 0
    };
  }
}

// 获取用户的宝可梦列表（用于租借帖）
export async function getUserPokemonList(userId: string): Promise<PokemonCard[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // 模拟数据，实际应该从用户的宝可梦展柜获取
  return [
    {
      id: 'pikachu-001',
      name: '皮卡丘',
      level: 65,
      nature: '开朗',
      ability: '静电',
      moves: ['十万伏特', '电光一闪', '铁尾', '电磁波'],
      imageUrl: '/thumbnails/025.png',
      description: '我的第一只宝可梦，非常活泼',
      isShiny: false,
      obtainedAt: new Date('2024-01-01'),
      position: 1,
      type1: '电',
      stats: {
        hp: 274,
        attack: 229,
        defense: 196,
        specialAttack: 218,
        spDefense: 218,
        speed: 317
      }
    },
    {
      id: 'charizard-001',
      name: '喷火龙',
      level: 58,
      nature: '固执',
      ability: '猛火',
      moves: ['喷射火焰', '龙爪', '地震', '雷电拳'],
      imageUrl: '/thumbnails/006.png',
      description: '强力的火系宝可梦',
      isShiny: true,
      obtainedAt: new Date('2024-01-05'),
      position: 2,
      type1: '火',
      type2: '飞行',
      stats: {
        hp: 297,
        attack: 293,
        defense: 240,
        specialAttack: 317,
        spDefense: 269,
        speed: 299
      }
    }
  ];
}

// 活动数据已迁移到数据库，通过API获取

// 活动相关服务函数
export async function getForumActivities(): Promise<ForumActivity[]> {
  try {
    const response = await fetch('/api/forum/activities?status=active');
    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }
    const data = await response.json();
    return data.success ? data.data.activities : [];
  } catch (error) {
    console.error('获取活动列表失败:', error);
    return [];
  }
}

export async function getHistoryForumActivities(): Promise<ForumActivity[]> {
  try {
    const response = await fetch('/api/forum/activities?status=completed,cancelled,expired');
    if (!response.ok) {
      throw new Error('Failed to fetch history activities');
    }
    const data = await response.json();
    return data.success ? data.data.activities : [];
  } catch (error) {
    console.error('获取历史活动列表失败:', error);
    return [];
  }
}

export async function getActivityById(activityId: string): Promise<ForumActivity | null> {
  try {
    const response = await fetch(`/api/forum/activities/${activityId}`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.success ? data.data.activity : null;
  } catch (error) {
    console.error('获取活动详情失败:', error);
    return null;
  }
}

export async function createActivity(
  creatorId: string,
  activityData: CreateActivityRequest
): Promise<ForumActivity> {
  try {
    const response = await fetch('/api/forum/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      },
      body: JSON.stringify({
        ...activityData,
        organizerId: creatorId
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '创建活动失败');
    }
    
    return data.data.activity;
  } catch (error) {
    console.error('创建活动失败:', error);
    throw error;
  }
}

export async function registerForActivity(
  userId: string,
  userName: string,
  userAvatar: string,
  userRole: UserRole,
  registrationData: ActivityRegistrationRequest
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`/api/forum/activities/${registrationData.activityId}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      },
      body: JSON.stringify({
        activityId: registrationData.activityId,
        userId,
        userName,
        userAvatar,
        userRole
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, message: data.message || '报名失败' };
    }
    
    return { success: true, message: data.message || '报名成功！' };
  } catch (error) {
    console.error('活动报名失败:', error);
    return { success: false, message: '网络错误，请稍后重试' };
  }
}

export async function getActivityParticipants(activityId: string): Promise<ActivityParticipant[]> {
  try {
    const response = await fetch(`/api/forum/activities/${activityId}/participants`);
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return data.success ? data.data.participants : [];
  } catch (error) {
    console.error('获取活动参与者失败:', error);
    return [];
  }
}

export async function getUserActivityRegistrations(userId: string): Promise<ActivityParticipant[]> {
  try {
    const response = await fetch(`/api/users/${userId}/activity-registrations`);
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return data.success ? data.data.registrations : [];
  } catch (error) {
    console.error('获取用户活动报名记录失败:', error);
    return [];
  }
}

// 帖子审核相关函数

// 获取待审核帖子列表
export async function getPendingPosts(): Promise<ForumPost[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return pendingPosts.filter(post => post.status === PostStatus.PENDING);
}

// 审核帖子
export async function moderatePost(
  moderatorId: string,
  moderatorName: string,
  moderationData: PostModerationRequest
): Promise<{ success: boolean; message: string }> {
  try {
    const { postId, action, reason, moderatorNote } = moderationData;
    
    // 数据验证
    if (!postId) {
      throw new Error('帖子ID不能为空');
    }
    if (!action || !['approve', 'reject'].includes(action)) {
      throw new Error('审核操作无效');
    }
    if (!moderatorId) {
      throw new Error('审核员ID不能为空');
    }

    // 获取帖子信息验证状态
    const postResponse = await fetch(`/api/forum/posts/${postId}`);
    const postData = await postResponse.json();
    
    if (!postResponse.ok || !postData.success) {
      return { success: false, message: '帖子不存在或已被删除' };
    }

    const post = postData.data.post;
    
    // 验证帖子状态
    if (post.status !== PostStatus.PENDING) {
      return { success: false, message: '帖子不在待审核状态' };
    }

    // 调用API进行审核
    const response = await fetch(`/api/forum/posts/${postId}/moderate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      },
      body: JSON.stringify({
        action,
        reason,
        moderatorNote,
        moderatorId,
        moderatorName
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '审核操作失败');
    }

    // 发送审核结果通知给帖子作者
    try {
      await fetch('/api/notifications/moderation-result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({
          type: action === 'approve' ? 'post_approved' : 'post_rejected',
          postId,
          recipientId: post.authorId,
          postTitle: post.title,
          reason: action === 'reject' ? reason : undefined,
          moderatorNote
        })
      });
    } catch (notificationError) {
      console.warn('发送审核通知失败:', notificationError);
    }

    return {
      success: true,
      message: action === 'approve' ? '帖子审核通过' : '帖子已拒绝'
    };
  } catch (error) {
    console.error('审核帖子失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '审核操作失败'
    };
  }
}

// 获取审核日志
export async function getModerationLogs(postId?: string): Promise<PostModerationLog[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (postId) {
    return moderationLogs.filter(log => log.postId === postId);
  }
  return moderationLogs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// 创建活动帖子
export async function createActivityPost(
  organizerId: string,
  organizerName: string,
  organizerRole: UserRole,
  activityData: CreateActivityRequest
): Promise<{ activity: ForumActivity; post: ForumPost }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 创建活动
  const activity = await createActivity(organizerId, activityData);
  
  // 创建对应的帖子
  const postData: CreatePostRequest = {
    title: `【活动】${activityData.title}`,
    content: `<div class="activity-post">
      <h3>${activityData.title}</h3>
      <p>${activityData.description}</p>
      <div class="activity-info">
        <p><strong>活动时间：</strong>${activityData.startTime.toLocaleString()} - ${activityData.endTime.toLocaleString()}</p>
        <p><strong>报名截止：</strong>${activityData.registrationDeadline.toLocaleString()}</p>
        ${activityData.maxParticipants ? `<p><strong>参与人数：</strong>限制 ${activityData.maxParticipants} 人</p>` : ''}
        ${activityData.location ? `<p><strong>活动地点：</strong>${activityData.location}</p>` : ''}
      </div>
      <div class="activity-rewards">
        <h4>活动奖励：</h4>
        <ul>
          ${activityData.rewards.map(reward => `<li>${reward.name} x${reward.quantity}</li>`).join('')}
        </ul>
      </div>
    </div>`,
    type: PostType.DISCUSSION, // 活动帖类型
    tags: ['活动', '官方']
  };
  
  const post = await createForumPost(organizerId, organizerName, organizerRole, postData);
  
  return { activity, post };
}

// 删除帖子（管理员功能）
export async function deletePost(
  moderatorId: string,
  moderatorName: string,
  postId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // 数据验证
    if (!postId) {
      throw new Error('帖子ID不能为空');
    }
    if (!moderatorId) {
      throw new Error('管理员ID不能为空');
    }

    // 获取帖子信息验证权限
    const postResponse = await fetch(`/api/forum/posts/${postId}`);
    const postData = await postResponse.json();
    
    if (!postResponse.ok || !postData.success) {
      return { success: false, message: '帖子不存在或已被删除' };
    }

    const post = postData.data.post;
    
    // 验证帖子状态
    if (post.status === PostStatus.DELETED) {
      return { success: false, message: '帖子已被删除' };
    }

    // 调用API删除帖子（软删除）
    const response = await fetch(`/api/forum/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      },
      body: JSON.stringify({
        reason,
        moderatorId,
        moderatorName
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '删除帖子失败');
    }

    // 发送删除通知给帖子作者（如果不是作者自己删除）
    if (post.authorId !== moderatorId) {
      try {
        await fetch('/api/notifications/post-deleted', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
          },
          body: JSON.stringify({
            type: 'post_deleted',
            postId,
            recipientId: post.authorId,
            postTitle: post.title,
            reason,
            moderatorName
          })
        });
      } catch (notificationError) {
        console.warn('发送删除通知失败:', notificationError);
      }
    }

    // 记录删除日志
    const log: PostModerationLog = {
      id: `log-${Date.now()}`,
      postId,
      moderatorId,
      moderatorName,
      action: 'delete',
      reason: reason || '管理员删除',
      note: `帖子被${moderatorName}删除`,
      createdAt: new Date()
    };
    moderationLogs.push(log);

    return { success: true, message: '帖子已删除' };
  } catch (error) {
    console.error('删除帖子失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '删除帖子失败'
    };
  }
}