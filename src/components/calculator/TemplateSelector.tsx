'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Filter, SortAsc, SortDesc, Loader2 } from 'lucide-react';
import { PokemonTemplate, TemplateFilter, TemplateListResponse, FlattenedTemplate } from '@/types/pokemonCalculator';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: any) => void; // Accept any template structure
  title: string;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  title
}) => {
  const [templates, setTemplates] = useState<FlattenedTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'level' | 'created_at'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 获取模板列表
  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (levelFilter) params.append('level', levelFilter.toString());
      params.append('sort', sortBy);
      params.append('order', sortOrder);
      
      const response = await fetch(`/api/templates?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || '获取模板列表失败');
        return;
      }
      
      const data: TemplateListResponse = await response.json();
      // 确保data和data.data都存在，并且data.data是数组
      if (data && Array.isArray(data.data)) {
        setTemplates(data.data);
      } else {
        setTemplates([]);
        console.warn('API返回的数据格式不正确:', data);
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
      console.error('获取模板列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时和搜索条件变化时获取数据
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen, searchTerm, levelFilter, sortBy, sortOrder]);

  // 处理模板选择
  const handleTemplateSelect = async (template: FlattenedTemplate) => {
    try {
      // 获取完整的模板数据
      const response = await fetch(`/api/templates/${template.id}`);
      
      // 检查响应状态
      if (!response.ok) {
        console.error('API响应错误:', response.status, response.statusText);
        setError(`获取模板详情失败: ${response.status} ${response.statusText}`);
        return;
      }
      
      // 检查响应的Content-Type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('API返回了非JSON响应:', contentType);
        const responseText = await response.text();
        console.error('响应内容:', responseText.substring(0, 200) + '...');
        setError('服务器返回了错误的响应格式，请检查API服务是否正常运行');
        return;
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        onSelect(data.data);
        onClose();
      } else {
        console.error('API返回错误:', data);
        setError(data.message || '获取模板详情失败');
      }
    } catch (err) {
      console.error('获取模板详情失败:', err);
      if (err instanceof SyntaxError && err.message.includes('Unexpected token')) {
        setError('服务器返回了无效的JSON数据，可能是API服务未正常启动');
      } else {
        setError('网络错误或服务器异常，请稍后重试');
      }
    }
  };

  // 重置搜索条件
  const resetFilters = () => {
    setSearchTerm('');
    setLevelFilter(null);
    setSortBy('name');
    setSortOrder('asc');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 搜索和过滤器 */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索宝可梦名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 等级过滤 */}
            <select
              value={levelFilter || ''}
              onChange={(e) => setLevelFilter(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">所有等级</option>
              <option value="50">Lv.50</option>
              <option value="100">Lv.100</option>
            </select>

            {/* 排序 */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as 'name' | 'level' | 'created_at');
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name-asc">名称 A-Z</option>
              <option value="name-desc">名称 Z-A</option>
              <option value="level-asc">等级 低-高</option>
              <option value="level-desc">等级 高-低</option>
              <option value="created_at-desc">最新创建</option>
              <option value="created_at-asc">最早创建</option>
            </select>

            {/* 重置按钮 */}
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              重置
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">加载中...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchTemplates}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                重试
              </button>
            </div>
          )}

          {!loading && !error && (!templates || templates.length === 0) && (
            <div className="text-center py-12">
              <p className="text-gray-500">没有找到匹配的模板</p>
            </div>
          )}

          {!loading && !error && templates && templates.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{template.pokemon?.nameChinese || template.name}</h3>
                    <span className="text-sm text-gray-500">Lv.{template.level}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(template.pokemon?.types || []).map((type, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>性格: {template.nature}</p>
                    <p>特性: {template.ability}</p>
                    {template.item && (
                      <p>道具: {template.item}</p>
                    )}
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    {template.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;