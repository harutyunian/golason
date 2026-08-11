import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { ApiFootballClientService } from '../api-football-client.service';
import { FootballNormalizerService } from '../football-normalizer.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LiveScoreGateway } from '../../gateway/live-score.gateway';

@Injectable()
export class LiveSyncCronService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LiveSyncCronService.name);
  private readonly syncedLeagues = new Set<number>();
  private readonly syncedTeams = new Set<number>();
  private pollingIntervalId: NodeJS.Timeout | null = null;
  private isPolling = false;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly apiFootballClient: ApiFootballClientService,
    private readonly normalizer: FootballNormalizerService,
    private readonly prisma: PrismaService,
    private readonly gateway: LiveScoreGateway,
  ) {
    this.redis.on('error', (err) => {
      this.logger.error(`Redis client error: ${err.message}`);
    });
  }

  onModuleInit() {
    // Configurable polling interval via environment variable (default: 60 seconds)
    const intervalMs = Number(process.env.LIVE_FIXTURES_POLL_INTERVAL_MS) || 60000;
    this.logger.log(`[LiveSyncCron] Initializing live match data polling. Interval: ${intervalMs}ms`);

    this.pollingIntervalId = setInterval(() => {
      this.handleLiveSync();
    }, intervalMs);
  }

  async onModuleDestroy() {
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
    }
    try {
      await this.redis.quit();
    } catch (err: any) {
      this.logger.error(
        `Failed to quit Redis connection cleanly: ${err.message}`,
      );
    }
  }

  async handleLiveSync() {
    // 1. Prevent overlapping executions
    if (this.isPolling) {
      this.logger.warn('[LiveSyncCron] Previous polling cycle is still in progress. Skipping execution to prevent overlapping.');
      return;
    }

    // 2. Optimization: Conserve API-Football quotas by skipping when no active connected WebSocket sessions
    if (LiveScoreGateway.activeClients === 0) {
      this.logger.log(
        '[LiveSyncCron] 0 active WebSocket sessions. Skipping live scores API poll to conserve subscription quota.',
      );
      return;
    }

    this.isPolling = true;
    const lockKey = 'cron:live-sync:lock';
    const lockTtlMs = 45000; // 45 seconds TTL (covers standard 1 min interval)

    try {
      // 3. Acquire Redis distributed lock (essential for horizontal scaling)
      const acquired = await this.redis.set(
        lockKey,
        'locked',
        'PX',
        lockTtlMs,
        'NX',
      );
      if (acquired !== 'OK') {
        this.logger.warn(
          '[LiveSyncCron] Distributed lock is already held by another NestJS instance. Skipping execution.',
        );
        this.isPolling = false;
        return;
      }

      this.logger.log('[LiveSyncCron] Acquired sync lock. Polling live fixtures from API-Football...');

      // 4. Fetch raw live fixtures
      const response = await this.apiFootballClient.getLiveFixtures();
      if (!response || !response.response || !Array.isArray(response.response)) {
        this.logger.warn('[LiveSyncCron] No valid response from API-Football live fixtures.');
        await this.releaseLock(lockKey);
        this.isPolling = false;
        return;
      }

      const rawFixtures = response.response;
      this.logger.log(`[LiveSyncCron] Live fixtures polling completed. Received ${rawFixtures.length} live matches.`);

      // 5. Normalize raw fixtures
      const normalizedMatches = this.normalizer.normalizeFixtures(rawFixtures);

      // 6. DB Cache & Smart Change Detection
      let successCount = 0;
      for (const match of normalizedMatches) {
        try {
          // A. Upsert League dependency
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

          // B. Upsert Home Team dependency
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

          // C. Upsert Away Team dependency
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

          // D. Upsert Match in PostgreSQL
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

          // E. Smart Change Detection via Redis State comparison
          const fixtureKey = `live:fixture:${match.id}`;
          const cachedFixtureStr = await this.redis.get(fixtureKey);

          let hasChanged = true;
          if (cachedFixtureStr) {
            try {
              const cached = JSON.parse(cachedFixtureStr);
              // Compare critical performance fields
              hasChanged =
                cached.status !== match.status ||
                cached.elapsedTime !== match.elapsedTime ||
                cached.homeScore !== match.homeScore ||
                cached.awayScore !== match.awayScore ||
                JSON.stringify(cached.events) !== JSON.stringify(match.events);
            } catch {
              hasChanged = true;
            }
          }

          if (hasChanged) {
            this.logger.log(`[LiveSyncCron] Live fixtures changed for Match ID ${match.id}. Broadcasting update.`);
            // Cache individual fixture with 24 hours TTL
            await this.redis.set(fixtureKey, JSON.stringify(match), 'EX', 86400);

            // Broadcast to general stream and direct room
            this.gateway.broadcastMatchUpdate(match);
          }
        } catch (dbErr: any) {
          this.logger.error(
            `[LiveSyncCron] Failed to process match ID ${match.id}: ${dbErr.message}`,
          );
        }
      }

      this.logger.log(`[LiveSyncCron] Successfully processed ${successCount}/${normalizedMatches.length} live matches.`);

      // 7. Save the overall list under `live:fixtures` with 2 hours TTL (keeps caching robust)
      await this.redis.set('live:fixtures', JSON.stringify(normalizedMatches), 'EX', 7200);

      // Release Lock
      await this.releaseLock(lockKey);
    } catch (err: any) {
      this.logger.error(`[LiveSyncCron] Critical error in live sync execution: ${err.message}`);
      await this.releaseLock(lockKey);
    } finally {
      this.isPolling = false;
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
