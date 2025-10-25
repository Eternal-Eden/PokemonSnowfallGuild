// 报表系统核心逻辑

import { 
  Report, 
  ReportConfig, 
  ReportRow, 
  ReportPermissions, 
  ReportQueryParams, 
  ReportStats, 
  ExportOptions, 
  ExportFormat, 
  TableField, 
  DEFAULT_FIELDS,
  MemberType,
  CRDTOperation,
  CRDTOperationType,
  CollaborationState
} from '@/types/report';
import { User, UserRole } from '@/types/auth';
import { createCRDTManager, CRDTManager } from './crdt';
import { Permission } from '@/types/auth';
import { authService } from '@/services/authService';

// 模拟数据存储
const reports: Report[] = [];
const reportConfigs: ReportConfig[] = [];
let reportIdCounter = 1;
let rowIdCounter = 1;

// CRDT管理器实例
const crdtManagers = new Map<string, CRDTManager>();

// 协作状态
const collaborationStates = new Map<string, CollaborationState>();

// 生成报表ID
function generateReportId(): string {
  return `report_${Date.now()}_${reportIdCounter++}`;
}

// 生成行ID
function generateRowId(): string {
  return `row_${Date.now()}_${rowIdCounter++}`;
}

// 初始化默认报表配置
export function initializeDefaultReport(): ReportConfig {
  const defaultConfig: ReportConfig = {
    id: 'default-member-report',
    name: '会员信息报表',
    description: '默认的会员信息管理报表',
    fields: [...DEFAULT_FIELDS],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    isDefault: true
  };

  if (!reportConfigs.find(config => config.id === defaultConfig.id)) {
    reportConfigs.push(defaultConfig);
  }

  return defaultConfig;
}

// 创建报表
export async function createReport(
  config: Omit<ReportConfig, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>,
  creator: User
): Promise<Report> {
  await new Promise(resolve => setTimeout(resolve, 200));

  const reportConfig: ReportConfig = {
    ...config,
    id: generateReportId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: creator.id
  };

  reportConfigs.push(reportConfig);

  const report: Report = {
    id: reportConfig.id,
    config: reportConfig,
    rows: [],
    data: [], // 添加data属性
    permissions: {
      canView: [creator.id],
      canEdit: [creator.id],
      canDelete: [creator.id],
      isPublic: false
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  reports.push(report);
  
  // 初始化CRDT管理器
  crdtManagers.set(report.id, createCRDTManager(creator.id));
  
  // 初始化协作状态
  collaborationStates.set(report.id, {
    activeUsers: [],
    pendingOperations: [],
    syncStatus: 'synced',
    hasConflicts: false
  });

  return report;
}

// 获取报表列表
export async function getReports(user: User): Promise<Report[]> {
  await new Promise(resolve => setTimeout(resolve, 300));

  return reports.filter(report => {
    // 检查用户权限
    return report.permissions.isPublic || 
           report.permissions.canView.includes(user.id) ||
           report.permissions.canEdit.includes(user.id) ||
           report.permissions.canDelete.includes(user.id);
  });
}

// 获取单个报表
export async function getReport(reportId: string, user: User): Promise<Report | null> {
  await new Promise(resolve => setTimeout(resolve, 200));

  const report = reports.find(r => r.id === reportId);
  if (!report) return null;

  // 检查权限
  if (!canViewReport(report, user)) return null;

  return report;
}

// 检查用户是否可以查看报表
export function canViewReport(report: Report, user: User): boolean {
  if (user.role === UserRole.MODERATOR) return true;
  
  return report.permissions.isPublic || 
         report.permissions.canView.includes(user.id) ||
         report.permissions.canEdit.includes(user.id) ||
         report.permissions.canDelete.includes(user.id);
}

// 检查用户是否可以编辑报表
export function canEditReport(report: Report, user: User): boolean {
  if ([UserRole.MODERATOR].includes(user.role)) return true;
  
  return report.permissions.canEdit.includes(user.id) ||
         (report.permissions.canEdit.length === 0 && [UserRole.MODERATOR].includes(user.role));
}

// 检查用户是否可以删除报表
export function canDeleteReport(report: Report, user: User): boolean {
  if ([UserRole.MODERATOR].includes(user.role)) return true;
  
  return report.permissions.canDelete.includes(user.id);
}

// 添加报表行
export async function addReportRow(
  reportId: string,
  rowData: Record<string, unknown>,
  user: User
): Promise<ReportRow | null> {
  await new Promise(resolve => setTimeout(resolve, 200));

  const report = reports.find(r => r.id === reportId);
  if (!report || !canEditReport(report, user)) return null;

  const rowId = generateRowId();
  const crdtManager = crdtManagers.get(reportId);
  
  if (crdtManager) {
    // 创建CRDT操作
    const operation = crdtManager.createOperation(CRDTOperationType.INSERT, rowId, undefined, rowData);
    
    // 应用操作
    const newRow: ReportRow = {
      id: rowId,
      data: rowData,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user.id,
      updatedBy: user.id,
      version: 1,
      vectorClock: operation.vectorClock
    };

    report.rows.push(newRow);
    report.data = report.rows; // 同步data属性
    report.updatedAt = new Date();

    // 更新协作状态
    updateCollaborationState(reportId, user, undefined);

    return newRow;
  }

  return null;
}

// 更新报表行
export async function updateReportRow(
  reportId: string,
  rowId: string,
  fieldId: string,
  value: unknown,
  user: User
): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 200));

  const report = reports.find(r => r.id === reportId);
  if (!report || !canEditReport(report, user)) return false;

  const row = report.rows.find(r => r.id === rowId);
  if (!row) return false;

  const crdtManager = crdtManagers.get(reportId);
  
  if (crdtManager) {
    // 创建CRDT操作
    const operation = crdtManager.createOperation(CRDTOperationType.UPDATE, rowId, fieldId, value);
    
    // 应用操作
    row.data[fieldId] = value;
    row.updatedAt = new Date();
    row.updatedBy = user.id;
    row.version += 1;
    row.vectorClock = operation.vectorClock;

    report.data = report.rows; // 同步data属性
    report.updatedAt = new Date();

    // 更新协作状态
    updateCollaborationState(reportId, user, { rowId, fieldId });

    return true;
  }

  return false;
}

