'use client';

import { useState, useEffect } from 'react';

export function BackgroundCarousel() {
  console.log('BackgroundCarousel 组件开始渲染');
  
  const [currentBackground, setCurrentBackground] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  console.log('BackgroundCarousel 状态:', { currentBackground, isLoading });
  
  // 简化的获取背景图片函数
  const fetchBackground = async () => {
    console.log('开始获取随机背景图片...');
    try {
      const response = await fetch('https://api.miaomc.cn/image/get', {
        method: 'GET',
        redirect: 'follow'
      });
      
      console.log('API响应:', response.status, response.url);
      
      if (response.ok) {
        const imageUrl = response.url;
        console.log('设置背景图片:', imageUrl);
        setCurrentBackground(imageUrl);
        setIsLoading(false);
      } else {
        console.error('API请求失败:', response.status);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('获取背景图片失败:', error);
      setIsLoading(false);
    }
  };
  
  // 使用useEffect调用API
  useEffect(() => {
    console.log('useEffect 执行，开始获取背景图片');
    fetchBackground();
  }, []);
  
  // 渲染背景
  const renderBackground = () => {
    console.log('渲染背景, isLoading:', isLoading, 'currentBackground:', currentBackground);
    
    if (isLoading) {
      return (
        <div
          className="fixed inset-0 -z-50"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        />
      );
    }

    if (currentBackground) {
      return (
        <div
          className="fixed inset-0 -z-50 bg-cover bg-center bg-no-repeat transition-all duration-1000"
          style={{
            backgroundImage: `url(${currentBackground})`,
          }}
        />
      );
    }

    // 如果获取失败，使用默认渐变背景
    return (
      <div
        className="fixed inset-0 -z-50"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      />
    );
  };

  return (
    <>
      {renderBackground()}
      
      {/* 背景遮罩层，确保内容可读性 */}
      <div className="fixed inset-0 -z-40 bg-white/20 dark:bg-gray-900/20" />
    </>
  );
}