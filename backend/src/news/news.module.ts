import { Module } from '@nestjs/common';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { NewsCommentsController } from './news-comments.controller';
import { NewsCommentsService } from './news-comments.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { SportsModule } from '../sports/sports.module';

@Module({
  imports: [AuthModule, SportsModule],
  controllers: [NewsController, NewsCommentsController],
  providers: [NewsService, NewsCommentsService, PrismaService],
})
export class NewsModule {}
