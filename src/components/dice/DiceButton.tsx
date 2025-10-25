'use client';

import React, { useState } from 'react';
import { Dices } from 'lucide-react';
import { motion } from 'framer-motion';
import { HoverAnimation } from '@/components/animations/AnimationComponents';
import { useSettings } from '@/contexts/SettingsContext';
import { getRandomBackgroundImage, createBackgroundImage } from '@/utils/backgroundUtils';

interface DiceButtonProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  position?: 'fixed' | 'relative';
}

export function DiceButton({ 
  className = '', 
  size = 'medium',
  position = 'fixed'
}: DiceButtonProps) {
  const [isRolling, setIsRolling] = useState(false);
  const { settings, updateBackground } = useSettings();

  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-12 h-12'
  };

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  const positionClasses = position === 'fixed' 
    ? 'fixed bottom-6 left-6 z-40' 
    : 'relative';



  // 设置默认背景图片
  const setDefaultBackground = async () => {
    setIsRolling(true);
    
    try {
      // 使用默认背景图片
      const defaultImageUrl = getRandomBackgroundImage(); // 现在返回默认背景
      const newImage = createBackgroundImage(defaultImageUrl);
      
      updateBackground({
        type: 'image',
        value: defaultImageUrl,
        images: [newImage],
        opacity: 1.0
      });
      
      // 显示成功提示
      if (typeof window !== 'undefined') {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        toast.textContent = '🎲 默认背景已设置！';
        document.body.appendChild(toast);
        
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 3000);
      }
    } catch (error) {
      console.error('获取随机背景失败:', error);
      
      // 显示错误提示
      if (typeof window !== 'undefined') {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        toast.textContent = '❌ 设置默认背景失败，请稍后重试';
        document.body.appendChild(toast);
        
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 3000);
      }
    } finally {
      setIsRolling(false);
    }
  };

  return (
    <div className={`${positionClasses} ${className}`}>
      <HoverAnimation scale={1.1}>
        <motion.button
          onClick={setDefaultBackground}
          disabled={isRolling}
          className={`
            ${sizeClasses[size]} 
            bg-gradient-to-r from-purple-500 to-pink-600 
            text-white rounded-full shadow-lg 
            hover:shadow-xl transition-all duration-300
            flex items-center justify-center
            backdrop-blur-sm
            hover:from-purple-600 hover:to-pink-700
            focus:outline-none focus:ring-4 focus:ring-purple-300/50
            group
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          whileHover={{ 
            scale: 1.1,
            rotate: settings.animation.enabled ? (isRolling ? 360 : 0) : 0
          }}
          whileTap={{ scale: 0.95 }}
          animate={{
            rotate: isRolling ? 360 : 0
          }}
          transition={{ 
            duration: settings.animation.enabled ? (isRolling ? 1 : 0.3) : 0.1,
            type: isRolling ? 'tween' : 'spring',
            ease: isRolling ? 'linear' : 'easeOut',
            stiffness: 300,
            repeat: isRolling ? Infinity : 0
          }}
          title="点击设置默认背景图片"
        >
          <Dices 
            className={`${iconSizes[size]} transition-transform duration-300 ${isRolling ? 'animate-spin' : 'group-hover:rotate-12'}`} 
          />
        </motion.button>
      </HoverAnimation>
      
      {/* 骰子提示 */}
      {position === 'fixed' && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2, duration: 0.5 }}
          className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 whitespace-nowrap"
        >
          <div className="bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
            点击设置默认背景
            <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-r-4 border-r-black/80 border-t-2 border-b-2 border-t-transparent border-b-transparent" />
          </div>
        </motion.div>
      )}
    </div>
  );
}

// 简化版骰子按钮（用于导航栏等地方）
export function SimpleDiceButton({ className = '' }: { className?: string }) {
  const [isRolling, setIsRolling] = useState(false);
  const { settings, updateBackground } = useSettings();

  const setDefaultBackground = async () => {
    setIsRolling(true);
    
    try {
      // 使用默认背景图片
      const defaultImageUrl = getRandomBackgroundImage(); // 现在返回默认背景
      const newImage = createBackgroundImage(defaultImageUrl);
      
      updateBackground({
        type: 'image',
        value: defaultImageUrl,
        images: [newImage],
        opacity: 1.0
      });
    } catch (error) {
      console.error('设置默认背景失败:', error);
    } finally {
      setIsRolling(false);
    }
  };

  return (
    <HoverAnimation>
      <button
        onClick={setDefaultBackground}
        disabled={isRolling}
        className={`
          p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
          hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        title="默认背景"
      >
        <Dices className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
      </button>
    </HoverAnimation>
  );
}