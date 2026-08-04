import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './interfaces/bookmarks.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/guards/jwt-auth.guard';

@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateBookmarkDto,
  ) {
    return this.bookmarksService.createBookmark(req.user.id, dto);
  }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    return this.bookmarksService.getBookmarks(req.user.id);
  }

  @Delete(':id')
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.bookmarksService.deleteBookmark(req.user.id, Number(id));
  }

  @Delete('composite/:type/:entityId')
  async removeByComposite(
    @Req() req: AuthenticatedRequest,
    @Param('type') type: 'competition' | 'team' | 'match',
    @Param('entityId') entityId: string,
  ) {
    return this.bookmarksService.deleteByComposite(req.user.id, type, Number(entityId));
  }
}
