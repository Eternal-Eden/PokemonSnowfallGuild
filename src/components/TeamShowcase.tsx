'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Zap,
  Shield,
  Sword,
  Heart,
  Target,
  Wind,
  Settings,
  Save,
  X,
  Copy,
  Share2,
  Download,
  User as UserIcon
} from 'lucide-react';
import { PokemonTeam, TeamPokemon, UserTeamShowcase, PokemonIVs, PokemonEVs, User } from '@/types/auth';
import { getChineseTypesSync, getPokemonImageUrl, getTypeColor } from '@/utils/pokemonClientUtils';
import PokemonSelector from './PokemonSelector';
import AbilitySelector from '@/components/AbilitySelector';
import MoveSelector from './MoveSelector';
import { useAuth } from '@/contexts/AuthContext';
import { PokemonIndexEntry, PokemonWithStats, AbilityData, MoveData, parsePokemonIndex, parseAbilities, parseMoves, parsePokemonWithStats, searchPokemonWithStats, getAbilitiesForPokemon } from '@/utils/pokemonDataParser';
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
  natureModifiers
} from '@/utils/pokemonStatsCalculator';

interface TeamShowcaseProps {
  teamShowcase: UserTeamShowcase | null;
  isOwnProfile: boolean;
  onUpdateTeamShowcase?: (showcase: UserTeamShowcase) => void;
}

interface TeamFormData {
  name: string;
  description: string;
  isPublic: boolean;
  tags: string[];
}

interface PokemonFormData {
  name: PokemonWithStats | null;
  level: number;
  nature: string;
  abilities: AbilityData[];
  moves: (MoveData | null)[];
  item: string;
  type1: string;
  type2: string;
  isShiny: boolean;
  gender: 'male' | 'female' | 'genderless';
  description: string;
  ivs: PokemonIVs;
  evs: PokemonEVs;
}

// 使用工具函数获取属性列表
const pokemonTypes = getChineseTypesSync();

// 从性格修正表获取性格列表
const pokemonNatures = Object.keys(natureModifiers);

const teamTags = [
  '钉攻', '平衡', '雨天', '晴天', '沙暴', '空间', '受队', '娱乐'
];

// getTypeColor 函数已从工具模块导入

// 配队宝可梦卡片组件
interface TeamPokemonCardProps {
  pokemon: TeamPokemon;
  onEdit?: () => void;
  onRemove?: () => void;
  isOwnProfile: boolean;
}