// 删除报表行
export async function deleteReportRow(
  reportId: string,
  rowId: string,
  user: User
): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 200));

  const report = reports.find(r => r.id === reportId);
  if (!report || !canEditReport(report, user)) return false;

  const rowIndex = report.rows.findIndex(r => r.id === rowId);
  if (rowIndex === -1) return false;

  const crdtManager = crdtManagers.get(reportId);
  
  if (crdtManager) {
    // 创建CRDT操作
    crdtManager.createOperation(CRDTOperationType.DELETE, rowId);
    
    // 应用操作
    report.rows.splice(rowIndex, 1);
    report.data = report.rows; // 同步data属性
    report.updatedAt = new Date();

    // 更新协作状态
    updateCollaborationState(reportId, user, undefined);

    return true;
  }

  return false;
}

// 更新协作状态
function updateCollaborationState(
  reportId: string, 
  user: User, 
  editingCell: { rowId: string; fieldId: string } | undefined
): void {
  const state = collaborationStates.get(reportId);
  if (!state) return;

  // 更新或添加用户状态
  const userIndex = state.activeUsers.findIndex(u => u.userId === user.id);
  const userState = {
    userId: user.id,
    username: user.username,
    editingCell,
    lastSeen: new Date()
  };

  if (userIndex >= 0) {
    state.activeUsers[userIndex] = userState;
  } else {
    state.activeUsers.push(userState);
  }

  // 清理过期用户（5分钟无活动）
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  state.activeUsers = state.activeUsers.filter(u => u.lastSeen > fiveMinutesAgo);
}

// 获取协作状态
export function getCollaborationState(reportId: string): CollaborationState | null {
  return collaborationStates.get(reportId) || null;
}

// 解决CRDT冲突
export async function resolveCRDTConflicts(reportId: string): Promise<boolean> {
  const report = reports.find(r => r.id === reportId);
  const crdtManager = crdtManagers.get(reportId);
  
  if (!report || !crdtManager) return false;

  const { rows, conflicts } = crdtManager.resolveConflicts(report.rows);
  
  report.rows = rows;
  report.updatedAt = new Date();

  // 更新同步状态
  const state = collaborationStates.get(reportId);
  if (state) {
    state.syncStatus = conflicts.length > 0 ? 'conflict' : 'synced';
  }

  return true;
}

