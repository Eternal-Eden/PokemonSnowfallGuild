'use client';

import React, { ReactNode, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useInView, useAnimation } from 'framer-motion';
import { useSettings } from '@/contexts/SettingsContext';

// 基础动画包装器
interface AnimatedWrapperProps {
  children: ReactNode;
  animation?: 'fadeIn' | 'slideIn' | 'bounce' | 'pulse' | 'shake' | 'none';
  delay?: number;
  duration?: number;
  className?: string;
}

export function AnimatedWrapper({ 
  children, 
  animation = 'fadeIn', 
  delay = 0, 
  duration,
  className = '' 
}: AnimatedWrapperProps) {
  const { settings } = useSettings();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const controls = useAnimation();

  const actualDuration = duration || (settings.animation.speed === 'slow' ? 0.8 : settings.animation.speed === 'fast' ? 0.2 : 0.4);

  useEffect(() => {
    if (!settings.animation.enabled || !settings.animation.effects[animation as keyof typeof settings.animation.effects]) {
      return;
    }

    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls, settings.animation.enabled, animation]);

  const variants = {
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: actualDuration, delay } }
    },
    slideIn: {
      hidden: { opacity: 0, y: 50 },
      visible: { opacity: 1, y: 0, transition: { duration: actualDuration, delay } }
    },
    bounce: {
      hidden: { opacity: 0, scale: 0.3 },
      visible: { 
        opacity: 1, 
        scale: 1, 
        transition: { 
          duration: actualDuration, 
          delay,
          type: 'spring' as const,
          bounce: 0.4
        } 
      }
    },
    pulse: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { 
        opacity: 1, 
        scale: 1, 
        transition: { 
          duration: actualDuration, 
          delay,
          repeat: Infinity,
          repeatType: 'reverse' as const
        } 
      }
    },
    shake: {
      hidden: { opacity: 0 },
      visible: { 
        opacity: 1,
        x: [0, -10, 10, -10, 10, 0],
        transition: { 
          duration: actualDuration, 
          delay
        } 
      }
    }
  };

  if (!settings.animation.enabled || animation === 'none') {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants[animation]}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 悬停动画组件
interface HoverAnimationProps {
  children: ReactNode;
  scale?: number;
  rotate?: number;
  className?: string;
}

export function HoverAnimation({ children, scale = 1.05, rotate = 0, className = '' }: HoverAnimationProps) {
  const { settings } = useSettings();

  if (!settings.animation.enabled || !settings.animation.effects.hover) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      whileHover={{ scale, rotate }}
      whileTap={{ scale: scale * 0.95 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 打字机效果
interface TypewriterProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export function Typewriter({ text, speed = 50, className = '', onComplete }: TypewriterProps) {
  const { settings } = useSettings();
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!settings.animation.enabled || !settings.animation.effects.typewriter) {
      setDisplayText(text);
      onComplete?.();
      return;
    }

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, settings.animation.enabled, onComplete]);

  return (
    <span className={className}>
      {displayText}
      {currentIndex < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        >
          |
        </motion.span>
      )}
    </span>
  );
}

// 粒子效果背景
export function ParticleBackground() {
  const { settings } = useSettings();
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; speed: number }>>([]);

  useEffect(() => {
    if (!settings.animation.enabled || !settings.animation.effects.particles) {
      setParticles([]);
      return;
    }

    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 4 + 1,
      speed: Math.random() * 2 + 0.5
    }));

    setParticles(newParticles);
  }, [settings.animation.enabled, settings.animation.effects.particles]);

  if (!settings.animation.enabled || !settings.animation.effects.particles) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute bg-white/20 rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            left: particle.x,
            top: particle.y,
          }}
          animate={{
            y: [particle.y, particle.y - window.innerHeight - 100],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: particle.speed * 10,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

// 视差滚动容器
interface ParallaxContainerProps {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export function ParallaxContainer({ children, speed = 0.5, className = '' }: ParallaxContainerProps) {
  const { settings } = useSettings();
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    if (!settings.animation.enabled || !settings.animation.effects.parallax) {
      return;
    }

    const handleScroll = () => {
      setOffsetY(window.pageYOffset);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [settings.animation.enabled, settings.animation.effects.parallax]);

  if (!settings.animation.enabled || !settings.animation.effects.parallax) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={className}
      style={{
        transform: `translateY(${offsetY * speed}px)`,
      }}
    >
      {children}
    </div>
  );
}

// 页面过渡动画
interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const { settings } = useSettings();

  if (!settings.animation.enabled || !settings.animation.effects.transitions) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 加载动画
export function LoadingSpinner({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const { settings } = useSettings();
  
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  if (!settings.animation.enabled) {
    return (
      <div className={`${sizeClasses[size]} border-2 border-gray-300 border-t-blue-500 rounded-full`} />
    );
  }

  return (
    <motion.div
      className={`${sizeClasses[size]} border-2 border-gray-300 border-t-blue-500 rounded-full`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );
}

// 数字计数动画
interface CountUpProps {
  end: number;
  start?: number;
  duration?: number;
  className?: string;
}

export function CountUp({ end, start = 0, duration = 2, className = '' }: CountUpProps) {
  const { settings } = useSettings();
  const [count, setCount] = useState(start);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView || !settings.animation.enabled) {
      setCount(end);
      return;
    }

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      
      setCount(Math.floor(start + (end - start) * progress));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isInView, end, start, duration, settings.animation.enabled]);

  return (
    <span ref={ref} className={className}>
      {count.toLocaleString()}
    </span>
  );
}