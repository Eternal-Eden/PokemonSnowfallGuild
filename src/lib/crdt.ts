// CRDT (Conflict-free Replicated Data Type) 算法实现
// 用于解决多用户同时编辑报表时的数据冲突问题

import { 
  CRDTOperation, 
  CRDTOperationType, 
  CRDTConflictResolution, 
  ReportRow 
} from '@/types/report';

// 向量时钟管理
export class VectorClock {
  private clock: Record<string, number>;

  constructor(initialClock: Record<string, number> = {}) {
    this.clock = { ...initialClock };
  }

  // 增加本地时钟
  increment(userId: string): void {
    this.clock[userId] = (this.clock[userId] || 0) + 1;
  }

  // 更新时钟（接收到远程操作时）
  update(otherClock: Record<string, number>): void {
    for (const [userId, timestamp] of Object.entries(otherClock)) {
      this.clock[userId] = Math.max(this.clock[userId] || 0, timestamp);
    }
  }

  // 比较两个向量时钟的关系
  compare(other: Record<string, number>): 'before' | 'after' | 'concurrent' {
    let hasLess = false;
    let hasGreater = false;

    const allUsers = new Set([...Object.keys(this.clock), ...Object.keys(other)]);

    for (const userId of allUsers) {
      const thisTime = this.clock[userId] || 0;
      const otherTime = other[userId] || 0;

      if (thisTime < otherTime) hasLess = true;
      if (thisTime > otherTime) hasGreater = true;
    }

    if (hasLess && !hasGreater) return 'before';
    if (hasGreater && !hasLess) return 'after';
    return 'concurrent';
  }

  // 获取时钟副本
  getClock(): Record<string, number> {
    return { ...this.clock };
  }
}

// CRDT操作管理器
export class CRDTManager {
  private operations: CRDTOperation[] = [];
  private vectorClock: VectorClock;
  private userId: string;

  constructor(userId: string, initialClock: Record<string, number> = {}) {
    this.userId = userId;
    this.vectorClock = new VectorClock(initialClock);
  }

