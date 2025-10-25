/**
 * 客户端认证工具库
 * 仅包含前端可用的认证功能，不依赖Node.js模块
 */

import { NextRequest } from 'next/server';

export interface AuthUser {
  id: string;
  username: string;
  gameNickname?: string;
  role: string;
  email?: string;
  groups?: any[];
  permissions?: any[];
  isDefaultPassword?: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  requirePasswordChange?: boolean;
  avatarUrl?: string;
  uniqueId?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  profile?: any;
  stats?: any;
  privacySettings?: any;
  pokemonShowcase?: any;
  teamShowcase?: any;
}

/**
 * 从localStorage获取token
 */
export function getTokenFromStorage(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('auth_token');
}

/**
 * 保存token到localStorage
 */
export function saveTokenToStorage(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem('auth_token', token);
}

/**
 * 从localStorage移除token
 */
export function removeTokenFromStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem('auth_token');
}

/**
 * 解析JWT token（仅解码，不验证签名）
 */
export function parseJWTToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Token parsing failed:', error);
    return null;
  }
}

/**
 * 检查token是否过期
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = parseJWTToken(token);
    if (!payload || typeof payload.exp !== 'number') {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
}

/**
 * 获取当前用户信息（从token中解析）
 */
export function getCurrentUser(): AuthUser | null {
  const token = getTokenFromStorage();
  if (!token || isTokenExpired(token)) {
    return null;
  }
  
  try {
    const payload = parseJWTToken(token);
    if (!payload) {
      return null;
    }
    
    return {
      id: payload.id,
      username: payload.username,
      gameNickname: payload.gameNickname,
      role: payload.role,
      email: payload.email,
      groups: [],
      permissions: [],
      isDefaultPassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

/**
 * 检查用户是否有指定的角色权限
 */
export function hasRole(user: AuthUser | null, requiredRoles: string[]): boolean {
  if (!user) {
    return false;
  }
  return requiredRoles.includes(user.role);
}



/**
 * 检查用户是否是版主
 */
export function isModerator(user: AuthUser | null): boolean {
  return hasRole(user, ['MODERATOR']);
}

/**
 * 检查用户是否已登录
 */
export function isAuthenticated(): boolean {
  const user = getCurrentUser();
  return user !== null;
}

/**
 * 登出用户
 */
export function logout(): void {
  removeTokenFromStorage();
  // 可以在这里添加其他登出逻辑，如清除其他缓存
}

/**
 * 创建认证头部
 */
export function createAuthHeaders(): Record<string, string> {
  const token = getTokenFromStorage();
  if (!token) {
    return {};
  }
  
  return {
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * 发送认证请求的辅助函数
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = {
    'Content-Type': 'application/json',
    ...createAuthHeaders(),
    ...options.headers,
  };
  
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * 登录函数
 */
export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; message?: string; user?: AuthUser }> {
  try {
    const response = await fetch('/api/auth/login-or-register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'login',
        username,
        password,
      }),
    });
    
    const data = await response.json();
    
    if (data.success && data.token) {
      saveTokenToStorage(data.token);
      const user = getCurrentUser();
      return { success: true, user: user || undefined };
    } else {
      return { success: false, message: data.message || '登录失败' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: '网络错误，请稍后重试' };
  }
}

/**
 * 注册函数
 */
export async function register(
  username: string,
  email: string,
  password: string
): Promise<{ success: boolean; message?: string; user?: AuthUser }> {
  try {
    const response = await fetch('/api/auth/login-or-register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'register',
        username,
        email,
        password,
      }),
    });
    
    const data = await response.json();
    
    if (data.success && data.token) {
      saveTokenToStorage(data.token);
      const user = getCurrentUser();
      return { success: true, user: user || undefined };
    } else {
      return { success: false, message: data.message || '注册失败' };
    }
  } catch (error) {
    console.error('Register error:', error);
    return { success: false, message: '网络错误，请稍后重试' };
  }
}

