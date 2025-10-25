'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Minus,
  Save,
  ArrowLeft,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// 注册GSAP插件
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface Pokemon {
  id: number;
  name: string;
  nameChinese: string;
  nameEnglish: string;
  nameJapanese: string;
  types: string[];
  baseStats: {
    HP: number;
    Attack: number;
    Defense: number;
    'Sp. Attack': number;
    'Sp. Defense': number;
    Speed: number;
  };
}

interface Move {
  name: string;
  type: string;
  category: string;
  power: number;
  accuracy: number;
  pp: number;
  description: string;
}

interface Item {
  name: string;
  category: string;
  description: string;
}

interface Nature {
  name: string;
  increased_stat: string;
  decreased_stat: string;
}

interface EVs {
  HP: number;
  Attack: number;
  Defense: number;
  'Sp. Attack': number;
  'Sp. Defense': number;
  Speed: number;
}

interface IVs {
  HP: number;
  Attack: number;
  Defense: number;
  'Sp. Attack': number;
  'Sp. Defense': number;
  Speed: number;
}

interface TemplateData {
  level: number;
  nature: string;
  ability: string;
  item: string;
  teraType: string;
  moves: string[];
  evs: EVs;
  ivs: IVs;
}

interface FormData {
  name: string;
  description: string;
  pokemonId: number;
  pokemonName: string;
  pokemonTypes: string[];
  isPublic: boolean;
  templateData: TemplateData;
}

