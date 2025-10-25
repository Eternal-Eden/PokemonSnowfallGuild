'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Shield, Calendar, AlertTriangle, Lock } from 'lucide-react';
import { securityAgreementData } from '@/data/legal/security-agreement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SectionProps {
  section: {
    id: string;
    title: string;
    content: string;
  };
  isExpanded: boolean;
  onToggle: () => void;
}

function Section({ section, isExpanded, onToggle }: SectionProps) {
  return (
    <motion.div
      layout
      className="mb-4"
    >
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="cursor-pointer"
        onClick={onToggle}
      >
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Shield className="w-5 h-5 mr-2 text-red-500" />
                {section.title}
              </CardTitle>
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </motion.div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card className="mt-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-white/30 dark:border-gray-600/30">
              <CardContent className="pt-6">
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  {section.content.split('\n').map((paragraph, index) => {
                    if (paragraph.trim() === '') return null;
                    
                    // 检查是否是标题（以数字开头或包含特定格式）
                    const isTitle = /^\d+\.\d+/.test(paragraph.trim()) || paragraph.includes('：');
                    const isSubTitle = paragraph.trim().startsWith('- ') && paragraph.includes('：');
                    
                    if (isTitle && !isSubTitle) {
                      return (
                        <h4 key={index} className="font-semibold text-gray-900 dark:text-white mt-4 mb-2 first:mt-0">
                          {paragraph.trim()}
                        </h4>
                      );
                    }
                    
                    if (isSubTitle) {
                      return (
                        <h5 key={index} className="font-medium text-gray-800 dark:text-gray-200 mt-3 mb-2">
                          {paragraph.trim()}
                        </h5>
                      );
                    }
                    
                    // 检查是否是列表项
                    if (paragraph.trim().startsWith('- ')) {
                      return (
                        <li key={index} className="text-gray-700 dark:text-gray-300 mb-1 ml-4 list-disc">
                          {paragraph.trim().substring(2)}
                        </li>
                      );
                    }
                    
                    return (
                      <p key={index} className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                        {paragraph.trim()}
                      </p>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function SecurityAgreementPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandAll, setExpandAll] = useState(false);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const toggleAll = () => {
    if (expandAll) {
      setExpandedSections(new Set());
    } else {
      setExpandedSections(new Set(securityAgreementData.sections.map(s => s.id)));
    }
    setExpandAll(!expandAll);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* 文档头部 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Card className="bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-sm border border-white/30 dark:border-gray-600/30">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-white mb-2 flex items-center">
                  <Lock className="w-6 h-6 mr-3 text-red-400" />
                  {securityAgreementData.title}
                </CardTitle>
                <div className="flex items-center space-x-4 text-white/80">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span className="text-sm">生效日期：{securityAgreementData.effectiveDate}</span>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    版本 {securityAgreementData.version}
                  </Badge>
                </div>
              </div>
              <Button
                onClick={toggleAll}
                variant="outline"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                {expandAll ? (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    收起全部
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4 mr-2" />
                    展开全部
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* 安全警告 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Card className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200/50 dark:border-red-700/50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">安全警告</h3>
                <p className="text-red-700 dark:text-red-300 text-sm leading-relaxed mb-3">
                  本安全协议具有法律约束力，违反协议条款将承担相应的法律责任。严禁任何形式的系统入侵、逆向工程及恶意攻击行为。
                </p>
                <div className="bg-red-100/50 dark:bg-red-800/30 rounded-lg p-3 border border-red-200/50 dark:border-red-700/50">
                  <p className="text-red-800 dark:text-red-200 text-sm font-medium">
                    ⚠️ 违规行为将被记录并可能移交司法机关处理
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 目录导航 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/30 dark:border-gray-600/30">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">目录</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {securityAgreementData.sections.map((section, index) => (
                <motion.button
                  key={section.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleSection(section.id)}
                  className="text-left p-3 rounded-lg bg-gray-50/50 dark:bg-gray-700/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/80 transition-colors duration-200 border border-gray-200/30 dark:border-gray-600/30"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {index + 1}. {section.title}
                  </span>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 协议内容 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {securityAgreementData.sections.map((section) => (
          <Section
            key={section.id}
            section={section}
            isExpanded={expandedSections.has(section.id)}
            onToggle={() => toggleSection(section.id)}
          />
        ))}
      </motion.div>

      {/* 紧急联系信息 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 mb-8"
      >
        <Card className="bg-orange-50/80 dark:bg-orange-900/20 backdrop-blur-sm border border-orange-200/30 dark:border-orange-700/30">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-orange-800 dark:text-orange-200 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              安全事件报告
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">紧急联系方式</h4>
                <ul className="space-y-1 text-orange-700 dark:text-orange-300">
                  <li>• 安全邮箱：security@snowfallguild.com</li>
                  <li>• 应急热线：400-XXX-XXXX（24小时）</li>
                  <li>• 举报邮箱：report@snowfallguild.com</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">法律依据</h4>
                <ul className="space-y-1 text-orange-700 dark:text-orange-300">
                  <li>• 《网络安全法》</li>
                  <li>• 《数据安全法》</li>
                  <li>• 《刑法》相关条款</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 页脚信息 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 mb-8"
      >
        <Card className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/30 dark:border-gray-600/30">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p className="mb-2">
                本协议最后更新时间：{securityAgreementData.lastUpdated}
              </p>
              <p className="mb-2">
                如有疑问，请联系我们：security@snowfallguild.com
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                本协议在法律允许的范围内由落雪公会论坛负责解释
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}