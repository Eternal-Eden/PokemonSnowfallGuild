'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, FileText, Calendar, Shield, Eye } from 'lucide-react';
import { privacyPolicyData } from '@/data/legal/privacy-policy';
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
                <FileText className="w-5 h-5 mr-2 text-blue-500" />
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
                    
                    if (isTitle) {
                      return (
                        <h4 key={index} className="font-semibold text-gray-900 dark:text-white mt-4 mb-2 first:mt-0">
                          {paragraph.trim()}
                        </h4>
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

export default function PrivacyPolicyPage() {
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
      setExpandedSections(new Set(privacyPolicyData.sections.map(s => s.id)));
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
        <Card className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/30 dark:border-gray-600/30">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-white mb-2 flex items-center">
                  <Shield className="w-6 h-6 mr-3 text-blue-400" />
                  {privacyPolicyData.title}
                </CardTitle>
                <div className="flex items-center space-x-4 text-white/80">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span className="text-sm">生效日期：{privacyPolicyData.effectiveDate}</span>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    版本 {privacyPolicyData.version}
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

      {/* 重要提示 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Card className="bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-sm border border-amber-200/50 dark:border-amber-700/50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Eye className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">重要提示</h3>
                <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">
                  请您在使用落雪公会论坛服务前仔细阅读并充分理解本协议的全部内容。本协议严格遵循《网络安全法》《数据安全法》《个人信息保护法》等相关法律法规制定，具有法律约束力。您的注册、登录或使用行为将视为您已阅读并同意接受本协议的约束。
                </p>
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
              {privacyPolicyData.sections.map((section, index) => (
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
        {privacyPolicyData.sections.map((section) => (
          <Section
            key={section.id}
            section={section}
            isExpanded={expandedSections.has(section.id)}
            onToggle={() => toggleSection(section.id)}
          />
        ))}
      </motion.div>

      {/* 页脚信息 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 mb-8"
      >
        <Card className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/30 dark:border-gray-600/30">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p className="mb-2">
                本协议最后更新时间：{privacyPolicyData.lastUpdated}
              </p>
              <p>
                如有疑问，请联系我们：privacy@snowfallguild.com
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}