  // 创建新操作
  createOperation(
    type: CRDTOperationType,
    rowId: string,
    fieldId?: string,
    value?: any
  ): CRDTOperation {
    this.vectorClock.increment(this.userId);

    const operation: CRDTOperation = {
      id: `${this.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      rowId,
      fieldId,
      value,
      timestamp: new Date(),
      userId: this.userId,
      vectorClock: this.vectorClock.getClock()
    };

    this.operations.push(operation);
    return operation;
  }

  // 接收远程操作
  receiveOperation(operation: CRDTOperation): void {
    this.vectorClock.update(operation.vectorClock);
    this.operations.push(operation);
  }

  // 解决冲突
  resolveConflicts(rows: ReportRow[]): { rows: ReportRow[]; conflicts: CRDTConflictResolution[] } {
    const conflicts: CRDTConflictResolution[] = [];
    const resolvedRows = new Map<string, ReportRow>();

    // 初始化行数据
    rows.forEach(row => {
      resolvedRows.set(row.id, { ...row });
    });

    // 按时间戳排序操作
    const sortedOperations = [...this.operations].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    // 分组并发操作
    const operationGroups = this.groupConcurrentOperations(sortedOperations);

    for (const group of operationGroups) {
      if (group.length === 1) {
        // 无冲突，直接应用
        this.applyOperation(group[0], resolvedRows);
      } else {
        // 有冲突，需要解决
        const conflict = this.resolveOperationConflict(group, resolvedRows);
        conflicts.push(conflict);
      }
    }

    return {
      rows: Array.from(resolvedRows.values()),
      conflicts
    };
  }

  // 分组并发操作
  private groupConcurrentOperations(operations: CRDTOperation[]): CRDTOperation[][] {
    const groups: CRDTOperation[][] = [];
    const processed = new Set<string>();

    for (const op of operations) {
      if (processed.has(op.id)) continue;

      const group = [op];
      processed.add(op.id);

      // 查找与当前操作并发的操作
      for (const otherOp of operations) {
        if (processed.has(otherOp.id)) continue;

        if (this.areOperationsConcurrent(op, otherOp) && 
            this.doOperationsConflict(op, otherOp)) {
          group.push(otherOp);
          processed.add(otherOp.id);
        }
      }

      groups.push(group);
    }

    return groups;
  }

  // 检查两个操作是否并发
  private areOperationsConcurrent(op1: CRDTOperation, op2: CRDTOperation): boolean {
    const clock1 = new VectorClock(op1.vectorClock);
    const comparison = clock1.compare(op2.vectorClock);
    return comparison === 'concurrent';
  }

  // 检查两个操作是否冲突
  private doOperationsConflict(op1: CRDTOperation, op2: CRDTOperation): boolean {
    // 同一行的操作可能冲突
    if (op1.rowId !== op2.rowId) return false;

    // 删除操作与其他操作冲突
    if (op1.type === CRDTOperationType.DELETE || op2.type === CRDTOperationType.DELETE) {
      return true;
    }

    // 同一字段的更新操作冲突
    if (op1.type === CRDTOperationType.UPDATE && 
        op2.type === CRDTOperationType.UPDATE && 
        op1.fieldId === op2.fieldId) {
      return true;
    }

    return false;
  }

  // 解决操作冲突
  private resolveOperationConflict(
    conflictingOps: CRDTOperation[], 
    rows: Map<string, ReportRow>
  ): CRDTConflictResolution {
    // 删除操作优先级最高
    const deleteOp = conflictingOps.find(op => op.type === CRDTOperationType.DELETE);
    if (deleteOp) {
      this.applyOperation(deleteOp, rows);
      return {
        resolved: true,
        finalValue: null,
        conflictingOperations: conflictingOps,
        resolutionStrategy: 'last-write-wins'
      };
    }

    // 对于更新操作，使用Last-Write-Wins策略
    const latestOp = conflictingOps.reduce((latest, current) => 
      current.timestamp > latest.timestamp ? current : latest
    );

    this.applyOperation(latestOp, rows);

    return {
      resolved: true,
      finalValue: latestOp.value,
      conflictingOperations: conflictingOps,
      resolutionStrategy: 'last-write-wins'
    };
  }

  // 应用单个操作
  private applyOperation(operation: CRDTOperation, rows: Map<string, ReportRow>): void {
    const { type, rowId, fieldId, value, userId, timestamp } = operation;

    switch (type) {
      case CRDTOperationType.INSERT:
        if (!rows.has(rowId)) {
          rows.set(rowId, {
            id: rowId,
            data: (value as Record<string, unknown>) || {},
            createdAt: timestamp,
            updatedAt: timestamp,
            createdBy: userId,
            updatedBy: userId,
            version: 1,
            vectorClock: operation.vectorClock
          });
        }
        break;

      case CRDTOperationType.UPDATE:
        const existingRow = rows.get(rowId);
        if (existingRow && fieldId) {
          existingRow.data[fieldId] = value;
          existingRow.updatedAt = timestamp;
          existingRow.updatedBy = userId;
          existingRow.version += 1;
          existingRow.vectorClock = operation.vectorClock;
        }
        break;

      case CRDTOperationType.DELETE:
        rows.delete(rowId);
        break;
    }
  }

  // 获取待同步的操作
  getPendingOperations(since?: Date): CRDTOperation[] {
    if (!since) return [...this.operations];
    return this.operations.filter(op => op.timestamp > since);
  }

  // 清理已同步的操作
  clearSyncedOperations(before: Date): void {
    this.operations = this.operations.filter(op => op.timestamp >= before);
  }

  // 获取当前向量时钟
  getCurrentVectorClock(): Record<string, number> {
    return this.vectorClock.getClock();
  }
}

// 创建CRDT管理器实例
export function createCRDTManager(userId: string, initialClock?: Record<string, number>): CRDTManager {
  return new CRDTManager(userId, initialClock);
}

// 合并多个向量时钟
export function mergeVectorClocks(clocks: Record<string, number>[]): Record<string, number> {
  const merged: Record<string, number> = {};
  
  for (const clock of clocks) {
    for (const [userId, timestamp] of Object.entries(clock)) {
      merged[userId] = Math.max(merged[userId] || 0, timestamp);
    }
  }
  
  return merged;
}

// 检查操作是否可以安全应用
export function canApplyOperation(operation: CRDTOperation, currentState: ReportRow[]): boolean {
  const targetRow = currentState.find(row => row.id === operation.rowId);
  
  switch (operation.type) {
    case CRDTOperationType.INSERT:
      return !targetRow; // 行不存在时才能插入
    
    case CRDTOperationType.UPDATE:
    case CRDTOperationType.DELETE:
      return !!targetRow; // 行存在时才能更新或删除
    
    default:
      return false;
  }
}