'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  MessageCircle,
  UserX,
  Search,
  Settings,
  UserPlus,
  Bell,
  ChevronDown,
  ChevronRight,
  Circle,
  Minus,
  X,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from '@/components/UserAvatar';
import {
  Friend,
  BlockedUser,
  FriendRequest,
  FriendStatus,
  FriendRequestStatus,
  FriendStats
} from '@/types/friends';
import {
  getFriends,
  getBlockedUsers,
  getFriendRequests,
  getFriendStats,
  respondToFriendRequest,
  unblockUser
} from '@/lib/friendsService';

interface FriendsSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onStartChat?: (friendId: string) => void;
}

type TabType = 'friends' | 'requests' | 'blocked';

const FriendsSidebar: React.FC<FriendsSidebarProps> = ({
  isOpen,
  onToggle,
  onClose,
  onStartChat
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 数据状态
  const [friends, setFriends] = useState<Friend[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [stats, setStats] = useState<FriendStats>({
    totalFriends: 0,
    onlineFriends: 0,
    pendingRequests: 0,
    blockedUsers: 0,
    unreadMessages: 0
  });
  
  // 展开状态
  const [expandedSections, setExpandedSections] = useState({
    online: true,
    offline: false
  });

  // 加载数据
  useEffect(() => {
    if (user && isOpen) {
      loadData();
    }
  }, [user, isOpen, activeTab]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [friendsData, blockedData, requestsData, statsData] = await Promise.all([
        getFriends(user.id, { search: searchQuery }),
        getBlockedUsers(user.id),
        getFriendRequests(user.id, { type: 'received', status: FriendRequestStatus.PENDING }),
        getFriendStats(user.id)
      ]);
      
      setFriends(friendsData);
      setBlockedUsers(blockedData);
      setFriendRequests(requestsData);
      setStats(statsData);
    } catch (error) {
      console.error('加载好友数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理好友请求
  const handleFriendRequest = async (requestId: string, action: 'accept' | 'reject') => {
    if (!user) return;
    
    try {
      await respondToFriendRequest(user.id, { requestId, action });
      await loadData(); // 重新加载数据
    } catch (error) {
      console.error('处理好友请求失败:', error);
    }
  };

  // 取消拉黑
  const handleUnblock = async (blockedUserId: string) => {
    if (!user) return;
    
    try {
      await unblockUser(user.id, blockedUserId);
      await loadData(); // 重新加载数据
    } catch (error) {
      console.error('取消拉黑失败:', error);
    }
  };

  // 开始聊天
  const handleStartChat = (friendId: string) => {
    if (onStartChat) {
      onStartChat(friendId);
    }
  };

  // 切换展开状态
  const toggleSection = (section: 'online' | 'offline') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 获取状态图标
  const getStatusIcon = (status: FriendStatus) => {
    const iconProps = { className: 'w-2 h-2' };
    
    switch (status) {
      case FriendStatus.ONLINE:
        return <Circle {...iconProps} className="w-2 h-2 fill-green-500 text-green-500" />;
      case FriendStatus.BUSY:
        return <Circle {...iconProps} className="w-2 h-2 fill-red-500 text-red-500" />;
      case FriendStatus.AWAY:
        return <Circle {...iconProps} className="w-2 h-2 fill-yellow-500 text-yellow-500" />;
      default:
        return <Circle {...iconProps} className="w-2 h-2 fill-gray-400 text-gray-400" />;
    }
  };

  // 过滤好友
  const filteredFriends = friends.filter(friend => 
    friend.friendName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (friend.nickname && friend.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const onlineFriends = filteredFriends.filter(f => f.status === FriendStatus.ONLINE);
  const offlineFriends = filteredFriends.filter(f => f.status !== FriendStatus.ONLINE);

  if (!isOpen) {
    return (
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: -240 }}
        className="fixed left-0 top-0 h-full z-30"
      >
        <Button
          onClick={onToggle}
          variant="outline"
          size="sm"
          className="absolute top-20 -right-10 bg-white shadow-lg border-gray-200 hover:bg-gray-50"
        >
          <Users className="w-4 h-4" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      exit={{ x: -280 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed left-0 top-0 h-full w-80 bg-white border-r border-gray-200 shadow-lg z-30 flex flex-col"
    >
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5" />
            好友系统
          </h2>
          
          <div className="flex items-center gap-2">
            {stats.unreadMessages > 0 && (
              <Badge variant="destructive" className="text-xs">
                {stats.unreadMessages}
              </Badge>
            )}
            
            <Button
              onClick={onToggle}
              variant="ghost"
              size="sm"
              className="p-1 h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* 标签页 */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'friends'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            好友 ({stats.totalFriends})
          </button>
          
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors relative ${
              activeTab === 'requests'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            请求
            {stats.pendingRequests > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 text-xs h-5 w-5 p-0 flex items-center justify-center"
              >
                {stats.pendingRequests}
              </Badge>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('blocked')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'blocked'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            黑名单 ({stats.blockedUsers})
          </button>
        </div>
        
        {/* 搜索框 */}
        {activeTab === 'friends' && (
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索好友..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        )}
      </div>
      
      {/* 内容区域 */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {activeTab === 'friends' && (
            <div className="space-y-4">
              {/* 在线好友 */}
              {onlineFriends.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleSection('online')}
                    className="flex items-center gap-2 w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 mb-2"
                  >
                    {expandedSections.online ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    在线好友 ({onlineFriends.length})
                  </button>
                  
                  <AnimatePresence>
                    {expandedSections.online && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-2"
                      >
                        {onlineFriends.map((friend) => (
                          <div
                            key={friend.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                          >
                            <div className="relative">
                              <UserAvatar
                                user={{
                                  avatarUrl: friend.friendAvatar,
                                  gameNickname: friend.friendName,
                                  role: friend.friendRole
                                }}
                                size="sm"
                              />
                              <div className="absolute -bottom-0.5 -right-0.5">
                                {getStatusIcon(friend.status)}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate text-sm">
                                {friend.nickname || friend.friendName}
                              </div>
                              {friend.nickname && (
                                <div className="text-xs text-gray-500 truncate">
                                  {friend.friendName}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {friend.unreadMessageCount > 0 && (
                                <Badge variant="destructive" className="text-xs h-5 w-5 p-0 flex items-center justify-center">
                                  {friend.unreadMessageCount > 9 ? '9+' : friend.unreadMessageCount}
                                </Badge>
                              )}
                              
                              <Button
                                onClick={() => handleStartChat(friend.friendId)}
                                variant="ghost"
                                size="sm"
                                className="p-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              
              {/* 离线好友 */}
              {offlineFriends.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleSection('offline')}
                    className="flex items-center gap-2 w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 mb-2"
                  >
                    {expandedSections.offline ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    离线好友 ({offlineFriends.length})
                  </button>
                  
                  <AnimatePresence>
                    {expandedSections.offline && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-2"
                      >
                        {offlineFriends.map((friend) => (
                          <div
                            key={friend.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group opacity-75"
                          >
                            <div className="relative">
                              <UserAvatar
                                user={{
                                  avatarUrl: friend.friendAvatar,
                                  gameNickname: friend.friendName,
                                  role: friend.friendRole
                                }}
                                size="sm"
                              />
                              <div className="absolute -bottom-0.5 -right-0.5">
                                {getStatusIcon(friend.status)}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-700 truncate text-sm">
                                {friend.nickname || friend.friendName}
                              </div>
                              {friend.lastOnlineAt && (
                                <div className="text-xs text-gray-500">
                                  {new Date(friend.lastOnlineAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            
                            <Button
                              onClick={() => handleStartChat(friend.friendId)}
                              variant="ghost"
                              size="sm"
                              className="p-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              
              {filteredFriends.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">
                    {searchQuery ? '没有找到匹配的好友' : '还没有好友'}
                  </p>
                  <p className="text-xs mt-1">
                    {searchQuery ? '尝试其他关键词' : '点击其他用户头像添加好友'}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'requests' && (
            <div className="space-y-3">
              {friendRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <UserAvatar
                      user={{
                        avatarUrl: request.senderAvatar,
                        gameNickname: request.senderName,
                        role: request.senderRole
                      }}
                      size="sm"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm">
                        {request.senderName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {request.message && (
                    <p className="text-sm text-gray-600 mb-3 bg-white p-2 rounded border">
                      {request.message}
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleFriendRequest(request.id, 'accept')}
                      size="sm"
                      className="flex-1 h-8"
                    >
                      接受
                    </Button>
                    
                    <Button
                      onClick={() => handleFriendRequest(request.id, 'reject')}
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8"
                    >
                      拒绝
                    </Button>
                  </div>
                </div>
              ))}
              
              {friendRequests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">没有待处理的好友请求</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'blocked' && (
            <div className="space-y-3">
              {blockedUsers.map((blockedUser) => (
                <div
                  key={blockedUser.id}
                  className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200"
                >
                  <UserAvatar
                    user={{
                      avatarUrl: blockedUser.blockedUserAvatar,
                      gameNickname: blockedUser.blockedUserName,
                      role: blockedUser.blockedUserRole
                    }}
                    size="sm"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm">
                      {blockedUser.blockedUserName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(blockedUser.blockedAt).toLocaleDateString()}
                    </div>
                    {blockedUser.reason && (
                      <div className="text-xs text-red-600 mt-1">
                        {blockedUser.reason}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => handleUnblock(blockedUser.blockedUserId)}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                  >
                    取消拉黑
                  </Button>
                </div>
              ))}
              
              {blockedUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">黑名单为空</p>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
};

export default FriendsSidebar;