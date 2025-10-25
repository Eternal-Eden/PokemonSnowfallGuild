/**
 * API安全监控和日志记录系统
 */

import { NextRequest } from 'next/server';
import { logger } from './logger';
import { redis, CACHE_KEYS } from './redis';

// 监控事件类型
export enum MonitoringEventType {
  API_REQUEST = 'api_request',
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILURE = 'auth_failure',
  RATE_LIMIT_HIT = 'rate_limit_hit',
  SECURITY_VIOLATION = 'security_violation',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  ERROR_OCCURRED = 'error_occurred',

  DATA_ACCESS = 'data_access',
  FILE_UPLOAD = 'file_upload',
}

// 监控事件接口
export interface MonitoringEvent {
  type: MonitoringEventType;
  timestamp: string;
  ip: string;
  userAgent?: string;
  userId?: string;
  username?: string;
  url: string;
  method: string;
  statusCode?: number;
  responseTime?: number;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// 安全威胁检测规则
interface ThreatRule {
  name: string;
  pattern: RegExp | ((event: MonitoringEvent) => boolean);
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'log' | 'alert' | 'block';
  description: string;
}

// 预定义威胁检测规则
const THREAT_RULES: ThreatRule[] = [
  {
    name: 'SQL_INJECTION',
    pattern: /(union|select|insert|update|delete|drop|create|alter|exec|script)/i,
    severity: 'high',
    action: 'alert',
    description: 'SQL注入攻击尝试',
  },
  {
    name: 'XSS_ATTACK',
    pattern: /(<script|javascript:|onload=|onerror=|onclick=)/i,
    severity: 'high',
    action: 'alert',
    description: 'XSS攻击尝试',
  },
  {
    name: 'PATH_TRAVERSAL',
    pattern: /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c)/i,
    severity: 'medium',
    action: 'alert',
    description: '路径遍历攻击尝试',
  },
  {
    name: 'BRUTE_FORCE_LOGIN',
    pattern: (event: MonitoringEvent) => {
      return event.type === MonitoringEventType.AUTH_FAILURE && 
             event.url?.includes('/login') === true &&
             event.statusCode === 401;
    },
    severity: 'medium',
    action: 'alert',
    description: '暴力破解登录尝试',
  },
  
  {
    name: 'RAPID_REQUESTS',
    pattern: (event: MonitoringEvent) => {
      return event.type === MonitoringEventType.RATE_LIMIT_HIT;
    },
    severity: 'medium',
    action: 'log',
    description: '快速请求检测',
  },
];

/**
 * 安全监控管理器
 */
