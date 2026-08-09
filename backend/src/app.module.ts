import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LiveScoreGateway } from './gateway/live-score.gateway';
import { PrismaService } from './prisma/prisma.service';
import { SportsModule } from './sports/sports.module';
import { AuthModule } from './auth/auth.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { NewsModule } from './news/news.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    SportsModule,
    AuthModule,
    BookmarksModule,
    NewsModule,
  ],
  controllers: [AppController],
  providers: [AppService, LiveScoreGateway, PrismaService],
})
export class AppModule {}
