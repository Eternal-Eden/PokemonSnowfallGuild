/**
 * 雪花算法ID生成器
 * 
 * 64位雪花ID结构：
 * +----------+----------+----------+----------+
 * |  1位符号  | 41位时间戳 | 10位机器ID | 12位序列号 |
 * +----------+----------+----------+----------+
 * |    0     |  时间戳   |  机器标识  |   序列   |
 * +----------+----------+----------+----------+
 */

// 简单的互斥锁实现
class Mutex {
  private locked = false;
  private waiting: (() => void)[] = [];
  
  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
  
  private async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }
    
    return new Promise(resolve => {
      this.waiting.push(resolve);
    });
  }
  
  private release(): void {
    if (this.waiting.length > 0) {
      const next = this.waiting.shift()!;
      next();
    } else {
      this.locked = false;
    }
  }
}

export class SnowflakeGenerator {
  private static readonly EPOCH = 1704067200000; // 2024-01-01 00:00:00 UTC
  private static readonly MACHINE_ID_BITS = 5;
  private static readonly DATACENTER_ID_BITS = 5;
  private static readonly SEQUENCE_BITS = 12;
  
  private static readonly MAX_MACHINE_ID = (1 << this.MACHINE_ID_BITS) - 1;
  private static readonly MAX_DATACENTER_ID = (1 << this.DATACENTER_ID_BITS) - 1;
  private static readonly MAX_SEQUENCE = (1 << this.SEQUENCE_BITS) - 1;
  
  private static readonly MACHINE_ID_SHIFT = this.SEQUENCE_BITS;
  private static readonly DATACENTER_ID_SHIFT = this.SEQUENCE_BITS + this.MACHINE_ID_BITS;
  private static readonly TIMESTAMP_SHIFT = this.SEQUENCE_BITS + this.MACHINE_ID_BITS + this.DATACENTER_ID_BITS;
  
  private machineId: number;
  private datacenterId: number;
  private sequence: number = 0;
  private lastTimestamp: number = -1;
  private readonly mutex = new Mutex();
  
  constructor(machineId: number, datacenterId: number) {
    if (machineId > SnowflakeGenerator.MAX_MACHINE_ID || machineId < 0) {
      throw new Error(`Machine ID must be between 0 and ${SnowflakeGenerator.MAX_MACHINE_ID}`);
    }
    if (datacenterId > SnowflakeGenerator.MAX_DATACENTER_ID || datacenterId < 0) {
      throw new Error(`Datacenter ID must be between 0 and ${SnowflakeGenerator.MAX_DATACENTER_ID}`);
    }
    
    this.machineId = machineId;
    this.datacenterId = datacenterId;
  }
  
  /**
   * 生成雪花ID
   * @returns Promise<bigint> 64位雪花ID
   */
  public async generateId(): Promise<bigint> {
    return this.mutex.runExclusive(async () => {
      let timestamp = this.getCurrentTimestamp();
      
      // 时钟回拨检测和处理
      if (timestamp < this.lastTimestamp) {
        const offset = this.lastTimestamp - timestamp;
        if (offset <= 5) {
          // 小幅回拨（5ms内），等待时钟追上
          console.warn(`Clock moved backwards by ${offset}ms, waiting for clock to catch up`);
          await this.waitUntilNextMillis(this.lastTimestamp);
          timestamp = this.getCurrentTimestamp();
        } else {
          // 大幅回拨，记录日志并抛出异常
          console.error(`Clock moved backwards by ${offset}ms, refusing to generate ID`);
          throw new Error(`Clock moved backwards. Refusing to generate id for ${offset} milliseconds`);
        }
      }
      
      if (this.lastTimestamp === timestamp) {
        // 同一毫秒内，序列号递增
        this.sequence = (this.sequence + 1) & SnowflakeGenerator.MAX_SEQUENCE;
        if (this.sequence === 0) {
          // 序列号溢出，等待下一毫秒
          timestamp = await this.waitUntilNextMillis(this.lastTimestamp);
        }
      } else {
        // 新的毫秒，序列号重置
        this.sequence = 0;
      }
      
      this.lastTimestamp = timestamp;
      
      // 组装ID - 使用BigInt进行64位运算
      const timestampPart = BigInt(timestamp - SnowflakeGenerator.EPOCH) << BigInt(SnowflakeGenerator.TIMESTAMP_SHIFT);
      const datacenterPart = BigInt(this.datacenterId) << BigInt(SnowflakeGenerator.DATACENTER_ID_SHIFT);
      const machinePart = BigInt(this.machineId) << BigInt(SnowflakeGenerator.MACHINE_ID_SHIFT);
      const sequencePart = BigInt(this.sequence);
      
      const id = timestampPart | datacenterPart | machinePart | sequencePart;
      
      return id;
    });
  }
  
  /**
   * 获取当前时间戳
   * @returns number 毫秒级时间戳
   */
  private getCurrentTimestamp(): number {
    return Date.now();
  }
  
  /**
   * 等待直到下一毫秒
   * @param lastTimestamp 上一次的时间戳
   * @returns Promise<number> 新的时间戳
   */
  private async waitUntilNextMillis(lastTimestamp: number): Promise<number> {
    let timestamp = this.getCurrentTimestamp();
    while (timestamp <= lastTimestamp) {
      await new Promise(resolve => setTimeout(resolve, 1));
      timestamp = this.getCurrentTimestamp();
    }
    return timestamp;
  }
  
  /**
   * 解析雪花ID，提取各个组成部分
   * @param id 雪花ID
   * @returns 解析后的ID信息
   */
  public static parseId(id: bigint): {
    timestamp: number;
    datacenterId: number;
    machineId: number;
    sequence: number;
    generateTime: Date;
  } {
    const timestamp = Number((id >> BigInt(SnowflakeGenerator.TIMESTAMP_SHIFT)) + BigInt(SnowflakeGenerator.EPOCH));
    const datacenterId = Number((id >> BigInt(SnowflakeGenerator.DATACENTER_ID_SHIFT)) & BigInt(SnowflakeGenerator.MAX_DATACENTER_ID));
    const machineId = Number((id >> BigInt(SnowflakeGenerator.MACHINE_ID_SHIFT)) & BigInt(SnowflakeGenerator.MAX_MACHINE_ID));
    const sequence = Number(id & BigInt(SnowflakeGenerator.MAX_SEQUENCE));
    
    return {
      timestamp,
      datacenterId,
      machineId,
      sequence,
      generateTime: new Date(timestamp)
    };
  }
  
  /**
   * 获取雪花算法的配置信息
   */
  public getConfig() {
    return {
      machineId: this.machineId,
      datacenterId: this.datacenterId,
      epoch: SnowflakeGenerator.EPOCH,
      maxMachineId: SnowflakeGenerator.MAX_MACHINE_ID,
      maxDatacenterId: SnowflakeGenerator.MAX_DATACENTER_ID,
      maxSequence: SnowflakeGenerator.MAX_SEQUENCE
    };
  }
  
  /**
   * 验证雪花ID的有效性
   * @param id 要验证的ID
   * @returns boolean 是否有效
   */
  public static isValidId(id: bigint): boolean {
    try {
      const parsed = this.parseId(id);
      // 检查时间戳是否在合理范围内
      const now = Date.now();
      const minTime = this.EPOCH;
      const maxTime = now + 86400000; // 允许未来24小时内的时间戳
      
      return parsed.timestamp >= minTime && parsed.timestamp <= maxTime;
    } catch {
      return false;
    }
  }
}