import React, { useState } from 'react';
import { User, Crown, Shield, Star } from 'lucide-react';

interface UserAvatarProps {
  user?: {
    id?: string;
    gameNickname?: string;
    username?: string;
    avatarUrl?: string;
    role?: string;
    isOnline?: boolean;
  } | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showName?: boolean;
  showTooltip?: boolean;
  showStatus?: boolean;
  showRoleBadge?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
  clickable?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  className = '',
  showName = false,
  showTooltip = false,
  showStatus = false,
  showRoleBadge = false,
  onClick,
  clickable = false
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const iconSizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const statusSizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5'
  };

  const badgeSizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  };

  const displayName = user?.gameNickname || user?.username || '未知用户';
  const avatarUrl = user?.avatarUrl;

  // 获取最终头像URL
  const getFinalAvatarUrl = () => {
    // 如果有头像URL，直接使用
    if (avatarUrl && !imageError) {
      return avatarUrl;
    }
    
    // 尝试从localStorage获取
    if (user?.gameNickname && !imageError) {
      try {
        const avatars = JSON.parse(localStorage.getItem('avatars') || '{}');
        if (avatars[user.gameNickname]) {
          return avatars[user.gameNickname];
        }
      } catch (error) {
        console.error('Failed to load avatar from localStorage:', error);
      }
    }
    
    // 如果都没有，返回null，使用默认头像图标
    return null;
  };
  
  const finalAvatarUrl = getFinalAvatarUrl();

  const handleClick = (e: React.MouseEvent) => {
    if (clickable && onClick) {
      onClick(e);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const getRoleBadge = () => {
    if (!showRoleBadge || !user?.role) return null;
    
    switch (user.role.toLowerCase()) {
      case 'moderator':
        return {
          icon: <Shield className={badgeSizeClasses[size]} />,
          color: 'bg-gradient-to-r from-blue-400 to-purple-500',
          title: '版主'
        };
      case 'vip':
        return {
          icon: <Star className={badgeSizeClasses[size]} />,
          color: 'bg-gradient-to-r from-purple-400 to-pink-500',
          title: 'VIP用户'
        };
      default:
        return null;
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <div className={`flex items-center ${className} ${clickable ? 'cursor-pointer group' : ''}`} onClick={handleClick}>
      {/* 头像容器 */}
      <div className="relative">
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center border-2 border-white dark:border-gray-600 shadow-lg transition-all duration-300 ${clickable ? 'group-hover:border-blue-400 group-hover:shadow-xl group-hover:scale-105' : ''}`}>
          {finalAvatarUrl && !imageError ? (
            <img
              src={finalAvatarUrl}
              alt={`${displayName}的头像`}
              className={`w-full h-full object-cover transition-transform duration-300 ${clickable ? 'group-hover:scale-110' : ''}`}
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <User className={`${iconSizeClasses[size]} text-white`} />
            </div>
          )}
        </div>
        
        {/* 在线状态指示器 */}
        {showStatus && user?.isOnline && (
          <div className={`absolute -bottom-0.5 -right-0.5 ${statusSizeClasses[size]} bg-green-400 border-2 border-white dark:border-gray-800 rounded-full animate-pulse`}></div>
        )}
        
        {/* 角色徽章 */}
        {roleBadge && (
          <div 
            className={`absolute -top-1 -right-1 ${roleBadge.color} rounded-full p-1 border-2 border-white dark:border-gray-800 shadow-lg`}
            title={roleBadge.title}
          >
            <div className="text-white">
              {roleBadge.icon}
            </div>
          </div>
        )}
      </div>

      {/* 用户名 */}
      {showName && (
        <div className="ml-3 flex flex-col">
          <span className={`font-medium text-gray-900 dark:text-gray-100 ${textSizeClasses[size]} transition-colors ${clickable ? 'group-hover:text-blue-600 dark:group-hover:text-blue-400' : ''}`}>
            {displayName}
          </span>
          {user?.isOnline && showStatus && (
            <span className="text-xs text-green-500 font-medium">
              在线
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;