/**
 * 数值验证工具函数
 * 用于确保计算结果中不出现 Infinity、-Infinity 和 NaN
 */

/**
 * 验证数值是否有效（不是 NaN、Infinity 或 -Infinity）
 */
export function isValidNumber(value: number): boolean {
  return !isNaN(value) && isFinite(value);
}

/**
 * 安全地获取数组的最小值，避免 Infinity
 */
export function safeMin(array: number[]): number {
  if (!array || array.length === 0) return 0;
  const validNumbers = array.filter(isValidNumber);
  if (validNumbers.length === 0) return 0;
  return Math.min(...validNumbers);
}

/**
 * 安全地获取数组的最大值，避免 -Infinity
 */
export function safeMax(array: number[]): number {
  if (!array || array.length === 0) return 0;
  const validNumbers = array.filter(isValidNumber);
  if (validNumbers.length === 0) return 0;
  return Math.max(...validNumbers);
}

/**
 * 安全的除法运算，避免除零和 NaN
 */
export function safeDivide(numerator: number, denominator: number, defaultValue: number = 0): number {
  if (!isValidNumber(numerator) || !isValidNumber(denominator) || denominator === 0) {
    return defaultValue;
  }
  const result = numerator / denominator;
  return isValidNumber(result) ? result : defaultValue;
}

/**
 * 安全的百分比计算
 */
export function safePercentage(value: number, total: number, defaultValue: number = 0): number {
  const percentage = safeDivide(value, total, defaultValue) * 100;
  return Math.round(percentage);
}

/**
 * 验证并清理数值，确保返回有效数值
 */
export function sanitizeNumber(value: number, defaultValue: number = 0): number {
  return isValidNumber(value) ? value : defaultValue;
}

/**
 * 格式化显示数值，处理异常情况
 */
export function formatDisplayNumber(value: number, defaultText: string = '0'): string {
  if (!isValidNumber(value)) {
    return defaultText;
  }
  return value.toString();
}

/**
 * 格式化百分比显示
 */
export function formatPercentage(value: number, defaultText: string = '0%'): string {
  if (!isValidNumber(value)) {
    return defaultText;
  }
  return `${Math.round(value)}%`;
}

/**
 * 格式化伤害范围显示
 */
export function formatDamageRange(damageRange: number[], defaultText: string = '0 - 0'): string {
  if (!damageRange || damageRange.length === 0) {
    return defaultText;
  }
  
  const min = safeMin(damageRange);
  const max = safeMax(damageRange);
  
  return `${min} - ${max}`;
}