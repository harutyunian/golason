import { Module } from '@nestjs/common';
import Redis from 'ioredis';
import { ApiFootballClientService } from './api-football-client.service';
import { FootballNormalizerService } from './football-normalizer.service';
import { LiveSyncCronService } from './cron/live-sync.cron';
import { NightlySyncCronService } from './cron/nightly-sync.cron';
import { FootballController } from './football.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [FootballController],
  providers: [
    ApiFootballClientService,
    FootballNormalizerService,
    LiveSyncCronService,
    NightlySyncCronService,
    PrismaService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379,
          // Disable automatic reconnection during tests or if Redis is not running locally
          maxRetriesPerRequest: null,
          enableOfflineQueue: true,
        });
      },
    },
  ],
  exports: [
    ApiFootballClientService,
    FootballNormalizerService,
    LiveSyncCronService,
    NightlySyncCronService,
    'REDIS_CLIENT',
  ],
})
export class SportsModule {}
