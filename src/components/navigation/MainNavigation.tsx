'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, 
  MessageSquare, 
  Hash,
  Menu,
  X,
  FileText,
  Shield,
  Ticket,
  Calculator
} from 'lucide-react';
import * as PIXI from 'pixi.js';
import TicketModal from '@/components/ticket/TicketModal';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  color: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'home',
    label: '首页',
    icon: Home,
    path: '/',
    color: '#3B82F6' // blue-500
  },
  {
    id: 'posts',
    label: '帖子',
    icon: MessageSquare,
    path: '/forum',
    color: '#8B5CF6' // violet-500
  },
  {
    id: 'calculator',
    label: '伤害计算器',
    icon: Calculator,
    path: '/calculator',
    color: '#F97316' // orange-500
  },
  {
    id: 'templates',
    label: '模板仓库',
    icon: FileText,
    path: '/templates',
    color: '#10B981' // emerald-500
  }
];

// 特殊操作项（不是路由导航）
const actionItems = [
  {
    id: 'ticket',
    label: '工单',
    icon: Ticket,
    color: '#F59E0B' // amber-500
  }
];

interface SnowflakeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
}

interface MainNavigationProps {
  className?: string;
}

export default function MainNavigation({ className = '' }: MainNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [activeItem, setActiveItem] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  // 添加导航栏显示/隐藏状态
  const [isNavVisible, setIsNavVisible] = useState(false);
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const snowflakesRef = useRef<SnowflakeParticle[]>([]);
  const animationFrameRef = useRef<number>(0);

  // 检查用户是否有版主权限
  const hasModeratorAccess = user && user.role === UserRole.MODERATOR;

  // 确定当前活跃项
  useEffect(() => {
    if (!pathname) return;
    
    const currentItem = navigationItems.find(item => {
      if (item.path === '/' && pathname === '/') return true;
      if (item.path !== '/' && pathname.startsWith(item.path)) return true;
      return false;
    });
    
    setActiveItem(currentItem?.id || '');
  }, [pathname]);

  // 初始化PixiJS应用
  useEffect(() => {
    if (!pixiContainerRef.current || pixiAppRef.current) return;

    const app = new PIXI.Application({
      width: 200,
      height: 60,
      backgroundColor: 0x000000,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });

    pixiContainerRef.current.appendChild(app.view as HTMLCanvasElement);
    pixiAppRef.current = app;

    // 创建落雪纹理
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0xFFFFFF);
    graphics.drawStar(0, 0, 6, 3, 1.5);
    graphics.endFill();
    
    const snowflakeTexture = app.renderer.generateTexture(graphics);

    // 初始化落雪粒子
    const initSnowflakes = () => {
      snowflakesRef.current = [];
      for (let i = 0; i < 15; i++) {
        snowflakesRef.current.push({
          x: Math.random() * 200,
          y: Math.random() * 60,
          vx: (Math.random() - 0.5) * 0.5,
          vy: Math.random() * 0.8 + 0.2,
          size: Math.random() * 0.5 + 0.3,
          alpha: Math.random() * 0.6 + 0.4,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02
        });
      }
    };

    // 动画循环
    const animate = () => {
      app.stage.removeChildren();
      
      snowflakesRef.current.forEach(snowflake => {
        // 更新位置
        snowflake.x += snowflake.vx;
        snowflake.y += snowflake.vy;
        snowflake.rotation += snowflake.rotationSpeed;
        
        // 边界检查
        if (snowflake.y > 60) {
          snowflake.y = -5;
          snowflake.x = Math.random() * 200;
        }
        if (snowflake.x < -5) snowflake.x = 205;
        if (snowflake.x > 205) snowflake.x = -5;
        
        // 创建落雪精灵
        const sprite = new PIXI.Sprite(snowflakeTexture);
        sprite.x = snowflake.x;
        sprite.y = snowflake.y;
        sprite.scale.set(snowflake.size);
        sprite.alpha = snowflake.alpha;
        sprite.rotation = snowflake.rotation;
        sprite.anchor.set(0.5);
        
        app.stage.addChild(sprite);
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    initSnowflakes();
    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true);
        pixiAppRef.current = null;
      }
    };
  }, []);

  const handleNavigation = (item: NavigationItem) => {
    setActiveItem(item.id);
    router.push(item.path);
    setIsMobileMenuOpen(false);
  };

  const handleActionClick = (actionId: string) => {
    if (actionId === 'ticket') {
      setIsTicketModalOpen(true);
    }
    setIsMobileMenuOpen(false);
  };
  
  // 获取动态操作项
  const getDynamicActionItems = () => {
    return [...actionItems];
  };

  // 鼠标悬停事件处理
  const handleMouseEnter = () => {
    setIsNavVisible(true);
  };

  const handleMouseLeave = () => {
    setIsNavVisible(false);
  };

  return (
    <>
      {/* 桌面端导航栏 */}
      <div className={`hidden lg:block fixed left-0 top-1/2 transform -translate-y-1/2 z-50 ${className}`}>
        {/* 触发区域 - 始终可见的边缘 */}
        <div 
          className="absolute left-0 top-0 w-3 h-full bg-transparent cursor-pointer"
          onMouseEnter={handleMouseEnter}
        />
        
        {/* 导航栏主体 */}
        <motion.nav
          className="relative"
          initial={{ x: -60 }}
          animate={{ x: isNavVisible ? 6 : -60 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            mass: 0.8
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-2">
            <div className="flex flex-col space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeItem === item.id;
                
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => handleNavigation(item)}
                    className="relative group p-3 rounded-xl transition-all duration-300 hover:scale-105"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      backgroundColor: isActive ? `${item.color}15` : 'transparent'
                    }}
                  >
                    {/* 落雪动画背景 */}
                    {isActive && (
                      <div 
                        ref={pixiContainerRef}
                        className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
                        style={{ opacity: 0.6 }}
                      />
                    )}
                    
                    {/* 图标 */}
                    <Icon 
                      className={`w-6 h-6 transition-colors duration-300 relative z-10 ${
                        isActive 
                          ? 'text-white' 
                          : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'
                      }`}
                      style={{
                        color: isActive ? item.color : undefined
                      }}
                    />
                    
                    {/* 活跃指示器 */}
                    {isActive && (
                      <motion.div
                        className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8 rounded-full"
                        style={{ backgroundColor: item.color }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      />
                    )}
                    
                    {/* 悬浮提示 */}
                    <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <div className="bg-gray-900 dark:bg-gray-700 text-white text-sm px-2 py-1 rounded-lg whitespace-nowrap">
                        {item.label}
                      </div>
                    </div>
                  </motion.button>
                  );
                })}
                
                {/* 分隔线 */}
                <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-2" />
                
                {/* 操作按钮 */}
                {getDynamicActionItems().map((item) => {
                  const Icon = item.icon;
                  
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => handleActionClick(item.id)}
                      className="relative group p-3 rounded-xl transition-all duration-300 hover:scale-105"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* 图标 */}
                      <Icon 
                        className="w-6 h-6 transition-colors duration-300 relative z-10 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200"
                        style={{
                          color: item.color
                        }}
                      />
                      
                      {/* 悬浮提示 */}
                      <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        <div className="text-white text-sm px-2 py-1 rounded-lg whitespace-nowrap bg-gray-900 dark:bg-gray-700">
                          {item.label}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
            </div>
          </div>
        </motion.nav>
      </div>

      {/* 移动端导航栏 */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <motion.button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          ) : (
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          )}
        </motion.button>

        {/* 移动端菜单 */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-16 left-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-2 min-w-[200px]"
            >
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeItem === item.id;
                
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => handleNavigation(item)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'text-white shadow-md' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    style={{
                      backgroundColor: isActive ? item.color : 'transparent'
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </motion.button>
                );
              })}
              
              {/* 分隔线 */}
              <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-2" />
              
              {/* 操作按钮 */}
              {getDynamicActionItems().map((item) => {
                const Icon = item.icon;
                
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => handleActionClick(item.id)}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-5 h-5" style={{ color: item.color }} />
                    <div className="flex-1">
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* 工单模态框 */}
      <TicketModal 
        isOpen={isTicketModalOpen} 
        onClose={() => setIsTicketModalOpen(false)} 
      />
    </>
  );
}