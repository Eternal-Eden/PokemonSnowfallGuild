'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { GlobalSettings, DEFAULT_SETTINGS, BackgroundImage } from '@/types/settings';

interface SettingsContextType {
  settings: GlobalSettings;
  updateTheme: (theme: Partial<GlobalSettings['theme']>) => void;
  updateAnimation: (animation: Partial<GlobalSettings['animation']>) => void;
  updateBackground: (background: Partial<GlobalSettings['background']>) => void;
  addBackgroundImage: (image: BackgroundImage) => void;
  removeBackgroundImage: (imageId: string) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
}

type SettingsAction =
  | { type: 'UPDATE_THEME'; payload: Partial<GlobalSettings['theme']> }
  | { type: 'UPDATE_ANIMATION'; payload: Partial<GlobalSettings['animation']> }
  | { type: 'UPDATE_BACKGROUND'; payload: Partial<GlobalSettings['background']> }
  | { type: 'ADD_BACKGROUND_IMAGE'; payload: BackgroundImage }
  | { type: 'REMOVE_BACKGROUND_IMAGE'; payload: string }
  | { type: 'RESET_SETTINGS' }
  | { type: 'LOAD_SETTINGS'; payload: GlobalSettings };

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

function settingsReducer(state: GlobalSettings, action: SettingsAction): GlobalSettings {
  switch (action.type) {
    case 'UPDATE_THEME':
      return {
        ...state,
        theme: { ...state.theme, ...action.payload },
      };
    case 'UPDATE_ANIMATION':
      return {
        ...state,
        animation: { ...state.animation, ...action.payload },
      };
    case 'UPDATE_BACKGROUND':
      return {
        ...state,
        background: { ...state.background, ...action.payload },
      };
    case 'ADD_BACKGROUND_IMAGE':
      return {
        ...state,
        background: {
          ...state.background,
          images: [...state.background.images, action.payload],
        },
      };
    case 'REMOVE_BACKGROUND_IMAGE':
      return {
        ...state,
        background: {
          ...state.background,
          images: state.background.images.filter(img => img.id !== action.payload),
        },
      };
    case 'RESET_SETTINGS':
      return DEFAULT_SETTINGS;
    case 'LOAD_SETTINGS':
      return action.payload;
    default:
      return state;
  }
}

const STORAGE_KEY = 'pokemon-guild-settings';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, dispatch] = useReducer(settingsReducer, DEFAULT_SETTINGS);

  // 从本地存储加载设置
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        dispatch({ type: 'LOAD_SETTINGS', payload: parsed });
      }
      // 如果没有保存的设置，使用默认设置（已包含默认背景）
    } catch (error) {
      console.error('Failed to load settings:', error);
      // 出错时使用默认设置
    }
  }, []);

  // 保存设置到本地存储
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [settings]);

  // 应用CSS变量
  useEffect(() => {
    const root = document.documentElement;
    
    // 应用主题颜色
    root.style.setProperty('--primary-color', settings.theme.primaryColor);
    root.style.setProperty('--accent-color', settings.theme.accentColor);
    
    // 应用边框圆角
    const radiusMap = {
      none: '0px',
      small: '4px',
      medium: '8px',
      large: '16px',
    };
    root.style.setProperty('--border-radius', radiusMap[settings.theme.borderRadius]);
    
    // 应用字体大小
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
    };
    root.style.setProperty('--font-size-base', fontSizeMap[settings.theme.fontSize]);
    
    // 应用动画速度
    const speedMap = {
      slow: '0.5s',
      normal: '0.3s',
      fast: '0.15s',
    };
    root.style.setProperty('--animation-speed', speedMap[settings.animation.speed]);
    
    // 应用背景设置
    if (settings.background.type === 'color') {
      root.style.setProperty('--background-image', 'none');
      root.style.setProperty('--background-color', settings.background.value);
    } else if (settings.background.type === 'gradient') {
      root.style.setProperty('--background-image', settings.background.value);
      root.style.setProperty('--background-color', 'transparent');
    } else if (settings.background.type === 'image' && settings.background.images.length > 0) {
      const currentImage = settings.background.images[0];
      root.style.setProperty('--background-image', `url(${currentImage.url})`);
      root.style.setProperty('--background-color', 'transparent');
    }
    
    root.style.setProperty('--background-opacity', settings.background.opacity.toString());
    root.style.setProperty('--background-blur', `${settings.background.blur}px`);
    
    // 应用暗色模式
    if (settings.theme.colorScheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (settings.theme.colorScheme === 'light') {
      document.documentElement.classList.remove('dark');
    }
    // auto模式由CSS媒体查询处理
  }, [settings]);

  const updateTheme = (theme: Partial<GlobalSettings['theme']>) => {
    dispatch({ type: 'UPDATE_THEME', payload: theme });
  };

  const updateAnimation = (animation: Partial<GlobalSettings['animation']>) => {
    dispatch({ type: 'UPDATE_ANIMATION', payload: animation });
  };

  const updateBackground = (background: Partial<GlobalSettings['background']>) => {
    dispatch({ type: 'UPDATE_BACKGROUND', payload: background });
  };

  const addBackgroundImage = (image: BackgroundImage) => {
    dispatch({ type: 'ADD_BACKGROUND_IMAGE', payload: image });
  };

  const removeBackgroundImage = (imageId: string) => {
    dispatch({ type: 'REMOVE_BACKGROUND_IMAGE', payload: imageId });
  };

  const resetSettings = () => {
    dispatch({ type: 'RESET_SETTINGS' });
  };

  const exportSettings = () => {
    return JSON.stringify(settings, null, 2);
  };

  const importSettings = (settingsJson: string): boolean => {
    try {
      const parsed = JSON.parse(settingsJson);
      dispatch({ type: 'LOAD_SETTINGS', payload: parsed });
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  };

  const value: SettingsContextType = {
    settings,
    updateTheme,
    updateAnimation,
    updateBackground,
    addBackgroundImage,
    removeBackgroundImage,
    resetSettings,
    exportSettings,
    importSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export { SettingsContext };