import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 获取帖子回复列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    
    // 获取当前用户ID（从请求头或查询参数中）
    const { searchParams } = new URL(request.url);
    const currentUserId = searchParams.get('userId') || request.headers.get('x-user-id');
    
    // 实现完整的回复查询逻辑
    // 1. 验证帖子是否存在
    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      select: { id: true, status: true }
    });

    if (!post) {
      return NextResponse.json(
        { success: false, message: '帖子不存在' },
        { status: 404 }
      );
    }

    if (post.status === 'DELETED') {
      return NextResponse.json(
        { success: false, message: '帖子已被删除' },
        { status: 404 }
      );
    }

    // 2. 查询回复列表
    const replies = await prisma.forumReply.findMany({
      where: {
        postId,
        isDeleted: false
      },
      orderBy: {
        createdAt: 'asc'
      },
      include: {
        parentReply: {
          select: {
            id: true,
            content: true,
            authorName: true
          }
        },
        childReplies: {
          where: {
            isDeleted: false
          },
          select: {
            id: true,
            content: true,
            authorName: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        likes: {
          select: {
            userId: true
          }
        }
      }
    });

    // 3. 格式化回复数据
    const formattedReplies = replies.map(reply => {
      // 根据当前用户判断是否已点赞
      const likedByCurrentUser = currentUserId ? 
        reply.likes.some(like => like.userId === currentUserId) : false;
      
      return {
        id: reply.id,
        postId: reply.postId,
        content: reply.content,
        authorId: reply.authorId,
        authorName: reply.authorName,
        authorAvatar: reply.authorAvatar,
        authorRole: reply.authorRole,
        parentReplyId: reply.parentReplyId,
        parentReply: reply.parentReply,
        childReplies: reply.childReplies,
        likeCount: reply.likeCount,
        likedByCurrentUser, // 根据当前用户判断是否已点赞
        rentalResponse: reply.rentalResponse,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt
      };
    });
    
    return NextResponse.json({
      success: true,
      data: {
        replies: formattedReplies,
        total: formattedReplies.length
      }
    });
  } catch (error) {
    console.error('获取帖子回复失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}