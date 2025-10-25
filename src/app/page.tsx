'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Snowflake } from 'lucide-react';
import MainNavigation from '@/components/navigation/MainNavigation';

interface HitokotoData {
  hitokoto: string;
  from: string;
  from_who: string;
}

export default function Home() {
  const { state } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hitokoto, setHitokoto] = useState<HitokotoData | null>(null);
  const [loading, setLoading] = useState(true);

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 获取一言
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;
    
    const fetchHitokoto = async () => {
      try {
        // 检查组件是否仍然挂载和信号是否已中止
        if (!isMounted || controller.signal.aborted) return;
        
        const response = await fetch('/api/hitokoto?c=b', {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        });
        
        // 再次检查组件是否仍然挂载和信号是否已中止
        if (!isMounted || controller.signal.aborted) return;
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 只有在组件仍然挂载且信号未中止时才更新状态
        if (isMounted && !controller.signal.aborted) {
          setHitokoto({
            hitokoto: data.hitokoto,
            from: data.from,
            from_who: data.from_who
          });
        }
      } catch (error) {
        // 忽略 AbortError，这是正常的取消操作
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        
        // 如果组件已经卸载或信号已中止，直接返回，不处理错误
        if (!isMounted || controller.signal.aborted) return;
        
        console.error('获取一言失败:', error);
        
        // 只有在组件仍然挂载且信号未中止时才更新状态
        if (isMounted && !controller.signal.aborted) {
          setHitokoto({
            hitokoto: '愿你的每一天都充满阳光与希望',
            from: '落雪公会',
            from_who: ''
          });
        }
      } finally {
        // 只有在组件仍然挂载且信号未中止时才更新加载状态
        if (isMounted && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    // 使用 setTimeout 来避免在组件挂载期间立即执行
    timeoutId = setTimeout(() => {
      if (isMounted && !controller.signal.aborted) {
        fetchHitokoto();
      }
    }, 0);
    
    // 清理函数
    return () => {
      isMounted = false;
      
      // 清理定时器
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      // 安全地中止请求
      try {
        if (!controller.signal.aborted) {
          controller.abort();
        }
      } catch (error) {
        // 静默忽略 abort 错误，这是正常的清理操作
      }
    };
  }, []);





  const formatTime = (date: Date) => {
    return {
      time: date.toLocaleTimeString('zh-CN', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      date: date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
    };
  };

  const { time, date } = formatTime(currentTime);

  if (!state.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg rounded-3xl p-12 shadow-2xl border border-white/30 dark:border-gray-600/30">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Snowflake className="w-16 h-16 text-blue-500 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              落雪公会
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
              Pokemon Snowfall Guild
            </p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-500 dark:text-gray-400"
            >
              请先登录以访问公会系统
            </motion.p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* 导航栏 */}
      <MainNavigation />
      
      {/* 主要内容 */}
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg rounded-3xl p-12 shadow-2xl border border-white/30 dark:border-gray-600/30 max-w-2xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-8">
              <Snowflake className="w-16 h-16 text-blue-500 mr-4" />
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
                落雪公会
              </h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Pokemon Snowfall Guild Management System
            </p>
            
            {/* 一言显示 */}
            {!loading && hitokoto && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-8"
              >
                <div className="text-lg text-gray-700 dark:text-gray-300 mb-3 italic leading-relaxed">
                  &ldquo;{hitokoto.hitokoto}&rdquo;
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  —— {hitokoto.from}{hitokoto.from_who && ` · ${hitokoto.from_who}`}
                </div>
              </motion.div>
            )}
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/40 dark:border-gray-600/40"
            >
              <div className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400 mb-2">
                {time}
              </div>
              <div className="text-base text-gray-600 dark:text-gray-300">
                {date}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
