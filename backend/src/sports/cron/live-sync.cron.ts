import { Injectable, Logger, OnModuleDestroy, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import Redis from 'ioredis';
import { ApiFootballClientService } from '../api-football-client.service';
import { FootballNormalizerService } from '../football-normalizer.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LiveScoreGateway } from '../../gateway/live-score.gateway';

@Injectable()
export class LiveSyncCronService implements OnModuleDestroy {
  private readonly logger = new Logger(LiveSyncCronService.name);
  private readonly syncedLeagues = new Set<number>();
  private readonly syncedTeams = new Set<number>();

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly apiFootballClient: ApiFootballClientService,
    private readonly normalizer: FootballNormalizerService,
    private readonly prisma: PrismaService,
  ) {
    this.redis.on('error', (err) => {
      this.logger.error(`Redis client error: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    try {
      await this.redis.quit();
    } catch (err: any) {
      this.logger.error(
        `Failed to quit Redis connection cleanly: ${err.message}`,
      );
    }
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleLiveSync() {
    // Optimization: Conserve external API-Football subscription quotas by skipping execution
    // when there are no active connected users (WebSocket clients) currently browsing the app.
    if (LiveScoreGateway.activeClients === 0) {
      this.logger.log(
        '[LiveSyncCron] 0 active WebSocket sessions. Skipping live scores API poll to conserve subscription quota.',
      );
      return;
    }

    const lockKey = 'cron:live-sync:lock';
    const lockTtlMs = 20000; // 20 seconds TTL

    try {
      // Attempt to acquire distributed lock to prevent overlaps
      const acquired = await this.redis.set(
        lockKey,
        'locked',
        'PX',
        lockTtlMs,
        'NX',
      );
      if (acquired !== 'OK') {
        this.logger.warn(
          '[LiveSyncCron] Sync lock is already held. Skipping execution.',
        );
        return;
      }

      this.logger.log(
        '[LiveSyncCron] Acquired sync lock. Fetching live fixtures...',
      );

      // 1. Fetch raw live fixtures
      const response = await this.apiFootballClient.getLiveFixtures();
      if (
        !response ||
        !response.response ||
        !Array.isArray(response.response)
      ) {
        this.logger.warn(
          '[LiveSyncCron] No valid response from API-Football live fixtures.',
        );
        await this.releaseLock(lockKey);
        return;
      }

      const rawFixtures = response.response;
      this.logger.log(
        `[LiveSyncCron] Fetched ${rawFixtures.length} live matches. Normalizing...`,
      );

      // 2. Normalize raw fixtures
      const normalizedMatches = this.normalizer.normalizeFixtures(rawFixtures);

      // 3. Upsert into DB
      let successCount = 0;
      for (const match of normalizedMatches) {
        try {
          // A. Upsert League dependency if not already synced in memory
          if (!this.syncedLeagues.has(match.league.id)) {
            await this.prisma.league.upsert({
              where: { id: match.league.id },
              update: {
                name: match.league.name,
                country: match.league.country,
                logo: match.league.logo,
              },
              create: {
                id: match.league.id,
                name: match.league.name,
                country: match.league.country,
                logo: match.league.logo,
                sport: 'FOOTBALL',
              },
            });
            this.syncedLeagues.add(match.league.id);
          }

          // B. Upsert Home Team dependency if not already synced in memory
          if (!this.syncedTeams.has(match.homeTeam.id)) {
            await this.prisma.team.upsert({
              where: { id: match.homeTeam.id },
              update: {
                name: match.homeTeam.name,
                logo: match.homeTeam.logo,
              },
              create: {
                id: match.homeTeam.id,
                name: match.homeTeam.name,
                logo: match.homeTeam.logo,
                sport: 'FOOTBALL',
              },
            });
            this.syncedTeams.add(match.homeTeam.id);
          }

          // C. Upsert Away Team dependency if not already synced in memory
          if (!this.syncedTeams.has(match.awayTeam.id)) {
            await this.prisma.team.upsert({
              where: { id: match.awayTeam.id },
              update: {
                name: match.awayTeam.name,
                logo: match.awayTeam.logo,
              },
              create: {
                id: match.awayTeam.id,
                name: match.awayTeam.name,
                logo: match.awayTeam.logo,
                sport: 'FOOTBALL',
              },
            });
            this.syncedTeams.add(match.awayTeam.id);
          }

          // D. Upsert Match
          await this.prisma.match.upsert({
            where: { id: match.id },
            update: {
              date: new Date(match.date),
              status: match.status,
              elapsedTime: match.elapsedTime,
              homeScore: match.homeScore,
              awayScore: match.awayScore,
              homeScoreHT: match.homeScoreHT,
              awayScoreHT: match.awayScoreHT,
              stats: match.stats || undefined,
              lineups: match.lineups || undefined,
              events: match.events || undefined,
            },
            create: {
              id: match.id,
              date: new Date(match.date),
              status: match.status,
              elapsedTime: match.elapsedTime,
              sport: 'FOOTBALL',
              leagueId: match.leagueId,
              homeTeamId: match.homeTeamId,
              awayTeamId: match.awayTeamId,
              homeScore: match.homeScore,
              awayScore: match.awayScore,
              homeScoreHT: match.homeScoreHT,
              awayScoreHT: match.awayScoreHT,
              stats: match.stats || undefined,
              lineups: match.lineups || undefined,
              events: match.events || undefined,
            },
          });

          successCount++;
        } catch (dbErr: any) {
          this.logger.error(
            `[LiveSyncCron] Failed to upsert match ID ${match.id}: ${dbErr.message}`,
          );
        }
      }

      this.logger.log(
        `[LiveSyncCron] Successfully upserted ${successCount}/${normalizedMatches.length} live matches.`,
      );

      // Release Lock
      await this.releaseLock(lockKey);
    } catch (err: any) {
      this.logger.error(
        `[LiveSyncCron] Critical error in live sync execution: ${err.message}`,
      );
      await this.releaseLock(lockKey);
    }
  }

  private async releaseLock(key: string) {
    try {
      await this.redis.del(key);
    } catch (err: any) {
      this.logger.error(
        `[LiveSyncCron] Failed to release Redis lock: ${err.message}`,
      );
    }
  }
}
