'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Database,
  Calendar,
  Users,
  FileText,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface StatisticsData {
  totalTraces: number;
  totalSnapshots: number;
  operationStats: Array<{
    operation: string;
    count: number;
  }>;
  dailyStats?: Array<{
    date: string;
    count: number;
  }>;
  userStats?: Array<{
    userId: string;
    username: string;
    count: number;
  }>;
}

interface TraceStatisticsProps {
  className?: string;
}

export default function TraceStatistics({ className = '' }: TraceStatisticsProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/trace/statistics?range=${timeRange}`, {
        headers: {
          'Authorization': user?.token ? `Bearer ${user.token}` : ''
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      } else {
        console.error('获取追溯统计失败:', response.statusText);
      }
    } catch (error) {
      console.error('获取追溯统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [timeRange]);

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'CREATE':
        return <Zap className="w-5 h-5 text-green-600" />;
      case 'UPDATE':
        return <Activity className="w-5 h-5 text-blue-600" />;
      case 'DELETE':
        return <FileText className="w-5 h-5 text-red-600" />;
      default:
        return <Database className="w-5 h-5 text-gray-600" />;
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'CREATE':
        return 'text-green-600 bg-green-50';
      case 'UPDATE':
        return 'text-blue-600 bg-blue-50';
      case 'DELETE':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`bg-white rounded-lg border p-6 text-center ${className}`}>
        <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">暂无统计数据</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* 标题和时间范围选择 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">追溯统计</h3>
          </div>
          
          <div className="flex gap-2">
            {[
              { value: '7d', label: '7天' },
              { value: '30d', label: '30天' },
              { value: '90d', label: '90天' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value as any)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  timeRange === option.value
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* 总体统计 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">总追溯记录</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalTraces}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600 rounded-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">数据快照</p>
                <p className="text-2xl font-bold text-green-900">{stats.totalSnapshots}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">平均每日</p>
                <p className="text-2xl font-bold text-purple-900">
                  {Math.round(stats.totalTraces / (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90))}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 操作类型统计 */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">操作类型分布</h4>
          <div className="space-y-3">
            {stats.operationStats.map((stat, index) => {
              const percentage = stats.totalTraces > 0 ? (stat.count / stats.totalTraces) * 100 : 0;
              
              return (
                <motion.div
                  key={stat.operation}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className={`flex items-center gap-2 min-w-[100px] px-3 py-2 rounded-lg ${getOperationColor(stat.operation)}`}>
                    {getOperationIcon(stat.operation)}
                    <span className="font-medium">{stat.operation}</span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">{stat.count} 次</span>
                      <span className="text-sm text-gray-500">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                        className={`h-2 rounded-full ${
                          stat.operation === 'CREATE' ? 'bg-green-500' :
                          stat.operation === 'UPDATE' ? 'bg-blue-500' :
                          stat.operation === 'DELETE' ? 'bg-red-500' : 'bg-gray-500'
                        }`}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 用户活跃度统计 */}
        {stats.userStats && stats.userStats.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">用户活跃度</h4>
            <div className="space-y-2">
              {stats.userStats.slice(0, 5).map((userStat, index) => (
                <motion.div
                  key={userStat.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {userStat.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{userStat.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{userStat.count} 次操作</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 bg-blue-500 rounded-full"
                        style={{
                          width: `${(userStat.count / Math.max(...stats.userStats!.map(u => u.count))) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}