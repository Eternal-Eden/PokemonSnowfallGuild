'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { api } from '@/lib/api';

interface TodayPostsCountProps {
  className?: string;
}

export default function TodayPostsCount({ className = '' }: TodayPostsCountProps) {
  const [todayCount, setTodayCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayPostsCount();
    
    // 每5分钟更新一次今日帖子数
    const interval = setInterval(loadTodayPostsCount, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const loadTodayPostsCount = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const response = await fetch('/api/forum/posts/today-count');
      const data = await response.json();
      
      if (data.success) {
        setTodayCount(data.data.count || 0);
      }
    } catch (error) {
      console.error('获取今日帖子数失败:', error);
      // 发生错误时显示0
      setTodayCount(0);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <span className={`flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full ${className}`}>
        <BarChart3 className="w-4 h-4" />
        <span className="font-medium">今日帖子: --</span>
      </span>
    );
  }

  return (
    <span className={`flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full ${className}`}>
      <BarChart3 className="w-4 h-4" />
      <span className="font-medium">今日帖子: {todayCount}</span>
    </span>
  );
}