'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  UserMinus,
  UserX,
  MessageCircle,
  User,
  Shield,
  Clock,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import {
  UserInteractionContext,
  UserInteractionMenuItem
} from '@/types/friends';
import {
  sendFriendRequest,
  blockUser,
  unblockUser,
  removeFriend,
  getUserRelationship
} from '@/lib/friendsService';

interface UserInteractionMenuProps {
  context: UserInteractionContext | null;
  onClose: () => void;
  onAction?: (action: string, targetUserId: string) => void;
}

const UserInteractionMenu: React.FC<UserInteractionMenuProps> = ({
  context,
  onClose,
  onAction
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [relationship, setRelationship] = useState({
    isFriend: false,
    isBlocked: false,
    hasPendingRequest: false,
    requestSentByCurrentUser: false
  });

  // 加载用户关系
  useEffect(() => {
    if (context && user) {
      loadUserRelationship();
    }
  }, [context, user]);

  const loadUserRelationship = async () => {
    if (!context || !user) return;
    
    try {
      const rel = await getUserRelationship(user.id, context.targetUser.id);
      setRelationship(rel);
    } catch (error) {
      console.error('加载用户关系失败:', error);
    }
  };

  // 处理菜单项点击
  const handleMenuAction = async (action: string) => {
    if (!context || !user || loading) return;
    
    setLoading(true);
    
    try {
      switch (action) {
        case 'addFriend':
          await sendFriendRequest(user.id, {
            receiverId: context.targetUser.id,
            message: `你好，我是${user.gameNickname || user.username}，希望能成为朋友！`
          });
          break;
          
        case 'removeFriend':
          await removeFriend(user.id, context.targetUser.id);
          break;
          
        case 'blockUser':
          await blockUser(user.id, {
            blockedUserId: context.targetUser.id,
            reason: '用户主动拉黑'
          });
          break;
          
        case 'unblockUser':
          await unblockUser(user.id, context.targetUser.id);
          break;
          
        case 'sendMessage':
          // 这里可以打开私聊窗口或跳转到私聊页面
          break;
          
        case 'viewProfile':
          // 这里可以打开用户资料页面
          break;
      }
      
      // 重新加载关系状态
      await loadUserRelationship();
      
      // 通知父组件
      if (onAction) {
        onAction(action, context.targetUser.id);
      }
      
    } catch (error) {
      console.error('操作失败:', error);
      // 这里可以显示错误提示
    } finally {
      setLoading(false);
    }
  };

  // 生成菜单项
  const getMenuItems = (): UserInteractionMenuItem[] => {
    if (!context || !user) return [];
    
    const items: UserInteractionMenuItem[] = [];
    
    // 查看资料
    items.push({
      id: 'viewProfile',
      label: '查看资料',
      icon: 'User',
      action: 'viewProfile'
    });
    
    // 好友相关操作
    if (relationship.isFriend) {
      items.push({
        id: 'sendMessage',
        label: '发送消息',
        icon: 'MessageCircle',
        action: 'sendMessage'
      });
      
      items.push({
        id: 'removeFriend',
        label: '删除好友',
        icon: 'UserMinus',
        action: 'removeFriend',
        variant: 'destructive'
      });
    } else if (relationship.hasPendingRequest) {
      if (relationship.requestSentByCurrentUser) {
        items.push({
          id: 'pendingRequest',
          label: '请求已发送',
          icon: 'Clock',
          action: 'addFriend',
          disabled: true
        });
      } else {
        items.push({
          id: 'acceptRequest',
          label: '接受请求',
          icon: 'Check',
          action: 'addFriend'
        });
        
        items.push({
          id: 'rejectRequest',
          label: '拒绝请求',
          icon: 'X',
          action: 'addFriend',
          variant: 'destructive'
        });
      }
    } else if (!relationship.isBlocked) {
      items.push({
        id: 'addFriend',
        label: '添加好友',
        icon: 'UserPlus',
        action: 'addFriend'
      });
    }
    
    // 拉黑相关操作
    if (relationship.isBlocked) {
      items.push({
        id: 'unblockUser',
        label: '取消拉黑',
        icon: 'Shield',
        action: 'unblockUser'
      });
    } else {
      items.push({
        id: 'blockUser',
        label: '拉黑用户',
        icon: 'UserX',
        action: 'blockUser',
        variant: 'destructive'
      });
    }
    
    return items;
  };

  // 获取图标组件
  const getIcon = (iconName: string) => {
    const iconProps = { className: 'w-4 h-4' };
    
    switch (iconName) {
      case 'User': return <User {...iconProps} />;
      case 'UserPlus': return <UserPlus {...iconProps} />;
      case 'UserMinus': return <UserMinus {...iconProps} />;
      case 'UserX': return <UserX {...iconProps} />;
      case 'MessageCircle': return <MessageCircle {...iconProps} />;
      case 'Shield': return <Shield {...iconProps} />;
      case 'Clock': return <Clock {...iconProps} />;
      case 'Check': return <Check {...iconProps} />;
      case 'X': return <X {...iconProps} />;
      default: return <User {...iconProps} />;
    }
  };

  if (!context) return null;

  const menuItems = getMenuItems();

  return (
    <>
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 z-40 bg-black/20" 
        onClick={onClose}
      />
      
      {/* 菜单内容 */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed z-50"
          style={{
            left: Math.min(context.position.x, window.innerWidth - 220),
            top: Math.min(context.position.y, window.innerHeight - (menuItems.length * 40 + 100))
          }}
        >
          <Card className="w-52 p-2 shadow-lg border border-gray-200 bg-white">
            {/* 用户信息头部 */}
            <div className="flex items-center gap-3 p-3 border-b border-gray-100 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                {context.targetUser.avatar ? (
                  <img 
                    src={context.targetUser.avatar} 
                    alt={context.targetUser.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  context.targetUser.name.charAt(0).toUpperCase()
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {context.targetUser.name}
                </div>
                <div className="text-xs text-gray-500">
                  {context.targetUser.role === 'moderator' ? '版主' : '普通用户'}
                </div>
              </div>
            </div>
            
            {/* 菜单项 */}
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Button
                  key={item.id}
                  variant={item.variant === 'destructive' ? 'destructive' : 'ghost'}
                  size="sm"
                  className={`w-full justify-start gap-2 h-8 ${
                    item.disabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => !item.disabled && handleMenuAction(item.action)}
                  disabled={item.disabled || loading}
                >
                  {getIcon(item.icon)}
                  <span className="text-sm">{item.label}</span>
                </Button>
              ))}
            </div>
            
            {/* 关系状态提示 */}
            {(relationship.isFriend || relationship.isBlocked || relationship.hasPendingRequest) && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-500 px-2">
                  {relationship.isFriend && '✓ 已是好友'}
                  {relationship.isBlocked && '🚫 已拉黑'}
                  {relationship.hasPendingRequest && relationship.requestSentByCurrentUser && '⏳ 请求已发送'}
                  {relationship.hasPendingRequest && !relationship.requestSentByCurrentUser && '📩 有待处理请求'}
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default UserInteractionMenu;