'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MessageSquare,
  Zap,
  Send,
  Tag,
  Search,
  Star,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ForumPost, ForumCategory, PostType, CreatePostRequest } from '@/types/forum';
import { PokemonCard } from '@/types/auth';
import { createForumPost, getUserPokemonList } from '@/lib/forumService';
import RichTextEditor from './RichTextEditor';
import UserAvatar from '@/components/UserAvatar';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: ForumPost) => void;
  categories: ForumCategory[];
}

export default function CreatePostModal({
  isOpen,
  onClose,
  onPostCreated,
  categories
}: CreatePostModalProps) {
  const { state } = useAuth();
  const [postType, setPostType] = useState<PostType>(PostType.DISCUSSION);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // 精灵租借相关状态
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonCard | null>(null);
  const [rentalDuration, setRentalDuration] = useState(24); // 默认24小时
  const [rentalRequirements, setRentalRequirements] = useState('');
  const [userPokemon, setUserPokemon] = useState<PokemonCard[]>([]);
  const [pokemonSearch, setPokemonSearch] = useState('');
  const [showPokemonSelector, setShowPokemonSelector] = useState(false);

  useEffect(() => {
    if (isOpen && state.user) {
      loadUserPokemon();
    }
  }, [isOpen, state.user]);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const loadUserPokemon = async () => {
    if (!state.user) return;
    
    try {
      const pokemon = await getUserPokemonList(state.user.id);
      setUserPokemon(pokemon);
    } catch (error) {
      console.error('加载宝可梦列表失败:', error);
    }
  };

  const resetForm = () => {
    setPostType(PostType.DISCUSSION);
    setTitle('');
    setContent('');
    setSelectedCategory('');
    setTags([]);
    setTagInput('');
    setSelectedPokemon(null);
    setRentalDuration(24);
    setRentalRequirements('');
    setPokemonSearch('');
    setShowPokemonSelector(false);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = '请输入帖子标题';
    } else if (title.length < 5) {
      newErrors.title = '标题至少需要5个字符';
    } else if (title.length > 100) {
      newErrors.title = '标题不能超过100个字符';
    }
    
    if (!content.trim() || content.replace(/<[^>]*>/g, '').trim().length === 0) {
      newErrors.content = '请输入帖子内容';
    } else if (content.replace(/<[^>]*>/g, '').length < 10) {
      newErrors.content = '内容至少需要10个字符';
    }
    
    if (postType === PostType.POKEMON_RENTAL) {
      if (!selectedPokemon) {
        newErrors.pokemon = '请选择要租借的宝可梦';
      }
      if (rentalDuration < 1) {
        newErrors.duration = '租借时长至少为1小时';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!state.user || !validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const postData: CreatePostRequest = {
        title: title.trim(),
        content: content.trim(),
        type: postType,
        categoryId: selectedCategory || undefined,
        tags: tags.length > 0 ? tags : undefined
      };
      
      if (postType === PostType.POKEMON_RENTAL && selectedPokemon) {
        postData.rentalInfo = {
          pokemonId: selectedPokemon.id,
          pokemonName: selectedPokemon.name,
          pokemonSpecies: selectedPokemon.name, // 使用name作为species的替代
          pokemonLevel: selectedPokemon.level,
          pokemonImageUrl: selectedPokemon.imageUrl,
          pokemonType1: selectedPokemon.type1,
          pokemonType2: selectedPokemon.type2,
          isShiny: selectedPokemon.isShiny,
          rentalDuration,
          requirements: rentalRequirements.trim() || undefined
        };
      }
      
      const newPost = await createForumPost(state.user.id, state.user.username, state.user.role, postData);
      onPostCreated(newPost);
      onClose();
    } catch (error) {
      console.error('发帖失败:', error);
      setErrors({ submit: '发帖失败，请重试' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const filteredPokemon = userPokemon.filter(pokemon =>
    pokemon.name.toLowerCase().includes(pokemonSearch.toLowerCase())
  );

  const getDurationText = (hours: number) => {
    if (hours < 24) {
      return `${hours}小时`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days}天${remainingHours}小时` : `${days}天`;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 模态框头部 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  发布新帖
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  分享你的想法或发布精灵租借信息
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* 模态框内容 */}
          <div className="flex-1 p-6 overflow-y-auto min-h-0">
            <div className="space-y-6">
              {/* 用户信息 */}
              <div className="flex items-center space-x-3">
                <UserAvatar 
                  user={state.user!}
                  size="md"
                />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {state.user?.username}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date().toLocaleDateString('zh-CN')}
                  </div>
                </div>
              </div>

              {/* 帖子类型选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  帖子类型
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPostType(PostType.DISCUSSION)}
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                      postType === PostType.DISCUSSION
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">
                        交流帖
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        分享心得、讨论话题
                      </div>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setPostType(PostType.POKEMON_RENTAL)}
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                      postType === PostType.POKEMON_RENTAL
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">
                        精灵租借
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        出租你的宝可梦
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 分类选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  分类 (可选)
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">选择分类</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 标题输入 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  标题 *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="请输入帖子标题..."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  maxLength={100}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.title}</span>
                  </p>
                )}
                <div className="mt-1 text-xs text-gray-500 text-right">
                  {title.length}/100
                </div>
              </div>

              {/* 精灵选择 (仅租借帖显示) */}
              {postType === PostType.POKEMON_RENTAL && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    选择宝可梦 *
                  </label>
                  
                  {selectedPokemon ? (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {selectedPokemon.imageUrl && (
                            <img 
                              src={selectedPokemon.imageUrl} 
                              alt={selectedPokemon.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {selectedPokemon.name}
                              </h4>
                              {selectedPokemon.isShiny && (
                                <Star className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              等级 {selectedPokemon.level}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              {selectedPokemon.type1 && (
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
                                  {selectedPokemon.type1}
                                </span>
                              )}
                              {selectedPokemon.type2 && (
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs">
                                  {selectedPokemon.type2}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedPokemon(null)}
                          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowPokemonSelector(!showPokemonSelector)}
                        className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors text-gray-500 dark:text-gray-400"
                      >
                        点击选择宝可梦
                      </button>
                      
                      {showPokemonSelector && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden"
                        >
                          <div className="p-3 border-b border-gray-300 dark:border-gray-600">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                value={pokemonSearch}
                                onChange={(e) => setPokemonSearch(e.target.value)}
                                placeholder="搜索宝可梦..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>
                          <div className="max-h-64 overflow-y-auto">
                            {filteredPokemon.length === 0 ? (
                              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                没有找到宝可梦
                              </div>
                            ) : (
                              filteredPokemon.map((pokemon) => (
                                <button
                                  key={pokemon.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedPokemon(pokemon);
                                    setShowPokemonSelector(false);
                                  }}
                                  className="w-full p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300 text-left border-b border-gray-200/50 dark:border-gray-700/50 last:border-b-0 group rounded-lg mx-2 mb-2"
                                >
                                  <div className="flex items-center space-x-4">
                                    {pokemon.imageUrl && (
                                      <div className="relative">
                                        <div className="relative w-14 h-14 bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-500 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner border-2 border-white/50 dark:border-gray-500/50">
                                          {pokemon.isShiny && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-pink-400/20 to-purple-400/20 rounded-2xl animate-pulse"></div>
                                          )}
                                          {pokemon.isShiny && (
                                            <div className="absolute -top-1 -right-1 z-20">
                                              <div className="relative">
                                                <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                                                  <span className="text-white text-xs font-bold">✨</span>
                                                </div>
                                                <div className="absolute inset-0 animate-ping">
                                                  <div className="w-4 h-4 bg-yellow-300 rounded-full opacity-75"></div>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                          <img 
                                            src={pokemon.imageUrl} 
                                            alt={pokemon.name}
                                            className="w-full h-full object-cover transition-all duration-300 transform group-hover:scale-110"
                                          />
                                        </div>
                                        
                                        {/* 等级徽章 */}
                                        <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white dark:border-gray-800">
                                          Lv.{pokemon.level}
                                        </div>
                                      </div>
                                    )}
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                          {pokemon.name}
                                        </span>
                                      </div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                         {pokemon.nature && `${pokemon.nature}性格`}
                                       </div>
                                       {pokemon.ability && (
                                         <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                           特性: {pokemon.ability}
                                         </div>
                                       )}
                                    </div>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                  
                  {errors.pokemon && (
                    <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.pokemon}</span>
                    </p>
                  )}
                </div>
              )}

              {/* 租借时长和要求 (仅租借帖显示) */}
              {postType === PostType.POKEMON_RENTAL && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      租借时长 *
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
                    {errors.duration && (
                      <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.duration}</span>
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      租借要求 (可选)
                    </label>
                    <textarea
                      value={rentalRequirements}
                      onChange={(e) => setRentalRequirements(e.target.value)}
                      placeholder="例如：用于道馆挑战，需要会特定技能等..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      maxLength={200}
                    />
                    <div className="mt-1 text-xs text-gray-500 text-right">
                      {rentalRequirements.length}/200
                    </div>
                  </div>
                </div>
              )}

              {/* 内容编辑器 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  内容 *
                </label>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="请输入帖子内容，支持富文本格式..."
                  minHeight={200}
                  maxHeight={400}
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.content}</span>
                  </p>
                )}
              </div>

              {/* 标签输入 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  标签 (可选)
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
                        placeholder="输入标签后按回车添加"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        maxLength={20}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addTag}
                      disabled={!tagInput.trim() || tags.length >= 5}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      添加
                    </button>
                  </div>
                  
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                        >
                          <span>#{tag}</span>
                          <button
                            type="button"
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
                    最多可添加5个标签，每个标签最多20个字符
                  </p>
                </div>
              </div>

              {/* 错误信息 */}
              {errors.submit && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.submit}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 模态框底部 */}
          <div className="flex-shrink-0 flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              发帖后将会在论坛中公开显示
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                取消
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? '发布中...' : '发布帖子'}</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}