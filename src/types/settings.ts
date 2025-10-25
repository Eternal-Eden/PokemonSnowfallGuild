// 全局设置类型定义
export interface ThemeSettings {
  colorScheme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  accentColor: string;
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  fontSize: 'small' | 'medium' | 'large';
}

export interface AnimationSettings {
  enabled: boolean;
  speed: 'slow' | 'normal' | 'fast';
  effects: {
    hover: boolean;
    transitions: boolean;
    parallax: boolean;
    particles: boolean;
    typewriter: boolean;
    fadeIn: boolean;
    slideIn: boolean;
    bounce: boolean;
    pulse: boolean;
    shake: boolean;
  };
}

export interface BackgroundSettings {
  type: 'color' | 'gradient' | 'image' | 'video';
  value: string;
  images: BackgroundImage[];
  autoSlide: boolean;
  slideInterval: number; // 秒
  opacity: number;
  blur: number;
}

export interface BackgroundImage {
  id: string;
  url: string;
  name: string;
  uploadTime: Date;
}

export interface GlobalSettings {
  theme: ThemeSettings;
  animation: AnimationSettings;
  background: BackgroundSettings;
  version: string;
}

// 预设主题
export const PRESET_THEMES: Record<string, Partial<ThemeSettings>> = {
  default: {
    primaryColor: '#3B82F6',
    accentColor: '#8B5CF6',
  },
  pokemon: {
    primaryColor: '#FFCB05',
    accentColor: '#3D7DCA',
  },
  nature: {
    primaryColor: '#10B981',
    accentColor: '#059669',
  },
  sunset: {
    primaryColor: '#F59E0B',
    accentColor: '#EF4444',
  },
  ocean: {
    primaryColor: '#0EA5E9',
    accentColor: '#06B6D4',
  },
  purple: {
    primaryColor: '#8B5CF6',
    accentColor: '#A855F7',
  },
};

// 动画预设
export const ANIMATION_PRESETS: Record<string, Partial<AnimationSettings>> = {
  minimal: {
    enabled: true,
    speed: 'fast',
    effects: {
      hover: true,
      transitions: true,
      parallax: false,
      particles: false,
      typewriter: false,
      fadeIn: true,
      slideIn: false,
      bounce: false,
      pulse: false,
      shake: false,
    },
  },
  standard: {
    enabled: true,
    speed: 'normal',
    effects: {
      hover: true,
      transitions: true,
      parallax: true,
      particles: false,
      typewriter: true,
      fadeIn: true,
      slideIn: true,
      bounce: true,
      pulse: true,
      shake: false,
    },
  },
  rich: {
    enabled: true,
    speed: 'normal',
    effects: {
      hover: true,
      transitions: true,
      parallax: true,
      particles: true,
      typewriter: true,
      fadeIn: true,
      slideIn: true,
      bounce: true,
      pulse: true,
      shake: true,
    },
  },
  disabled: {
    enabled: false,
    speed: 'fast',
    effects: {
      hover: false,
      transitions: false,
      parallax: false,
      particles: false,
      typewriter: false,
      fadeIn: false,
      slideIn: false,
      bounce: false,
      pulse: false,
      shake: false,
    },
  },
};

// 默认设置
export const DEFAULT_SETTINGS: GlobalSettings = {
  theme: {
    colorScheme: 'auto',
    primaryColor: '#3B82F6',
    accentColor: '#8B5CF6',
    borderRadius: 'medium',
    fontSize: 'medium',
  },
  animation: {
    enabled: true,
    speed: 'normal',
    effects: {
      hover: true,
      transitions: true,
      parallax: true,
      particles: false,
      typewriter: true,
      fadeIn: true,
      slideIn: true,
      bounce: true,
      pulse: true,
      shake: false,
    },
  },
  background: {
    type: 'image',
    value: 'https://i1.mcobj.com/uploads/20220111_dc518b9e59108.jpg',
    images: [{
      id: 'default',
      url: 'https://i1.mcobj.com/uploads/20220111_dc518b9e59108.jpg',
      name: '默认背景',
      uploadTime: new Date()
    }],
    autoSlide: false,
    slideInterval: 10,
    opacity: 0.1,
    blur: 0,
  },
  version: '1.0.0',
};