import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 从查询参数中获取类型，默认为 'b'
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('c') || 'b';
    
    // 请求一言API
    const response = await fetch(`https://v1.hitokoto.cn/?c=${type}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      // 设置超时
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // 返回数据并设置CORS头
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'public, max-age=300' // 缓存5分钟
      }
    });
  } catch (error) {
    console.error('一言API代理错误:', error);
    
    // 返回默认数据
    const fallbackData = {
      hitokoto: '愿你的每一天都充满阳光与希望',
      from: '落雪公会',
      from_who: '',
      id: 0,
      uuid: '',
      commit_from: '',
      creator: '',
      creator_uid: 0,
      reviewer: 0,
      type: 'b',
      length: 0
    };

    return NextResponse.json(fallbackData, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}

// 处理OPTIONS请求（预检请求）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}