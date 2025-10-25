'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  Users,
  Zap,
  BarChart3,
  Settings,
  Hash,
  Loader2,
  Circle,
  Edit3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { PostType, ForumPost, ForumCategory } from '@/types/forum';
import PostCard from '@/components/forum/PostCard';
import CreatePostModal from '@/components/forum/CreatePostModal';
import IntegratedActivitySection from '@/components/forum/IntegratedActivitySection';
import MessageSection from '@/components/forum/MessageSection';
import UserProfileSummary from '@/components/forum/UserProfileSummary';
import OnlineUsersCount from '@/components/forum/OnlineUsersCount';
import TodayPostsCount from '@/components/forum/TodayPostsCount';
import UserAvatar from '@/components/UserAvatar';

import { AnimatedWrapper, PageTransition, HoverAnimation } from '@/components/animations/AnimationComponents';
import { useSettings } from '@/contexts/SettingsContext';

import { getForumPosts, getForumCategories } from '@/lib/forumService';
import { useRouter } from 'next/navigation';

export default function ForumPage() {
  const { state } = useAuth();
  const { settings } = useSettings();
  const router = useRouter();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<PostType | 'all'>('all');

  const [page, setPage] = useState(1);
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px'
  });

  // 检查是否为版主（可以返回数据展示页面）
  const isModerator = state.user?.role === UserRole.MODERATOR;



  // 初始加载数据
  useEffect(() => {
    loadForumData();
  }, [selectedCategory, selectedType, searchQuery, state.user?.id]);

  // 监听无限滚动
  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore) {
      loadMorePosts();
    }
  }, [inView, hasMore, loading, loadingMore, page, selectedCategory, selectedType, searchQuery, state.user?.id]);

  // 监听发帖事件
  useEffect(() => {
    const handleOpenCreatePost = () => {
      setShowCreateModal(true);
    };
    
    window.addEventListener('openCreatePost', handleOpenCreatePost);
    
    return () => {
      window.removeEventListener('openCreatePost', handleOpenCreatePost);
    };
  }, []);

  const loadForumData = async () => {
    try {
      setLoading(true);
      setPage(1);
      setHasMore(true);
      
      const [postsData, categoriesData] = await Promise.all([
        getForumPosts({
          search: searchQuery || undefined,
          type: selectedType === 'all' ? undefined : selectedType,
          categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
          page: 1,
          limit: 20
        }, state.user?.id),
        getForumCategories()
      ]);
      
      setPosts(postsData.posts);
      setCategories(categoriesData);
      setHasMore(postsData.posts.length === 20);
    } catch (error) {
      console.error('加载论坛数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const postsData = await getForumPosts({
        search: searchQuery || undefined,
        type: selectedType === 'all' ? undefined : selectedType,
        categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        page: nextPage,
        limit: 20
      }, state.user?.id);
      
      if (postsData.posts.length > 0) {
        setPosts(prev => [...prev, ...postsData.posts]);
        setPage(nextPage);
        setHasMore(postsData.posts.length === 20);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('加载更多帖子失败:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCreatePost = () => {
    setShowCreateModal(true);
  };

  const handlePostCreated = (newPost: ForumPost) => {
    setPosts(prev => [newPost, ...prev]);
    setShowCreateModal(false);
  };

  const getTypeIcon = (type: PostType) => {
    switch (type) {
      case PostType.DISCUSSION:
        return <MessageSquare className="w-4 h-4" />;
      case PostType.POKEMON_RENTAL:
        return <Zap className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: PostType) => {
    switch (type) {
      case PostType.DISCUSSION:
        return '交流帖';
      case PostType.POKEMON_RENTAL:
        return '精灵租借';
      default:
        return '未知类型';
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen relative overflow-hidden">
        
        {/* 装饰性动画元素 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {settings.animation.enabled && (
            <>
              <motion.div
                className="absolute top-32 right-20 w-20 h-20 bg-purple-200/15 dark:bg-purple-500/8 rounded-full blur-xl"
                animate={{
                  x: [0, -60, 0],
                  y: [0, 40, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="absolute bottom-32 left-16 w-28 h-28 bg-blue-200/15 dark:bg-blue-500/8 rounded-full blur-xl"
                animate={{
                  x: [0, 80, 0],
                  y: [0, -60, 0],
                  scale: [1, 0.8, 1]
                }}
                transition={{
                  duration: 9,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.5
                }}
              />
            </>
          )}
        </div>
        
        {/* 主要内容 */}
        <div className="relative z-10">
          {/* 页面头部 */}
          <AnimatedWrapper animation="slideIn" delay={0}>
            <header className="backdrop-blur-sm shadow-lg border-b border-gray-200/30 dark:border-gray-700/30 sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* 主导航栏 */}
                <div className="flex items-center justify-between h-20">
                  {/* 左侧：论坛标题和统计 */}
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-4">
                      <HoverAnimation scale={1.05}>
                        <div className="p-2 bg-blue-500 rounded-xl">
                          <MessageSquare className="w-8 h-8 text-white" />
                        </div>
                      </HoverAnimation>
                      <div>
                        <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          落雪论坛
                        </h1>
                        <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <OnlineUsersCount />
                          <TodayPostsCount />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 右侧：用户信息和快捷操作 */}
                  <div className="flex items-center space-x-4">
                    {/* 搜索框 */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="搜索帖子..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2.5 w-72 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                      />
                    </div>

                    {/* 全局设置按钮 */}
                    <HoverAnimation scale={1.02}>
                      <div className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all duration-200">
        
                      </div>
                    </HoverAnimation>

                    {/* 用户信息区域 */}
                    {state.user && (
                      <div className="flex items-center space-x-3">


                        {/* 用户头像 */}
                        <HoverAnimation scale={1.02}>
                          <div className="flex items-center space-x-3 px-3 py-2 rounded-xl">
                            <UserAvatar
                              user={{
                                ...state.user,
                                isOnline: true
                              }}
                              size="md"
                              clickable={true}
                              showStatus={true}
                              showRoleBadge={false}
                              onClick={() => router.push(`/profile/${state.user?.id}`)}
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                              {state.user?.gameNickname || '用户'}
                            </span>
                          </div>
                        </HoverAnimation>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </header>
          </AnimatedWrapper>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* 左侧筛选栏 */}
              <div className="lg:col-span-1">
                <AnimatedWrapper animation="slideIn" delay={0.2}>
                  {/* 统一筛选卡片 */}
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                      筛选条件
                    </h3>
                    
                    {/* 分类筛选 */}
                    <div className="mb-8">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        分类
                      </h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => setSelectedCategory('all')}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                            selectedCategory === 'all'
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          全部分类
                        </button>
                        {categories.map((category) => (
                          <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                              selectedCategory === category.id
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{category.name}</span>
                              <span className="text-xs text-gray-500">{category.postCount}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 帖子类型筛选 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        类型
                      </h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => setSelectedType('all')}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                            selectedType === 'all'
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>全部类型</span>
                        </button>
                        {Object.values(PostType).map((type) => (
                          <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                              selectedType === type
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {getTypeIcon(type)}
                            <span>{getTypeLabel(type)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </AnimatedWrapper>
              </div>

          {/* 主内容区 */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >

              
              {/* 活动中心区域 */}
              <IntegratedActivitySection />
              
              {/* 所有帖子列表 */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    所有帖子 ({posts.length})
                  </h3>
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => window.location.reload()}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                    >
                      刷新
                    </button>
                    <HoverAnimation scale={1.05}>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCreatePost}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        <span>发帖</span>
                      </motion.button>
                    </HoverAnimation>
                  </div>
                </div>
                
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 animate-pulse">
                        <div className="flex items-start space-x-3">
                          <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                            <div className="flex space-x-4 mt-2">
                              <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                              <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                              <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      暂无帖子
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      还没有人发布帖子，成为第一个发帖的人吧！
                    </p>
                    <HoverAnimation scale={1.05}>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCreatePost}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-lg font-medium"
                      >
                        发布第一个帖子
                      </motion.button>
                    </HoverAnimation>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post, index) => (
                      <AnimatedWrapper
                        key={post.id}
                        animation="fadeIn"
                        delay={index * 0.05}
                      >
                        <PostCard post={post} />
                      </AnimatedWrapper>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* 右侧用户信息和消息栏 */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* 用户主页缩略信息 */}
              <UserProfileSummary />

              {/* 站内信区域 */}
              <MessageSection />
            </motion.div>
          </div>
        </div>
      </div>

        {/* 创建帖子模态框 */}
        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onPostCreated={handlePostCreated}
          categories={categories}
        />
        
        </div>
      </div>
    </PageTransition>
  );
}