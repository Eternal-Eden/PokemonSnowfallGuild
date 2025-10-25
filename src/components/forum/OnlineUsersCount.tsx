'use client';

import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { api } from '@/lib/api';

interface OnlineUsersCountProps {
  className?: string;
}

export default function OnlineUsersCount({ className = '' }: OnlineUsersCountProps) {
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOnlineUsersCount();
    
    // 每30秒更新一次在线用户数
    const interval = setInterval(loadOnlineUsersCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadOnlineUsersCount = async () => {
    try {
      const response = await fetch('/api/users/online-count');
      const data = await response.json();
      
      if (data.success) {
        setOnlineCount(data.data.count || 0);
      }
    } catch (error) {
      console.error('获取在线用户数失败:', error);
      // 发生错误时显示0
      setOnlineCount(0);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <span className={`flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full ${className}`}>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <Users className="w-4 h-4" />
        <span className="font-medium">在线: --</span>
      </span>
    );
  }

  return (
    <span className={`flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full ${className}`}>
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <Users className="w-4 h-4" />
      <span className="font-medium">在线: {onlineCount}</span>
    </span>
  );
}