import { Request } from 'express';

/**
 * 获取客户端IP地址
 */
export function getClientIP(req: Request): string {
  return (
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    (req.connection as any)?.socket?.remoteAddress ||
    req.headers['x-forwarded-for'] as string ||
    req.headers['x-real-ip'] as string ||
    'unknown'
  );
}

/**
 * 获取用户代理字符串
 */
export function getUserAgent(req: Request): string {
  return req.get('User-Agent') || 'unknown';
}