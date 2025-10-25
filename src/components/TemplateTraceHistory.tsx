'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  Clock, 
  User, 
  Eye, 
  ChevronDown, 
  ChevronUp,
  GitBranch,
  Calendar,
  Activity,
  FileText,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface TraceRecord {
  id: string;
  traceId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  operatorId: string;
  operatorName?: string;
  timestamp: string;
  metadata?: any;
  snapshot?: {
    id: string;
    data: any;
    createdAt: string;
  };
}

interface TemplateTraceHistoryProps {
  templateId: string;
  className?: string;
}

export default function TemplateTraceHistory({ templateId, className = '' }: TemplateTraceHistoryProps) {
  const { user } = useAuth();
  const [traces, setTraces] = useState<TraceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [selectedTrace, setSelectedTrace] = useState<TraceRecord | null>(null);
  const [showSnapshot, setShowSnapshot] = useState(false);

  const fetchTraceHistory = async () => {
    if (!templateId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/templates/${templateId}/trace`, {
        headers: {
          'Authorization': user?.token ? `Bearer ${user.token}` : ''
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTraces(data.data || []);
      } else {
        console.error('获取追溯历史失败:', response.statusText);
      }
    } catch (error) {
      console.error('获取追溯历史失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded && templateId) {
      fetchTraceHistory();
    }
  }, [expanded, templateId]);

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'CREATE':
        return <Zap className="w-4 h-4 text-green-600" />;
      case 'UPDATE':
        return <Activity className="w-4 h-4 text-blue-600" />;
      case 'DELETE':
        return <FileText className="w-4 h-4 text-red-600" />;
      default:
        return <GitBranch className="w-4 h-4 text-gray-600" />;
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'CREATE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('zh-CN'),
      time: date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      })
    };
  };

  const viewSnapshot = (trace: TraceRecord) => {
    setSelectedTrace(trace);
    setShowSnapshot(true);
  };

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* 标题栏 */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">追溯历史</h3>
          {traces.length > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {traces.length} 条记录
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </div>

      {/* 展开内容 */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-200">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">加载追溯历史...</p>
                </div>
              ) : traces.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>暂无追溯记录</p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {traces.map((trace, index) => {
                    const { date, time } = formatTimestamp(trace.timestamp);
                    
                    return (
                      <motion.div
                        key={trace.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {/* 操作图标 */}
                        <div className="flex-shrink-0 mt-1">
                          {getOperationIcon(trace.operation)}
                        </div>

                        {/* 主要内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded border ${getOperationColor(trace.operation)}`}>
                              {trace.operation}
                            </span>
                            <span className="text-sm text-gray-600">
                              追溯ID: {trace.traceId}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>{trace.operatorName || trace.operatorId}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{time}</span>
                            </div>
                          </div>

                          {/* 元数据 */}
                          {trace.metadata && (
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">变更信息:</span>
                              <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                                {JSON.stringify(trace.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex-shrink-0">
                          {trace.snapshot && (
                            <button
                              onClick={() => viewSnapshot(trace)}
                              className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              查看快照
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 快照查看模态框 */}
      <AnimatePresence>
        {showSnapshot && selectedTrace && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSnapshot(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-4xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    数据快照 - {selectedTrace.operation}
                  </h3>
                  <button
                    onClick={() => setShowSnapshot(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  追溯ID: {selectedTrace.traceId} | 
                  时间: {formatTimestamp(selectedTrace.timestamp).date} {formatTimestamp(selectedTrace.timestamp).time}
                </p>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {selectedTrace.snapshot ? (
                  <pre className="text-sm bg-gray-50 p-4 rounded border overflow-x-auto">
                    {JSON.stringify(selectedTrace.snapshot.data, null, 2)}
                  </pre>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    该记录没有关联的数据快照
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}