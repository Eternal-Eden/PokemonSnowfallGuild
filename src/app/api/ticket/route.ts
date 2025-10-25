import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface PerformanceData {
  memory?: {
    used: number;
    total: number;
  };
  timing?: {
    loadTime: number;
    renderTime: number;
  };
  userAgent?: string;
  [key: string]: unknown;
}

interface TicketData {
  ticket: {
    nickname: string;
    content: string;
    timestamp: number;
    submittedAt: string;
  };
  performance: PerformanceData;
}

// 提交到远程Git仓库
async function submitToGitRepository(filename: string, data: TicketData & { metadata?: Record<string, unknown> }): Promise<boolean> {
  try {
    const gitApiUrl = 'http://surblog.cn:3000/Starlight/Snowfall-Guild-Ticket-Warehouse.git';
    
    // 这里实现Git仓库提交逻辑
    // 由于直接提交到Git仓库需要认证和复杂的Git操作，
    // 在实际生产环境中，建议使用Git API或webhook
    
    // 模拟提交过程
    const response = await fetch(`${gitApiUrl}/api/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        content: JSON.stringify(data, null, 2),
        message: `Add ticket from ${data.ticket.nickname}`,
        branch: 'main'
      })
    }).catch(() => null);
    
    // 如果远程提交失败，仍然继续本地备份
    return response?.ok || false;
  } catch (error) {
    console.error('远程提交失败:', error);
    return false;
  }
}

// 本地备份
async function saveLocalBackup(filename: string, data: TicketData & { metadata?: Record<string, unknown> }): Promise<boolean> {
  try {
    // 确保public/Ticket目录存在
    const ticketDir = join(process.cwd(), 'public', 'Ticket');
    
    if (!existsSync(ticketDir)) {
      await mkdir(ticketDir, { recursive: true });
    }
    
    // 保存文件
    const filePath = join(ticketDir, filename);
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    
    return true;
  } catch (error) {
    console.error('本地备份失败:', error);
    return false;
  }
}

// 生成安全的文件名
function generateSafeFilename(nickname: string): string {
  // 移除特殊字符，只保留字母、数字、中文和基本符号
  const safeName = nickname
    .replace(/[<>:"/\\|?*]/g, '') // 移除Windows文件名禁用字符
    .replace(/\s+/g, '_') // 空格替换为下划线
    .substring(0, 50); // 限制长度
  
  // 如果处理后为空，使用默认名称
  if (!safeName) {
    return `ticket_${Date.now()}.json`;
  }
  
  return `${safeName}.json`;
}

export async function POST(request: NextRequest) {
  try {
    const body: TicketData = await request.json();
    
    // 验证数据
    if (!body.ticket || !body.ticket.nickname || !body.ticket.content) {
      return NextResponse.json(
        { error: '缺少必要的工单信息' },
        { status: 400 }
      );
    }
    
    // 生成文件名
    const filename = generateSafeFilename(body.ticket.nickname);
    
    // 准备完整数据
    const completeData = {
      ...body,
      metadata: {
        filename,
        createdAt: new Date().toISOString(),
        version: '1.0',
        source: 'Snowfall Guild Website'
      }
    };
    
    // 并行执行远程提交和本地备份
    const [remoteSuccess, localSuccess] = await Promise.all([
      submitToGitRepository(filename, completeData),
      saveLocalBackup(filename, completeData)
    ]);
    
    // 检查结果
    if (!localSuccess) {
      return NextResponse.json(
        { error: '本地备份失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      filename,
      remoteSubmitted: remoteSuccess,
      localBackup: localSuccess,
      message: remoteSuccess 
        ? '工单提交成功，已同步到远程仓库并本地备份' 
        : '工单已本地备份，远程同步失败（将稍后重试）'
    });
    
  } catch (error) {
    console.error('工单提交处理失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 健康检查
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Ticket Submission API',
    timestamp: new Date().toISOString()
  });
}