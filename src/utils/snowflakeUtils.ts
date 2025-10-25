/**
 * Snowflake ID utility functions
 * Provides parsing, formatting, and display utilities for Snowflake IDs
 */

// Snowflake ID constants
const EPOCH = BigInt(1288834974657); // Twitter epoch (2010-11-04T01:42:54.657Z)
const MACHINE_ID_BITS = BigInt(5);
const DATACENTER_ID_BITS = BigInt(5);
const SEQUENCE_BITS = BigInt(12);

const MAX_MACHINE_ID = (BigInt(1) << MACHINE_ID_BITS) - BigInt(1);
const MAX_DATACENTER_ID = (BigInt(1) << DATACENTER_ID_BITS) - BigInt(1);
const MAX_SEQUENCE = (BigInt(1) << SEQUENCE_BITS) - BigInt(1);

const MACHINE_ID_SHIFT = SEQUENCE_BITS;
const DATACENTER_ID_SHIFT = SEQUENCE_BITS + MACHINE_ID_BITS;
const TIMESTAMP_SHIFT = SEQUENCE_BITS + MACHINE_ID_BITS + DATACENTER_ID_BITS;

export interface SnowflakeIdInfo {
  isValid: boolean;
  timestamp: number;
  datacenterId: number;
  machineId: number;
  sequence: number;
  generateTime: string;
  error?: string;
}

/**
 * Parse a Snowflake ID and extract its components
 */
export function parseSnowflakeId(traceId: string): SnowflakeIdInfo {
  try {
    // Convert string to BigInt
    const id = BigInt(traceId);
    
    // Extract components using bitwise operations
    const timestamp = Number((id >> TIMESTAMP_SHIFT) + EPOCH);
    const datacenterId = Number((id >> DATACENTER_ID_SHIFT) & MAX_DATACENTER_ID);
    const machineId = Number((id >> MACHINE_ID_SHIFT) & MAX_MACHINE_ID);
    const sequence = Number(id & MAX_SEQUENCE);
    
    // Validate extracted values
    if (datacenterId > Number(MAX_DATACENTER_ID) || 
        machineId > Number(MAX_MACHINE_ID) || 
        sequence > Number(MAX_SEQUENCE)) {
      throw new Error('Invalid Snowflake ID format');
    }
    
    const generateTime = formatDateTime(new Date(timestamp));
    
    return {
      isValid: true,
      timestamp,
      datacenterId,
      machineId,
      sequence,
      generateTime
    };
  } catch (error) {
    return {
      isValid: false,
      timestamp: 0,
      datacenterId: 0,
      machineId: 0,
      sequence: 0,
      generateTime: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Format a date to a readable string
 */
export function formatDateTime(date: Date): string {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Shanghai'
  });
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Format Snowflake ID for display with segments
 */
export function formatSnowflakeIdDisplay(id: string): string {
  if (!id || id.length < 10) return id;
  
  // Split into segments for better readability
  const segments: string[] = [];
  for (let i = 0; i < id.length; i += 4) {
    segments.push(id.slice(i, i + 4));
  }
  
  return segments.join(' ');
}

/**
 * Get a brief description of the Snowflake ID
 */
export function getSnowflakeIdDescription(info: SnowflakeIdInfo): string {
  if (!info.isValid) {
    return '无效的 Snowflake ID';
  }
  
  return `生成于 ${info.generateTime}，数据中心 ${info.datacenterId}，机器 ${info.machineId}，序列号 ${info.sequence}`;
}