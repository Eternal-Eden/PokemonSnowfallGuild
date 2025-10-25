/**
 * 认证服务
 * 处理用户认证、登录、注册等功能
 */

import { api } from '@/lib/api';
import {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  TwoFactorVerifyRequest,
  UserRole
} from '@/types/auth';

/**
 * 登录即注册请求接口
 */
export interface LoginOrRegisterRequest {
  username: string;
  password: string;
  email: string;
}

/**
 * 认证服务类
 */
class AuthService {
  // 当前登录用户
  private currentUser: User | null = null;

  constructor() {
    // 初始化认证服务
    this.initializeFromStorage();
  }

  /**
   * 从本地存储初始化用户状态
   */
  private async initializeFromStorage(): Promise<void> {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (token) {
        try {
          const user = await this.verifyToken(token);
          if (user) {
            this.currentUser = user;
          } else {
            // Token无效，清除本地存储
            api.clearAuthToken();
          }
        } catch (error) {
          console.warn('Failed to verify stored token:', error);
          api.clearAuthToken();
        }
      }
    }
  }

  // ==================== 用户管理 ====================

  /**
   * 获取所有用户
   */
  async getUsers(): Promise<User[]> {
    const response = await api.get<User[]>('/users');
    return response.data || [];
  }

  /**
   * 根据ID获取用户
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const response = await api.get<User>(`/users/${id}`);
      return response.data || null;
    } catch (_error) {
      return null;
    }
  }

  /**
   * 根据用户名获取用户
   */
  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const response = await api.get<User>(`/users/username/${username}`);
      return response.data || null;
    } catch (_error) {
      return null;
    }
  }

  // ==================== 认证相关 ====================

  /**
   * 登录即注册 - 新的统一接口
   */
  async loginOrRegister(data: LoginOrRegisterRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login-or-register', data);
    
    if (response.success && response.data) {
      this.currentUser = response.data.user || null;
      
      // 保存token到本地存储
      if (response.data.token) {
        api.setAuthToken(response.data.token, true);
      }
      
      return response.data;
    }
    
    throw new Error(response.message || '登录失败');
  }



  /**
   * 用户登录 - 兼容旧接口
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // 转换为新的登录即注册接口
    return this.loginOrRegister({
      username: credentials.username,
      password: credentials.password || '',
      email: credentials.email || `${credentials.username}@snowfall-guild.com`
    });
  }

  /**
   * 用户注册 - 已废弃，使用登录即注册
   */
  async register(userData: RegisterRequest): Promise<LoginResponse> {
    // 使用新的登录即注册接口
    return this.loginOrRegister({
      username: userData.username,
      password: userData.password,
      email: userData.email || `${userData.username}@snowfall-guild.com`
    });
  }

  /**
   * 验证双因素认证
   */
  async verifyTwoFactor(data: TwoFactorVerifyRequest): Promise<{ success: boolean; token?: string }> {
    const response = await api.post<{ success: boolean; token?: string }>('/auth/verify-2fa', data);
    
    if (response.success && response.data?.token) {
      api.setAuthToken(response.data.token, true);
    }
    
    return response.data || { success: false };
  }

  /**
   * 用户登出
   */
  async logout(token?: string): Promise<{ success: boolean }> {
    try {
      await api.post('/auth/logout', { token });
    } catch (error) {
      console.warn('Logout API call failed:', error);
    }
    
    // 清除本地状态
    this.currentUser = null;
    api.clearAuthToken();
    
    return { success: true };
  }

  /**
   * 验证token
   */
  async verifyToken(token: string): Promise<User | null> {
    try {
      const response = await api.post<User>('/auth/verify-token', { token });
      return response.data || null;
    } catch (_error) {
      return null;
    }
  }

  /**
   * 获取当前用户
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * 设置当前用户
   */
  setCurrentUser(user: User | null): void {
    this.currentUser = user;
  }

  /**
   * 检查用户权限
   */
  hasPermission(user: User | null, requiredRole: UserRole): boolean {
    if (!user) return false;
    
    const roleHierarchy = {
      [UserRole.MODERATOR]: 2,
      [UserRole.MEMBER]: 1,
      [UserRole.USER]: 1
    };
    
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  }



  /**
   * 检查是否为版主
   */
  isModerator(user: User | null): boolean {
    return this.hasPermission(user, UserRole.MODERATOR);
  }

  // ==================== 私有方法 ====================

  /**
   * 获取当前认证状态
   */
  async getAuthStatus(): Promise<{ isAuthenticated: boolean; user: User | null }> {
    const token = typeof window !== 'undefined' ? 
      (localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')) : null;
    
    if (!token) {
      return { isAuthenticated: false, user: null };
    }
    
    try {
      const user = await this.verifyToken(token);
      return { isAuthenticated: !!user, user };
    } catch (_error) {
      return { isAuthenticated: false, user: null };
    }
  }

  /**
   * 刷新用户信息
   */
  async refreshUser(): Promise<User | null> {
    if (!this.currentUser) return null;
    
    try {
      const user = await this.getUserById(this.currentUser.id);
      if (user) {
        this.currentUser = user;
      }
      return user;
    } catch (_error) {
      console.warn('Failed to refresh user:', _error);
      return null;
    }
  }
}

/**
 * 全局认证服务实例
 */
export const authService = new AuthService();

// 重新导出常用方法以保持向后兼容
export const getUsers = () => authService.getUsers();
export const getUserById = (id: string) => authService.getUserById(id);
export const getUserByUsername = (username: string) => authService.getUserByUsername(username);
export const login = (credentials: LoginRequest) => authService.login(credentials);
export const register = (userData: RegisterRequest) => authService.register(userData);
export const logout = (token?: string) => authService.logout(token);
export const verifyToken = (token: string) => authService.verifyToken(token);
export const getCurrentUser = () => authService.getCurrentUser();
export const setCurrentUser = (user: User | null) => authService.setCurrentUser(user);
export const hasPermission = (user: User | null, requiredRole: UserRole) => authService.hasPermission(user, requiredRole);
export const isModerator = (user: User | null) => authService.isModerator(user);

// 新的登录即注册方法
export const loginOrRegister = (data: LoginOrRegisterRequest) => authService.loginOrRegister(data);
export const getAuthStatus = () => authService.getAuthStatus();
export const refreshUser = () => authService.refreshUser();