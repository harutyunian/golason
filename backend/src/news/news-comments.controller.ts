import { Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe, Req } from '@nestjs/common';
import type { Request } from 'express';
import { NewsCommentsService } from './news-comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/guards/jwt-auth.guard';
import { LiveScoreGateway } from '../gateway/live-score.gateway';

@Controller('football/news/:articleId/comments')
export class NewsCommentsController {
  constructor(
    private readonly commentsService: NewsCommentsService,
    private readonly gateway: LiveScoreGateway,
  ) {}

  @Get()
  async findTree(@Param('articleId', ParseIntPipe) articleId: number) {
    return this.commentsService.findTree(articleId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Param('articleId', ParseIntPipe) articleId: number,
    @Req() req: Request,
    @Body('content') content: string
  ) {
    const userId = (req as unknown as AuthenticatedRequest).user.id;
    const comment = await this.commentsService.createComment(articleId, userId, content);
    this.gateway.broadcastNewComment(articleId, comment);
    return comment;
  }

  @Post(':parentId/reply')
  @UseGuards(JwtAuthGuard)
  async createReply(
    @Param('articleId', ParseIntPipe) articleId: number,
    @Param('parentId', ParseIntPipe) parentId: number,
    @Req() req: Request,
    @Body('content') content: string
  ) {
    const userId = (req as unknown as AuthenticatedRequest).user.id;
    const reply = await this.commentsService.createReply(articleId, parentId, userId, content);
    this.gateway.broadcastNewComment(articleId, reply);
    return reply;
  }
}
