'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Eye,
  Share2,
  MoreHorizontal,
  Clock,
  Calendar,
  Star,
  Zap,
  User,
  Send,
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer,
  ThumbsUp,
  Bookmark,
  Flag
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ForumPost, ForumReply, PostType, RentalStatus, CreateReplyRequest, RentalConfirmRequest } from '@/types/forum';
import { PokemonCard } from '@/types/auth';
import {
  getForumPost,
  getPostReplies,
  createPostReply,
  likePost,
  likeReply,
  confirmRental,
  getUserPokemonList
} from '@/lib/forumService';
import UserAvatar from '@/components/UserAvatar';
import RichTextEditor from '@/components/forum/RichTextEditor';
import RoleBadge from '@/components/RoleBadge';
import ShareCard from '@/components/ShareCard';

// 回复列表组件
interface ReplyListProps {
  replies: ForumReply[];
  post: ForumPost;
  state: any;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  nestedReplyContent: string;
  setNestedReplyContent: (content: string) => void;
  isSubmittingReply: boolean;
  handleLikeReply: (id: string) => void;
  handleSubmitNestedReply: (parentId: string) => void;
  handleRentalResponse: (reply: ForumReply) => void;
  formatDate: (date: Date) => string;
  level?: number;
}

function ReplyList({
  replies,
  post,
  state,
  replyingTo,
  setReplyingTo,
  nestedReplyContent,
  setNestedReplyContent,
  isSubmittingReply,
  handleLikeReply,
  handleSubmitNestedReply,
  handleRentalResponse,
  formatDate,
  level = 0
}: ReplyListProps) {
  const router = useRouter();
  // 分离顶级回复和子回复
  const topLevelReplies = replies.filter(reply => !reply.parentReplyId);
  const childReplies = replies.filter(reply => reply.parentReplyId);

  // 获取指定父回复的子回复
  const getChildReplies = (parentId: string) => {
    return childReplies.filter(reply => reply.parentReplyId === parentId);
  };

  const renderReply = (reply: ForumReply, isChild = false) => (
    <motion.div
      key={reply.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isChild ? 'ml-12 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''} p-6`}
    >
      <div className="flex items-start space-x-4">
        <UserAvatar 
          user={{ id: reply.authorId, username: reply.authorName }} 
          size={isChild ? "sm" : "md"} 
          clickable
          onClick={(e) => {
            e?.stopPropagation();
            router.push(`/profile/${reply.authorId}`);
          }}
        />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                {reply.authorName}
              </span>
              {reply.authorRole && <RoleBadge role={reply.authorRole} size="sm" />}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(reply.createdAt)}
              </span>
            </div>
            
            {/* 租借响应按钮 */}
            {post.type === PostType.POKEMON_RENTAL && 
             post.rentalInfo?.status === RentalStatus.AVAILABLE &&
             state.user?.id === post.authorId &&
             reply.authorId !== post.authorId && (
              <button
                onClick={() => handleRentalResponse(reply)}
                className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
              >
                确认租借
              </button>
            )}
          </div>
          
          <div 
            className="prose dark:prose-invert prose-sm max-w-none mb-3"
            ref={(el) => {
              if (el && el.innerHTML !== reply.content) {
                el.innerHTML = reply.content;
              }
            }}
          />
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleLikeReply(reply.id)}
              className={`flex items-center space-x-1 text-sm transition-colors ${
                reply.likedByCurrentUser
                  ? 'text-red-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${reply.likedByCurrentUser ? 'fill-current' : ''}`} />
              <span>{reply.likeCount}</span>
            </button>
            
            {level < 3 && ( // 限制嵌套层级
              <button 
                onClick={() => setReplyingTo(reply.id)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
              >
                回复
              </button>
            )}
          </div>
          
          {/* 嵌套回复输入框 */}
          {replyingTo === reply.id && state.user && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center space-x-2">
                <UserAvatar user={state.user} size="sm" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  回复 @{reply.authorName}
                </span>
              </div>
              
              <RichTextEditor
                value={nestedReplyContent}
                onChange={setNestedReplyContent}
                placeholder={`回复 @${reply.authorName}...`}
                minHeight={80}
                maxHeight={200}
              />
              
              <div className="flex items-center justify-end space-x-2">
                <button
                  onClick={() => {
                    setReplyingTo(null);
                    setNestedReplyContent('');
                  }}
                  className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => handleSubmitNestedReply(reply.id)}
                  disabled={!nestedReplyContent.trim() || isSubmittingReply}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-3 h-3" />
                  <span>{isSubmittingReply ? '发送中...' : '回复'}</span>
                </button>
              </div>
            </div>
          )}
          
          {/* 渲染子回复 */}
          {!isChild && getChildReplies(reply.id).length > 0 && (
            <div className="mt-4">
              {getChildReplies(reply.id).map(childReply => renderReply(childReply, true))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      {topLevelReplies.map(reply => renderReply(reply))}
    </>
  );
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { state } = useAuth();
  const postId = params?.id as string;
  
  const [post, setPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // 正在回复的评论ID
  const [nestedReplyContent, setNestedReplyContent] = useState(''); // 嵌套回复内容
  
  // 租借相关状态
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [selectedReply, setSelectedReply] = useState<ForumReply | null>(null);
  const [rentalDuration, setRentalDuration] = useState(24);
  const [userPokemon, setUserPokemon] = useState<PokemonCard[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonCard | null>(null);
  const [isConfirmingRental, setIsConfirmingRental] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);

  useEffect(() => {
    if (postId) {
      loadPostData();
    }
  }, [postId, state.user?.id]);

  useEffect(() => {
    if (state.user && post?.type === PostType.POKEMON_RENTAL) {
      loadUserPokemon();
    }
  }, [state.user, post?.type]);

  const loadPostData = async () => {
    try {
      setIsLoading(true);
      const [postData, repliesData] = await Promise.all([
        getForumPost(postId, state.user?.id),
        getPostReplies(postId, state.user?.id)
      ]);
      setPost(postData);
      setReplies(repliesData);
    } catch (error) {
      console.error('加载帖子数据失败:', error);
      setError('加载帖子失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserPokemon = async () => {
    if (!state.user) return;
    
    try {
      const pokemon = await getUserPokemonList(state.user.id);
      setUserPokemon(pokemon);
    } catch (error) {
      console.error('加载宝可梦列表失败:', error);
    }
  };

  const handleLikePost = async () => {
    if (!state.user || !post) return;
    
    try {
      const updatedPost = await likePost(post.id, state.user.id);
      setPost(updatedPost);
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const handleLikeReply = async (replyId: string) => {
    if (!state.user) return;
    
    try {
      const updatedReply = await likeReply(replyId, state.user.id);
      setReplies(replies.map(reply => 
        reply.id === replyId ? updatedReply : reply
      ));
    } catch (error) {
      console.error('点赞回复失败:', error);
    }
  };

  const handleSubmitReply = async () => {
    if (!state.user || !post || !replyContent.trim()) return;
    
    setIsSubmittingReply(true);
    try {
      const replyData: CreateReplyRequest = {
        postId: post.id,
        content: replyContent.trim()
      };
      
      const newReply = await createPostReply(
        state.user.id,
        state.user.username,
        state.user.role,
        replyData
      );
      
      setReplies([...replies, newReply]);
      setReplyContent('');
      setIsReplying(false);
      
      // 更新帖子回复数
      setPost({
        ...post,
        replyCount: post.replyCount + 1
      });
    } catch (error) {
      console.error('回复失败:', error);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // 提交嵌套回复
  const handleSubmitNestedReply = async (parentReplyId: string) => {
    if (!nestedReplyContent.trim() || !state.user || !post) return;

    setIsSubmittingReply(true);
    setError(null);

    try {
      const replyData: CreateReplyRequest = {
        postId: post.id,
        content: nestedReplyContent,
        parentReplyId
      };

      await createPostReply(
        state.user.id,
        state.user.username,
        state.user.role,
        replyData
      );
      
      setNestedReplyContent('');
      setReplyingTo(null);
      await loadPostData(); // 重新加载数据
    } catch (error) {
      console.error('提交回复失败:', error);
      setError('提交回复失败，请重试');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleRentalResponse = (reply: ForumReply) => {
    setSelectedReply(reply);
    setShowRentalModal(true);
  };

  const handleConfirmRental = async () => {
    if (!state.user || !post || !selectedReply || !selectedPokemon) return;
    
    setIsConfirmingRental(true);
    try {
      const rentalData: RentalConfirmRequest = {
        postId: post.id,
        replyId: selectedReply.id,
        duration: rentalDuration,
        renterUserId: selectedReply.authorId,
        confirmationType: 'owner'
      };
      
      await confirmRental(state.user.id, rentalData);
      
      // 更新帖子状态
      setPost({
        ...post,
        rentalInfo: {
          ...post.rentalInfo!,
          status: RentalStatus.RENTED
        }
      });
      
      setShowRentalModal(false);
      setSelectedReply(null);
      setSelectedPokemon(null);
    } catch (error) {
      console.error('确认租借失败:', error);
    } finally {
      setIsConfirmingRental(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffInHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return '刚刚';
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}天前`;
    } else {
      return dateObj.toLocaleDateString('zh-CN');
    }
  };

  const getDurationText = (hours: number) => {
    if (hours < 24) {
      return `${hours}小时`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days}天${remainingHours}小时` : `${days}天`;
    }
  };

  const getRentalStatusColor = (status: RentalStatus) => {
    switch (status) {
      case RentalStatus.AVAILABLE:
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case RentalStatus.RENTED:
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      case RentalStatus.EXPIRED:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getRentalStatusText = (status: RentalStatus) => {
    switch (status) {
      case RentalStatus.AVAILABLE:
        return '可租借';
      case RentalStatus.RENTED:
        return '已租借';
      case RentalStatus.EXPIRED:
        return '已过期';
      default:
        return '未知状态';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {error || '帖子不存在'}
          </h2>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      {/* 装饰性背景元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-20 w-32 h-32 bg-purple-200/20 dark:bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 20, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-32 left-16 w-40 h-40 bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 40, 0],
            y: [0, -30, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="group flex items-center space-x-3 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-8 transition-all duration-200 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm hover:shadow-md border border-gray-200/50 dark:border-gray-700/50"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">返回论坛</span>
        </motion.button>

        {/* 帖子内容 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden mb-8 hover:shadow-2xl transition-all duration-300"
        >
          {/* 帖子头部 */}
          <div className="p-8 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-700/50">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative"
                >
                  <UserAvatar 
                    user={{ id: post.authorId, username: post.authorName }} 
                    size="lg" 
                    clickable
                    onClick={(e) => {
                      e?.stopPropagation();
                      router.push(`/profile/${post.authorId}`);
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                </motion.div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {post.authorName}
                    </span>
                    {post.authorRole && <RoleBadge role={post.authorRole} size="md" />}
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-700/60 px-3 py-1 rounded-full">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-700/60 px-3 py-1 rounded-full">
                      <Eye className="w-4 h-4" />
                      <span>{post.viewCount} 浏览</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* 帖子类型标识 */}
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium shadow-sm border ${
                    post.type === PostType.DISCUSSION
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-300 shadow-blue-200/50'
                      : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-yellow-300 shadow-yellow-200/50'
                  }`}
                >
                  {post.type === PostType.DISCUSSION ? (
                    <MessageSquare className="w-4 h-4" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <span>
                    {post.type === PostType.DISCUSSION ? '交流帖' : '精灵租借'}
                  </span>
                </motion.div>
                
                {/* 租借状态 */}
                {post.type === PostType.POKEMON_RENTAL && post.rentalInfo && (
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium shadow-sm border ${
                      post.rentalInfo.status === RentalStatus.AVAILABLE
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-300 shadow-green-200/50'
                        : post.rentalInfo.status === RentalStatus.RENTED
                        ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-red-300 shadow-red-200/50'
                        : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-300 shadow-gray-200/50'
                    }`}
                  >
                    {getRentalStatusText(post.rentalInfo.status)}
                  </motion.div>
                )}
              </div>
            </div>
            
            {/* 帖子标题 */}
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-6 leading-tight"
            >
              {post.title}
            </motion.h1>
            
            {/* 标签 */}
            {post.tags && post.tags.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-3 mb-6"
              >
                {post.tags.map((tag, index) => (
                  <motion.span
                    key={index}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium border border-purple-200/50 dark:border-purple-700/50 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    #{tag}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </div>

          {/* 精灵租借信息 */}
          {post.type === PostType.POKEMON_RENTAL && post.rentalInfo && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-8 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-red-900/20 border-b border-gray-200/50 dark:border-gray-700/50 relative overflow-hidden"
            >
              {/* 装饰性背景 */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-200/30 to-orange-200/30 dark:from-yellow-500/10 dark:to-orange-500/10 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center space-x-2 mb-6">
                  <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">精灵租借信息</h3>
                </div>
                
                <div className="flex items-start space-x-6">
                  {post.rentalInfo.pokemonImageUrl && (
                    <motion.div
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      className="relative"
                    >
                      <img 
                        src={post.rentalInfo.pokemonImageUrl} 
                        alt={post.rentalInfo.pokemonName}
                        className="w-24 h-24 rounded-2xl object-cover shadow-lg border-2 border-white/50 dark:border-gray-700/50"
                      />
                      {post.rentalInfo.isShiny && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg"
                        >
                          <Star className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                  
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {post.rentalInfo.pokemonName}
                        </h4>
                        {post.rentalInfo.isShiny && (
                          <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-bold rounded-full shadow-sm">
                            闪光
                          </span>
                        )}
                      </div>
                      <div className="text-gray-600 dark:text-gray-300 font-medium">
                        等级 {post.rentalInfo.pokemonLevel} • {post.rentalInfo.pokemonSpecies}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                        <Timer className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">租借时长</div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {getDurationText(post.rentalInfo.rentalDuration)}
                          </div>
                        </div>
                      </div>
                      
                      {post.rentalInfo.requirements && (
                        <div className="flex items-start space-x-2 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                          <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">租借要求</div>
                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                              {post.rentalInfo.requirements}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 帖子内容 */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="p-8"
          >
            <div
              className="prose dark:prose-invert max-w-none prose-lg prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-strong:text-gray-900 dark:prose-strong:text-white"
              ref={(el) => {
                if (el && el.innerHTML !== post.content) {
                  el.innerHTML = post.content;
                }
              }}
            />
          </motion.div>

          {/* 帖子操作 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="px-8 py-6 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/80 to-white/80 dark:from-gray-700/80 dark:to-gray-800/80 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLikePost}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                    post.likedByCurrentUser
                      ? 'text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      : 'text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${post.likedByCurrentUser ? 'fill-current' : ''}`} />
                  <span className="font-medium">{post.likeCount}</span>
                  <span className="text-sm">点赞</span>
                </motion.button>
                
                <div className="flex items-center space-x-2 px-4 py-2 text-gray-500 dark:text-gray-400 bg-gray-100/50 dark:bg-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-medium">{post.replyCount}</span>
                  <span className="text-sm">回复</span>
                </div>
                
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowShareCard(true)}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                  title="分享帖子"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="font-medium">分享</span>
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all duration-200 border border-transparent hover:border-purple-200 dark:hover:border-purple-800"
                >
                  <Bookmark className="w-5 h-5" />
                  <span className="font-medium">收藏</span>
                </motion.button>
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
              >
                <MoreHorizontal className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        {/* 回复列表 */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden hover:shadow-2xl transition-all duration-300"
        >
          <div className="p-8 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-700/50">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                回复讨论 ({replies.length})
              </h2>
            </div>
          </div>
          
          {/* 回复输入框 */}
          {state.user && (
            <div className="p-8 border-b border-gray-200/50 dark:border-gray-700/50">
              {!isReplying ? (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setIsReplying(true)}
                  className="w-full p-6 text-left text-gray-500 dark:text-gray-400 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-2xl hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50 hover:border-blue-300/50 dark:hover:border-blue-600/50 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center space-x-3">
                    <UserAvatar user={state.user} size="sm" />
                    <span className="text-lg">写下你的回复...</span>
                  </div>
                </motion.button>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-4">
                    <UserAvatar user={state.user} size="md" />
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white text-lg">
                        {state.user.username}
                      </span>
                      <div className="text-sm text-gray-500 dark:text-gray-400">正在回复</div>
                    </div>
                  </div>
                  
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
                    <RichTextEditor
                      value={replyContent}
                      onChange={setReplyContent}
                      placeholder="写下你的回复..."
                      minHeight={120}
                      maxHeight={300}
                    />
                  </div>
                  
                  <div className="flex items-center justify-end space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setIsReplying(false);
                        setReplyContent('');
                      }}
                      className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                    >
                      取消
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSubmitReply}
                      disabled={!replyContent.trim() || isSubmittingReply}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Send className="w-5 h-5" />
                      <span className="font-medium">{isSubmittingReply ? '发送中...' : '发送回复'}</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
          
          {/* 回复列表 */}
          <div className="divide-y divide-gray-200/30 dark:divide-gray-700/30">
            {replies.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-12 text-center"
              >
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center"
                >
                  <MessageSquare className="w-10 h-10 text-blue-500 dark:text-blue-400" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  还没有回复
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  来发表第一个回复，开启讨论吧！
                </p>
                {state.user && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsReplying(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                  >
                    发表第一个回复
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <ReplyList 
                replies={replies} 
                post={post}
                state={state}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                nestedReplyContent={nestedReplyContent}
                setNestedReplyContent={setNestedReplyContent}
                isSubmittingReply={isSubmittingReply}
                handleLikeReply={handleLikeReply}
                handleSubmitNestedReply={handleSubmitNestedReply}
                handleRentalResponse={handleRentalResponse}
                formatDate={formatDate}
              />
            )}
          </div>
        </motion.div>
      </div>

      {/* 租借确认模态框 */}
      <AnimatePresence>
        {showRentalModal && selectedReply && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRentalModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  确认租借
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      租借方: <span className="font-medium">{selectedReply.authorName}</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      宝可梦: <span className="font-medium">{post.rentalInfo?.pokemonName}</span>
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      确认租借时长
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="1"
                        max="168"
                        value={rentalDuration}
                        onChange={(e) => setRentalDuration(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>1小时</span>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{getDurationText(rentalDuration)}</span>
                        </div>
                        <span>7天</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowRentalModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConfirmRental}
                    disabled={isConfirmingRental}
                    className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{isConfirmingRental ? '确认中...' : '确认租借'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 分享卡片模态框 */}
      {showShareCard && (
        <ShareCard
          type="post"
          post={post}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </div>
  );
}