interface Template {
  id: string;
  name: string;
  description: string;
  pokemonId: number;
  pokemonName: string;
  pokemonTypes: string[];
  templateData: TemplateData;
  isPublic: boolean;
  author: {
    id: string;
    username: string;
  };
}

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<Template | null>(null);
  
  const templateId = params?.id as string;
  
  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pokemonId: 0,
    pokemonName: '',
    pokemonTypes: [] as string[],
    isPublic: true,
    templateData: {
      level: 50,
      nature: '',
      ability: '',
      item: '',
      teraType: '',
      moves: ['', '', '', ''],
      evs: {
        HP: 0,
        Attack: 0,
        Defense: 0,
        'Sp. Attack': 0,
        'Sp. Defense': 0,
        Speed: 0
      },
      ivs: {
        HP: 31,
        Attack: 31,
        Defense: 31,
        'Sp. Attack': 31,
        'Sp. Defense': 31,
        Speed: 31
      }
    }
  });

  // 搜索和选择数据
  const [pokemonSearch, setPokemonSearch] = useState('');
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [showPokemonSearch, setShowPokemonSearch] = useState(false);
  
  const [movesList, setMovesList] = useState<Move[]>([]);
  const [itemsList, setItemsList] = useState<Item[]>([]);
  const [naturesList, setNaturesList] = useState<Nature[]>([]);

  // 获取模板数据
  useEffect(() => {
    const fetchTemplate = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/templates/${templateId}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const templateData: Template = data.data;
          setTemplate(templateData);
          
          // 检查权限
          if (templateData.author.id !== user.id) {
            router.push('/templates');
            return;
          }

          setFormData({
            name: templateData.name,
            description: templateData.description,
            pokemonId: templateData.pokemonId,
            pokemonName: templateData.pokemonName,
            pokemonTypes: templateData.pokemonTypes,
            isPublic: templateData.isPublic,
            templateData: templateData.templateData
          });

          // 获取宝可梦信息
          const pokemonResponse = await fetch(`/api/pokemon/${templateData.pokemonId}`);
          if (pokemonResponse.ok) {
            const pokemonData = await pokemonResponse.json();
            setSelectedPokemon(pokemonData.data);
          }
        } else if (response.status === 404) {
          router.push('/templates');
        }
      } catch (error) {
        console.error('获取模板失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId, user, router]);

  // 获取静态数据
  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const [movesRes, itemsRes, naturesRes] = await Promise.all([
          fetch('/api/static-data/moves'),
          fetch('/api/static-data/items'),
          fetch('/api/static-data/natures')
        ]);

        if (movesRes.ok) {
          const movesData = await movesRes.json();
          setMovesList(movesData.data);
        }

        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          setItemsList(itemsData.data);
        }

        if (naturesRes.ok) {
          const naturesData = await naturesRes.json();
          setNaturesList(naturesData.data);
        }
      } catch (error) {
        console.error('获取静态数据失败:', error);
      }
    };

    fetchStaticData();
  }, []);

  // 搜索宝可梦
  const searchPokemon = async () => {
    if (!pokemonSearch.trim()) return;

    try {
      const response = await fetch(`/api/pokemon/search?q=${encodeURIComponent(pokemonSearch)}`);
      if (response.ok) {
        const data = await response.json();
        setPokemonList(data.data);
      }
    } catch (error) {
      console.error('搜索宝可梦失败:', error);
    }
  };

  // 选择宝可梦
  const selectPokemon = (pokemon: Pokemon) => {
    setSelectedPokemon(pokemon);
    setFormData((prev: FormData) => ({
      ...prev,
      pokemonId: pokemon.id,
      pokemonName: pokemon.name,
      pokemonTypes: pokemon.types
    }));
    setShowPokemonSearch(false);
    setPokemonSearch('');
    setPokemonList([]);
  };

  // 更新表单数据
  const updateFormData = (field: keyof FormData, value: string | number | boolean | string[] | TemplateData) => {
    setFormData((prev: FormData) => ({
      ...prev,
      [field]: value
    }));
  };

  const updateTemplateData = (field: keyof TemplateData, value: string | number | string[] | EVs | IVs) => {
    setFormData((prev: FormData) => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        [field]: value
      }
    }));
  };

  const updateEV = (stat: keyof EVs, value: number) => {
    setFormData((prev: FormData) => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        evs: {
          ...prev.templateData.evs,
          [stat]: Math.max(0, Math.min(252, value))
        }
      }
    }));
  };

  const updateIV = (stat: keyof IVs, value: number) => {
    setFormData((prev: FormData) => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        ivs: {
          ...prev.templateData.ivs,
          [stat]: Math.max(0, Math.min(31, value))
        }
      }
    }));
  };

  const updateMove = (index: number, move: string) => {
    const newMoves = [...formData.templateData.moves];
    newMoves[index] = move;
    updateTemplateData('moves', newMoves);
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name.trim() || !formData.pokemonId) {
      alert('请填写模板名称并选择宝可梦');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        router.push(`/templates/${templateId}`);
      } else {
        const error = await response.json();
        alert(error.message || '更新模板失败');
      }
    } catch (error) {
      console.error('更新模板失败:', error);
      alert('更新模板失败');
    } finally {
      setSaving(false);
    }
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h1>
          <p className="text-gray-600 mb-6">您需要登录才能编辑模板</p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            前往登录
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">模板不存在</h1>
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回模板列表
          </Link>
        </div>
      </div>
    );
  }

  // 检查是否为模板作者
  if (template.author.id !== user.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">无权限编辑</h1>
          <p className="text-gray-600 mb-6">您只能编辑自己创建的模板</p>
          <Link
            href={`/templates/${templateId}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回模板详情
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link
            href={`/templates/${templateId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回模板详情
          </Link>
        </div>

        {/* 编辑表单 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">编辑模板</h1>
            <p className="text-gray-600">修改您的宝可梦对战模板</p>
          </div>

          {/* 基本信息 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">基本信息</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模板名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入模板名称"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  公开设置
                </label>
                <select
                  value={formData.isPublic ? 'public' : 'private'}
                  onChange={(e) => updateFormData('isPublic', e.target.value === 'public')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="public">公开</option>
                  <option value="private">私有</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                模板描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="描述您的模板..."
              />
            </div>
          </div>

          {/* 宝可梦选择 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">宝可梦选择</h2>
            
            {formData.pokemonName ? (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-medium text-gray-900">{formData.pokemonName}</div>
                    <div className="flex gap-1 mt-1">
                      {(formData.pokemonTypes || []).map((type) => (
                        <span
                          key={type}
                          className={`px-2 py-1 text-xs text-white rounded-full ${getTypeColor(type)}`}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPokemonSearch(true)}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  更换宝可梦
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPokemonSearch(true)}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors text-gray-500 hover:text-blue-600"
              >
                点击选择宝可梦
              </button>
            )}
          </div>

          {/* 宝可梦配置 */}
          {formData.pokemonName && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">宝可梦配置</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 性格 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    性格
                  </label>
                  <select
                    value={formData.templateData.nature}
                    onChange={(e) => updateTemplateData('nature', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">选择性格</option>
                    {naturesList.map((nature) => (
                      <option key={nature.name} value={nature.name}>
                        {nature.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 特性 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    特性
                  </label>
                  <input
                    type="text"
                    value={formData.templateData.ability}
                    onChange={(e) => updateTemplateData('ability', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="输入特性名称"
                  />
                </div>

                {/* 道具 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    携带道具
                  </label>
                  <select
                    value={formData.templateData.item}
                    onChange={(e) => updateTemplateData('item', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">选择道具</option>
                    {itemsList.map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 等级 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    等级
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.templateData.level}
                    onChange={(e) => updateTemplateData('level', parseInt(e.target.value) || 50)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 太晶属性 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    太晶属性
                  </label>
                  <input
                    type="text"
                    value={formData.templateData.teraType}
                    onChange={(e) => updateTemplateData('teraType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="输入太晶属性"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 招式配置 */}
          {formData.pokemonName && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">招式配置</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.templateData.moves.map((move, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      招式 {index + 1}
                    </label>
                    <select
                      value={move}
                      onChange={(e) => {
                        const newMoves = [...formData.templateData.moves];
                        newMoves[index] = e.target.value;
                        updateTemplateData('moves', newMoves);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">选择招式</option>
                      {movesList.map((moveOption) => (
                        <option key={moveOption.name} value={moveOption.name}>
                          {moveOption.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EV配置 */}
          {formData.pokemonName && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">努力值 (EV)</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(formData.templateData.evs).map(([stat, value]) => (
                  <div key={stat}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {stat === 'hp' ? 'HP' : 
                       stat === 'attack' ? '攻击' :
                       stat === 'defense' ? '防御' :
                       stat === 'spAttack' ? '特攻' :
                       stat === 'spDefense' ? '特防' : '速度'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="252"
                      value={value}
                      onChange={(e) => updateEV(stat as keyof EVs, parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
              
              <div className="mt-2 text-sm text-gray-500">
                总计: {Object.values(formData.templateData.evs).reduce((sum: number, val: number) => sum + val, 0)} / 510
              </div>
            </div>
          )}

          {/* IV配置 */}
          {formData.pokemonName && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">个体值 (IV)</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(formData.templateData.ivs).map(([stat, value]) => (
                  <div key={stat}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {stat === 'hp' ? 'HP' : 
                       stat === 'attack' ? '攻击' :
                       stat === 'defense' ? '防御' :
                       stat === 'spAttack' ? '特攻' :
                       stat === 'spDefense' ? '特防' : '速度'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="31"
                      value={value}
                      onChange={(e) => updateIV(stat as keyof IVs, parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 提交按钮 */}
          <div className="flex gap-4 pt-6 border-t">
            <Link
              href={`/templates/${templateId}`}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={saving || !formData.name.trim() || !formData.pokemonId}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? '保存中...' : '保存模板'}
            </button>
          </div>
        </form>

        {/* 宝可梦搜索对话框 */}
        {showPokemonSearch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">选择宝可梦</h3>
                <button
                  onClick={() => {
                    setShowPokemonSearch(false);
                    setPokemonSearch('');
                    setPokemonList([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  value={pokemonSearch}
                  onChange={(e) => setPokemonSearch(e.target.value)}
                  placeholder="搜索宝可梦..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="max-h-64 overflow-y-auto">
                {pokemonList.length > 0 ? (
                  <div className="space-y-2">
                    {pokemonList.map((pokemon) => (
                      <button
                        key={pokemon.id}
                        onClick={() => selectPokemon(pokemon)}
                        className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="font-medium text-gray-900">{pokemon.name}</div>
                        <div className="flex gap-1 mt-1">
                          {pokemon.types.map((type) => (
                            <span
                              key={type}
                              className={`px-2 py-1 text-xs text-white rounded-full ${getTypeColor(type)}`}
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : pokemonSearch.trim() ? (
                  <div className="text-center text-gray-500 py-8">
                    没有找到相关宝可梦
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    输入宝可梦名称进行搜索
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}