'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Minus,
  Save,
  ArrowLeft,
  X,
  Heart,
  Sword,
  Shield,
  Zap,
  Target,
  Wind,
  Copy,
  CheckCircle,
  Info,
  Eye,
  EyeOff,
  Monitor,
  Smartphone
} from 'lucide-react';
import { YamlPreview } from './components/YamlPreview';
import { Template, PokemonInfo } from './utils/yamlGenerator';
import AbilitySelector from '@/components/AbilitySelector';
import { ExtendedAbilityData } from '@/utils/abilityDataProcessor';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getRecommendedTemplateName } from '@/services/templateService';
import {
  calculateAllStats,
  createDefaultIVs,
  createDefaultEVs,
  validateIV,
  validateEV,
  validateEVTotal,
  getEVTotal,
  getNatureModifierText,
  getNatureModifierColor,
  natureModifiers,
  type NatureModifier
} from '@/utils/pokemonStatsCalculator';
import {
  parseSnowflakeId,
  formatSnowflakeIdDisplay,
  getSnowflakeIdDescription,
  copyToClipboard,
  type SnowflakeIdInfo
} from '@/utils/snowflakeUtils';
import { getPokemonTypes, getTypeColor } from '@/utils/pokemonTypeUtils';

// 注册GSAP插件
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// 防抖函数
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface Pokemon {
  id: number;
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
  id: number;
  name: string;
  names: {
    chinese: string;
    english: string;
    japanese: string;
  };
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  description: string;
}

interface Item {
  id: string;
  name: string;
  category: string;
}

interface Nature {
  id: number;
  name: string;
  stats: {
    HP: number;
    Attack: number;
    Defense: number;
    Sp_Attack: number;
    Sp_Defense: number;
    Speed: number;
  };
  increased: string | null;
  decreased: string | null;
  isNeutral: boolean;
}

// 转换函数：将Pokemon类型转换为PokemonInfo类型
function convertPokemonToPokemonInfo(pokemon: Pokemon | null): PokemonInfo | undefined {
  if (!pokemon) return undefined;
  
  return {
    id: pokemon.id,
    name: pokemon.nameChinese, // 使用中文名称
    types: pokemon.types,
    baseStats: pokemon.baseStats
  };
}

