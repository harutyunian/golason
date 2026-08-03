import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FootballController } from './sports/football.controller';
import { LiveScoreGateway } from './gateway/live-score.gateway';
import { ApiFootballClientService } from './sports/api-football-client.service';
import { FootballNormalizerService } from './sports/football-normalizer.service';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [],
  controllers: [AppController, FootballController],
  providers: [
    AppService,
    LiveScoreGateway,
    ApiFootballClientService,
    FootballNormalizerService,
    PrismaService,
  ],
  exports: [FootballNormalizerService],
})
export class AppModule {}
