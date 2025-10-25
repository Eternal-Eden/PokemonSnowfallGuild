'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Eye, 
  Calendar,
  User,
  Edit,
  Trash2,
  Share2,
  ArrowLeft,
  Copy,
  CheckCircle,
  Info,
  Clock,
  Server,
  Hash
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import TemplateTraceHistory from '@/components/TemplateTraceHistory';
import { 
  parseSnowflakeId, 
  formatSnowflakeIdDisplay, 
  getSnowflakeIdDescription, 
  copyToClipboard,
  SnowflakeIdInfo 
} from '@/utils/snowflakeUtils';

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
  traceId?: string;
  ivs?: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    spDefense: number;
    speed: number;
  };
  evs?: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    spDefense: number;
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
    nameEnglish: string;
    nameJapanese: string;
    types: any;
    baseStats: any;
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

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedTraceId, setCopiedTraceId] = useState(false);
  const [copiedTemplateId, setCopiedTemplateId] = useState(false);

  const templateId = params?.id as string;

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/templates/${templateId}`, {
        headers: {
          'Authorization': user?.token ? `Bearer ${user.token}` : ''
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplate(data.data);
      } else if (response.status === 404) {
        router.push('/templates');
      }
    } catch (error) {
      console.error('获取模板详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !template) return;

    try {
      const response = await fetch(`/api/templates/${template.id}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplate(prev => prev ? {
          ...prev,
          _count: {
            ...prev._count,
            favorites: data.data.favoriteCount || prev._count.favorites
          }
        } : null);
      }
    } catch (error) {
      console.error('切换收藏状态失败:', error);
    }
  };

  const deleteTemplate = async () => {
    if (!user || !template) return;

    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        router.push('/templates');
      }
    } catch (error) {
      console.error('删除模板失败:', error);
    }
  };

  const shareTemplate = async () => {
    if (!template) return;

    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      alert('链接已复制到剪贴板！');
    } catch (error) {
      console.error('复制链接失败:', error);
    }
  };

  const handleCopyTraceId = async (traceId: string) => {
    const success = await copyToClipboard(traceId);
    if (success) {
      setCopiedTraceId(true);
      setTimeout(() => setCopiedTraceId(false), 2000);
    }
  };

  const handleCopyTemplateId = async (templateId: string) => {
    const success = await copyToClipboard(templateId);
    if (success) {
      setCopiedTemplateId(true);
      setTimeout(() => setCopiedTemplateId(false), 2000);
    }
  };

  useEffect(() => {
    if (templateId) {
      fetchTemplate();
    }
  }, [templateId]);

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

  const isOwner = user && template.user && user.id === template.user.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
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

        {/* 模板详情 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* 标题和操作按钮 */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
            <div className="flex-1 mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{template.name}</h1>
              <p className="text-gray-600">等级 {template.level} • {template.nature} • {template.moves.length} 个技能</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={shareTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                分享
              </button>

              {user && (
                <button
                  onClick={toggleFavorite}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Heart className="w-4 h-4" />
                  收藏
                </button>
              )}

              {isOwner && (
                <>
                  <Link
                    href={`/templates/${template.id}/edit`}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    编辑
                  </Link>

                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 模板ID信息 */}
          <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Hash className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-lg text-gray-900">模板基本信息</h3>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">模板ID</span>
                </div>
                <div className="font-mono text-sm text-gray-900 bg-gray-50 px-2 py-1 rounded">
                  {template.id}
                </div>
              </div>
              <button
                onClick={() => handleCopyTemplateId(template.id)}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {copiedTemplateId ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    复制
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 追溯ID信息 */}
          {template.traceId && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-lg text-gray-900">模板追溯信息</h3>
              </div>
              
              <div className="space-y-3">
                {/* 追溯ID */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Server className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">追溯ID</span>
                    </div>
                    <div className="font-mono text-sm text-gray-900 bg-gray-50 px-2 py-1 rounded">
                      {formatSnowflakeIdDisplay(template.traceId)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyTraceId(template.traceId!)}
                    className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    {copiedTraceId ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        复制
                      </>
                    )}
                  </button>
                </div>

                {/* 雪花算法详细信息 */}
                {(() => {
                  const snowflakeInfo = parseSnowflakeId(template.traceId);
                  if (snowflakeInfo) {
                    return (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-3 bg-white rounded-lg border">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">生成时间</span>
                            </div>
                            <div className="text-sm text-gray-900">
                              {new Date(snowflakeInfo.timestamp).toLocaleString('zh-CN')}
                            </div>
                          </div>
                          
                          <div className="p-3 bg-white rounded-lg border">
                            <div className="flex items-center gap-2 mb-1">
                              <Server className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">机器节点</span>
                            </div>
                            <div className="text-sm text-gray-900">
                              节点 {snowflakeInfo.machineId}
                            </div>
                          </div>
                          
                          <div className="p-3 bg-white rounded-lg border">
                            <div className="flex items-center gap-2 mb-1">
                              <Info className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">序列号</span>
                            </div>
                            <div className="text-sm text-gray-900">
                              #{snowflakeInfo.sequence}
                            </div>
                          </div>
                        </div>

                        {/* 描述信息 */}
                        <div className="text-xs text-gray-600 bg-white p-2 rounded border mt-3">
                          {getSnowflakeIdDescription(snowflakeInfo)}
                        </div>
                      </>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          )}

          {/* 宝可梦信息 */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-gray-900 mb-2">宝可梦信息</h3>
            <div className="flex items-center gap-4">
              <div>
                <div className="font-medium text-gray-700">{template.pokemon.nameChinese}</div>
                <div className="flex gap-1 mt-1">
                  {(Array.isArray(template.pokemon.types) ? template.pokemon.types : []).map((type: string) => (
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

          {/* 模板配置 */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">模板配置</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-6">
              {/* 基础信息 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm text-gray-500">等级</span>
                  <div className="font-medium">{template.level}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">性格</span>
                  <div className="font-medium">{template.nature}</div>
                </div>
                {template.ability && (
                  <div>
                    <span className="text-sm text-gray-500">特性</span>
                    <div className="font-medium">{template.ability}</div>
                  </div>
                )}
                {template.item && (
                  <div>
                    <span className="text-sm text-gray-500">道具</span>
                    <div className="font-medium">{template.item}</div>
                  </div>
                )}
              </div>

              {/* 个体值 (IVs) */}
              {template.ivs && (
                <div>
                  <span className="text-sm text-gray-500 block mb-3">个体值 (IVs)</span>
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">HP</div>
                        <div className="font-bold text-lg text-red-600">{template.ivs.hp}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">攻击</div>
                        <div className="font-bold text-lg text-orange-600">{template.ivs.attack}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">防御</div>
                        <div className="font-bold text-lg text-yellow-600">{template.ivs.defense}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">特攻</div>
                        <div className="font-bold text-lg text-blue-600">{template.ivs.specialAttack}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">特防</div>
                        <div className="font-bold text-lg text-green-600">{template.ivs.spDefense}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">速度</div>
                        <div className="font-bold text-lg text-purple-600">{template.ivs.speed}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 努力值 (EVs) */}
              {template.evs && (
                <div>
                  <span className="text-sm text-gray-500 block mb-3">努力值 (EVs)</span>
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">HP</div>
                        <div className="font-bold text-lg text-red-600">{template.evs.hp}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">攻击</div>
                        <div className="font-bold text-lg text-orange-600">{template.evs.attack}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">防御</div>
                        <div className="font-bold text-lg text-yellow-600">{template.evs.defense}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">特攻</div>
                        <div className="font-bold text-lg text-blue-600">{template.evs.specialAttack}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">特防</div>
                        <div className="font-bold text-lg text-green-600">{template.evs.spDefense}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">速度</div>
                        <div className="font-bold text-lg text-purple-600">{template.evs.speed}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-center">
                      <span className="text-xs text-gray-500">
                        总计: {Object.values(template.evs).reduce((sum, val) => sum + val, 0)} / 510
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 实际属性值计算 */}
              {template.ivs && template.evs && template.pokemon.baseStats && (
                <div>
                  <span className="text-sm text-gray-500 block mb-3">实际属性值</span>
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">HP</div>
                        <div className="font-bold text-lg text-red-600">
                          {Math.floor(((template.pokemon.baseStats.HP * 2 + template.ivs.hp + Math.floor(template.evs.hp / 4)) * template.level) / 100) + template.level + 10}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">攻击</div>
                        <div className="font-bold text-lg text-orange-600">
                          {Math.floor((Math.floor(((template.pokemon.baseStats.Attack * 2 + template.ivs.attack + Math.floor(template.evs.attack / 4)) * template.level) / 100) + 5) * (template.nature === '固执' || template.nature === '开朗' || template.nature === '调皮' || template.nature === '勇敢' ? 1.1 : template.nature === '胆小' || template.nature === '保守' || template.nature === '冷静' || template.nature === '温和' ? 0.9 : 1))}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">防御</div>
                        <div className="font-bold text-lg text-yellow-600">
                          {Math.floor((Math.floor(((template.pokemon.baseStats.Defense * 2 + template.ivs.defense + Math.floor(template.evs.defense / 4)) * template.level) / 100) + 5) * (template.nature === '大胆' || template.nature === '悠闲' || template.nature === '淘气' || template.nature === '无虑' ? 1.1 : template.nature === '孤独' || template.nature === '温和' || template.nature === '急躁' || template.nature === '天真' ? 0.9 : 1))}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">特攻</div>
                        <div className="font-bold text-lg text-blue-600">
                          {Math.floor((Math.floor(((template.pokemon.baseStats['Sp. Attack'] * 2 + template.ivs.specialAttack + Math.floor(template.evs.specialAttack / 4)) * template.level) / 100) + 5) * (template.nature === '保守' || template.nature === '冷静' || template.nature === '马虎' || template.nature === '冷静' ? 1.1 : template.nature === '固执' || template.nature === '小心' || template.nature === '爽朗' || template.nature === '认真' ? 0.9 : 1))}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">特防</div>
                        <div className="font-bold text-lg text-green-600">
                          {Math.floor((Math.floor(((template.pokemon.baseStats['Sp. Defense'] * 2 + template.ivs.spDefense + Math.floor(template.evs.spDefense / 4)) * template.level) / 100) + 5) * (template.nature === '沉着' || template.nature === '温顺' || template.nature === '慎重' || template.nature === '自大' ? 1.1 : template.nature === '温和' || template.nature === '胆小' || template.nature === '急躁' || template.nature === '开朗' ? 0.9 : 1))}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">速度</div>
                        <div className="font-bold text-lg text-purple-600">
                          {Math.floor((Math.floor(((template.pokemon.baseStats.Speed * 2 + template.ivs.speed + Math.floor(template.evs.speed / 4)) * template.level) / 100) + 5) * (template.nature === '胆小' || template.nature === '爽朗' || template.nature === '天真' || template.nature === '急躁' ? 1.1 : template.nature === '勇敢' || template.nature === '悠闲' || template.nature === '冷静' || template.nature === '慎重' ? 0.9 : 1))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 技能 */}
              {template.moves.length > 0 && (
                <div>
                  <span className="text-sm text-gray-500 block mb-2">技能</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {template.moves.map((move) => (
                      <div key={move.id} className="bg-white rounded p-3 border">
                        <div className="font-medium">{move.moveName}</div>
                        <div className="text-sm text-gray-500">{move.moveCategory}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 统计信息 */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {template._count.favorites} 收藏
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {template.usageCount} 使用
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(template.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* 追溯历史 */}
          <TemplateTraceHistory 
            templateId={template.id} 
            className="mb-6" 
          />

          {/* 作者信息 */}
          {template.user && (
            <div className="border-t pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {template.user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{template.user.username}</div>
                  <div className="text-sm text-gray-500">模板作者</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 删除确认对话框 */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">确认删除</h3>
              <p className="text-gray-600 mb-6">
                确定要删除模板 "{template.name}" 吗？此操作无法撤销。
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={deleteTemplate}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}