'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FileText, Shield, Eye, Lock, Calendar, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LegalDocumentCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  lastUpdated: string;
  version: string;
  type: 'privacy' | 'security';
  delay: number;
}

function LegalDocumentCard({ title, description, icon, href, lastUpdated, version, type, delay }: LegalDocumentCardProps) {
  const router = useRouter();
  
  const handleClick = () => {
    router.push(href);
  };

  const gradientClass = type === 'privacy' 
    ? 'from-blue-500/20 to-purple-500/20' 
    : 'from-red-500/20 to-orange-500/20';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className={`bg-gradient-to-br ${gradientClass} backdrop-blur-sm border border-white/30 dark:border-gray-600/30 cursor-pointer hover:shadow-lg transition-all duration-300`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-white/20">
                {icon}
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-white">
                  {title}
                </CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                    版本 {version}
                  </Badge>
                  <span className="text-white/70 text-xs">
                    {lastUpdated} 更新
                  </span>
                </div>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-white/70" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-white/80 text-sm leading-relaxed mb-4">
            {description}
          </p>
          <Button
            onClick={handleClick}
            className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/50 transition-all duration-200"
          >
            查看详情
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function LegalIndexPage() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* 页面头部 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-6">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          法律文件中心
        </h1>
        <p className="text-white/80 text-lg max-w-2xl mx-auto leading-relaxed">
          落雪公会论坛严格遵循相关法律法规，为保障用户权益和平台安全，特制定以下具有法律效力的规范性文件。
        </p>
      </motion.div>

      {/* 重要提示 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card className="bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-sm border border-amber-200/50 dark:border-amber-700/50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Eye className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">法律声明</h3>
                <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">
                  以下文件严格遵循《中华人民共和国网络安全法》《中华人民共和国数据安全法》《中华人民共和国个人信息保护法》等相关法律法规制定，具有法律约束力。用户在使用本平台服务时，必须严格遵守相关协议条款。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 法律文件列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <LegalDocumentCard
          title="用户协议与隐私政策"
          description="详细规定用户注册流程、账号管理规范、个人信息收集使用、数据保护措施等内容，保障用户合法权益。"
          icon={<Shield className="w-6 h-6 text-blue-400" />}
          href="/legal/privacy"
          lastUpdated="2024年1月"
          version="1.0"
          type="privacy"
          delay={0.2}
        />
        
        <LegalDocumentCard
          title="安全协议"
          description="严格禁止系统入侵、逆向工程等恶意行为，明确违规处罚措施和法律责任，维护平台安全。"
          icon={<Lock className="w-6 h-6 text-red-400" />}
          href="/legal/security"
          lastUpdated="2024年1月"
          version="1.0"
          type="security"
          delay={0.3}
        />
      </div>

      {/* 法律依据 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/30 dark:border-gray-600/30">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              法律依据
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-gray-50/50 dark:bg-gray-700/50">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">网络安全法</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">规范网络安全保护义务</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-gray-50/50 dark:bg-gray-700/50">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">数据安全法</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">保障数据安全与合规</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-gray-50/50 dark:bg-gray-700/50">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">个人信息保护法</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">保护个人信息权益</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 联系信息 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-8"
      >
        <Card className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/30 dark:border-gray-600/30">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white text-center">
              联系我们
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">法律事务咨询</h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>📧 legal@snowfallguild.com</p>
                  <p>📞 400-XXX-XXXX</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">安全事件报告</h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>🔒 security@snowfallguild.com</p>
                  <p>🚨 400-XXX-XXXX（24小时）</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200/30 dark:border-gray-600/30">
              <p className="text-center text-xs text-gray-500 dark:text-gray-500">
                本页面所有法律文件在法律允许的范围内由落雪公会论坛负责解释
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}