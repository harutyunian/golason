import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LiveScoreGateway } from './gateway/live-score.gateway';
import { PrismaService } from './prisma/prisma.service';
import { SportsModule } from './sports/sports.module';

@Module({
  imports: [ScheduleModule.forRoot(), SportsModule],
  controllers: [AppController],
  providers: [AppService, LiveScoreGateway, PrismaService],
})
export class AppModule {}
