'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BackgroundCarousel } from '@/components/background/BackgroundCarousel';
import { ArrowLeft, FileText, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface LegalLayoutProps {
  children: React.ReactNode;
}

export default function LegalLayout({ children }: LegalLayoutProps) {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <BackgroundCarousel />
      
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-20 right-0 w-80 h-80 bg-purple-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-pink-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* 页面头部 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 border-b border-white/20 dark:border-gray-700/20 bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="ghost" 
                onClick={handleGoBack}
                className="bg-white/50 dark:bg-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-700/80 border border-white/30 dark:border-gray-600/30 rounded-xl px-4 py-2 transition-all duration-200 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回
              </Button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-4"
            >
              <div className="flex items-center space-x-2 text-white">
                <FileText className="w-5 h-5" />
                <span className="font-medium">法律文件</span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* 主要内容区域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative z-10 container mx-auto px-4 py-8"
      >
        {children}
      </motion.div>
    </div>
  );
}