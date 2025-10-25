'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, Copy, CheckCircle, Eye, EyeOff, FileText } from 'lucide-react';
import { 
  generateYamlTemplate, 
  downloadYamlFile, 
  Template, 
  PokemonInfo,
  calculateEVTotal,
  validateEVs,
  validateIVs
} from '../utils/yamlGenerator';
import { ExtendedAbilityData } from '@/utils/abilityDataProcessor';

interface YamlPreviewProps {
  template: Template;
  pokemonInfo?: PokemonInfo;
  abilityData?: ExtendedAbilityData | null;
  className?: string;
}

export function YamlPreview({ template, pokemonInfo, abilityData, className = '' }: YamlPreviewProps) {
  const [yamlContent, setYamlContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showComments, setShowComments] = useState(true);

  // 生成YAML内容
  const generateYaml = async () => {
    if (!template.name || !pokemonInfo) {
      setYamlContent('# 请填写模板名称并选择Pokemon');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const yaml = await generateYamlTemplate(template, pokemonInfo, abilityData || undefined);
      setYamlContent(yaml);
    } catch (err) {
      console.error('生成YAML失败:', err);
      setError('生成YAML预览失败，请检查输入数据');
      setYamlContent('# 生成失败，请检查输入数据');
    } finally {
      setLoading(false);
    }
  };

  // 当模板数据变化时重新生成YAML
  useEffect(() => {
    generateYaml();
  }, [template, pokemonInfo, abilityData]);

  // 处理复制功能
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(yamlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 检查是否为错误消息
  const isErrorMessage = (content: string): boolean => {
    if (!content) return true;
    
    // 检查是否为错误提示消息
    const errorMessages = [
      '# 请填写模板名称并选择Pokemon',
      '# 生成失败，请检查输入数据'
    ];
    
    return errorMessages.some(msg => content.startsWith(msg));
  };

  // 处理下载功能
  const handleDownload = () => {
    if (!yamlContent || isErrorMessage(yamlContent)) {
      return;
    }

    const filename = template.name 
      ? `${template.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_template`
      : 'pokemon_template';
    
    downloadYamlFile(yamlContent, filename);
  };

  // 移除或保留注释
  const displayContent = useMemo(() => {
    if (!showComments && yamlContent) {
      return yamlContent
        .split('\n')
        .filter(line => !line.trim().startsWith('#'))
        .join('\n')
        .replace(/\n\s*\n\s*\n/g, '\n\n'); // 清理多余的空行
    }
    return yamlContent;
  }, [yamlContent, showComments]);

  // 验证数据
  const evValidation = validateEVs(template.templateData.evs);
  const ivValidation = validateIVs(template.templateData.ivs);
  const evTotal = calculateEVTotal(template.templateData.evs);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-fit min-h-[400px] lg:min-h-[600px] flex flex-col ${className}`}>
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            YAML 预览
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 显示/隐藏注释按钮 */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title={showComments ? '隐藏注释' : '显示注释'}
          >
            {showComments ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>

          {/* 复制按钮 */}
          <button
            onClick={handleCopy}
            disabled={!yamlContent || isErrorMessage(yamlContent)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="复制YAML内容"
          >
            {copied ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          {/* 下载按钮 */}
          <button
            onClick={handleDownload}
            disabled={!yamlContent || isErrorMessage(yamlContent)}
            className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="下载YAML文件"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">下载</span>
          </button>
        </div>
      </div>

      {/* 验证状态 */}
      {(!evValidation.isValid || !ivValidation.isValid) && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="text-sm text-red-700 dark:text-red-300 space-y-1">
            {!evValidation.isValid && (
              <div>⚠️ 努力值错误: {evValidation.message}</div>
            )}
            {!ivValidation.isValid && (
              <div>⚠️ 个体值错误: {ivValidation.message}</div>
            )}
          </div>
        </div>
      )}

      {/* 统计信息 */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">努力值总计:</span>
            <span className={`font-medium ${evTotal > 510 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
              {evTotal}/510
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">技能数量:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {template.templateData.moves.filter(move => move.trim()).length}/4
            </span>
          </div>
        </div>
      </div>

      {/* YAML内容 */}
      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>生成中...</span>
            </div>
          </div>
        )}

        <pre className="p-4 text-sm font-mono text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 overflow-auto h-full min-h-[300px] lg:min-h-[500px] whitespace-pre-wrap">
          {error ? (
            <span className="text-red-600 dark:text-red-400">{error}</span>
          ) : (
            displayContent
          )}
        </pre>
      </div>

      {/* 底部信息 */}
      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <span>
            {yamlContent ? `${displayContent.split('\n').length} 行` : '等待生成...'}
          </span>
          <span>
            格式: YAML | 编码: UTF-8
          </span>
        </div>
      </div>
    </div>
  );
}

export default YamlPreview;