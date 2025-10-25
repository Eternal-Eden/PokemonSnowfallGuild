'use client';

import { motion } from 'framer-motion';
import { getModulesByPosition } from '@/lib/moduleLoader';
import { ModuleConfig } from '@/types';

interface ModuleRendererProps {
  position: 'main' | 'sidebar';
  className?: string;
  moduleProps?: Record<string, any>;
}

export default function ModuleRenderer({ position, className = '', moduleProps = {} }: ModuleRendererProps) {
  const modules = getModulesByPosition(position);

  if (modules.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {modules.map((module: ModuleConfig, index: number) => {
        const Component = module.component;
        
        return (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: index * 0.1,
              duration: 0.5,
              ease: 'easeOut'
            }}
            className="mb-6 last:mb-0"
          >
            <Component {...(module.props || {})} {...moduleProps} />
          </motion.div>
        );
      })}
    </div>
  );
}