/**
 * 刷新token
 */
export async function refreshToken(): Promise<boolean> {
  try {
    const response = await authenticatedFetch('/api/auth/refresh', {
      method: 'POST',
    });
    
    const data = await response.json();
    
    if (data.success && data.token) {
      saveTokenToStorage(data.token);
      return true;
    } else {
      logout();
      return false;
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    logout();
    return false;
  }
}

/**
 * 获取所有用户列表（客户端版本）
 */
export async function getAllUsers(): Promise<AuthUser[]> {
  try {
    const response = await authenticatedFetch('/api/users');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.data && data.data.users) {
      return data.data.users.map((user: any) => ({
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
      }));
    } else {
      console.error('Failed to get users:', data.message);
      return [];
    }
  } catch (error) {
    console.error('Get all users error:', error);
    return [];
  }
}

/**
 * 获取当前用户完整信息（需要认证）
 */
export async function getCurrentUserInfo(): Promise<AuthUser | null> {
  try {
    const response = await authenticatedFetch('/api/auth/me');
    
    if (!response.ok) {
      if (response.status === 401) {
        // 认证失败，清除本地token
        logout();
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.data) {
      const user = data.data;
      return {
        id: user.id,
        username: user.username,
        gameNickname: user.gameNickname,
        role: user.role,
        email: user.email,
        avatarUrl: user.avatarUrl,
        uniqueId: user.uniqueId,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        isDefaultPassword: user.isDefaultPassword,
        requirePasswordChange: user.requirePasswordChange,
        lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : undefined,
        createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
        updatedAt: new Date(),
        groups: [],
        permissions: [],
        profile: user.profile,
        stats: user.stats,
        privacySettings: user.privacySettings,
      };
    } else {
      console.error('Failed to get current user info:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Get current user info error:', error);
    return null;
  }
}

/**
 * 获取单个用户信息（不需要管理员权限）
 */
export async function getUserById(userId: string): Promise<AuthUser | null> {
  try {
    const response = await fetch(`/api/users/${userId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.data && data.data.user) {
      const user = data.data.user;
      return {
        id: user.id,
        username: user.username,
        gameNickname: user.gameNickname,
        role: user.role,
        email: user.email,
        avatarUrl: user.avatarUrl,
        uniqueId: user.uniqueId,
        isActive: user.isActive,
        createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
        updatedAt: new Date(),
        groups: [],
        permissions: [],
        isDefaultPassword: false,
        profile: user.profile,
        stats: user.stats,
      };
    } else {
      console.error('Failed to get user:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Get user by id error:', error);
    return null;
  }
}

/**
 * 自动刷新token的中间件
 */
export function setupTokenRefresh(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  // 每5分钟检查一次token是否需要刷新
  setInterval(() => {
    const token = getTokenFromStorage();
    if (!token) {
      return;
    }
    
    try {
      const payload = parseJWTToken(token);
      if (!payload || !payload.exp) {
        return;
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - currentTime;
      
      // 如果token在30分钟内过期，尝试刷新
      if (timeUntilExpiry < 30 * 60) {
        refreshToken();
      }
    } catch (error) {
      console.error('Token refresh check failed:', error);
    }
  }, 5 * 60 * 1000); // 5分钟
}

/**
 * 权限检查Hook（用于React组件）
 */
export function useAuth() {
  const user = getCurrentUser();
  
  return {
    user,
    isAuthenticated: user !== null,
    isModerator: isModerator(user),
    hasRole: (roles: string[]) => hasRole(user, roles),
    login,
    register,
    logout,
    refreshToken,
  };
}

export default {
  getTokenFromStorage,
  saveTokenToStorage,
  removeTokenFromStorage,
  getCurrentUser,
  getCurrentUserInfo,
  isAuthenticated,
  isModerator,
  hasRole,
  login,
  register,
  logout,
  refreshToken,
  authenticatedFetch,
  getAllUsers,
  getUserById,
  setupTokenRefresh,
  useAuth,
};