export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private alertThresholds = {
    low: 10,
    medium: 5,
    high: 3,
    critical: 1,
  };

  private constructor() {}

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  /**
   * 记录监控事件
   */
  async logEvent(event: Partial<MonitoringEvent>): Promise<void> {
    try {
      const fullEvent: MonitoringEvent = {
        timestamp: new Date().toISOString(),
        severity: 'low',
        ...event,
      } as MonitoringEvent;

      // 记录到日志
      this.writeToLog(fullEvent);

      // 检测威胁
      await this.detectThreats(fullEvent);

      // 存储到Redis（用于实时监控）
      await this.storeEventToRedis(fullEvent);

      // 更新统计信息
      await this.updateStatistics(fullEvent);

    } catch (error) {
      logger.error('记录监控事件失败:', error);
    }
  }

  /**
   * 写入日志
   */
  private writeToLog(event: MonitoringEvent): void {
    const logData = {
      type: event.type,
      ip: event.ip,
      userId: event.userId,
      url: event.url,
      method: event.method,
      statusCode: event.statusCode,
      responseTime: event.responseTime,
      severity: event.severity,
      details: event.details,
    };

    switch (event.severity) {
      case 'critical':
        logger.error(`[CRITICAL] ${event.type}`, logData);
        break;
      case 'high':
        logger.error(`[HIGH] ${event.type}`, logData);
        break;
      case 'medium':
        logger.warn(`[MEDIUM] ${event.type}`, logData);
        break;
      default:
        logger.info(`[LOW] ${event.type}`, logData);
    }
  }

  /**
   * 威胁检测
   */
  private async detectThreats(event: MonitoringEvent): Promise<void> {
    for (const rule of THREAT_RULES) {
      let isMatch = false;

      if (rule.pattern instanceof RegExp) {
        const testString = `${event.url} ${event.userAgent || ''} ${JSON.stringify(event.details || {})}`;
        isMatch = rule.pattern.test(testString);
      } else if (typeof rule.pattern === 'function') {
        isMatch = rule.pattern(event);
      }

      if (isMatch) {
        await this.handleThreatDetection(event, rule);
      }
    }
  }

  /**
   * 处理威胁检测
   */
  private async handleThreatDetection(event: MonitoringEvent, rule: ThreatRule): Promise<void> {
    const threatEvent: MonitoringEvent = {
      ...event,
      type: MonitoringEventType.SECURITY_VIOLATION,
      severity: rule.severity,
      details: {
        ...event.details,
        threatRule: rule.name,
        threatDescription: rule.description,
        originalEvent: event.type,
      },
    };

    // 记录威胁事件
    this.writeToLog(threatEvent);

    // 根据规则采取行动
    switch (rule.action) {
      case 'alert':
        await this.sendAlert(threatEvent, rule);
        break;
      case 'block':
        await this.blockIP(event.ip, rule.name);
        break;
      case 'log':
        // 已经记录了，无需额外操作
        break;
    }

    // 更新威胁统计
    await this.updateThreatStatistics(rule.name, event.ip);
  }

  /**
   * 发送安全警报
   */
  private async sendAlert(event: MonitoringEvent, rule: ThreatRule): Promise<void> {
    try {
      // 检查是否需要发送警报（避免垃圾警报）
      const alertKey = `alert:${rule.name}:${event.ip}`;
      const recentAlerts = await redis.get<number>(alertKey) || 0;
      
      if (recentAlerts >= this.alertThresholds[rule.severity]) {
        return; // 已经发送过足够的警报
      }

      // 增加警报计数
      await redis.incr(alertKey);
      await redis.expire(alertKey, 3600); // 1小时过期

      // 记录高级别警报
      logger.error(`🚨 安全警报: ${rule.description}`, {
        rule: rule.name,
        severity: rule.severity,
        ip: event.ip,
        url: event.url,
        timestamp: event.timestamp,
        details: event.details,
      });

    } catch (error) {
      logger.error('发送安全警报失败:', error);
    }
  }

  /**
   * 阻止IP地址
   */
  private async blockIP(ip: string, reason: string): Promise<void> {
    try {
      const blockKey = `blocked_ip:${ip}`;
      const blockData = {
        reason,
        timestamp: new Date().toISOString(),
        duration: 3600, // 1小时
      };

      await redis.setex(blockKey, 3600, JSON.stringify(blockData));
      
      logger.warn(`🚫 IP地址已被阻止: ${ip}`, {
        reason,
        duration: '1小时',
      });

    } catch (error) {
      logger.error('阻止IP地址失败:', error);
    }
  }

  /**
   * 存储事件到Redis
   */
  private async storeEventToRedis(event: MonitoringEvent): Promise<void> {
    try {
      // 存储最近的事件（用于实时监控）
      const eventKey = `${CACHE_KEYS.MONITORING_EVENTS}:recent`;
      await redis.lpush(eventKey, JSON.stringify(event));
      await redis.ltrim(eventKey, 0, 999); // 保留最近1000个事件
      await redis.expire(eventKey, 86400); // 24小时过期

      // 按IP存储事件（用于分析）
      const ipEventKey = `${CACHE_KEYS.MONITORING_EVENTS}:ip:${event.ip}`;
      await redis.lpush(ipEventKey, JSON.stringify(event));
      await redis.ltrim(ipEventKey, 0, 99); // 保留最近100个事件
      await redis.expire(ipEventKey, 3600); // 1小时过期

    } catch (error) {
      logger.error('存储监控事件到Redis失败:', error);
    }
  }

  /**
   * 更新统计信息
   */
  private async updateStatistics(event: MonitoringEvent): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const hour = new Date().getHours();

      // 每日统计
      const dailyKey = `${CACHE_KEYS.MONITORING_STATS}:daily:${today}`;
      await redis.hincrby(dailyKey, event.type, 1);
      await redis.hincrby(dailyKey, `severity_${event.severity}`, 1);
      await redis.expire(dailyKey, 86400 * 7); // 保留7天

      // 每小时统计
      const hourlyKey = `${CACHE_KEYS.MONITORING_STATS}:hourly:${today}:${hour}`;
      await redis.hincrby(hourlyKey, event.type, 1);
      await redis.expire(hourlyKey, 86400); // 保留24小时

      // IP统计
      const ipStatsKey = `${CACHE_KEYS.MONITORING_STATS}:ip:${event.ip}:${today}`;
      await redis.hincrby(ipStatsKey, 'requests', 1);
      await redis.hincrby(ipStatsKey, event.type, 1);
      await redis.expire(ipStatsKey, 86400); // 保留24小时

    } catch (error) {
      logger.error('更新监控统计失败:', error);
    }
  }

  /**
   * 更新威胁统计
   */
  private async updateThreatStatistics(threatName: string, ip: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 威胁类型统计
      const threatKey = `${CACHE_KEYS.MONITORING_STATS}:threats:${today}`;
      await redis.hincrby(threatKey, threatName, 1);
      await redis.expire(threatKey, 86400 * 7); // 保留7天

      // IP威胁统计
      const ipThreatKey = `${CACHE_KEYS.MONITORING_STATS}:ip_threats:${ip}:${today}`;
      await redis.hincrby(ipThreatKey, threatName, 1);
      await redis.expire(ipThreatKey, 86400); // 保留24小时

    } catch (error) {
      logger.error('更新威胁统计失败:', error);
    }
  }

  /**
   * 检查IP是否被阻止
   */
  async isIPBlocked(ip: string): Promise<boolean> {
    try {
      const blockKey = `blocked_ip:${ip}`;
      const blockData = await redis.get(blockKey);
      return !!blockData;
    } catch (error) {
      logger.error('检查IP阻止状态失败:', error);
      return false;
    }
  }

  /**
   * 获取监控统计
   */
  async getStatistics(period: 'daily' | 'hourly' = 'daily'): Promise<Record<string, any>> {
    try {
      const today = new Date().toISOString().split('T')[0];
      let statsKey: string;

      if (period === 'daily') {
        statsKey = `${CACHE_KEYS.MONITORING_STATS}:daily:${today}`;
      } else {
        const hour = new Date().getHours();
        statsKey = `${CACHE_KEYS.MONITORING_STATS}:hourly:${today}:${hour}`;
      }

      const stats = await redis.hgetall(statsKey);
      return stats || {};
    } catch (error) {
      logger.error('获取监控统计失败:', error);
      return {};
    }
  }

  /**
   * 获取最近事件
   */
  async getRecentEvents(limit: number = 50): Promise<MonitoringEvent[]> {
    try {
      const eventKey = `${CACHE_KEYS.MONITORING_EVENTS}:recent`;
      const events = await redis.lrange(eventKey, 0, limit - 1);
      return events.map((event: string) => JSON.parse(event));
    } catch (error) {
      logger.error('获取最近事件失败:', error);
      return [];
    }
  }
}

