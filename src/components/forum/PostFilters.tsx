'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  MessageSquare,
  Zap,
  Calendar,
  TrendingUp,
  Heart,
  Eye,
  X,
  Tag
} from 'lucide-react';
import { PostType, ForumCategory, PostQueryParams } from '@/types/forum';

interface PostFiltersProps {
  categories: ForumCategory[];
  onFiltersChange: (filters: PostQueryParams) => void;
  totalPosts: number;
  isLoading?: boolean;
}

type SortOption = {
  value: 'created' | 'updated' | 'replies' | 'views' | 'likes';
  label: string;
  icon: React.ReactNode;
};

const sortOptions: SortOption[] = [
  {
    value: 'created',
    label: '最新发布',
    icon: <Calendar className="w-4 h-4" />
  },
  {
    value: 'updated',
    label: '最受欢迎',
    icon: <TrendingUp className="w-4 h-4" />
  },
  {
    value: 'likes',
    label: '最多点赞',
    icon: <Heart className="w-4 h-4" />
  },
  {
    value: 'views',
    label: '最多浏览',
    icon: <Eye className="w-4 h-4" />
  },
  {
    value: 'replies',
    label: '最多回复',
    icon: <MessageSquare className="w-4 h-4" />
  }
];

export default function PostFilters({
  categories,
  onFiltersChange,
  totalPosts,
  isLoading = false
}: PostFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<PostType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<'created' | 'updated' | 'replies' | 'views' | 'likes'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    updateFilters({ search: value });
  };

  const handleTypeChange = (type: PostType | 'all') => {
    setSelectedType(type);
    updateFilters({ type: type === 'all' ? undefined : type });
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    updateFilters({ categoryId: categoryId === 'all' ? undefined : categoryId });
  };

  const handleSortChange = (sort: 'created' | 'updated' | 'replies' | 'views' | 'likes') => {
    setSelectedSort(sort);
    // 映射前端sort值到后端字段名
    const sortByMapping = {
      'created': 'createdAt',
      'updated': 'updatedAt',
      'replies': 'replyCount',
      'views': 'viewCount',
      'likes': 'likeCount'
    } as const;
    updateFilters({ sortBy: sortByMapping[sort] });
  };

  const handleSortOrderChange = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    updateFilters({ sortOrder: newOrder });
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !selectedTags.includes(tag) && selectedTags.length < 5) {
      const newTags = [...selectedTags, tag];
      setSelectedTags(newTags);
      setTagInput('');
      updateFilters({ tags: newTags });
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(newTags);
    updateFilters({ tags: newTags.length > 0 ? newTags : undefined });
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const updateFilters = (newFilters: Partial<PostQueryParams>) => {
    // 映射前端sort值到后端字段名
    const sortByMapping = {
      'created': 'createdAt',
      'updated': 'updatedAt',
      'replies': 'replyCount',
      'views': 'viewCount',
      'likes': 'likeCount'
    } as const;
    
    const filters: PostQueryParams = {
      search: searchQuery,
      type: selectedType === 'all' ? undefined : selectedType,
      categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
      sortBy: sortByMapping[selectedSort],
      sortOrder,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      ...newFilters
    };
    
    onFiltersChange(filters);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedSort('created');
    setSortOrder('desc');
    setSelectedTags([]);
    setTagInput('');
    onFiltersChange({});
  };

  const hasActiveFilters = searchQuery || selectedType !== 'all' || selectedCategory !== 'all' || selectedTags.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* 主要筛选区域 */}
      <div className="space-y-4">
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="搜索帖子标题、内容或作者..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* 快速筛选按钮 */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 帖子类型 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleTypeChange('all')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                selectedType === 'all'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span>全部</span>
            </button>
            <button
              onClick={() => handleTypeChange(PostType.DISCUSSION)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                selectedType === PostType.DISCUSSION
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>交流帖</span>
            </button>
            <button
              onClick={() => handleTypeChange(PostType.POKEMON_RENTAL)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                selectedType === PostType.POKEMON_RENTAL
                  ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>精灵租借</span>
            </button>
          </div>

          {/* 分隔线 */}
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

          {/* 排序选项 */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedSort}
              onChange={(e) => handleSortChange(e.target.value as 'created' | 'updated' | 'replies' | 'views' | 'likes')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleSortOrderChange}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title={sortOrder === 'desc' ? '降序' : '升序'}
            >
              {sortOrder === 'desc' ? (
                <SortDesc className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <SortAsc className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>

          {/* 高级筛选按钮 */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              showAdvancedFilters
                ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>高级筛选</span>
          </button>

          {/* 清除筛选 */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center space-x-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              <span>清除筛选</span>
            </button>
          )}
        </div>

        {/* 高级筛选面板 */}
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4"
          >
            {/* 分类筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                分类筛选
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCategoryChange('all')}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  全部分类
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 标签筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                标签筛选
              </label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleTagInputKeyPress}
                      placeholder="输入标签名称"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      maxLength={20}
                    />
                  </div>
                  <button
                    onClick={addTag}
                    disabled={!tagInput.trim() || selectedTags.length >= 5}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    添加
                  </button>
                </div>
                
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                      >
                        <span>#{tag}</span>
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:text-blue-900 dark:hover:text-blue-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  最多可添加5个标签进行筛选
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* 结果统计 */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>
              {isLoading ? '加载中...' : `共找到 ${totalPosts} 个帖子`}
            </span>
            {hasActiveFilters && (
              <span className="text-blue-600 dark:text-blue-400">
                已应用筛选条件
              </span>
            )}
          </div>
          
          {/* 当前筛选条件摘要 */}
          {hasActiveFilters && (
            <div className="flex items-center space-x-2">
              {selectedType !== 'all' && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                  {selectedType === PostType.DISCUSSION ? '交流帖' : '精灵租借'}
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                  {categories.find(c => c.id === selectedCategory)?.name}
                </span>
              )}
              {selectedTags.length > 0 && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
                  {selectedTags.length}个标签
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}