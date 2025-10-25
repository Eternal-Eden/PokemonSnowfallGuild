/**
 * 背景图片工具函数
 */

// 默认背景图片URL
const DEFAULT_BACKGROUND_URL = 'https://i1.mcobj.com/uploads/20220111_dc518b9e59108.jpg';

/**
 * 获取默认背景图片URL
 * @returns 默认背景图片的URL
 */
export function getDefaultBackgroundImage(): string {
  return DEFAULT_BACKGROUND_URL;
}

/**
 * 创建背景图片对象
 * @param url 图片URL
 * @param name 图片名称
 * @returns 背景图片对象
 */
export function createBackgroundImage(url: string, name?: string) {
  return {
    id: Date.now().toString(),
    url,
    name: name || `背景图片_${new Date().toLocaleTimeString()}`,
    uploadTime: new Date()
  };
}

/**
 * 获取初始默认背景图片
 * @returns 初始背景图片对象
 */
export function getInitialDefaultBackground() {
  const url = getDefaultBackgroundImage();
  return createBackgroundImage(url, '默认背景');
}

// 为了向后兼容，保留旧的函数名但返回默认背景
/**
 * @deprecated 使用 getDefaultBackgroundImage 替代
 */
export function getRandomBackgroundImage(): string {
  return getDefaultBackgroundImage();
}

/**
 * @deprecated 使用 getInitialDefaultBackground 替代
 */
export function getInitialRandomBackground() {
  return getInitialDefaultBackground();
}