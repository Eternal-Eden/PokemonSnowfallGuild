'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Heart, 
  Eye, 
  Calendar,
  User,
  Plus,
  ChevronLeft,
  ChevronRight,
  Copy,
  Hash
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// 注册GSAP插件
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface Template {
  id: string;
  name: string;
  level: number;
  nature: string;
  ability?: string;
  item?: string;
  abilityType?: string;
  abilityName?: string;
  templateType?: string;
  abilityData?: any;
  ivs?: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  evs?: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  pokemonId: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  pokemon: {
    id: number;
    nameChinese: string;
    types: any;
  };
  moves: Array<{
    id: string;
    moveId: number;
    moveName: string;
    moveCategory: string;
    position: number;
  }>;
  _count: {
    favorites: number;
  };
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function TemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [templateType, setTemplateType] = useState(''); // '', 'offensive', 'defensive'
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0
  });

  // GSAP refs
  const titleRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const templatesGridRef = useRef<HTMLDivElement>(null);
  const createButtonRef = useRef<HTMLDivElement>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      // 确保 pagination 对象存在且有有效的 page 属性
      const currentPage = pagination?.page || 1;
      const currentLimit = pagination?.limit || 12;
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: currentLimit.toString(),
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(showFavoritesOnly && { favoritesOnly: 'true' }),
        ...(templateType && { templateType })
      });

      const response = await fetch(`/api/templates?${params}`, {
        headers: {
          'Authorization': user?.token ? `Bearer ${user.token}` : ''
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data || []);
        setPagination(data.pagination || {
          total: 0,
          page: 1,
          limit: 12,
          totalPages: 0
        });
      }
    } catch (error) {
      console.error('获取模板失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (templateId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/templates/${templateId}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(prev => prev.map(template => 
          template.id === templateId 
            ? { 
                ...template, 
                _count: {
                  ...template._count,
                  favorites: data.data.favoriteCount || template._count?.favorites || 0
                }
              }
            : template
        ));
      }
    } catch (error) {
      console.error('切换收藏状态失败:', error);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // 这里可以添加一个toast通知
      console.log(`${type}已复制到剪贴板`);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  // 初始加载数据
  useEffect(() => {
    fetchTemplates();
  }, []);

  // 当分页或筛选条件变化时重新加载数据
  useEffect(() => {
    // 只有当 pagination 对象存在且不是初始加载时才执行 fetchTemplates
    if (pagination && pagination.page > 0) {
      fetchTemplates();
    }
  }, [pagination?.page, sortBy, sortOrder, searchTerm, showFavoritesOnly, templateType]);

  // GSAP动画效果
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tl = gsap.timeline();

    // 页面标题动画
    if (titleRef.current) {
      tl.fromTo(titleRef.current, 
        { opacity: 0, y: -50 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
      );
    }

    // 搜索栏动画
    if (searchBarRef.current) {
      tl.fromTo(searchBarRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        "-=0.4"
      );
    }

    // 创建按钮动画
    if (createButtonRef.current) {
      tl.fromTo(createButtonRef.current,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" },
        "-=0.3"
      );
    }

    return () => {
      tl.kill();
    };
  }, []);

  // 模板网格动画
  useEffect(() => {
    if (typeof window === 'undefined' || loading || !templatesGridRef.current) return;

    const cards = templatesGridRef.current.querySelectorAll('.template-card');
    
    gsap.fromTo(cards,
      { opacity: 0, y: 50, scale: 0.9 },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out"
      }
    );

    // 滚动触发动画
    ScrollTrigger.batch(cards, {
      onEnter: (elements) => {
        gsap.fromTo(elements,
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
        );
      },
      onLeave: (elements) => {
        gsap.to(elements, { opacity: 0.3, duration: 0.3 });
      },
      onEnterBack: (elements) => {
        gsap.to(elements, { opacity: 1, duration: 0.3 });
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [templates, loading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => prev ? ({ ...prev, page: 1 }) : { total: 0, page: 1, limit: 12, totalPages: 0 });
    fetchTemplates();
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Normal': 'bg-gray-400',
      'Fire': 'bg-red-500',
      'Water': 'bg-blue-500',
      'Electric': 'bg-yellow-400',
      'Grass': 'bg-green-500',
      'Ice': 'bg-blue-300',
      'Fighting': 'bg-red-700',
      'Poison': 'bg-purple-500',
      'Ground': 'bg-yellow-600',
      'Flying': 'bg-indigo-400',
      'Psychic': 'bg-pink-500',
      'Bug': 'bg-green-400',
      'Rock': 'bg-yellow-800',
      'Ghost': 'bg-purple-700',
      'Dragon': 'bg-indigo-700',
      'Dark': 'bg-gray-800',
      'Steel': 'bg-gray-500',
      'Fairy': 'bg-pink-300'
    };
    return colors[type] || 'bg-gray-400';
  };

  return (
    <div className="min-h-screen p-6 lg:ml-24">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div ref={titleRef} className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">宝可梦伤害计算模板仓库</h1>
          <p className="text-gray-600">发现、创建和分享宝可梦伤害计算模板</p>
        </div>

        {/* 搜索和筛选栏 */}
        <div ref={searchBarRef} className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜索模板名称、宝可梦名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt">创建时间</option>
              <option value="updatedAt">更新时间</option>
              <option value="favoriteCount">收藏数</option>
              <option value="viewCount">浏览数</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">降序</option>
              <option value="asc">升序</option>
            </select>

            <select
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部模板</option>
              <option value="offensive">进攻模板</option>
              <option value="defensive">防守模板</option>
            </select>

            {user && (
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={showFavoritesOnly}
                  onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-sm text-gray-700">仅显示收藏</span>
              </label>
            )}

            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              搜索
            </button>
          </form>
        </div>

        {/* 创建模板按钮 */}
        {user && (
          <div ref={createButtonRef} className="mb-6">
            <Link
              href="/templates/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              创建新模板
            </Link>
          </div>
        )}

        {/* 模板网格 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="flex gap-2 mb-4">
                  <div className="h-6 w-16 bg-gray-200 rounded"></div>
                  <div className="h-6 w-16 bg-gray-200 rounded"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">暂无模板</h3>
            <p className="text-gray-500">{searchTerm ? '没有找到匹配的模板' : '还没有人创建模板'}</p>
          </div>
        ) : (
          <div ref={templatesGridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="template-card bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                    {template.name}
                  </h3>
                  {user && (
                    <button
                      onClick={() => toggleFavorite(template.id)}
                      className="p-1 rounded-full transition-colors text-gray-400 hover:text-red-500"
                    >
                      <Heart className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* 模板ID显示 */}
                <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-md">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-600 font-mono flex-1 truncate">
                    ID: {template.id}
                  </span>
                  <button
                    onClick={() => copyToClipboard(template.id, '模板ID')}
                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                    title="复制模板ID"
                  >
                    <Copy className="w-3 h-3 text-gray-500" />
                  </button>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  等级 {template.level} • {template.nature} • {template.moves?.length || 0} 个技能
                </p>

                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    {template.pokemon?.nameChinese || '未知宝可梦'}
                  </div>
                  <div className="flex gap-1 flex-wrap mb-2">
                    {(Array.isArray(template.pokemon?.types) ? template.pokemon.types : []).map((type: string) => (
                      <span
                        key={type}
                        className={`px-2 py-1 text-xs text-white rounded-full ${getTypeColor(type)}`}
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                  
                  {/* 特性信息显示 */}
                  {template.abilityName && template.abilityType && (
                    <div className="flex items-center gap-2">
                      <span 
                        className={`px-2 py-1 text-xs text-white rounded-full ${
                          template.abilityType === 'offensive' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      >
                        {template.abilityType === 'offensive' ? '进攻' : '防守'}
                      </span>
                      <span className="text-xs text-gray-600 truncate">
                        {template.abilityName}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {template._count?.favorites || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {template.usageCount || 0}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <User className="w-4 h-4" />
                    <span>{template.user?.username || '未知用户'}</span>
                  </div>
                  <Link
                    href={`/templates/${template.id}`}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    查看详情
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => prev ? ({ ...prev, page: Math.max(1, prev.page - 1) }) : prev)}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                上一页
              </button>
              
              {Array.from({ length: Math.min(5, pagination.totalPages || 0) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setPagination(prev => prev ? ({ ...prev, page }) : prev)}
                    className={`px-4 py-2 border rounded-lg ${
                      pagination.page === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => setPagination(prev => prev ? ({ ...prev, page: Math.min(prev.totalPages || 0, prev.page + 1) }) : prev)}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}