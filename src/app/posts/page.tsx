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
  Loader2,
  Edit3,
  Grid,
  List
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PostType, ForumPost, ForumCategory } from '@/types/forum';
import PostCard from '@/components/forum/PostCard';
import CreatePostModal from '@/components/forum/CreatePostModal';
import UserAvatar from '@/components/UserAvatar';
import { AnimatedWrapper, PageTransition, HoverAnimation } from '@/components/animations/AnimationComponents';
import { useSettings } from '@/contexts/SettingsContext';
import { getForumPosts, getForumCategories } from '@/lib/forumService';
import { useRouter } from 'next/navigation';

export default function PostsPage() {
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
  const [viewMode, setViewMode] = useState<'waterfall' | 'list'>('waterfall');
  const [page, setPage] = useState(1);
  
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px'
  });

  // 初始加载数据
  useEffect(() => {
    loadForumData();
  }, [selectedCategory, selectedType, searchQuery]);

  // 监听无限滚动
  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore) {
      loadMorePosts();
    }
  }, [inView, hasMore, loading, loadingMore]);

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

  // 瀑布流布局组件
  const WaterfallLayout = ({ posts }: { posts: ForumPost[] }) => {
    const [columns, setColumns] = useState<ForumPost[][]>([[], [], []]);
    
    useEffect(() => {
      // 重新分配帖子到列中
      const newColumns: ForumPost[][] = [[], [], []];
      posts.forEach((post, index) => {
        const columnIndex = index % 3;
        newColumns[columnIndex].push(post);
      });
      setColumns(newColumns);
    }, [posts]);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {columns.map((columnPosts, columnIndex) => (
          <div key={columnIndex} className="space-y-4">
            {columnPosts.map((post, index) => (
              <AnimatedWrapper
                key={post.id}
                animation="fadeIn"
                delay={index * 0.1}
              >
                <PostCard post={post} compact />
              </AnimatedWrapper>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* 页面头部 */}
        <AnimatedWrapper animation="slideIn" delay={0}>
          <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* 主标题栏 */}
              <div className="flex items-center justify-between h-16">
                {/* 左侧：标题和统计 */}
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                      帖子广场
                    </h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>在线: 42</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <BarChart3 className="w-4 h-4" />
                        <span>今日: 15</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 右侧：操作按钮 */}
                <div className="flex items-center space-x-3">
                  {/* 视图切换 */}
                  <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('waterfall')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'waterfall'
                          ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'list'
                          ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 发帖按钮 */}
                  {state.user && (
                    <HoverAnimation scale={1.02}>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCreatePost}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm font-medium"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>发帖</span>
                      </motion.button>
                    </HoverAnimation>
                  )}

                  {/* 用户头像 */}
                  {state.user && (
                    <HoverAnimation scale={1.02}>
                      <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
                        <UserAvatar
                          user={{
                            ...state.user,
                            isOnline: true
                          }}
                          size="sm"
                          clickable={true}
                          onClick={() => router.push(`/profile/${state.user?.id}`)}
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                          {state.user?.gameNickname || '用户'}
                        </span>
                      </div>
                    </HoverAnimation>
                  )}
                </div>
              </div>

              {/* 搜索和筛选栏 */}
              <div className="flex items-center justify-between py-4 border-t border-gray-100 dark:border-gray-700">
                {/* 搜索框 */}
                <div className="flex items-center space-x-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="搜索帖子..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* 筛选选项 */}
                <div className="flex items-center space-x-3">
                  {/* 分类筛选 */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">全部分类</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>

                  {/* 类型筛选 */}
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as PostType | 'all')}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">全部类型</option>
                    {Object.values(PostType).map((type) => (
                      <option key={type} value={type}>
                        {getTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </header>
        </AnimatedWrapper>

        {/* 主内容区 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                暂无帖子
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                还没有人发布帖子，成为第一个发帖的人吧！
              </p>
              <HoverAnimation scale={1.05}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreatePost}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
                >
                  发布第一个帖子
                </motion.button>
              </HoverAnimation>
            </div>
          ) : (
            <>
              {/* 帖子列表 */}
              {viewMode === 'waterfall' ? (
                <WaterfallLayout posts={posts} />
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {posts.map((post, index) => (
                      <AnimatedWrapper
                        key={post.id}
                        animation="fadeIn"
                        delay={index * 0.05}
                      >
                        <PostCard post={post} />
                      </AnimatedWrapper>
                    ))}
                  </AnimatePresence>
                </div>
              )}
              
              {/* 无限滚动加载触发器 */}
              {hasMore && (
                <div ref={loadMoreRef} className="flex justify-center py-8">
                  {loadingMore ? (
                    <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>加载更多帖子...</span>
                    </div>
                  ) : (
                    <div className="text-gray-400 dark:text-gray-500 text-sm">
                      滚动加载更多
                    </div>
                  )}
                </div>
              )}
              
              {/* 没有更多内容提示 */}
              {!hasMore && posts.length > 0 && (
                <div className="flex justify-center py-8">
                  <div className="text-gray-400 dark:text-gray-500 text-sm">
                    已显示全部帖子
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 创建帖子模态框 */}
        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onPostCreated={handlePostCreated}
          categories={categories}
        />
      </div>
    </PageTransition>
  );
}