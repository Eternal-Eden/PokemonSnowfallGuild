'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Eye, 
  Heart, 
  Pin, 
  Lock, 
  Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ForumPost, PostType, RentalStatus } from '@/types/forum';
import { likePost } from '@/lib/forumService';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from '@/components/UserAvatar';

interface PostCardProps {
  post: ForumPost;
  compact?: boolean;
}

export default function PostCard({ post, compact = false }: PostCardProps) {
  const router = useRouter();
  const { state } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isLiking, setIsLiking] = useState(false);

  const handlePostClick = () => {
    router.push(`/forum/post/${post.id}`);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!state.user || isLiking) return;
    
    setIsLiking(true);
    try {
      const updatedPost = await likePost(post.id, state.user.id);
      setIsLiked(updatedPost.likedByCurrentUser ?? false);
      setLikeCount(updatedPost.likeCount);
    } catch (error) {
      console.error('点赞失败:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const getPostTypeInfo = () => {
    switch (post.type) {
      case PostType.DISCUSSION:
        return {
          icon: <MessageSquare className="w-4 h-4" />,
          label: '交流帖',
          color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
        };
      case PostType.POKEMON_RENTAL:
        return {
          icon: <Zap className="w-4 h-4" />,
          label: '精灵租借',
          color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
        };
      default:
        return {
          icon: <MessageSquare className="w-4 h-4" />,
          label: '未知',
          color: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
        };
    }
  };

  const getRentalStatusInfo = () => {
    if (!post.rentalInfo) return null;
    
    switch (post.rentalInfo.status) {
      case RentalStatus.AVAILABLE:
        return {
          label: '可租借',
          color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
        };
      case RentalStatus.PENDING:
        return {
          label: '待确认',
          color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
        };
      case RentalStatus.RENTED:
        return {
          label: '已租借',
          color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
        };
      case RentalStatus.COMPLETED:
        return {
          label: '已完成',
          color: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
        };
      case RentalStatus.CANCELLED:
        return {
          label: '已取消',
          color: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
        };
      default:
        return null;
    }
  };

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // 检查日期是否有效
    if (isNaN(dateObj.getTime())) {
      return '时间未知';
    }
    
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return '刚刚';
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}分钟前`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}小时前`;
    } else if (diffInSeconds < 2592000) {
      return `${Math.floor(diffInSeconds / 86400)}天前`;
    } else {
      return dateObj.toLocaleDateString('zh-CN');
    }
  };

  const stripHtmlTags = (html: string) => {
    return html.replace(/<[^>]*>/g, '').substring(0, 150) + (html.length > 150 ? '...' : '');
  };

  const typeInfo = getPostTypeInfo();
  const rentalStatusInfo = getRentalStatusInfo();

  // 获取帖子配图
  const getPostImage = () => {
    // 如果有精灵租借信息且有图片，优先显示精灵图片
    if (post.rentalInfo?.pokemonImageUrl) {
      return post.rentalInfo.pokemonImageUrl;
    }
    
    // 如果帖子有附件图片，显示第一张
    if (post.attachments && post.attachments.length > 0) {
      const imageAttachment = post.attachments.find(att => att.type === 'image');
      if (imageAttachment) {
        return imageAttachment.url;
      }
    }
    
    // 如果没有用户上传的图片，返回null，不显示图片
    return null;
  };

  const postImage = getPostImage();

  // 紧凑模式的渲染
  if (compact) {
    return (
      <motion.div
        whileHover={{ y: -2, scale: 1.02 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
        onClick={handlePostClick}
      >
        {/* 顶部图片区域 - 只在有图片时显示 */}
        {postImage && (
          <div className="relative h-48 overflow-hidden">
            <img 
              src={postImage} 
              alt={post.title}
              className="w-full h-full object-cover"
            />
              {/* 闪光精灵标识 */}
              {post.rentalInfo?.isShiny && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm">✨</span>
                  </div>
                </div>
              )}
              {/* 类型标签 */}
              <div className="absolute top-2 left-2">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm ${typeInfo.color}`}>
                  {typeInfo.icon}
                  <span>{typeInfo.label}</span>
                </span>
              </div>
            </div>
        )}
        
        {/* 内容区域 */}
        <div className="p-4">
          {/* 标题 */}
          <div className="flex items-start gap-2 mb-2">
            {post.isSticky && <Pin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
            {post.isLocked && <Lock className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />}
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight">
              {post.title}
            </h3>
          </div>
          
          {/* 正文预览 */}
          <p className="text-gray-600 dark:text-gray-300 text-xs line-clamp-3 mb-3 leading-relaxed">
            {stripHtmlTags(post.content)}
          </p>
          
          {/* 精灵租借信息 */}
          {post.rentalInfo && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg px-2 py-1 mb-3">
              <span className="text-xs text-yellow-700 dark:text-yellow-300">
                {post.rentalInfo.pokemonName} Lv.{post.rentalInfo.pokemonLevel} • {Math.floor(post.rentalInfo.rentalDuration / 24)}天
              </span>
            </div>
          )}
          
          {/* 标签 */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {post.tags.slice(0, 2).map((tag, index) => (
                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                  #{tag}
                </span>
              ))}
              {post.tags.length > 2 && (
                <span className="text-xs text-gray-400">+{post.tags.length - 2}</span>
              )}
            </div>
          )}
          
          {/* 底部信息 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserAvatar 
                user={{
                  id: post.authorId,
                  username: post.authorName,
                  avatarUrl: post.authorAvatar,
                  isOnline: Math.random() > 0.5
                } as any}
                size="xs"
                showTooltip
                clickable
                onClick={(e) => {
                  e?.stopPropagation();
                  router.push(`/profile/${post.authorId}`);
                }}
              />
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <div>{post.authorName}</div>
                <div>{formatTimeAgo(post.createdAt)}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {post.viewCount}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {post.replyCount}
                </span>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                  isLiked 
                    ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' 
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-red-100 hover:text-red-600'
                }`}
              >
                <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-xs">{likeCount}</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // 默认模式的渲染
  return (
    <motion.div
      whileHover={{ y: -1 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={handlePostClick}
    >
      <div className="flex p-3 gap-3">
        {/* 左侧配图区域 - 只在有图片时显示 */}
        {postImage && (
          <div className="flex-shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 relative">
              <img 
                src={postImage} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
              {/* 闪光精灵标识 */}
              {post.rentalInfo?.isShiny && (
                <div className="absolute top-1 right-1">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✨</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 右侧内容区域 */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* 上部分：标题和正文 */}
          <div className="flex-1 mb-2">
            {/* 标题行 */}
            <div className="flex items-start gap-2 mb-1">
              {post.isSticky && <Pin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
              {post.isLocked && <Lock className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />}
              <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2">
                {post.title}
              </h3>
            </div>
            
            {/* 正文预览 */}
            <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-2">
              {stripHtmlTags(post.content)}
            </p>
              
            {/* 精灵租借信息（简化版） */}
            {post.rentalInfo && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded px-2 py-1 mb-2">
                <span className="text-xs text-yellow-700 dark:text-yellow-300">
                  {post.rentalInfo.pokemonName} Lv.{post.rentalInfo.pokemonLevel} • {Math.floor(post.rentalInfo.rentalDuration / 24)}天
                </span>
              </div>
            )}
          </div>

          {/* 下部分：标签和元数据 */}
          <div className="space-y-2">
            {/* 标签行（简化） */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${typeInfo.color}`}>
                {typeInfo.icon}
                <span>{typeInfo.label}</span>
              </span>
              
              {rentalStatusInfo && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${rentalStatusInfo.color}`}>
                  {rentalStatusInfo.label}
                </span>
              )}
              
              {/* 只显示第一个标签 */}
              {post.tags?.[0] && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                  #{post.tags[0]}
                </span>
              )}
            </div>

            {/* 作者和统计信息 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <UserAvatar 
                  user={{
                    id: post.authorId,
                    username: post.authorName,
                    avatarUrl: post.authorAvatar,
                    isOnline: Math.random() > 0.5
                  } as any}
                  size="sm"
                  showTooltip
                  clickable
                  onClick={(e) => {
                    e?.stopPropagation();
                    router.push(`/profile/${post.authorId}`);
                  }}
                />
                <span className="text-xs">{post.authorName}</span>
                <span className="text-xs">•</span>
                <span className="text-xs">{formatTimeAgo(post.createdAt)}</span>
              </div>

              {/* 统计信息和操作按钮 */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>{post.viewCount} 浏览</span>
                  <span>{post.replyCount} 回复</span>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                    isLiked 
                      ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-red-100 hover:text-red-600'
                  }`}
                >
                  <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="text-xs">{likeCount}</span>
                </motion.button>
              </div>
            </div>
          </div>
         </div>
      </div>
    </motion.div>
  );
}