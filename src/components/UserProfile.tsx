'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, UserProfile as UserProfileType, UserStats, PokemonShowcase, UserActivity, UserPrivacySettings, UserTeamShowcase } from '@/types/auth';
import { AuthUser } from '@/lib/auth-client';
import { 
  getUserProfile, 
  updateUserProfile, 
  updatePrivacySettings, 
  getPrivacySettings,
  updatePokemonShowcase,
  addPokemonToShowcase,
  removePokemonFromShowcase,
  followUser,
  unfollowUser,
  getFollowStatus,
  initializeUserProfile
} from '@/lib/userProfile';
import UserAvatar from '@/components/UserAvatar';
import RoleBadge from '@/components/RoleBadge';
import TeamShowcase from '@/components/TeamShowcase';
import ShareCard from '@/components/ShareCard';
import { getChineseTypesSync, getPokemonImageUrl, getTypeColor } from '@/utils/pokemonClientUtils';
import PokemonSelector from './PokemonSelector';
import AbilitySelector from '@/components/AbilitySelector';
import { PokemonIndexEntry, AbilityData, parsePokemonIndex, parseAbilities } from '@/utils/pokemonDataParser';
import { ExtendedAbilityData } from '@/utils/abilityDataProcessor';
import { natureModifiers } from '@/utils/pokemonStatsCalculator';
import { Share2 } from 'lucide-react';

interface UserProfileProps {
  user: AuthUser;
  currentUser?: User | null;
  isOwnProfile?: boolean;
}

interface PokemonFormData {
  name: PokemonIndexEntry | null;
  level: number;
  type1: string;
  type2?: string;
  nature: string;
  ability: ExtendedAbilityData | null;
  description: string;
}

// 使用工具函数获取属性列表
const pokemonTypes = getChineseTypesSync();

// 从性格修正表获取性格列表
const pokemonNatures = Object.keys(natureModifiers);

// 宝可梦卡片组件
interface PokemonCardProps {
  pokemon: any;
  isOwnProfile: boolean;
  onRemove: () => void;
}

