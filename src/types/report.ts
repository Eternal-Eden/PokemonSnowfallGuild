// 报表相关类型定义

// 会员类型枚举
export enum MemberType {
  ANNUAL = 'annual',
  MONTHLY = 'monthly',
  FREE = 'free'
}

// 表格字段类型
export interface TableField {
  id: string;
  name: string;
  type: 'text' | 'select' | 'date' | 'boolean' | 'number';
  required: boolean;
  options?: string[]; // 用于select类型
  defaultValue?: unknown;
  order: number;
}

// 预设表格字段
export const DEFAULT_FIELDS: TableField[] = [
  {
    id: 'username',
    name: '用户名',
    type: 'text',
    required: true,
    order: 1
  },
  {
    id: 'memberType',
    name: '会员类型',
    type: 'select',
    required: true,
    options: ['年费', '月费', '免费'],
    order: 2
  },
  {
    id: 'membershipFee',
    name: '会费金额',
    type: 'number',
    required: true,
    defaultValue: 0,
    order: 3
  },
  {
    id: 'joinDate',
    name: '入会时间',
    type: 'date',
    required: true,
    order: 4
  },
  {
    id: 'isOverdue',
    name: '是否逾期',
    type: 'boolean',
    required: false,
    defaultValue: false,
    order: 5
  }
];

// 报表数据行
export interface ReportRow {
  id: string;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  version: number; // 用于CRDT版本控制
  vectorClock: Record<string, number>; // CRDT向量时钟
}

// 报表配置
export interface ReportConfig {
  id: string;
  name: string;
  description?: string;
  fields: TableField[];
  permissions?: ReportPermissions;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isDefault: boolean;
  showInDataDisplay?: boolean; // 是否在数据展示页面显示
}

// 报表数据结构
export interface Report {
  id: string;
  config: ReportConfig;
  rows: ReportRow[];
  data: ReportRow[]; // 添加data属性作为rows的别名
  permissions: ReportPermissions;
  createdAt: Date;
  updatedAt: Date;
}

// 报表权限
export interface ReportPermissions {
  canView: string[]; // 用户ID列表
  canEdit: string[]; // 用户ID列表
  canDelete: string[]; // 用户ID列表
  isPublic: boolean; // 是否公开浏览
}

// CRDT操作类型
export enum CRDTOperationType {
  INSERT = 'insert',
  UPDATE = 'update',
  DELETE = 'delete'
}

// CRDT操作
export interface CRDTOperation {
  id: string;
  type: CRDTOperationType;
  rowId: string;
  fieldId?: string;
  value?: unknown;
  timestamp: Date;
  userId: string;
  vectorClock: Record<string, number>;
}

// CRDT冲突解决结果
export interface CRDTConflictResolution {
  resolved: boolean;
  finalValue: unknown;
  conflictingOperations: CRDTOperation[];
  resolutionStrategy: 'last-write-wins' | 'merge' | 'user-choice';
}

// 导出格式
export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  JSON = 'json'
}

// 导出选项
export interface ExportOptions {
  format: ExportFormat;
  includeHeaders: boolean;
  selectedFields?: string[];
  selectedRows?: string[];
  filename?: string;
}

// 报表查询参数
export interface ReportQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
  search?: string;
}

// 报表统计信息
export interface ReportStats {
  totalRows: number;
  totalReports: number;
  memberTypeDistribution: Record<string, number>;
  overdueCount: number;
  recentJoins: number; // 最近30天加入的会员数
  todayUpdates: number;
  activeUsers: number;
  lastUpdated: Date;
}

// 拖拽字段项
export interface DragFieldItem {
  id: string;
  name: string;
  type: TableField['type'];
  isPreset: boolean;
}

// 表格编辑状态
export interface TableEditState {
  editingCell: { rowId: string; fieldId: string } | null;
  selectedRows: string[];
  draggedField: DragFieldItem | null;
  isAddingRow: boolean;
}

// 实时协作状态
export interface CollaborationState {
  activeUsers: {
    userId: string;
    username: string;
    editingCell?: { rowId: string; fieldId: string } | undefined;
    lastSeen: Date;
  }[];
  pendingOperations: CRDTOperation[];
  syncStatus: 'synced' | 'syncing' | 'conflict' | 'error';
  hasConflicts: boolean;
}