import { ModuleConfig } from '@/types';

// 模块注册表
const moduleRegistry: Map<string, ModuleConfig> = new Map();

// 注册模块
export function registerModule(config: ModuleConfig) {
  moduleRegistry.set(config.id, config);
}

// 获取所有模块
export function getAllModules(): ModuleConfig[] {
  return Array.from(moduleRegistry.values()).sort((a, b) => a.order - b.order);
}

// 根据位置获取模块
export function getModulesByPosition(position: 'main' | 'sidebar'): ModuleConfig[] {
  return getAllModules().filter(module => module.position === position);
}

// 获取单个模块
export function getModule(id: string): ModuleConfig | undefined {
  return moduleRegistry.get(id);
}

// 模块装饰器
export function Module(config: Omit<ModuleConfig, 'component'>) {
  return function <T extends React.ComponentType<any>>(Component: T) {
    registerModule({
      ...config,
      component: Component
    });
    return Component;
  };
}