function TeamPokemonCard({ pokemon, onEdit, onRemove, isOwnProfile }: TeamPokemonCardProps) {
  const [imageUrl, setImageUrl] = useState<string>('/thumbnails/default.png');
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const url = await getPokemonImageUrl(pokemon.name);
        setImageUrl(url);
      } catch (error) {
        console.error('Failed to load pokemon image:', error);
      }
    };
    loadImage();
  }, [pokemon.name]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-750 dark:to-gray-700 rounded-2xl p-5 shadow-lg border border-gray-200/50 dark:border-gray-600/50 hover:shadow-xl hover:border-blue-300/50 dark:hover:border-blue-500/50 transition-all duration-300 relative group backdrop-blur-sm"
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      {/* 闪光效果 */}
      {pokemon.isShiny && (
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-pink-400/20 to-purple-400/20 rounded-2xl animate-pulse"></div>
      )}

      {isOwnProfile && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 flex space-x-2 z-20">
          {onEdit && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onEdit}
              className="p-2 bg-blue-500/90 backdrop-blur-sm text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
            >
              <Edit3 className="w-4 h-4" />
            </motion.button>
          )}
          {onRemove && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRemove}
              className="p-2 bg-red-500/90 backdrop-blur-sm text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      )}

      <div className="relative z-10">
        <div className="flex items-start space-x-4">
          {/* 宝可梦图片 */}
          <div className="relative">
            <div className="relative w-20 h-20 bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-500 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner border-2 border-white/50 dark:border-gray-500/50">
              {pokemon.isShiny && (
                <div className="absolute -top-2 -right-2 z-20">
                  <div className="relative">
                    <Star className="w-6 h-6 text-yellow-400 drop-shadow-lg" fill="currentColor" />
                    <div className="absolute inset-0 animate-ping">
                      <Star className="w-6 h-6 text-yellow-300 opacity-75" fill="currentColor" />
                    </div>
                  </div>
                </div>
              )}              <img src={imageUrl} alt={pokemon.name} className={`w-full h-full object-cover transition-all duration-500 transform group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`} onLoad={() => setImageLoaded(true)} onError={() => { setImageUrl('/thumbnails/default.png'); setImageLoaded(true); }} />              {!imageLoaded && (<div className="absolute inset-0 flex items-center justify-center">                  <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>                </div>)}            </div>

            {/* 等级徽章 */}
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white dark:border-gray-800">
              Lv.{pokemon.level}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate">
                {pokemon.name}
              </h4>
              {pokemon.gender === 'male' && (
                <span className="text-blue-500 text-lg font-bold">♂</span>
              )}
              {pokemon.gender === 'female' && (
                <span className="text-pink-500 text-lg font-bold">♀</span>
              )}
            </div>

            {/* 属性 */}
            <div className="flex flex-wrap gap-1 mb-3">
              <span className={`px-3 py-1 ${getTypeColor(pokemon.type1)} text-white text-xs font-semibold rounded-full shadow-sm`}>
                {pokemon.type1}
              </span>
              {pokemon.type2 && (
                <span className={`px-3 py-1 ${getTypeColor(pokemon.type2)} text-white text-xs font-semibold rounded-full shadow-sm`}>
                  {pokemon.type2}
                </span>
              )}
            </div>

            {/* 特性和性格 */}
            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
              {pokemon.ability && (
                <div className="flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  <span>特性: {pokemon.ability}</span>
                </div>
              )}
              {pokemon.nature && (
                <div className="flex items-center space-x-1">
                  <Heart className="w-3 h-3 text-pink-500" />
                  <span>性格: {pokemon.nature}</span>
                </div>
              )}
              {pokemon.item && (
                <div className="flex items-center space-x-1">
                  <Shield className="w-3 h-3 text-blue-500" />
                  <span>道具: {pokemon.item}</span>
                </div>
              )}
            </div>

            {/* 能力值显示 */}
            {pokemon.stats && pokemon.ivs && pokemon.evs && (
              <div className="mt-3 pt-2 border-t border-gray-200/50 dark:border-gray-600/50">
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">能力值</div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {[
                    { key: 'hp', name: 'HP', icon: Heart, color: 'text-red-500' },
                    { key: 'attack', name: '攻击', icon: Sword, color: 'text-orange-500' },
                    { key: 'defense', name: '防御', icon: Shield, color: 'text-blue-500' },
                    { key: 'specialAttack', name: '特攻', icon: Zap, color: 'text-purple-500' },
                    { key: 'spDefense', name: '特防', icon: Target, color: 'text-green-500' },
                    { key: 'speed', name: '速度', icon: Wind, color: 'text-cyan-500' }
                  ].map(({ key, name, icon: Icon, color }) => {
                    const baseStat = pokemon.stats![key as keyof typeof pokemon.stats];
                    const calculatedStats = calculateAllStats(
                      pokemon.stats!,
                      pokemon.ivs!,
                      pokemon.evs!,
                      pokemon.level,
                      pokemon.nature || '勤奋'
                    );
                    const finalStat = calculatedStats[key as keyof typeof calculatedStats];

                    return (
                      <div key={key} className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Icon className={`w-3 h-3 ${color}`} />
                          <span className="text-gray-600 dark:text-gray-400">{name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-gray-500">({baseStat})</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{finalStat}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 技能 */}
        {pokemon.moves.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200/50 dark:border-gray-600/50">
            <div className="flex items-center space-x-1 mb-2">
              <Sword className="w-3 h-3 text-orange-500" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">技能</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {pokemon.moves.map((move, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-lg font-medium shadow-sm border border-gray-200/50 dark:border-gray-500/50"
                >
                  {move}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

const getStatIcon = (statName: string) => {
  switch (statName) {
    case 'hp': return <Heart className="w-4 h-4" />;
    case 'attack': return <Sword className="w-4 h-4" />;
    case 'defense': return <Shield className="w-4 h-4" />;
    case 'specialAttack': return <Zap className="w-4 h-4" />;
    case 'spDefense': return <Target className="w-4 h-4" />;
    case 'speed': return <Wind className="w-4 h-4" />;
    default: return <Star className="w-4 h-4" />;
  }
};

// 队伍分享卡片组件
interface TeamShareCardProps {
  team: PokemonTeam;
  user: User;
  onClose: () => void;
}

function TeamShareCard({ team, user, onClose }: TeamShareCardProps) {
  const shareCardRef = React.useRef<HTMLDivElement>(null);
  const [pokemonImages, setPokemonImages] = useState<{ [key: string]: string }>({});

  // 加载所有宝可梦图片
  useEffect(() => {
    const loadPokemonImages = async () => {
      const imagePromises = team.pokemons.map(async (pokemon) => {
        try {
          const url = await getPokemonImageUrl(pokemon.name);
          return { id: pokemon.id, url };
        } catch (error) {
          console.error(`Failed to load image for ${pokemon.name}:`, error);
          return { id: pokemon.id, url: '/thumbnails/default.png' };
        }
      });
      
      const results = await Promise.all(imagePromises);
      const imageMap: { [key: string]: string } = {};
      results.forEach(({ id, url }) => {
        imageMap[id] = url;
      });
      setPokemonImages(imageMap);
    };
    
    loadPokemonImages();
  }, [team.pokemons]);

  const handleDownload = async () => {
    if (!shareCardRef.current) return;

    try {
      // 动态导入html2canvas
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        width: shareCardRef.current.scrollWidth * 2,
        height: shareCardRef.current.scrollHeight * 2
      });

      const link = document.createElement('a');
      link.download = `${team.name}_队伍分享.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请重试');
    }
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/team/${team.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('分享链接已复制到剪贴板');
    }).catch(() => {
      alert('复制失败，请手动复制链接');
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 操作按钮 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            队伍分享卡片
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              <span>下载图片</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center space-x-1 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              <Copy className="w-4 h-4" />
              <span>复制链接</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 分享卡片内容 */}
        <div ref={shareCardRef} className="relative overflow-hidden"></div>
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200/30 to-purple-200/30 dark:from-blue-500/10 dark:to-purple-500/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-200/30 to-yellow-200/30 dark:from-pink-500/10 dark:to-yellow-500/10 rounded-full translate-y-24 -translate-x-24"></div>

        <div className="relative z-10 p-8">
          {/* 用户信息头部 */}
          <div className="flex items-center space-x-6 mb-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-1 shadow-xl">
                <div className="w-full h-full rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.gameNickname || user.username} className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    <UserIcon className="w-10 h-10 text-gray-400" />
                  )}
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <Star className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {user.gameNickname || user.username}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                训练师 ID: {user.uniqueId || user.id}
              </p>
              <div className="flex items-center space-x-2">
                <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-medium rounded-full shadow-sm">
                  队伍分享
                </div>
                <div className="px-3 py-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full shadow-sm border border-gray-200 dark:border-gray-600">
                  {new Date().toLocaleDateString('zh-CN')}
                </div>
              </div>
            </div>
          </div>

          {/* 队伍信息 */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50 dark:border-gray-700/50 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    {team.name}
                  </h3>
                  {team.isPublic ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium rounded-full border border-green-200 dark:border-green-700">
                      <Eye className="w-3 h-3" />
                      公开队伍
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700/30 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-full border border-gray-200 dark:border-gray-600">
                      <EyeOff className="w-3 h-3" />
                      私密队伍
                    </span>
                  )}
                </div>
                {team.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    {team.description}
                  </p>
                )}
              </div>
              <div className="text-right ml-4">
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl border border-blue-200 dark:border-blue-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {team.pokemons.length}/6 宝可梦
                  </span>
                </div>
              </div>
            </div>

            {/* 队伍标签 */}
            {team.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {team.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full border border-blue-200 dark:border-blue-700 shadow-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 宝可梦详细信息 */}
          <div className="space-y-4">
            {team.pokemons.map((pokemon, index) => {
              // 计算能力值
              const stats = pokemon.ivs && pokemon.evs && pokemon.stats ? calculateAllStats({ hp: pokemon.stats.hp || 0, attack: pokemon.stats.attack || 0, defense: pokemon.stats.defense || 0, specialAttack: pokemon.stats.specialAttack || 0, spDefense: pokemon.stats.spDefense || 0, speed: pokemon.stats.speed || 0 }, pokemon.ivs, pokemon.evs, pokemon.level, pokemon.nature || '勤奋') : null;

              return (
                <div key={pokemon.id} className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/60 dark:border-gray-700/60 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-start space-x-5">
                    {/* 宝可梦图片和编号 */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-700 dark:via-gray-600 dark:to-gray-500 flex items-center justify-center overflow-hidden shadow-lg border-2 border-white/50 dark:border-gray-600/50">
                          {pokemonImages[pokemon.id] ? (
                            <img
                              src={pokemonImages[pokemon.id]}
                              alt={pokemon.name}
                              className="w-20 h-20 object-contain drop-shadow-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-20 h-20 flex items-center justify-center text-gray-400 dark:text-gray-500">
                              <span className="text-xs">加载中...</span>
                            </div>
                          )}
                        </div>
                        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center text-white text-sm font-bold shadow-xl border-2 border-white dark:border-gray-800">
                          {index + 1}
                        </div>
                        {pokemon.isShiny && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center">
                            <Star className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 宝可梦基本信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent truncate">
                          {pokemon.name}
                        </h4>
                        <div className="flex items-center space-x-3 text-sm">
                          <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-bold shadow-md">
                            Lv.{pokemon.level}
                          </span>
                          {pokemon.gender && pokemon.gender !== 'genderless' && (
                            <span className={`text-lg font-bold ${pokemon.gender === 'male' ? 'text-blue-500' : 'text-pink-500'
                              }`}>
                              {pokemon.gender === 'male' ? '♂' : '♀'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 属性和性格 */}
                      <div className="flex items-center flex-wrap gap-2 mb-4">
                        <span
                          className="px-4 py-1.5 rounded-full text-sm font-bold text-white shadow-lg border border-white/30"
                          style={{ backgroundColor: getTypeColor(pokemon.type1) }}
                        >
                          {pokemon.type1}
                        </span>
                        {pokemon.type2 && (
                          <span
                            className="px-4 py-1.5 rounded-full text-sm font-bold text-white shadow-lg border border-white/30"
                            style={{ backgroundColor: getTypeColor(pokemon.type2) }}
                          >
                            {pokemon.type2}
                          </span>
                        )}
                        {pokemon.nature && (
                          <span className="px-4 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 text-purple-800 dark:text-purple-200 rounded-full text-sm font-bold border border-purple-200 dark:border-purple-700 shadow-md">
                            {pokemon.nature}
                          </span>
                        )}
                      </div>

                      {/* 特性和道具 */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
                        {pokemon.ability && (
                          <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-700">
                            <Zap className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                            <span className="text-yellow-800 dark:text-yellow-200 font-medium truncate">{pokemon.ability}</span>
                          </div>
                        )}
                        {pokemon.item && (
                          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600">
                            <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300 font-medium truncate">{pokemon.item}</span>
                          </div>
                        )}
                      </div>

                      {/* 能力值 */}
                      {stats && (
                        <div className="mb-4">
                          <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
                            <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                            <span>能力值</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="flex items-center justify-between bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 px-3 py-2 rounded-xl border border-red-200 dark:border-red-700 shadow-sm">
                              <div className="flex items-center space-x-1">
                                <Heart className="w-3 h-3 text-red-600 dark:text-red-400" />
                                <span className="text-red-700 dark:text-red-300 font-bold">HP</span>
                              </div>
                              <span className="font-bold text-red-800 dark:text-red-200">{stats.hp}</span>
                            </div>
                            <div className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 px-3 py-2 rounded-xl border border-orange-200 dark:border-orange-700 shadow-sm">
                              <div className="flex items-center space-x-1">
                                <Sword className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                                <span className="text-orange-700 dark:text-orange-300 font-bold">攻击</span>
                              </div>
                              <span className="font-bold text-orange-800 dark:text-orange-200">{stats.attack}</span>
                            </div>
                            <div className="flex items-center justify-between bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 px-3 py-2 rounded-xl border border-yellow-200 dark:border-yellow-700 shadow-sm">
                              <div className="flex items-center space-x-1">
                                <Shield className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                                <span className="text-yellow-700 dark:text-yellow-300 font-bold">防御</span>
                              </div>
                              <span className="font-bold text-yellow-800 dark:text-yellow-200">{stats.defense}</span>
                            </div>
                            <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-700 shadow-sm">
                              <div className="flex items-center space-x-1">
                                <Target className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                <span className="text-blue-700 dark:text-blue-300 font-bold">特攻</span>
                              </div>
                              <span className="font-bold text-blue-800 dark:text-blue-200">{stats.specialAttack}</span>
                            </div>
                            <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 px-3 py-2 rounded-xl border border-green-200 dark:border-green-700 shadow-sm">
                              <div className="flex items-center space-x-1">
                                <Shield className="w-3 h-3 text-green-600 dark:text-green-400" />
                                <span className="text-green-700 dark:text-green-300 font-bold">特防</span>
                              </div>
                              <span className="font-bold text-green-800 dark:text-green-200">{stats.spDefense}</span>
                            </div>
                            <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 px-3 py-2 rounded-xl border border-purple-200 dark:border-purple-700 shadow-sm">
                              <div className="flex items-center space-x-1">
                                <Wind className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                <span className="text-purple-700 dark:text-purple-300 font-bold">速度</span>
                              </div>
                              <span className="font-bold text-purple-800 dark:text-purple-200">{stats.speed}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 技能 */}
                      {pokemon.moves.length > 0 && (
                        <div>
                          <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
                            <div className="w-1 h-4 bg-gradient-to-b from-yellow-500 to-orange-500 rounded-full"></div>
                            <span>技能</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {pokemon.moves.slice(0, 4).map((move, moveIndex) => (
                              <div
                                key={moveIndex}
                                className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-800 dark:text-yellow-200 rounded-xl text-xs font-bold border border-yellow-200 dark:border-yellow-700 shadow-sm hover:shadow-md transition-shadow"
                              >
                                <Zap className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                                <span className="truncate">{move}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 水印 */}
          <div className="text-center mt-8 pt-6 border-t border-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                <Star className="w-4 h-4 text-white" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  PokemonSnowfallGuild
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
                <Heart className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function TeamShowcase({ teamShowcase, isOwnProfile, onUpdateTeamShowcase }: TeamShowcaseProps) {
  const { user } = useAuth();

  // UI状态
  const [selectedTeam, setSelectedTeam] = useState<PokemonTeam | null>(null);
  const [editingTeam, setEditingTeam] = useState<PokemonTeam | null>(null);
  const [shareTeam, setShareTeam] = useState<PokemonTeam | null>(null);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAddPokemon, setShowAddPokemon] = useState(false);
  const [editingPokemon, setEditingPokemon] = useState<TeamPokemon | null>(null);

  // 数据状态
  const [pokemonList, setPokemonList] = useState<PokemonWithStats[]>([]);
  const [abilities, setAbilities] = useState<AbilityData[]>([]);
  const [filteredAbilities, setFilteredAbilities] = useState<AbilityData[]>([]);
  const [moves, setMoves] = useState<MoveData[]>([]);

  const [teamForm, setTeamForm] = useState<TeamFormData>({
    name: '',
    description: '',
    isPublic: true,
    tags: []
  });

  const [pokemonForm, setPokemonForm] = useState<PokemonFormData>({
    name: null,
    level: 50,
    nature: '勤奋',
    abilities: [],
    moves: [null, null, null, null],
    item: '',
    type1: '普通',
    type2: '',
    isShiny: false,
    gender: 'genderless',
    description: '',
    ivs: createDefaultIVs(),
    evs: createDefaultEVs()
  });

  const teams = teamShowcase?.teams || [];

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const [pokemonData, abilityData, moveData] = await Promise.all([
          parsePokemonWithStats(),
          parseAbilities(),
          parseMoves()
        ]);
        setPokemonList(pokemonData);
        setAbilities(abilityData);
        setFilteredAbilities(abilityData);
        setMoves(moveData);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []);

  const handleCreateTeam = () => {
    if (!teamForm.name.trim()) return;

    const newTeam: PokemonTeam = {
      id: `team_${Date.now()}`,
      name: teamForm.name,
      description: teamForm.description,
      pokemons: [],
      isPublic: teamForm.isPublic,
      tags: teamForm.tags,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedShowcase: UserTeamShowcase = {
      ...teamShowcase!,
      teams: [...teams, newTeam],
      updatedAt: new Date()
    };

    onUpdateTeamShowcase?.(updatedShowcase);
    setShowCreateTeam(false);
    setTeamForm({ name: '', description: '', isPublic: true, tags: [] });
  };

  const handleDeleteTeam = (teamId: string) => {
    const updatedShowcase: UserTeamShowcase = {
      ...teamShowcase!,
      teams: teams.filter(team => team.id !== teamId),
      updatedAt: new Date()
    };

    onUpdateTeamShowcase?.(updatedShowcase);
    if (selectedTeam?.id === teamId) {
      setSelectedTeam(null);
    }
  };

  const handleAddPokemon = () => {
    if (!selectedTeam || selectedTeam.pokemons.length >= 6) return;
    if (!pokemonForm.name) return;

    // 从pokedex获取种族值
    const baseStats = pokemonForm.name.base ? {
      hp: pokemonForm.name.base.HP || 0,
      attack: pokemonForm.name.base.Attack || 0,
      defense: pokemonForm.name.base.Defense || 0,
      specialAttack: pokemonForm.name.base['Sp. Attack'] || 0,
      spDefense: pokemonForm.name.base['Sp. Defense'] || 0,
      speed: pokemonForm.name.base.Speed || 0
    } : {
      hp: 100, attack: 100, defense: 100, specialAttack: 100, spDefense: 100, speed: 100
    };

    const newPokemon: TeamPokemon = {
      id: `pokemon_${Date.now()}`,
      name: pokemonForm.name.chinese,
      level: pokemonForm.level,
      nature: pokemonForm.nature,
      ability: pokemonForm.abilities.map(ability => ability.name).join(', '),
      moves: pokemonForm.moves.filter(move => move !== null).map(move => move!.cname),
      item: pokemonForm.item,
      type1: pokemonForm.type1,
      type2: pokemonForm.type2 || undefined,
      isShiny: pokemonForm.isShiny,
      gender: pokemonForm.gender,
      position: selectedTeam.pokemons.length,
      description: pokemonForm.description,
      stats: baseStats,
      ivs: { ...pokemonForm.ivs },
      evs: { ...pokemonForm.evs }
    };

    const updatedTeam = {
      ...selectedTeam,
      pokemons: [...selectedTeam.pokemons, newPokemon],
      updatedAt: new Date()
    };

    const updatedShowcase: UserTeamShowcase = {
      ...teamShowcase!,
      teams: teams.map(team => team.id === selectedTeam.id ? updatedTeam : team),
      updatedAt: new Date()
    };

    onUpdateTeamShowcase?.(updatedShowcase);
    setSelectedTeam(updatedTeam);
    setShowAddPokemon(false);
    setPokemonForm({
      name: null,
      level: 50,
      nature: '勤奋',
      abilities: [],
      moves: [null, null, null, null],
      item: '',
      type1: '普通',
      type2: '',
      isShiny: false,
      gender: 'genderless',
      description: '',
      ivs: createDefaultIVs(),
      evs: createDefaultEVs()
    });
  };

  const handleRemovePokemon = (pokemonId: string) => {
    if (!selectedTeam) return;

    const updatedTeam = {
      ...selectedTeam,
      pokemons: selectedTeam.pokemons.filter(p => p.id !== pokemonId),
      updatedAt: new Date()
    };

    const updatedShowcase: UserTeamShowcase = {
      ...teamShowcase!,
      teams: teams.map(team => team.id === selectedTeam.id ? updatedTeam : team),
      updatedAt: new Date()
    };

    onUpdateTeamShowcase?.(updatedShowcase);
    setSelectedTeam(updatedTeam);
  };

  if (!teamShowcase) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">
          <Settings className="w-12 h-12 mx-auto mb-2" />
          <p>还没有配置队伍展示</p>
        </div>
        {isOwnProfile && (
          <button
            onClick={() => setShowCreateTeam(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            创建第一个队伍
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 队伍列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md transition-all"
            onClick={() => setSelectedTeam(team)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                  {team.name}
                </h3>
                {team.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {team.description}
                  </p>
                )}
              </div>

              <div className="flex space-x-1">
                {/* 分享按钮 - 所有用户都可以看到 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShareTeam(team);
                  }}
                  className="p-1 text-gray-400 hover:text-green-500 transition-colors"
                  title="分享队伍"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                {/* 编辑和删除按钮 - 只有队伍拥有者可以看到 */}
                {isOwnProfile && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTeam(team);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                      title="编辑队伍"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTeam(team.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="删除队伍"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 队伍标签 */}
            {team.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {team.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* 宝可梦预览 */}
            <div className="grid grid-cols-6 gap-1">
              {Array.from({ length: 6 }).map((_, index) => {
                const pokemon = team.pokemons[index];
                return (
                  <div
                    key={index}
                    className={`aspect-square rounded-lg border-2 border-dashed ${pokemon
                        ? 'border-gray-300 dark:border-gray-600 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                      } flex items-center justify-center`}
                  >
                    {pokemon ? (
                      <div className="text-center">
                        <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                          {pokemon.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Lv.{pokemon.level}
                        </div>
                      </div>
                    ) : (
                      <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* 队伍统计 */}
            <div className="mt-3 flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{team.pokemons.length}/6 宝可梦</span>
              {team.isPublic ? (
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  公开
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <EyeOff className="w-3 h-3" />
                  私密
                </span>
              )}
            </div>
          </motion.div>
        ))}

        {/* 添加队伍按钮 */}
        {isOwnProfile && teams.length < 6 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setShowCreateTeam(true)}
            className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-all"
          >
            <Plus className="w-8 h-8 mb-2" />
            <span className="font-medium">创建新队伍</span>
            <span className="text-sm">({teams.length}/6)</span>
          </motion.button>
        )}
      </div>

      {/* 队伍详情模态框 */}
      <AnimatePresence>
        {selectedTeam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedTeam(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 队伍详情头部 */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {selectedTeam.name}
                    </h2>
                    {selectedTeam.description && (
                      <p className="text-gray-600 dark:text-gray-400 mt-2">
                        {selectedTeam.description}
                      </p>
                    )}

                    {/* 标签 */}
                    {selectedTeam.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {selectedTeam.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {isOwnProfile && (
                      <button
                        onClick={() => setShowAddPokemon(true)}
                        disabled={selectedTeam.pokemons.length >= 6}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2 inline" />
                        添加宝可梦
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedTeam(null)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 宝可梦列表 */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTeam.pokemons.map((pokemon) => (
                    <TeamPokemonCard
                      key={pokemon.id}
                      pokemon={pokemon}
                      isOwnProfile={isOwnProfile}
                      onEdit={() => {
                        // 实现编辑功能
                        if (!isOwnProfile) return;
                        
                        // 设置编辑状态
                        setPokemonForm({
                          name: pokemon.name ? (typeof pokemon.name === 'string' ? { chinese: pokemon.name, id: 0, english: '', japanese: '', french: '', imageUrl: '' } as PokemonWithStats : pokemon.name) : null,
                          level: pokemon.level,
                          nature: pokemon.nature || '勤奋',
                          abilities: pokemon.ability ? [{ index: '001', name: pokemon.ability, name_jp: pokemon.ability, name_en: pokemon.ability, text: '', generation: '1' }] : [],
                          moves: pokemon.moves ? pokemon.moves.map(move => typeof move === 'string' ? { id: 0, name: move, cname: move, ename: move, jname: move, type: '', power: 0, accuracy: 0, pp: 0, description: '', category: '' } as MoveData : move) : [null, null, null, null],
                          description: pokemon.description || '',
                          isShiny: pokemon.isShiny || false,
                          item: pokemon.item || '',
                          type1: pokemon.type1 || '普通',
                          type2: pokemon.type2 || '',
                          gender: pokemon.gender || 'genderless',
                          ivs: createDefaultIVs(),
                          evs: createDefaultEVs()
                        });
                        
                        // 设置编辑模式
                        setEditingPokemon(pokemon);
                        setShowAddPokemon(true);
                      }}
                      onRemove={() => handleRemovePokemon(pokemon.id)}
                    />
                  ))}

                  {/* 空位提示 */}
                  {Array.from({ length: 6 - selectedTeam.pokemons.length }).map((_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="bg-gray-50 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 flex items-center justify-center text-gray-400 dark:text-gray-500"
                    >
                      <div className="text-center">
                        <Plus className="w-8 h-8 mx-auto mb-2" />
                        <span className="text-sm">空位</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 创建队伍模态框 */}
      <AnimatePresence>
        {showCreateTeam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateTeam(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  创建新队伍
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      队伍名称 *
                    </label>
                    <input
                      type="text"
                      value={teamForm.name}
                      onChange={(e) => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="输入队伍名称"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      队伍描述
                    </label>
                    <textarea
                      value={teamForm.description}
                      onChange={(e) => setTeamForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="描述这个队伍的特点和用途"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      队伍标签
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {teamTags.map((tag) => (
                        <label key={tag} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={teamForm.tags.includes(tag)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTeamForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                              } else {
                                setTeamForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{tag}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={teamForm.isPublic}
                      onChange={(e) => setTeamForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">
                      公开展示此队伍
                    </label>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowCreateTeam(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleCreateTeam}
                    disabled={!teamForm.name.trim()}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    创建
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 添加宝可梦模态框 */}
      <AnimatePresence>
        {showAddPokemon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddPokemon(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  添加宝可梦到 {selectedTeam?.name}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 基本信息 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      宝可梦名称 *
                    </label>
                    <PokemonSelector
                      value={pokemonForm.name}
                      onChange={async (name) => {
                        setPokemonForm(prev => ({ ...prev, name, ability: null }));

                        // 自动筛选匹配的特性
                        if (name && name.chinese) {
                          try {
                            const matchedAbilityNames = await getAbilitiesForPokemon(name.chinese);
                            if (matchedAbilityNames.length > 0) {
                              // 筛选出匹配的特性对象
                              const matchedAbilities = abilities.filter(ability =>
                                matchedAbilityNames.includes(ability.name)
                              );
                              // 更新可用特性列表（这里需要传递给AbilitySelector）
                              setFilteredAbilities(matchedAbilities);
                              // 将所有匹配的特性设置到pokemonForm的abilities数组中
                              setPokemonForm(prev => ({ ...prev, abilities: matchedAbilities }));
                            } else {
                              setFilteredAbilities(abilities);
                              setPokemonForm(prev => ({ ...prev, abilities: [] }));
                            }
                          } catch (error) {
                            console.error('Error filtering abilities:', error);
                            setFilteredAbilities(abilities);
                            setPokemonForm(prev => ({ ...prev, abilities: [] }));
                          }
                        } else {
                          setFilteredAbilities(abilities);
                          setPokemonForm(prev => ({ ...prev, abilities: [] }));
                        }
                      }}
                      placeholder="如：皮卡丘"
                      pokemonList={pokemonList}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      等级
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={pokemonForm.level}
                      onChange={(e) => setPokemonForm(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      性格
                    </label>
                    <select
                      value={pokemonForm.nature}
                      onChange={(e) => setPokemonForm(prev => ({ ...prev, nature: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {pokemonNatures.map(nature => (
                        <option key={nature} value={nature}>{nature}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      主属性
                    </label>
                    <select
                      value={pokemonForm.type1}
                      onChange={(e) => setPokemonForm(prev => ({ ...prev, type1: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {pokemonTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      副属性
                    </label>
                    <select
                      value={pokemonForm.type2}
                      onChange={(e) => setPokemonForm(prev => ({ ...prev, type2: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">无</option>
                      {pokemonTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      特性 {pokemonForm.abilities.length > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({pokemonForm.abilities.length}个)</span>
                      )}
                    </label>
                    <div className="space-y-2">
                      {pokemonForm.abilities.map((ability, index) => (
                        <div key={index} className="group relative bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3 hover:shadow-md transition-all duration-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-bold text-white">{ability.index}</span>
                                </div>
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{ability.name}</span>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed pl-8">{ability.text}</p>
                            </div>
                            <button
                              onClick={() => {
                                setPokemonForm(prev => ({
                                  ...prev,
                                  abilities: prev.abilities.filter((_, i) => i !== index)
                                }));
                              }}
                              className="ml-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                              title="移除此特性"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {pokemonForm.abilities.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm italic">请先选择宝可梦以显示特性</p>
                        </div>
                      )}
                      {pokemonForm.abilities.length > 0 && (
                        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-blue-700 dark:text-blue-300 font-medium">💡 提示</span>
                            <button
                              onClick={() => {
                                setPokemonForm(prev => ({ ...prev, abilities: [] }));
                              }}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium"
                            >
                              清空所有特性
                            </button>
                          </div>
                          <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">点击特性右上角的 ✕ 可移除单个特性</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      携带道具
                    </label>
                    <input
                      type="text"
                      value={pokemonForm.item}
                      onChange={(e) => setPokemonForm(prev => ({ ...prev, item: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="如：专爱入kd"
                    />
                  </div>
                </div>

                {/* 技能 */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    技能（最多4个）
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {pokemonForm.moves.map((move, index) => (
                      <MoveSelector
                        key={index}
                        value={move}
                        onChange={(newMove) => {
                          const newMoves = [...pokemonForm.moves];
                          newMoves[index] = newMove;
                          setPokemonForm(prev => ({ ...prev, moves: newMoves }));
                        }}
                        placeholder={`技能 ${index + 1}`}
                        moves={moves}
                      />
                    ))}
                  </div>
                </div>

                {/* 个体值设置 */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    个体值 (0-31)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'hp', name: 'HP', icon: Heart, color: 'text-red-500' },
                      { key: 'attack', name: '攻击', icon: Sword, color: 'text-orange-500' },
                      { key: 'defense', name: '防御', icon: Shield, color: 'text-blue-500' },
                      { key: 'specialAttack', name: '特攻', icon: Zap, color: 'text-purple-500' },
                      { key: 'spDefense', name: '特防', icon: Target, color: 'text-green-500' },
                      { key: 'speed', name: '速度', icon: Wind, color: 'text-cyan-500' }
                    ].map(({ key, name, icon: Icon, color }) => (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center space-x-1">
                          <Icon className={`w-3 h-3 ${color}`} />
                          <span className="text-xs text-gray-600 dark:text-gray-400">{name}</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max="31"
                          value={pokemonForm.ivs[key as keyof PokemonIVs]}
                          onChange={(e) => {
                            const value = validateIV(parseInt(e.target.value) || 0);
                            setPokemonForm(prev => ({
                              ...prev,
                              ivs: { ...prev.ivs, [key]: value }
                            }));
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setPokemonForm(prev => ({ ...prev, ivs: createDefaultIVs() }))}
                      className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                      全31
                    </button>
                    <button
                      type="button"
                      onClick={() => setPokemonForm(prev => ({ ...prev, ivs: { hp: 0, attack: 0, defense: 0, specialAttack: 0, spDefense: 0, speed: 0 } }))}
                      className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      全0
                    </button>
                  </div>
                </div>

                {/* 努力值设置 */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      努力值 (0-252)
                    </label>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      总计: {getEVTotal(pokemonForm.evs)}/510
                      {getEVTotal(pokemonForm.evs) > 510 && (
                        <span className="text-red-500 ml-1">超出限制!</span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'hp', name: 'HP', icon: Heart, color: 'text-red-500' },
                      { key: 'attack', name: '攻击', icon: Sword, color: 'text-orange-500' },
                      { key: 'defense', name: '防御', icon: Shield, color: 'text-blue-500' },
                      { key: 'specialAttack', name: '特攻', icon: Zap, color: 'text-purple-500' },
                      { key: 'spDefense', name: '特防', icon: Target, color: 'text-green-500' },
                      { key: 'speed', name: '速度', icon: Wind, color: 'text-cyan-500' }
                    ].map(({ key, name, icon: Icon, color }) => {
                      const natureModifier = getNatureModifierText(pokemonForm.nature, key as any);
                      const modifierColor = getNatureModifierColor(pokemonForm.nature, key as any);

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
                            value={pokemonForm.evs[key as keyof PokemonEVs]}
                            onChange={(e) => {
                              const value = validateEV(parseInt(e.target.value) || 0);
                              const newEvs = { ...pokemonForm.evs, [key]: value };
                              if (validateEVTotal(newEvs)) {
                                setPokemonForm(prev => ({
                                  ...prev,
                                  evs: newEvs
                                }));
                              }
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setPokemonForm(prev => ({ ...prev, evs: createDefaultEVs() }))}
                      className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      重置
                    </button>
                  </div>
                </div>

                {/* 能力值预览 */}
                {pokemonForm.name && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">能力值预览</h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {[
                        { key: 'hp', name: 'HP', icon: Heart, color: 'text-red-500' },
                        { key: 'attack', name: '攻击', icon: Sword, color: 'text-orange-500' },
                        { key: 'defense', name: '防御', icon: Shield, color: 'text-blue-500' },
                        { key: 'specialAttack', name: '特攻', icon: Zap, color: 'text-purple-500' },
                        { key: 'spDefense', name: '特防', icon: Target, color: 'text-green-500' },
                        { key: 'speed', name: '速度', icon: Wind, color: 'text-cyan-500' }
                      ].map(({ key, name, icon: Icon, color }) => {
                        const baseStat = pokemonForm.name?.base ? {
                          hp: pokemonForm.name.base.HP || 0,
                          attack: pokemonForm.name.base.Attack || 0,
                          defense: pokemonForm.name.base.Defense || 0,
                          specialAttack: pokemonForm.name.base['Sp. Attack'] || 0,
                          spDefense: pokemonForm.name.base['Sp. Defense'] || 0,
                          speed: pokemonForm.name.base.Speed || 0
                        } : { hp: 100, attack: 100, defense: 100, specialAttack: 100, spDefense: 100, speed: 100 };

                        const calculatedStats = calculateAllStats(
                          baseStat,
                          pokemonForm.ivs,
                          pokemonForm.evs,
                          pokemonForm.level,
                          pokemonForm.nature
                        );

                        const baseValue = baseStat[key as keyof typeof baseStat];
                        const finalValue = calculatedStats[key as keyof typeof calculatedStats];

                        return (
                          <div key={key} className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              <Icon className={`w-3 h-3 ${color}`} />
                              <span className="text-gray-600 dark:text-gray-400">{name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-gray-500">({baseValue})</span>
                              <span className="font-semibold text-gray-900 dark:text-gray-100">{finalValue}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 其他选项 */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      性别
                    </label>
                    <select
                      value={pokemonForm.gender}
                      onChange={(e) => setPokemonForm(prev => ({ ...prev, gender: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="genderless">无性别</option>
                      <option value="male">雄性</option>
                      <option value="female">雌性</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 mt-6">
                    <input
                      type="checkbox"
                      id="isShiny"
                      checked={pokemonForm.isShiny}
                      onChange={(e) => setPokemonForm(prev => ({ ...prev, isShiny: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isShiny" className="text-sm text-gray-700 dark:text-gray-300">
                      异色宝可梦
                    </label>
                  </div>
                </div>

                {/* 描述 */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    描述
                  </label>
                  <textarea
                    value={pokemonForm.description}
                    onChange={(e) => setPokemonForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="描述这只宝可梦的特点或故事"
                  />
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddPokemon(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAddPokemon}
                    disabled={!pokemonForm.name}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    添加
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 队伍分享卡片 */}
      <AnimatePresence>
        {shareTeam && user && (
          <TeamShareCard
            team={shareTeam}
            user={user}
            onClose={() => setShareTeam(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}