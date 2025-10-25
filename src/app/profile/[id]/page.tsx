'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, UserRole } from '@/types/auth';
import { AuthUser } from '@/lib/auth-client';
import { getUserProfile } from '@/lib/userProfile';
import { getUserById, getCurrentUserInfo } from '@/lib/auth-client';
import { useAuth } from '@/contexts/AuthContext';
import UserProfile from '@/components/UserProfile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Star } from 'lucide-react';
import { BackgroundCarousel } from '@/components/background/BackgroundCarousel';



export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { state } = useAuth();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, [params?.id]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取目标用户数据
      const targetUserId = params?.id as string;
      
      // 检查是否是当前用户访问自己的主页
      if (state.user && (state.user.id === targetUserId || state.user.uniqueId === targetUserId)) {
        // 获取当前用户的完整信息（包括敏感信息和隐私设置）
        const currentUserInfo = await getCurrentUserInfo();
        if (currentUserInfo) {
          setUser(currentUserInfo);
        } else {
          // 如果获取失败，使用state中的用户数据作为备选
          setUser(state.user);
        }
        return;
      }
      
      // 获取指定用户的公开信息（根据隐私设置过滤）
      const targetUser = await getUserById(targetUserId);
      
      if (!targetUser) {
        setError('用户不存在');
        return;
      }

      setUser(targetUser);
    } catch (error) {
      console.error('加载用户数据失败:', error);
      setError('加载用户数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <BackgroundCarousel />
        {/* 背景装饰 */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-300/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="relative mb-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white animate-spin" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full animate-ping"></div>
            </div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
            >
              加载中...
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 dark:text-gray-400"
            >
              正在获取用户信息
            </motion.p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <BackgroundCarousel />
        {/* 背景装饰 */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-red-300/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-300/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="container mx-auto px-4 py-8 max-w-2xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 overflow-hidden"
          >
            <div className="text-center py-16 px-8">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                className="relative mb-8"
              >
                <div className="w-24 h-24 mx-auto bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-4xl text-white">⚠️</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/30 to-orange-400/30 rounded-full animate-ping"></div>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-4"
              >
                {error || '用户不存在'}
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 dark:text-gray-300 mb-8 text-lg leading-relaxed max-w-md mx-auto"
              >
                {error === '用户不存在' 
                  ? '您访问的用户不存在，请检查用户ID是否正确。'
                  : '加载用户信息时出现问题，请稍后重试。'
                }
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button 
                  onClick={handleGoBack}
                  className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  返回
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const isOwnProfile = state.user?.id === user.id;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <BackgroundCarousel />
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-20 right-0 w-80 h-80 bg-purple-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-pink-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-indigo-300/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        
        {/* 装饰性星星 */}
        <div className="absolute top-32 left-1/4 animate-pulse">
          <Star className="w-6 h-6 text-blue-300/40" />
        </div>
        <div className="absolute top-64 right-1/3 animate-pulse delay-300">
          <Sparkles className="w-8 h-8 text-purple-300/40" />
        </div>
        <div className="absolute bottom-32 left-1/2 animate-pulse delay-600">
          <Star className="w-5 h-5 text-pink-300/40" />
        </div>
      </div>
      
      {/* 导航栏 */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 border-b border-white/20 dark:border-gray-700/20"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="ghost" 
                onClick={handleGoBack}
                className="bg-white/50 dark:bg-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-700/80 border border-white/30 dark:border-gray-600/30 rounded-xl px-4 py-2 transition-all duration-200 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回
              </Button>
            </motion.div>
            

          </div>
        </div>
      </motion.div>

      {/* 用户主页内容 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative z-10"
      >
        <UserProfile 
          user={user}
          currentUser={state.user}
          isOwnProfile={isOwnProfile}
        />
      </motion.div>
    </div>
  );
}