// 获取报表统计信息
export async function getReportStats(reportId: string): Promise<ReportStats | null> {
  await new Promise(resolve => setTimeout(resolve, 200));

  const report = reports.find(r => r.id === reportId);
  if (!report) return null;

  const memberTypeField = report.config.fields.find(f => f.id === 'memberType');
  const isOverdueField = report.config.fields.find(f => f.id === 'isOverdue');
  const joinDateField = report.config.fields.find(f => f.id === 'joinDate');

  const stats: ReportStats = {
    totalRows: report.rows.length,
    totalReports: reports.length,
    memberTypeDistribution: {},
    overdueCount: 0,
    recentJoins: 0,
    todayUpdates: reports.filter(r => {
      const today = new Date();
      const reportDate = new Date(r.updatedAt);
      return reportDate.toDateString() === today.toDateString();
    }).length,
    activeUsers: collaborationStates.get(reportId)?.activeUsers.length || 0,
    lastUpdated: report.updatedAt
  };

  // 统计会员类型分布
  if (memberTypeField) {
    report.rows.forEach(row => {
      const memberType = row.data[memberTypeField.id];
      if (memberType) {
        const memberTypeStr = String(memberType);
        stats.memberTypeDistribution[memberTypeStr] = 
          (stats.memberTypeDistribution[memberTypeStr] || 0) + 1;
      }
    });
  }

  // 统计逾期会员
  if (isOverdueField) {
    stats.overdueCount = report.rows.filter(row => 
      row.data[isOverdueField.id] === true
    ).length;
  }

  // 统计最近加入的会员
  if (joinDateField) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    stats.recentJoins = report.rows.filter(row => {
      const joinDateValue = row.data[joinDateField.id];
      if (!joinDateValue) return false;
      const joinDate = new Date(String(joinDateValue));
      return joinDate > thirtyDaysAgo;
    }).length;
  }

  return stats;
}

