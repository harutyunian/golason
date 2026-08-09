import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NewsCommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findTree(articleId: number) {
    return this.prisma.comment.findMany({
      where: { articleId, parentId: null },
      include: {
        user: { select: { id: true, name: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createComment(articleId: number, userId: number, content: string) {
    return this.prisma.comment.create({
      data: { articleId, userId, content },
      include: { user: { select: { id: true, name: true } } }
    });
  }

  async createReply(articleId: number, parentId: number, userId: number, content: string) {
    const parent = await this.prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent) throw new NotFoundException('Parent comment not found');

    const hasReplied = await this.prisma.comment.findFirst({
      where: { parentId, userId }
    });
    if (hasReplied) {
      throw new ConflictException('You are permitted only one reply per comment thread.');
    }

    return this.prisma.comment.create({
      data: { articleId, parentId, userId, content },
      include: { user: { select: { id: true, name: true } } }
    });
  }
}
