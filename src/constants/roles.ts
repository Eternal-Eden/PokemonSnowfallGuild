/**
 * 角色相关常量定义
 * 这个文件不依赖任何Node.js特定模块，可以安全地在客户端使用
 */

/**
 * 角色徽章配置
 */
export const ROLE_BADGES = {
  'moderator': {
    label: '版主',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: '🛡️'
  },
  'user': {
    label: '用户',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: '👤'
  },
  'member': {
    label: '会员',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: '⭐'
  }
} as const;

/**
 * 角色类型定义
 */
export type RoleBadgeKey = keyof typeof ROLE_BADGES;

/**
 * 角色徽章类型
 */
export type RoleBadge = {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
};