// 导出报表数据
export async function exportReportData(
  reportId: string,
  options: ExportOptions,
  user: User
): Promise<{ data: string; filename: string; mimeType: string } | null> {
  await new Promise(resolve => setTimeout(resolve, 300));

  const report = reports.find(r => r.id === reportId);
  if (!report || !canViewReport(report, user)) return null;

  const { format, includeHeaders, selectedFields, selectedRows, filename } = options;
  
  // 过滤字段
  const fields = selectedFields 
    ? report.config.fields.filter(f => selectedFields.includes(f.id))
    : report.config.fields;

  // 过滤行
  const rows = selectedRows
    ? report.rows.filter(r => selectedRows.includes(r.id))
    : report.rows;

  const defaultFilename = filename || `${report.config.name}_${new Date().toISOString().split('T')[0]}`;

  switch (format) {
    case ExportFormat.CSV:
      return {
        data: generateCSV(fields, rows, includeHeaders),
        filename: `${defaultFilename}.csv`,
        mimeType: 'text/csv'
      };

    case ExportFormat.JSON:
      return {
        data: generateJSON(fields, rows, report.config),
        filename: `${defaultFilename}.json`,
        mimeType: 'application/json'
      };

    case ExportFormat.EXCEL:
      // 简化的Excel格式（实际应用中需要使用专门的库）
      return {
        data: generateCSV(fields, rows, includeHeaders),
        filename: `${defaultFilename}.xlsx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };

    default:
      return null;
  }
}

// 生成CSV格式
function generateCSV(fields: TableField[], rows: ReportRow[], includeHeaders: boolean): string {
  const lines: string[] = [];

  if (includeHeaders) {
    lines.push(fields.map(f => `"${f.name}"`).join(','));
  }

  rows.forEach(row => {
    const values = fields.map(field => {
      const value = row.data[field.id] || '';
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    lines.push(values.join(','));
  });

  return lines.join('\n');
}

// 生成JSON格式
function generateJSON(fields: TableField[], rows: ReportRow[], config: ReportConfig): string {
  const data = {
    reportName: config.name,
    exportDate: new Date().toISOString(),
    fields: fields.map(f => ({ id: f.id, name: f.name, type: f.type })),
    data: rows.map(row => {
      const rowData: Record<string, unknown> = {};
      fields.forEach(field => {
        rowData[field.name] = row.data[field.id];
      });
      return rowData;
    })
  };

  return JSON.stringify(data, null, 2);
}

// 生成假数据用于演示
export async function generateMockData(reportId: string): Promise<boolean> {
  const report = reports.find(r => r.id === reportId);
  if (!report) return false;

  const mockUsers = [
    { username: 'alice_snow', memberType: '年费', joinDate: '2023-01-15', isOverdue: false },
    { username: 'bob_frost', memberType: '月费', joinDate: '2023-06-20', isOverdue: false },
    { username: 'charlie_ice', memberType: '免费', joinDate: '2023-09-10', isOverdue: false },
    { username: 'diana_winter', memberType: '年费', joinDate: '2022-12-05', isOverdue: true },
    { username: 'eve_blizzard', memberType: '月费', joinDate: '2023-11-01', isOverdue: false },
    { username: 'frank_crystal', memberType: '年费', joinDate: '2023-03-18', isOverdue: false },
    { username: 'grace_flake', memberType: '免费', joinDate: '2023-08-25', isOverdue: false },
    { username: 'henry_glacier', memberType: '月费', joinDate: '2023-05-12', isOverdue: true },
    { username: 'iris_icicle', memberType: '年费', joinDate: '2023-02-28', isOverdue: false },
    { username: 'jack_snowball', memberType: '免费', joinDate: '2023-10-15', isOverdue: false }
  ];

  const crdtManager = crdtManagers.get(reportId);
  if (!crdtManager) return false;

  for (const userData of mockUsers) {
    const rowId = generateRowId();
    const operation = crdtManager.createOperation(CRDTOperationType.INSERT, rowId, undefined, userData);
    
    const newRow: ReportRow = {
      id: rowId,
      data: userData,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      updatedBy: 'system',
      version: 1,
      vectorClock: operation.vectorClock
    };

    report.rows.push(newRow);
  }

  report.data = report.rows; // 同步data属性
  report.updatedAt = new Date();
  return true;
}

// 初始化系统
export function initializeReportSystem(): void {
  // 创建默认报表配置
  const defaultConfig = initializeDefaultReport();
  
  // 创建默认报表实例
  if (!reports.find(r => r.id === defaultConfig.id)) {
    const defaultReport: Report = {
      id: defaultConfig.id,
      config: defaultConfig,
      rows: [],
      data: [], // 添加data属性
      permissions: {
        canView: [],
        canEdit: [],
        canDelete: [],
        isPublic: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    reports.push(defaultReport);
    
    // 初始化CRDT管理器
    crdtManagers.set(defaultReport.id, createCRDTManager('system'));
    
    // 初始化协作状态
    collaborationStates.set(defaultReport.id, {
      activeUsers: [],
      pendingOperations: [],
      syncStatus: 'synced',
      hasConflicts: false
    });

    // 生成假数据
    generateMockData(defaultReport.id);
  }
}

// 导出报表系统实例（用于兼容性）
export const reportSystem = {
  createReport,
  getReports,
  getReport,
  addReportRow,
  updateReportRow,
  deleteReportRow,
  getReportStats,
  exportReportData,
  generateMockData,
  initializeReportSystem,
  canEditReport,
  canDeleteReport,
  getCollaborationState,
  subscribeToCollaboration: (reportId: string, callback: (state: CollaborationState) => void) => {
    // 简单的订阅实现
    const interval = setInterval(() => {
      const state = getCollaborationState(reportId);
      if (state) callback(state);
    }, 2000);
    return () => clearInterval(interval);
  }
};

// 删除整个报表
export async function deleteReport(reportId: string, userId: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 200));

  const reportIndex = reports.findIndex(r => r.id === reportId);
  if (reportIndex === -1) return false;

  const report = reports[reportIndex];
  
  // 检查权限 - 只有报表创建者或超级管理员可以删除整个报表
  if (report.config.createdBy !== userId) {
    // 这里应该检查用户角色，但为了简化，我们假设只有创建者可以删除
    return false;
  }

  // 删除报表
  reports.splice(reportIndex, 1);
  
  // 清理相关数据
  crdtManagers.delete(reportId);
  collaborationStates.delete(reportId);
  
  // 删除报表配置
  const configIndex = reportConfigs.findIndex(c => c.id === reportId);
  if (configIndex >= 0) {
    reportConfigs.splice(configIndex, 1);
  }

  return true;
}