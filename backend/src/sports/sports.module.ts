import { Module } from '@nestjs/common';
import { ApiFootballClientService } from './api-football-client.service';
import { FootballNormalizerService } from './football-normalizer.service';
import { LiveSyncCronService } from './cron/live-sync.cron';
import { FootballController } from './football.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [FootballController],
  providers: [
    ApiFootballClientService,
    FootballNormalizerService,
    LiveSyncCronService,
    PrismaService,
  ],
  exports: [
    ApiFootballClientService,
    FootballNormalizerService,
    LiveSyncCronService,
  ],
})
export class SportsModule {}