// 导出单例实例
export const securityMonitor = SecurityMonitor.getInstance();

/**
 * API请求监控中间件
 */
export function createMonitoringMiddleware() {
  return async (request: NextRequest) => {
    const startTime = Date.now();
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;
    const url = request.url;
    const method = request.method;

    // 记录请求开始
    await securityMonitor.logEvent({
      type: MonitoringEventType.API_REQUEST,
      ip,
      userAgent,
      url,
      method,
      severity: 'low',
      details: {
        headers: Object.fromEntries(request.headers.entries()),
      },
    });

    return {
      ip,
      userAgent,
      startTime,
      logResponse: async (statusCode: number, details?: Record<string, any>) => {
        const responseTime = Date.now() - startTime;
        
        await securityMonitor.logEvent({
          type: MonitoringEventType.API_REQUEST,
          ip,
          userAgent,
          url,
          method,
          statusCode,
          responseTime,
          severity: statusCode >= 400 ? 'medium' : 'low',
          details,
        });
      },
    };
  };
}

/**
 * 记录认证事件
 */
export async function logAuthEvent(
  type: MonitoringEventType.AUTH_SUCCESS | MonitoringEventType.AUTH_FAILURE,
  request: NextRequest,
  details?: Record<string, any>
) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || undefined;
  
  await securityMonitor.logEvent({
    type,
    ip,
    userAgent,
    url: request.url,
    method: request.method,
    severity: type === MonitoringEventType.AUTH_FAILURE ? 'medium' : 'low',
    details,
  });
}

/**
 * 记录安全违规事件
 */
export async function logSecurityViolation(
  request: NextRequest,
  violation: string,
  details?: Record<string, any>
) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || undefined;
  
  await securityMonitor.logEvent({
    type: MonitoringEventType.SECURITY_VIOLATION,
    ip,
    userAgent,
    url: request.url,
    method: request.method,
    severity: 'high',
    details: {
      violation,
      ...details,
    },
  });
}