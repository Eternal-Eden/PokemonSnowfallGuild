/**
 * 简单的日志工具类
 * 支持不同级别的日志记录和格式化输出
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: unknown;
  source?: string;
}

class Logger {
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.logLevel = level;
  }

  setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level];
    let formatted = `[${timestamp}] [${levelStr}] ${message}`;
    
    if (data !== undefined) {
      formatted += ` | Data: ${JSON.stringify(data)}`;
    }
    
    return formatted;
  }

  private addLog(level: LogLevel, message: string, data?: unknown, source?: string): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      source
    };

    this.logs.push(entry);

    // 保持日志数量在限制内
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  error(message: string, data?: unknown, source?: string): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message, data));
      this.addLog(LogLevel.ERROR, message, data, source);
    }
  }

  warn(message: string, data?: unknown, source?: string): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, data));
      this.addLog(LogLevel.WARN, message, data, source);
    }
  }

  info(message: string, data?: unknown, source?: string): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message, data));
      this.addLog(LogLevel.INFO, message, data, source);
    }
  }

  debug(message: string, data?: unknown, source?: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, data));
      this.addLog(LogLevel.DEBUG, message, data, source);
    }
  }

  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filteredLogs = this.logs;

    if (level !== undefined) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }

    if (limit !== undefined) {
      filteredLogs = filteredLogs.slice(-limit);
    }

    return filteredLogs;
  }

  clearLogs(): void {
    this.logs = [];
  }

  getRecentErrors(limit: number = 10): LogEntry[] {
    return this.logs
      .filter(log => log.level === LogLevel.ERROR)
      .slice(-limit);
  }

  exportLogs(): string {
    return this.logs.map(log => this.formatMessage(log.level, log.message, log.data)).join('\n');
  }
}

// 创建全局日志实例
export const logger = new Logger(
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO
);

// 导出类以便创建自定义实例
export { Logger };