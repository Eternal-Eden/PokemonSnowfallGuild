'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Download, Copy, X, Check } from 'lucide-react';
import { User } from '@/types/auth';
import { AuthUser } from '@/lib/auth-client';
import { ForumPost } from '@/types/forum';
import UserAvatar from '@/components/UserAvatar';
import html2canvas from 'html2canvas';

interface ShareCardProps {
  type: 'profile' | 'post';
  user?: AuthUser;
  post?: ForumPost;
  userStats?: {
    followersCount: number;
    followingCount: number;
    postsCount: number;
    likesReceived: number;
  };
  userProfile?: {
    bio?: string;
    location?: string;
    joinedAt: Date;
  };
  onClose: () => void;
}

export default function ShareCard({ type, user, post, userStats, userProfile, onClose }: ShareCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 生成分享链接
  const getShareUrl = () => {
    const baseUrl = window.location.origin;
    if (type === 'profile' && user) {
      return `${baseUrl}/profile/${user.id}`;
    } else if (type === 'post' && post) {
      return `${baseUrl}/forum/post/${post.id}`;
    }
    return baseUrl;
  };

  // 复制链接到剪贴板
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  // 下载分享卡片
  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        width: cardRef.current.offsetWidth * 2,
        height: cardRef.current.offsetHeight * 2,
        useCORS: true,
        allowTaint: true
      });
      
      const link = document.createElement('a');
      link.download = `${type === 'profile' ? '个人主页' : '帖子'}_分享卡片.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Failed to generate card:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // 格式化日期
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // 截取文本
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

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
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              分享{type === 'profile' ? '个人主页' : '帖子'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* 分享卡片预览 */}
          <div className="p-6">
            <div
              ref={cardRef}
              className="rounded-3xl p-8 border-2 border-white/30 shadow-2xl relative overflow-hidden"
              style={{
                backgroundImage: 'url(https://i1.mcobj.com/uploads/20220111_dc518b9e59108.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {/* 背景遮罩 */}
              <div className="absolute inset-0 bg-black/40"></div>
              {/* 个人主页卡片 */}
                {type === 'profile' && user && (
                  <div className="space-y-6 relative z-10">
                  {/* 用户信息 */}
                  <div className="flex items-center space-x-4">
                    <UserAvatar user={user} size="lg" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-xl font-bold text-white">
                          {user.username}
                        </h3>
                      </div>
                      {user.gameNickname && (
                        <p className="text-sm text-white">
                          游戏昵称: {user.gameNickname}
                        </p>
                      )}
                      <p className="text-xs text-white">
                        ID: {user.id}
                      </p>
                    </div>
                  </div>

                  {/* 个人简介 */}
                  {userProfile?.bio && (
                    <div className="bg-black/30 rounded-lg p-3">
                      <p className="text-sm text-white">
                        {truncateText(userProfile.bio, 100)}
                      </p>
                    </div>
                  )}

                  {/* 统计信息 */}
                  {userStats && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black/30 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-white">
                          {userStats.followersCount}
                        </div>
                        <div className="text-xs text-white">粉丝</div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-white">
                          {userStats.postsCount}
                        </div>
                        <div className="text-xs text-white">帖子</div>
                      </div>
                    </div>
                  )}

                  {/* 加入时间 */}
                  {userProfile?.joinedAt && (
                    <div className="text-center">
                      <p className="text-xs text-white">
                        {formatDate(userProfile.joinedAt)} 加入落雪公会
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 帖子卡片 */}
              {type === 'post' && post && (
                <div className="space-y-4">
                  {/* 作者信息 */}
                  <div className="flex items-center space-x-3">
                    <UserAvatar 
                      user={{ id: post.authorId, username: post.authorName }} 
                      size="md" 
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white">
                          {post.authorName}
                        </span>
                      </div>
                      <p className="text-xs text-white">
                        {formatDate(post.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* 帖子标题 */}
                  <div className="bg-black/30 rounded-lg p-3">
                    <h3 className="font-bold text-white mb-2">
                      {truncateText(post.title, 50)}
                    </h3>
                    {post.content && (
                      <p className="text-sm text-white">
                        {truncateText(post.content.replace(/<[^>]*>/g, ''), 120)}
                      </p>
                    )}
                  </div>

                  {/* 帖子统计 */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <div className="text-sm font-bold text-white">
                        {post.likeCount || 0}
                      </div>
                      <div className="text-xs text-white">点赞</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <div className="text-sm font-bold text-white">
                        {post.replyCount || 0}
                      </div>
                      <div className="text-xs text-white">回复</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <div className="text-sm font-bold text-white">
                        {post.viewCount || 0}
                      </div>
                      <div className="text-xs text-white">浏览</div>
                    </div>
                  </div>

                  {/* 帖子类型 */}
                  <div className="text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${
                      post.type === 'discussion'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                    }`}>
                      {post.type === 'discussion' ? '交流帖' : '精灵租借'}
                    </span>
                  </div>
                </div>
              )}

              {/* 水印 */}
              <div className="mt-4 pt-3 border-t border-white/30 text-center relative z-10">
                <p className="text-xs text-white">
                  来自 落雪宝可梦公会
                </p>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <button
              onClick={handleDownloadCard}
              disabled={isGenerating}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>{isGenerating ? '生成中...' : '下载分享卡片'}</span>
            </button>
            
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-green-600">已复制链接</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>复制分享链接</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}