function PokemonCard({ pokemon, isOwnProfile, onRemove }: PokemonCardProps) {
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
    <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-750 dark:to-gray-700 rounded-2xl p-6 relative shadow-lg border border-gray-200/50 dark:border-gray-600/50 hover:shadow-xl hover:border-blue-300/50 dark:hover:border-blue-500/50 transition-all duration-300 group backdrop-blur-sm transform hover:-translate-y-2 hover:scale-105">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* 闪光效果（如果是异色） */}
      {pokemon.isShiny && (
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-pink-400/20 to-purple-400/20 rounded-2xl animate-pulse"></div>
      )}
      
      {isOwnProfile && (
        <button
          onClick={onRemove}
          className="absolute top-3 right-3 w-8 h-8 bg-red-500/90 backdrop-blur-sm text-white rounded-full hover:bg-red-600 transition-all duration-300 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 z-20 transform hover:scale-110"
        >
          <span className="text-sm font-bold">✕</span>
        </button>
      )}
      
      <div className="text-center relative z-10">
        {/* 宝可梦图片 */}
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <div className="relative w-24 h-24 bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-500 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner border-2 border-white/50 dark:border-gray-500/50">
              {pokemon.isShiny && (
                <div className="absolute -top-2 -right-2 z-20">
                  <div className="relative">
                    <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-xs font-bold">✨</span>
                    </div>
                    <div className="absolute inset-0 animate-ping">
                      <div className="w-6 h-6 bg-yellow-300 rounded-full opacity-75"></div>
                    </div>
                  </div>
                </div>
              )}
              <img
                src={imageUrl}
                alt={pokemon.name}
                className={`w-full h-full object-cover transition-all duration-500 transform group-hover:scale-110 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageUrl('/thumbnails/default.png');
                  setImageLoaded(true);
                }}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            
            {/* 等级徽章 */}
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white dark:border-gray-800">
              Lv.{pokemon.level}
            </div>
          </div>
        </div>
        
        <h4 className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-2">{pokemon.name}</h4>
        
        {/* 属性标签 */}
        <div className="mt-3 flex justify-center flex-wrap gap-2">
          <span className={`px-3 py-1 text-white text-sm font-semibold rounded-full shadow-sm ${getTypeColor(pokemon.type1)}`}>
            {pokemon.type1}
          </span>
          {pokemon.type2 && (
            <span className={`px-3 py-1 text-white text-sm font-semibold rounded-full shadow-sm ${getTypeColor(pokemon.type2)}`}>
              {pokemon.type2}
            </span>
          )}
        </div>
        
        {/* 详细信息 */}
        <div className="mt-4 space-y-2">
          {pokemon.nature && (
            <div className="flex items-center justify-center space-x-1 text-sm text-gray-600 dark:text-gray-300">
              <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
              <span>性格: {pokemon.nature}</span>
            </div>
          )}
          
          {pokemon.ability && (
            <div className="flex items-center justify-center space-x-1 text-sm text-gray-600 dark:text-gray-300">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span>特性: {pokemon.ability}</span>
            </div>
          )}
        </div>
        
        {pokemon.description && (
          <div className="mt-4 pt-3 border-t border-gray-200/50 dark:border-gray-600/50">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{pokemon.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UserProfile({ user, currentUser, isOwnProfile = false }: UserProfileProps) {
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [showcase, setShowcase] = useState<PokemonShowcase | null>(null);
  const [teamShowcase, setTeamShowcase] = useState<UserTeamShowcase | null>(null);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [privacySettings, setPrivacySettings] = useState<UserPrivacySettings | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddPokemon, setShowAddPokemon] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [textColor, setTextColor] = useState('text-white');
  const profileCardRef = useRef<HTMLDivElement>(null);
  const textElementsRef = useRef<(HTMLElement | null)[]>([]);
  
  // 数据状态
   const [pokemonList, setPokemonList] = useState<PokemonIndexEntry[]>([]);
   const [abilities, setAbilities] = useState<AbilityData[]>([]);
  const [pokemonForm, setPokemonForm] = useState<PokemonFormData>({
    name: null,
    level: 1,
    type1: '普通',
    type2: '',
    nature: '勤奋',
    ability: null,
    description: ''
  });

  // 智能文字颜色适配函数
  const analyzeBackgroundColor = useCallback(async (imageUrl: string, textElements: HTMLElement[]) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise<void>((resolve) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          // 分析每个文字元素下方的背景颜色
          textElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const profileCard = profileCardRef.current;
            if (!profileCard) return;

            const cardRect = profileCard.getBoundingClientRect();
            
            // 计算文字在背景图中的相对位置
            const relativeX = (rect.left - cardRect.left) / cardRect.width;
            const relativeY = (rect.top - cardRect.top) / cardRect.height;
            
            // 采样区域大小（文字区域）
            const sampleWidth = Math.max(20, rect.width / cardRect.width * canvas.width);
            const sampleHeight = Math.max(20, rect.height / cardRect.height * canvas.height);
            
            const startX = Math.max(0, relativeX * canvas.width - sampleWidth / 2);
            const startY = Math.max(0, relativeY * canvas.height - sampleHeight / 2);
            
            const endX = Math.min(canvas.width, startX + sampleWidth);
            const endY = Math.min(canvas.height, startY + sampleHeight);
            
            // 获取采样区域的像素数据
            const imageData = ctx.getImageData(startX, startY, endX - startX, endY - startY);
            const pixels = imageData.data;
            
            let totalBrightness = 0;
            let pixelCount = 0;
            
            // 计算平均亮度
            for (let i = 0; i < pixels.length; i += 4) {
              const r = pixels[i];
              const g = pixels[i + 1];
              const b = pixels[i + 2];
              const alpha = pixels[i + 3];
              
              if (alpha > 0) {
                // 使用感知亮度公式
                const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
                totalBrightness += brightness;
                pixelCount++;
              }
            }
            
            if (pixelCount > 0) {
              const avgBrightness = totalBrightness / pixelCount;
              
              // 根据亮度设置文字颜色
              // 亮度阈值：128（0-255的中点）
              const isDark = avgBrightness < 128;
              const newTextColor = isDark ? 'text-white' : 'text-black';
              
              // 应用颜色到元素
              element.className = element.className.replace(/text-(white|black)/g, newTextColor);
            }
          });
          
          resolve();
        };
        
        img.onerror = () => {
          // 如果图片加载失败，使用默认白色文字
          textElements.forEach(element => {
            element.className = element.className.replace(/text-(white|black)/g, 'text-white');
          });
          resolve();
        };
        
        img.src = imageUrl;
      });
    } catch (error) {
      console.error('背景颜色分析失败:', error);
      // 出错时使用默认白色文字
      textElements.forEach(element => {
        element.className = element.className.replace(/text-(white|black)/g, 'text-white');
      });
    }
  }, []);

  // 应用智能文字颜色
  const applySmartTextColor = useCallback(() => {
    if (!profileCardRef.current) return;
    
    // 获取所有需要调整颜色的文字元素
    const textElements = profileCardRef.current.querySelectorAll(
      'h1, p, span, strong'
    ) as NodeListOf<HTMLElement>;
    
    // 分析背景图并调整文字颜色
    analyzeBackgroundColor('https://i1.mcobj.com/uploads/20220111_dc518b9e59108.jpg', Array.from(textElements));
  }, [analyzeBackgroundColor]);

  useEffect(() => {
    loadUserData();
    loadData();
    
    // 如果不是自己的主页且当前选中设置选项卡，切换到个人资料选项卡
    if (!isOwnProfile && activeTab === 'settings') {
      setActiveTab('profile');
    }
  }, [user.id, isOwnProfile]);
  
  useEffect(() => {
    // 当isOwnProfile变化时，检查当前选项卡是否有效
    if (!isOwnProfile && activeTab === 'settings') {
      setActiveTab('profile');
    }
  }, [isOwnProfile, activeTab]);

  // 监听背景图加载完成后应用智能文字颜色
  useEffect(() => {
    const timer = setTimeout(() => {
      applySmartTextColor();
    }, 1000); // 等待背景图加载
    
    return () => clearTimeout(timer);
  }, [applySmartTextColor]);

  // 监听窗口大小变化，重新计算文字颜色
  useEffect(() => {
    const handleResize = () => {
      applySmartTextColor();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [applySmartTextColor]);

  // 加载数据
  const loadData = async () => {
    try {
      const [pokemonData, abilityData] = await Promise.all([
        parsePokemonIndex(),
        parseAbilities()
      ]);
      setPokemonList(pokemonData);
      setAbilities(abilityData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const loadUserData = async () => {
    try {
      let userProfile = await getUserProfile(user.id);
      
      // 如果用户数据不完整，初始化用户资料
      if (!userProfile.profile || !userProfile.stats || !userProfile.showcase) {
        await initializeUserProfile(user.id, user.gameNickname || user.username);
        // 重新获取用户资料
        userProfile = await getUserProfile(user.id);
      }
      
      // 设置用户资料，如果不存在则使用默认值
      setProfile(userProfile.profile || {
        userId: user.id,
        onlineTime: 0,
        joinedAt: user.createdAt || new Date()
      });
      
      // 设置用户统计，如果不存在则使用默认值
      setStats(userProfile.stats || {
        followersCount: 0,
        followingCount: 0,
        likesReceived: 0,
        postsCount: 0,
        repliesCount: 0,
        lastActiveAt: new Date()
      });
      
      // 设置宝可梦展柜，如果不存在则使用默认值
      setShowcase(userProfile.showcase || {
        id: `showcase_${user.id}`,
        title: `${user.gameNickname || user.username}的宝可梦展柜`,
        description: '这里展示我最珍贵的宝可梦伙伴们',
        pokemons: [],
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // 设置配队展示，如果不存在则使用默认值
      setTeamShowcase(user.teamShowcase || {
        id: `team_showcase_${user.id}`,
        userId: user.id,
        teams: [],
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      setActivities(userProfile.activities || []);
      
      if (isOwnProfile) {
        const privacyResult = await getPrivacySettings(user.id);
        setPrivacySettings(privacyResult.settings || {
          showProfile: true,
          showStats: true,
          showOnlineTime: true,
          showPokemonShowcase: true,
          showTeamShowcase: true,
          showActivity: true,
          allowFollow: true
        });
      }
      
      if (currentUser && !isOwnProfile) {
        const followResult = await getFollowStatus(currentUser.id, user.id);
        setIsFollowing(followResult.isFollowing);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      // 即使出错也设置默认数据，确保页面能正常显示
      setProfile({
        userId: user.id,
        onlineTime: 0,
        joinedAt: user.createdAt || new Date()
      });
      setStats({
        followersCount: 0,
        followingCount: 0,
        likesReceived: 0,
        postsCount: 0,
        repliesCount: 0,
        lastActiveAt: new Date()
      });
      setShowcase({
        id: `showcase_${user.id}`,
        title: `${user.gameNickname || user.username}的宝可梦展柜`,
        description: '这里展示我最珍贵的宝可梦伙伴们',
        pokemons: [],
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      if (isOwnProfile) {
        setPrivacySettings({
          showProfile: true,
          showStats: true,
          showOnlineTime: true,
          showPokemonShowcase: true,
          showTeamShowcase: true,
          showActivity: true,
          allowFollow: true
        });
      }
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) return;
    
    try {
      if (isFollowing) {
        await unfollowUser(currentUser.id, user.id);
        setIsFollowing(false);
      } else {
        await followUser(currentUser.id, user.id);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    try {
      await updateUserProfile(user.id, profile);
      setEditingProfile(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handlePrivacyUpdate = async (setting: keyof UserPrivacySettings, value: boolean) => {
    if (!privacySettings) return;
    
    const updated = { ...privacySettings, [setting]: value };
    setPrivacySettings(updated);
    
    try {
      await updatePrivacySettings(user.id, updated);
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
    }
  };

  const handleUpdateTeamShowcase = async (updatedShowcase: UserTeamShowcase) => {
    try {
      setTeamShowcase(updatedShowcase);
      // 这里可以添加API调用来保存到后端
      // await updateTeamShowcase(user.id, updatedShowcase);
    } catch (error) {
      console.error('Failed to update team showcase:', error);
    }
  };

  const handleAddPokemon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showcase || !pokemonForm.name) return;
    
    try {
      const newPokemon = {
        name: pokemonForm.name.chinese,
        level: pokemonForm.level,
        type1: pokemonForm.type1,
        type2: pokemonForm.type2,
        nature: pokemonForm.nature,
        ability: pokemonForm.ability?.name || '',
        description: pokemonForm.description,
        isShiny: false,
        stats: {
          hp: Math.floor(Math.random() * 100) + 50,
          attack: Math.floor(Math.random() * 100) + 50,
          defense: Math.floor(Math.random() * 100) + 50,
          specialAttack: Math.floor(Math.random() * 100) + 50,
          spDefense: Math.floor(Math.random() * 100) + 50,
          speed: Math.floor(Math.random() * 100) + 50
        }
      };
      
      const result = await addPokemonToShowcase(user.id, newPokemon);
      
      if (result.success) {
        await loadUserData();
        setShowAddPokemon(false);
        setPokemonForm({
          name: null,
          level: 1,
          type1: '普通',
          type2: '',
          nature: '勤奋',
          ability: null,
          description: ''
        });
        console.log('宝可梦添加成功:', result.message);
      } else {
        console.error('添加宝可梦失败:', result.message);
        alert(`添加失败: ${result.message}`);
      }
    } catch (error) {
      console.error('Failed to add pokemon:', error);
    }
  };

  const handleRemovePokemon = async (pokemonId: string) => {
    try {
      await removePokemonFromShowcase(user.id, pokemonId);
      await loadUserData();
    } catch (error) {
      console.error('Failed to remove pokemon:', error);
    }
  };

  if (!profile || !stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 用户头部信息 */}
      <div 
        ref={profileCardRef}
        className="bg-white rounded-lg shadow-md p-6 relative overflow-hidden" 
        style={{
          backgroundImage: 'url(https://i1.mcobj.com/uploads/20220111_dc518b9e59108.jpg)', 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          backgroundRepeat: 'no-repeat'
        }}
        onLoad={() => {
          // 背景图加载完成后重新分析颜色
          setTimeout(() => applySmartTextColor(), 500);
        }}
      >
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center space-x-4">
            <UserAvatar user={user} size="lg" />
            <div>
              <h1 ref={el => { textElementsRef.current[0] = el; }} className="text-2xl font-bold text-white">{user.gameNickname || user.username}</h1>
              <p ref={el => { textElementsRef.current[1] = el; }} className="text-white">@{user.username}</p>
              <p ref={el => { textElementsRef.current[2] = el; }} className="text-sm text-white">ID: {user.uniqueId}</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {!isOwnProfile && currentUser && (
              <button
                onClick={handleFollowToggle}
                className={`px-4 py-2 rounded-md font-medium ${
                  isFollowing 
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isFollowing ? '取消关注' : '关注'}
              </button>
            )}
            
            {isOwnProfile && (
              <button
                onClick={() => setEditingProfile(!editingProfile)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                {editingProfile ? '取消编辑' : '编辑资料'}
              </button>
            )}
            
            {/* 分享按钮 */}
            <button
              onClick={() => setShowShareCard(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center space-x-2"
              title="分享个人主页"
            >
              <Share2 className="w-4 h-4" />
              <span>分享</span>
            </button>
          </div>
        </div>
        
        {profile.bio && (
          <div className="mt-4">
            <p className="text-gray-700">{profile.bio}</p>
          </div>
        )}
        
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
          {profile.location && (
            <span>📍 {profile.location}</span>
          )}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              🔗 {profile.website}
            </a>
          )}
          <span ref={el => { textElementsRef.current[3] = el; }} className="text-white">📅 {new Date(profile.joinedAt).toLocaleDateString()} 加入</span>
        </div>
        
        <div className="mt-4 flex space-x-6 text-sm">
          <span ref={el => { textElementsRef.current[4] = el; }} style={{ color: textColor }}><strong>{stats.followingCount}</strong> 关注</span>
          <span ref={el => { textElementsRef.current[5] = el; }} style={{ color: textColor }}><strong>{stats.followersCount}</strong> 粉丝</span>
          <span ref={el => { textElementsRef.current[6] = el; }} style={{ color: textColor }}><strong>{stats.postsCount}</strong> 帖子</span>
          <span ref={el => { textElementsRef.current[7] = el; }} style={{ color: textColor }}><strong>{stats.likesReceived}</strong> 获赞</span>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {['profile', 'showcase', 'teams', 'activity', ...(isOwnProfile ? ['settings'] : [])].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'profile' && '个人资料'}
                {tab === 'showcase' && '宝可梦展柜'}
                {tab === 'teams' && '配队展示'}
                {tab === 'activity' && '动态'}
                {tab === 'settings' && '设置'}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* 个人资料标签页 */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {editingProfile && isOwnProfile ? (
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
                    <textarea
                      value={profile.bio || ''}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      rows={3}
                      placeholder="介绍一下自己..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">地区</label>
                    <input
                      type="text"
                      value={profile.location || ''}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="你的地区"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">个人网站</label>
                    <input
                      type="url"
                      value={profile.website || ''}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="https://..."
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProfile(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      取消
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">基本信息</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">用户名</span>
                        <p className="font-medium">{user.username}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">游戏昵称</span>
                        <p className="font-medium">{user.gameNickname || '未设置'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">注册时间</span>
                        <p className="font-medium">{new Date(profile.joinedAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">在线时长</span>
                        <p className="font-medium">{Math.floor(profile.onlineTime / 60)} 小时</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 宝可梦展柜标签页 */}
          {activeTab === 'showcase' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{showcase?.title || '宝可梦展柜'}</h3>
                {isOwnProfile && (
                  <button
                    onClick={() => setShowAddPokemon(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    添加宝可梦
                  </button>
                )}
              </div>
              
              {showcase?.description && (
                <p className="text-gray-600">{showcase.description}</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {showcase?.pokemons.map((pokemon) => (
                  <PokemonCard 
                    key={pokemon.id} 
                    pokemon={pokemon} 
                    isOwnProfile={isOwnProfile}
                    onRemove={() => handleRemovePokemon(pokemon.id)}
                  />
                ))}
              </div>
              
              {(!showcase?.pokemons || showcase.pokemons.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <p>还没有添加任何宝可梦</p>
                </div>
              )}
            </div>
          )}

          {/* 配队展示标签页 */}
          {activeTab === 'teams' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">配队展示</h3>
                {isOwnProfile && (
                  <p className="text-sm text-gray-500">
                    展示你的宝可梦对战队伍配置
                  </p>
                )}
              </div>
              
              <TeamShowcase
                teamShowcase={teamShowcase}
                isOwnProfile={isOwnProfile}
                onUpdateTeamShowcase={handleUpdateTeamShowcase}
              />
            </div>
          )}

          {/* 动态标签页 */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">最近动态</h3>
              
              {activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <h4 className="font-medium">{activity.title}</h4>
                      {activity.content && (
                        <p className="text-gray-600 text-sm">{activity.content}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>暂无动态</p>
                </div>
              )}
            </div>
          )}

          {/* 设置标签页 */}
          {activeTab === 'settings' && isOwnProfile && privacySettings && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">隐私设置</h3>
              
              <div className="space-y-4">
                {Object.entries({
                  showProfile: '显示个人资料',
                  showStats: '显示统计信息',
                  showOnlineTime: '显示在线时长',
                  showPokemonShowcase: '显示宝可梦展柜',
                  showTeamShowcase: '显示配队展示',
                  showActivity: '显示动态',
                  allowFollow: '允许被关注'
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{label}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacySettings[key as keyof UserPrivacySettings]}
                        onChange={(e) => handlePrivacyUpdate(key as keyof UserPrivacySettings, e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors ${
                        privacySettings[key as keyof UserPrivacySettings] ? 'bg-blue-500' : 'bg-gray-300'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                          privacySettings[key as keyof UserPrivacySettings] ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 添加宝可梦对话框 */}
      {showAddPokemon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">添加宝可梦</h3>
            
            <form onSubmit={handleAddPokemon} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <PokemonSelector
                  value={pokemonForm.name}
                  onChange={(name) => setPokemonForm({ ...pokemonForm, name })}
                  placeholder="选择宝可梦"
                  pokemonList={pokemonList}
                />
              </div>
              

              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">等级</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={pokemonForm.level}
                  onChange={(e) => setPokemonForm({ ...pokemonForm, level: parseInt(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">主属性</label>
                  <select
                    value={pokemonForm.type1}
                    onChange={(e) => setPokemonForm({ ...pokemonForm, type1: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {pokemonTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">副属性</label>
                  <select
                    value={pokemonForm.type2 || ''}
                    onChange={(e) => setPokemonForm({ ...pokemonForm, type2: e.target.value || undefined })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">无</option>
                    {pokemonTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">性格</label>
                <select
                  value={pokemonForm.nature}
                  onChange={(e) => setPokemonForm({ ...pokemonForm, nature: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {pokemonNatures.map(nature => (
                    <option key={nature} value={nature}>{nature}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">特性</label>
                <AbilitySelector
                  pokemonName={pokemonForm.name?.chinese}
                  selectedAbility={pokemonForm.ability}
                  onAbilitySelect={(ability) => setPokemonForm({ ...pokemonForm, ability })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={pokemonForm.description}
                  onChange={(e) => setPokemonForm({ ...pokemonForm, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  添加
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPokemon(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* 分享卡片模态框 */}
      {showShareCard && (
        <ShareCard
          type="profile"
          user={user}
          userStats={stats}
          userProfile={profile}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </div>
  );
}