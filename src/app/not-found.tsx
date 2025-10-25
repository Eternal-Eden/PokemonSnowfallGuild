'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Home, 
  MessageSquare, 
  ArrowLeft, 
  Sparkles,
  Star,
  Heart,
  Zap,
  MapPin,
  Compass,
  Rocket
} from 'lucide-react';
import { AnimatedWrapper, HoverAnimation, PageTransition } from '@/components/animations/AnimationComponents';
import { BackgroundCarousel } from '@/components/background/BackgroundCarousel';
import { useSettings } from '@/contexts/SettingsContext';



// 粒子效果组件
const ParticleField = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 3 + 2
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-60"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0],
            scale: [0, 1, 0]
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

// 3D数字组件
const Number3D = ({ number, delay = 0 }: { number: string; delay?: number }) => {
  return (
    <motion.div
      className="relative perspective-1000"
      initial={{ opacity: 0, rotateX: 90, scale: 0.5 }}
      animate={{ opacity: 1, rotateX: 0, scale: 1 }}
      transition={{
        duration: 1,
        delay: delay,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
    >
      <motion.div
        className="text-8xl md:text-9xl lg:text-[12rem] font-black relative"
        style={{
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b)',
          backgroundSize: '400% 400%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        {number}
        
        {/* 3D阴影效果 */}
        <div 
          className="absolute inset-0 text-8xl md:text-9xl lg:text-[12rem] font-black text-gray-800/20 dark:text-gray-200/10"
          style={{
            transform: 'translate(4px, 4px)',
            zIndex: -1
          }}
        >
          {number}
        </div>
        
        {/* 发光效果 */}
        <motion.div
          className="absolute inset-0 text-8xl md:text-9xl lg:text-[12rem] font-black text-blue-400 blur-lg opacity-30"
          animate={{
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {number}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};



export default function NotFound() {
  const router = useRouter();
  const { settings } = useSettings();
  const [currentMessage, setCurrentMessage] = useState(0);
  
  const messages = [
    "哎呀！你迷失在数字世界了",
    "这里没有你要找的页面...",
    "让我们一起回到正确的路径吧！",
    "落雪公会永远为你指引方向"
  ];

  // 消息轮播
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <PageTransition>
      <div className="min-h-screen relative overflow-hidden">
        {/* 背景 */}
        <BackgroundCarousel />
        
        {/* 粒子效果 */}
        {settings.animation.enabled && <ParticleField />}
        
        {/* 浮动装饰元素 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {settings.animation.enabled && (
            <>
              {/* 浮动图标 */}
              <motion.div
                className="absolute top-32 left-1/3"
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Star className="w-8 h-8 text-yellow-400 fill-current drop-shadow-lg" />
              </motion.div>
              
              <motion.div
                className="absolute bottom-32 right-1/4"
                animate={{
                  y: [0, -15, 0],
                  x: [0, 10, 0],
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              >
                <Sparkles className="w-10 h-10 text-purple-400 drop-shadow-lg" />
              </motion.div>
              
              <motion.div
                className="absolute top-80 left-20"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, -360]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2
                }}
              >
                <Heart className="w-6 h-6 text-pink-400 fill-current drop-shadow-lg" />
              </motion.div>
              
              <motion.div
                className="absolute bottom-20 left-1/2"
                animate={{
                  y: [0, -25, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              >
                <Zap className="w-7 h-7 text-blue-400 fill-current drop-shadow-lg" />
              </motion.div>
            </>
          )}
          
          {/* 大型装饰圆圈 */}
          <motion.div
            className="absolute top-20 right-10 w-40 h-40 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-2xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.7, 0.3]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <motion.div
            className="absolute bottom-20 left-10 w-52 h-52 bg-gradient-to-br from-pink-200/15 to-yellow-200/15 rounded-full blur-3xl"
            animate={{
              scale: [1, 0.8, 1.4, 1],
              x: [0, 30, -20, 0],
              y: [0, -20, 15, 0]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
        </div>

        {/* 主要内容 */}
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-6xl mx-auto">
            {/* 404 数字 */}
            <AnimatedWrapper animation="fadeIn" delay={0}>
              <div className="flex items-center justify-center space-x-2 md:space-x-4 mb-8">
                <Number3D number="4" delay={0.2} />
                <Number3D number="0" delay={0.4} />
                <Number3D number="4" delay={0.6} />
              </div>
            </AnimatedWrapper>

            {/* 主标题 */}
            <AnimatedWrapper animation="slideIn" delay={0.8}>
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
                style={{
                  background: 'linear-gradient(135deg, #1e40af, #7c3aed, #db2777)',
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                页面迷失在时空中
              </motion.h1>
            </AnimatedWrapper>

            {/* 动态消息 */}
            <AnimatedWrapper animation="fadeIn" delay={1.2}>
              <div className="h-20 flex items-center justify-center mb-12">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentMessage}
                    initial={{ opacity: 0, y: 30, rotateX: 90 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    exit={{ opacity: 0, y: -30, rotateX: -90 }}
                    transition={{ duration: 0.6, type: "spring" }}
                    className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 font-medium"
                  >
                    {messages[currentMessage]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </AnimatedWrapper>



            {/* 操作按钮组 */}
            <AnimatedWrapper animation="slideIn" delay={1.5}>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
                {/* 返回首页 */}
                <HoverAnimation scale={1.05}>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/')}
                    className="group flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-2xl hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 relative overflow-hidden"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    <Home className="w-5 h-5 relative z-10" />
                    <span className="font-semibold relative z-10">回到首页</span>
                  </motion.button>
                </HoverAnimation>

                {/* 前往论坛 */}
                <HoverAnimation scale={1.05}>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/forum')}
                    className="group flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white rounded-2xl hover:from-purple-600 hover:via-pink-600 hover:to-red-600 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 relative overflow-hidden"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.5 }}
                    />
                    <MessageSquare className="w-5 h-5 relative z-10" />
                    <span className="font-semibold relative z-10">前往论坛</span>
                  </motion.button>
                </HoverAnimation>

                {/* 返回上页 */}
                <HoverAnimation scale={1.05}>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.back()}
                    className="flex items-center space-x-3 px-8 py-4 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 border-2 border-gray-300/50 dark:border-gray-600/50 rounded-2xl hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 backdrop-blur-sm"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-semibold">返回上页</span>
                  </motion.button>
                </HoverAnimation>
              </div>
            </AnimatedWrapper>

            {/* 底部信息卡片 */}
            <AnimatedWrapper animation="fadeIn" delay={2}>
              <motion.div
                className="p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-gray-700/50 shadow-2xl relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {/* 背景装饰 */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-gray-700/50 dark:via-gray-600/50 dark:to-gray-500/50" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-center space-x-3 text-gray-600 dark:text-gray-400 mb-4">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <Compass className="w-6 h-6" />
                    </motion.div>
                    <span className="text-lg font-medium">
                      迷路了？让我们帮你找到正确的方向
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-500">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>落雪公会</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Rocket className="w-4 h-4" />
                      <span>探索无限可能</span>
                    </div>
                  </div>
                  
                  <motion.div
                    className="mt-6 text-xs text-gray-400 dark:text-gray-600"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    © 2024 Pokemon Snowfall Guild - 在数字世界中永不迷失
                  </motion.div>
                </div>
              </motion.div>
            </AnimatedWrapper>
          </div>
        </div>


      </div>
    </PageTransition>
  );
}