export default function CreateTemplatePage() {
  const router = useRouter();
  const { user, state } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // 成功创建模板的状态
  const [createdTemplate, setCreatedTemplate] = useState<{
    id: string;
    name: string;
    traceId: string | null;
  } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    pokemonId: 0,
    isPublic: true, // 所有模板默认公开
    templateData: {
      level: 50,
      nature: '',
      ability: '',
      item: '',
      moves: ['', '', '', ''],
      types: {
        english: [] as string[],
        chinese: [] as string[]
      },
      evs: {
        hp: 0,
        attack: 0,
        defense: 0,
        specialAttack: 0,
        spDefense: 0,
        speed: 0
      },
      ivs: {
        hp: 31,
        attack: 31,
        defense: 31,
        specialAttack: 31,
        spDefense: 31,
        speed: 31
      }
    }
  });

  // 搜索和选择数据
  const [pokemonSearchQuery, setPokemonSearchQuery] = useState('');
  const [pokemonSearchResults, setPokemonSearchResults] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  const [movesList, setMovesList] = useState<Move[]>([]);
  const [itemsList, setItemsList] = useState<Item[]>([]);
  const [naturesList, setNaturesList] = useState<Nature[]>([]);
  
  // 特性相关状态
  const [selectedAbility, setSelectedAbility] = useState<ExtendedAbilityData | null>(null);
  
  // 调试信息面板状态
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  // 移动端视图控制
  const [mobileView, setMobileView] = useState<'form' | 'preview'>('form');
  const [isMobile, setIsMobile] = useState(false);

  // 检测屏幕尺寸
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 获取静态数据
  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const [movesRes, itemsRes, naturesRes] = await Promise.all([
          fetch('/api/static-data/moves'),
          fetch('/api/static-data/items/custom'),
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



  // 防抖搜索宝可梦
  const debouncedSearchPokemon = useCallback(
    debounce(async (searchTerm: string) => {
      console.log('🔍 开始搜索宝可梦:', searchTerm);
      
      if (!searchTerm.trim()) {
        console.log('🔍 搜索词为空，清空结果');
        setPokemonSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const url = `/api/pokemon/search?q=${encodeURIComponent(searchTerm)}`;
        console.log('🔍 请求URL:', url);
        
        const response = await fetch(url);
        console.log('🔍 响应状态:', response.status, response.ok);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 响应数据:', data);
          console.log('🔍 宝可梦数量:', data.data?.length || 0);
          
          setPokemonSearchResults(data.data || []);
        } else {
          console.error('🔍 搜索失败，状态码:', response.status);
        }
      } catch (error) {
        console.error('🔍 搜索宝可梦失败:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  // 选择宝可梦
  const selectPokemon = async (pokemon: Pokemon) => {
    setSelectedPokemon(pokemon);
    
    // 重置特性选择
    setSelectedAbility(null);
    
    // 获取宝可梦类型信息
    try {
      const typeInfo = await getPokemonTypes(pokemon.id);
      
      setFormData(prev => ({
        ...prev,
        templateData: {
          ...prev.templateData,
          ability: '',
          types: {
            english: typeInfo.englishTypes,
            chinese: typeInfo.chineseTypes
          }
        }
      }));
    } catch (error) {
      console.error('获取宝可梦类型失败:', error);
      // 如果获取类型失败，使用宝可梦对象中的类型信息
      setFormData(prev => ({
        ...prev,
        templateData: {
          ...prev.templateData,
          ability: '',
          types: {
            english: pokemon.types,
            chinese: pokemon.types // 临时使用英文类型，后续可以优化
          }
        }
      }));
    }
    
    // 自动生成推荐的模板名称
    if (user) {
      try {
        const recommendedName = await getRecommendedTemplateName(pokemon.nameChinese, user.id);
        setFormData(prev => ({
          ...prev,
          pokemonId: pokemon.id,
          name: recommendedName
        }));
      } catch (error) {
        console.error('生成推荐名称失败:', error);
        // 如果获取推荐名称失败，使用默认格式
        setFormData(prev => ({
          ...prev,
          pokemonId: pokemon.id,
          name: `${pokemon.nameChinese}伤害计算模板`
        }));
      }
    }
    
    setPokemonSearchQuery('');
    setPokemonSearchResults([]);
  };

  // 选择特性
  const selectAbility = (ability: ExtendedAbilityData) => {
    setSelectedAbility(ability);
    setFormData(prev => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        ability: ability.name
      }
    }));
  };

  // 更新表单数据
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateTemplateData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        [field]: value
      }
    }));
  };

  // 属性名映射函数
  const mapStatKey = (key: string): string => {
    const mapping: Record<string, string> = {
      'HP': 'hp',
      'Attack': 'attack',
      'Defense': 'defense',
      'Sp. Attack': 'specialAttack',
      'Sp. Defense': 'spDefense',
      'Speed': 'speed'
    };
    return mapping[key] || key;
  };

  const updateEV = (stat: string, value: number) => {
    const validatedValue = validateEV(value);
    const mappedStat = mapStatKey(stat);
    const newEvs = { ...formData.templateData.evs, [mappedStat]: validatedValue };
    
    // 只有在总EV不超过510时才更新
    if (validateEVTotal(newEvs)) {
      setFormData(prev => ({
        ...prev,
        templateData: {
          ...prev.templateData,
          evs: newEvs
        }
      }));
    }
  };

  const updateIV = (stat: string, value: number) => {
    const validatedValue = validateIV(value);
    const mappedStat = mapStatKey(stat);
    setFormData(prev => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        ivs: {
          ...prev.templateData.ivs,
          [mappedStat]: validatedValue
        }
      }
    }));
  };

  // 快捷按钮功能
  const setAllIVs = (value: number) => {
    setFormData(prev => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        ivs: {
          hp: value,
          attack: value,
          defense: value,
          specialAttack: value,
          spDefense: value,
          speed: value
        }
      }
    }));
  };

  const resetEVs = () => {
    setFormData(prev => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        evs: createDefaultEVs()
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
      alert('请选择宝可梦，系统将自动生成模板名称');
      return;
    }

    setLoading(true);
    try {
      // 获取token，优先使用state.token，如果没有则从localStorage获取
      const token = state.token || localStorage.getItem('auth_token');
      
      if (!token) {
        alert('登录状态已过期，请重新登录');
        return;
      }

      // 将前端的嵌套数据结构转换为后端期望的扁平结构
      const templatePayload = {
        pokemonId: formData.pokemonId,
        name: formData.name,
        level: formData.templateData.level,
        nature: formData.templateData.nature,
        ability: formData.templateData.ability,
        item: formData.templateData.item,
        moves: formData.templateData.moves
          .map((moveName, index) => {
            if (!moveName) return null;
            
            // 根据招式名称查找招式信息
            const moveInfo = movesList.find(move => move.name === moveName);
            if (!moveInfo) return null;
            
            return {
              moveId: moveInfo.id,
              moveName: moveInfo.name,
              moveCategory: moveInfo.category,
              position: index + 1
            };
          })
          .filter(move => move !== null), // 过滤掉空的招式
        evs: formData.templateData.evs,
        ivs: formData.templateData.ivs,
        isPublic: formData.isPublic
      };

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templatePayload)
      });

      if (response.ok) {
        const data = await response.json();
        // 设置创建成功的模板信息
        setCreatedTemplate({
          id: data.data.id,
          name: data.data.name,
          traceId: data.data.traceId
        });
        setShowSuccessModal(true);
      } else if (response.status === 401) {
        // 401未授权错误，可能是token过期或无效
        alert('登录状态已过期，请重新登录');
        // 清除本地存储的认证信息
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        // 跳转到登录页面
        router.push('/auth/login');
      } else {
        const error = await response.json();
        alert(error.message || '创建模板失败');
      }
    } catch (error) {
      console.error('创建模板失败:', error);
      if (error instanceof Error) {
        alert(`创建模板失败: ${error.message}`);
      } else {
        alert('创建模板失败，请检查网络连接');
      }
    } finally {
      setLoading(false);
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
      <div className="min-h-screen p-6 lg:ml-24">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h1>
          <p className="text-gray-600 mb-6">您需要登录才能创建模板</p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 lg:ml-24">
      <div className="max-w-7xl mx-auto">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回模板列表
          </Link>
        </div>

        {/* 移动端视图切换按钮 */}
        {isMobile && (
          <div className="mb-4 flex bg-white rounded-lg p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setMobileView('form')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                mobileView === 'form'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Monitor className="w-4 h-4" />
              表单
            </button>
            <button
              type="button"
              onClick={() => setMobileView('preview')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                mobileView === 'preview'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="w-4 h-4" />
              预览
            </button>
          </div>
        )}

        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 左侧表单区域 */}
          <div className={`lg:col-span-2 ${isMobile && mobileView === 'preview' ? 'hidden' : 'block'}`}>
            <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">基本信息</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                模板名称（自动生成）
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                {formData.name || '请先选择宝可梦，系统将自动生成模板名称'}
              </div>
            </div>


          </div>

          {/* 宝可梦选择 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">选择宝可梦 *</h2>
            
            {selectedPokemon ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{selectedPokemon.nameChinese}</div>
                    <div className="text-sm text-gray-500">{selectedPokemon.nameEnglish}</div>
                    <div className="flex gap-1 mt-1">
                      {selectedPokemon.types.map((type) => (
                        <span
                          key={type}
                          className={`px-2 py-1 text-xs text-white rounded-full ${getTypeColor(type)}`}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPokemon(null);
                      setPokemonSearchQuery('');
                      setPokemonSearchResults([]);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    重新选择
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={pokemonSearchQuery}
                    onChange={(e) => {
                      setPokemonSearchQuery(e.target.value);
                      debouncedSearchPokemon(e.target.value);
                    }}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="搜索宝可梦名称..."
                  />
                </div>
                
                {pokemonSearchResults.length > 0 && (
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    {pokemonSearchResults.map((pokemon) => (
                      <div
                        key={pokemon.id}
                        onClick={() => selectPokemon(pokemon)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{pokemon.nameChinese}</div>
                            <div className="text-sm text-gray-500">{pokemon.nameEnglish}</div>
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
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {pokemonSearchQuery && pokemonSearchResults.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    未找到匹配的宝可梦
                  </div>
                )}
              </div>
            )}
          </div>



          {/* 宝可梦配置 */}
          {selectedPokemon && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">宝可梦配置</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">等级</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.templateData.level}
                    onChange={(e) => updateTemplateData('level', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">性格</label>
                  <select
                    value={formData.templateData.nature}
                    onChange={(e) => updateTemplateData('nature', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">选择性格</option>
                    {naturesList.map((nature) => (
                      <option key={nature.id} value={nature.name}>
                        {nature.name}
                        {!nature.isNeutral && nature.increased && nature.decreased && 
                          ` (+${nature.increased} -${nature.decreased})`
                        }
                      </option>
                    ))}
                  </select>
                </div>

                {/* 特性选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">特性</label>
                  {selectedPokemon ? (
                    <AbilitySelector
                      pokemonName={selectedPokemon.nameChinese}
                      selectedAbility={selectedAbility}
                      onAbilitySelect={selectAbility}
                    />
                  ) : (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                      请先选择宝可梦
                    </div>
                  )}
                </div>

                {/* 属性显示 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">属性</label>
                  {formData.templateData.types.chinese.length > 0 ? (
                    <div className="flex gap-2">
                      {formData.templateData.types.chinese.map((type, index) => (
                        <span
                          key={index}
                          className={`px-3 py-1 text-sm text-white rounded-full ${getTypeColor(type)}`}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                      请先选择宝可梦
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">道具</label>
                  <select
                    value={formData.templateData.item}
                    onChange={(e) => updateTemplateData('item', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">选择道具</option>
                    {itemsList.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 技能选择 */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">技能</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.templateData.moves.map((move, index) => (
                    <div key={index}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        技能 {index + 1}
                      </label>
                      <select
                        value={move}
                        onChange={(e) => updateMove(index, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">选择技能</option>
                        {movesList.map((moveItem) => (
                          <option key={moveItem.id} value={moveItem.name}>
                            {moveItem.name} ({moveItem.type}
                            {moveItem.power ? ` 威力:${moveItem.power}` : ''}
                            {moveItem.pp ? ` PP:${moveItem.pp}` : ''})
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* 努力值 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">努力值 (EV)</h3>
                  <div className="flex items-center space-x-4">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      总计: {getEVTotal(formData.templateData.evs)}/510
                      {getEVTotal(formData.templateData.evs) > 510 && (
                        <span className="text-red-500 ml-1">超出限制!</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={resetEVs}
                      className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      重置
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { key: 'HP', name: 'HP', icon: Heart, color: 'text-red-500' },
                    { key: 'Attack', name: '攻击', icon: Sword, color: 'text-orange-500' },
                    { key: 'Defense', name: '防御', icon: Shield, color: 'text-blue-500' },
                    { key: 'Sp. Attack', name: '特攻', icon: Zap, color: 'text-purple-500' },
                    { key: 'Sp. Defense', name: '特防', icon: Target, color: 'text-green-500' },
                    { key: 'Speed', name: '速度', icon: Wind, color: 'text-cyan-500' }
                  ].map(({ key, name, icon: Icon, color }) => {
                    const statKey = key.replace(/\s/g, '_') as keyof Omit<NatureModifier, 'name'>;
                    const natureModifier = getNatureModifierText(formData.templateData.nature, statKey);
                    const modifierColor = getNatureModifierColor(formData.templateData.nature, statKey);

                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Icon className={`w-3 h-3 ${color}`} />
                            <span className="text-xs text-gray-600 dark:text-gray-400">{name}</span>
                          </div>
                          {natureModifier && (
                            <span className={`text-xs font-semibold ${modifierColor}`}>
                              {natureModifier}
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          min="0"
                          max="252"
                          step="4"
                          value={formData.templateData.evs[mapStatKey(key) as keyof typeof formData.templateData.evs]}
                          onChange={(e) => updateEV(key, parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 个体值 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">个体值 (IV)</h3>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setAllIVs(31)}
                      className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-600 transition-colors"
                    >
                      全31
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllIVs(0)}
                      className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      全0
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { key: 'HP', name: 'HP', icon: Heart, color: 'text-red-500' },
                    { key: 'Attack', name: '攻击', icon: Sword, color: 'text-orange-500' },
                    { key: 'Defense', name: '防御', icon: Shield, color: 'text-blue-500' },
                    { key: 'Sp. Attack', name: '特攻', icon: Zap, color: 'text-purple-500' },
                    { key: 'Sp. Defense', name: '特防', icon: Target, color: 'text-green-500' },
                    { key: 'Speed', name: '速度', icon: Wind, color: 'text-cyan-500' }
                  ].map(({ key, name, icon: Icon, color }) => {
                    const statKey = key.replace(/\s/g, '_') as keyof Omit<NatureModifier, 'name'>;
                    const natureModifier = getNatureModifierText(formData.templateData.nature, statKey);
                    const modifierColor = getNatureModifierColor(formData.templateData.nature, statKey);

                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Icon className={`w-3 h-3 ${color}`} />
                            <span className="text-xs text-gray-600 dark:text-gray-400">{name}</span>
                          </div>
                          {natureModifier && (
                            <span className={`text-xs font-semibold ${modifierColor}`}>
                              {natureModifier}
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          min="0"
                          max="31"
                          value={formData.templateData.ivs[mapStatKey(key) as keyof typeof formData.templateData.ivs]}
                          onChange={(e) => updateIV(key, parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 能力值预览 */}
              {selectedPokemon && (
                <div className="mt-6 space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">能力值预览</h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {[
                        { key: 'hp', name: 'HP', icon: Heart, color: 'text-red-500', baseKey: 'HP' },
                        { key: 'attack', name: '攻击', icon: Sword, color: 'text-orange-500', baseKey: 'Attack' },
                        { key: 'defense', name: '防御', icon: Shield, color: 'text-blue-500', baseKey: 'Defense' },
                        { key: 'specialAttack', name: '特攻', icon: Zap, color: 'text-purple-500', baseKey: 'Sp. Attack' },
                        { key: 'spDefense', name: '特防', icon: Target, color: 'text-green-500', baseKey: 'Sp. Defense' },
                        { key: 'speed', name: '速度', icon: Wind, color: 'text-cyan-500', baseKey: 'Speed' }
                      ].map(({ key, name, icon: Icon, color, baseKey }) => {
                        const baseStat = selectedPokemon.baseStats[baseKey as keyof typeof selectedPokemon.baseStats] || 100;
                        
                        // 转换数据格式以匹配计算函数
                        const baseStats = {
                          hp: selectedPokemon.baseStats.HP || 100,
                          attack: selectedPokemon.baseStats.Attack || 100,
                          defense: selectedPokemon.baseStats.Defense || 100,
                          specialAttack: selectedPokemon.baseStats['Sp. Attack'] || 100,
                          spDefense: selectedPokemon.baseStats['Sp. Defense'] || 100,
                          speed: selectedPokemon.baseStats.Speed || 100
                        };

                        const ivs = {
                          hp: formData.templateData.ivs.hp,
                          attack: formData.templateData.ivs.attack,
                          defense: formData.templateData.ivs.defense,
                          specialAttack: formData.templateData.ivs.specialAttack,
                          spDefense: formData.templateData.ivs.spDefense,
                          speed: formData.templateData.ivs.speed
                        };

                        const evs = {
                          hp: formData.templateData.evs.hp,
                          attack: formData.templateData.evs.attack,
                          defense: formData.templateData.evs.defense,
                          specialAttack: formData.templateData.evs.specialAttack,
                          spDefense: formData.templateData.evs.spDefense,
                          speed: formData.templateData.evs.speed
                        };

                        const calculatedStats = calculateAllStats(
                          baseStats,
                          ivs,
                          evs,
                          formData.templateData.level,
                          formData.templateData.nature
                        );

                        const finalValue = calculatedStats[key as keyof typeof calculatedStats];

                        return (
                          <div key={key} className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              <Icon className={`w-3 h-3 ${color}`} />
                              <span className="text-gray-600 dark:text-gray-400">{name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-gray-500">({baseStat})</span>
                              <span className="font-semibold text-gray-900 dark:text-gray-100">{finalValue}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 调试信息面板 */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <button
                      type="button"
                      onClick={() => setShowDebugInfo(!showDebugInfo)}
                      className="w-full px-4 py-3 text-left flex items-center justify-between text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors rounded-lg"
                    >
                      <span className="text-sm font-medium">数值详情</span>
                      <motion.div
                        animate={{ rotate: showDebugInfo ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </motion.div>
                    </button>
                    
                    {showDebugInfo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="px-4 pb-4 space-y-4"
                      >
                        {/* 性格修正信息 */}
                        {formData.templateData.nature && (
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                            <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                              当前性格：{formData.templateData.nature}
                            </h5>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              <div className="mb-1">修正信息：</div>
                              <div className="grid grid-cols-2 gap-1">
                                {(() => {
                                  const modifier = natureModifiers[formData.templateData.nature];
                                  if (!modifier) return null;
                                  
                                  return [
                                    { key: 'HP', value: modifier.HP },
                                    { key: 'Attack', value: modifier.Attack },
                                    { key: 'Defense', value: modifier.Defense },
                                    { key: 'Sp_Attack', value: modifier.Sp_Attack },
                                    { key: 'Sp_Defense', value: modifier.Sp_Defense },
                                    { key: 'Speed', value: modifier.Speed }
                                  ].map(({ key, value }) => (
                                    <span 
                                      key={key} 
                                      className={`${
                                        value > 1.0 ? 'text-red-600 dark:text-red-400' : 
                                        value < 1.0 ? 'text-blue-600 dark:text-blue-400' : 
                                        'text-gray-600 dark:text-gray-400'
                                      }`}
                                    >
                                      {key}: {value.toFixed(1)}
                                    </span>
                                  ));
                                })()}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 计算调试信息 */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                          <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">计算详情</h5>
                          <div className="space-y-2 text-xs">
                            {/* 基础信息 */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-gray-500 dark:text-gray-400 mb-1">基础种族值：</div>
                                <div className="space-y-1">
                                  <div>HP: {selectedPokemon.baseStats.HP}</div>
                                  <div>攻击: {selectedPokemon.baseStats.Attack}</div>
                                  <div>防御: {selectedPokemon.baseStats.Defense}</div>
                                  <div>特攻: {selectedPokemon.baseStats['Sp. Attack']}</div>
                                  <div>特防: {selectedPokemon.baseStats['Sp. Defense']}</div>
                                  <div>速度: {selectedPokemon.baseStats.Speed}</div>
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-gray-500 dark:text-gray-400 mb-1">个体值 (IV)：</div>
                                <div className="space-y-1">
                                  <div>HP: {formData.templateData.ivs.hp}</div>
                                  <div>攻击: {formData.templateData.ivs.attack}</div>
                                  <div>防御: {formData.templateData.ivs.defense}</div>
                                  <div>特攻: {formData.templateData.ivs.specialAttack}</div>
                                  <div>特防: {formData.templateData.ivs.spDefense}</div>
                                  <div>速度: {formData.templateData.ivs.speed}</div>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-gray-500 dark:text-gray-400 mb-1">努力值 (EV)：</div>
                                <div className="space-y-1">
                                  <div>HP: {formData.templateData.evs.hp}</div>
                                  <div>攻击: {formData.templateData.evs.attack}</div>
                                  <div>防御: {formData.templateData.evs.defense}</div>
                                  <div>特攻: {formData.templateData.evs.specialAttack}</div>
                                  <div>特防: {formData.templateData.evs.spDefense}</div>
                                  <div>速度: {formData.templateData.evs.speed}</div>
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-gray-500 dark:text-gray-400 mb-1">其他信息：</div>
                                <div className="space-y-1">
                                  <div>等级: {formData.templateData.level}</div>
                                  <div>性格: {formData.templateData.nature || '未选择'}</div>
                                  <div>EV总计: {getEVTotal(formData.templateData.evs)}/510</div>
                                </div>
                              </div>
                            </div>

                            {/* 计算公式说明 */}
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                              <div className="text-gray-500 dark:text-gray-400 mb-1">计算公式：</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                <div>HP = ((种族值 × 2 + 个体值 + 努力值/4) × 等级/100) + 10 + 等级</div>
                                <div>其他 = (((种族值 × 2 + 个体值 + 努力值/4) × 等级/100) + 5) × 性格修正</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

              {/* 提交按钮 */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading || !selectedPokemon}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-5 h-5" />
                  {loading ? '创建中...' : '创建模板'}
                </button>
              </div>
            </form>
          </div>

          {/* 右侧YAML预览区域 */}
          <div className={`lg:col-span-3 ${isMobile && mobileView === 'form' ? 'hidden' : 'block'}`}>
            <YamlPreview
              template={{
                name: formData.name,
                pokemonId: formData.pokemonId,
                isPublic: formData.isPublic,
                templateData: formData.templateData
              }}
              pokemonInfo={convertPokemonToPokemonInfo(selectedPokemon)}
              abilityData={selectedAbility}
            />
          </div>
        </div>

        {/* 成功创建模板的模态框 */}
        {showSuccessModal && createdTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">模板创建成功！</h3>
                <p className="text-gray-600">
                  模板 "{createdTemplate.name}" 已成功创建
                </p>
              </div>

              {/* 雪花算法ID显示 */}
              {createdTemplate.traceId && (
                <SnowflakeIdDisplay traceId={createdTemplate.traceId} />
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push(`/templates/${createdTemplate.id}`);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  查看模板
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    // 重置表单
                    setFormData({
                      name: '',
                      pokemonId: 0,
                      isPublic: true,
                      templateData: {
                        level: 50,
                        nature: '',
                        ability: '',
                        item: '',
                        moves: ['', '', '', ''],
                        types: {
                          english: [] as string[],
                          chinese: [] as string[]
                        },
                        evs: {
                          hp: 0,
                          attack: 0,
                          defense: 0,
                          specialAttack: 0,
                          spDefense: 0,
                          speed: 0
                        },
                        ivs: {
                          hp: 31,
                          attack: 31,
                          defense: 31,
                          specialAttack: 31,
                          spDefense: 31,
                          speed: 31
                        }
                      }
                    });
                    setSelectedPokemon(null);
                    setCreatedTemplate(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  继续创建
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
}

// 雪花算法ID显示组件
function SnowflakeIdDisplay({ traceId }: { traceId: string }) {
  const [copied, setCopied] = useState(false);
  const idInfo = parseSnowflakeId(traceId);

  const handleCopy = async () => {
    const success = await copyToClipboard(traceId);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!idInfo) {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Info className="w-4 h-4" />
        追溯ID信息
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">追溯ID:</span>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-white px-2 py-1 rounded border font-mono">
              {formatSnowflakeIdDisplay(traceId)}
            </code>
            <button
              onClick={handleCopy}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              title="复制ID"
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        
        {idInfo.isValid && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">生成时间:</span>
              <span className="text-sm text-gray-900">{idInfo.generateTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">机器节点:</span>
              <span className="text-sm text-gray-900">{idInfo.datacenterId}-{idInfo.machineId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">序列号:</span>
              <span className="text-sm text-gray-900">{idInfo.sequence}</span>
            </div>
          </>
        )}
      </div>
      
      <p className="text-xs text-gray-500">
        {getSnowflakeIdDescription(idInfo)}
      </p>
    </div>
  );
}