import { Injectable, Logger, OnModuleDestroy, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import Redis from 'ioredis';
import { ApiFootballClientService } from '../api-football-client.service';
import { FootballNormalizerService } from '../football-normalizer.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NightlySyncCronService implements OnModuleDestroy {
  private readonly logger = new Logger(NightlySyncCronService.name);

  private readonly targetLeagues = [39, 140, 135]; // Premier League, La Liga, Serie A
  private readonly targetSeason = 2026;

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

  async OnModuleDestroy() {
    // lowercase/uppercase safety
    await this.cleanup();
  }

  async onModuleDestroy() {
    await this.cleanup();
  }

  private async cleanup() {
    try {
      await this.redis.quit();
    } catch (err: any) {
      this.logger.error(
        `Failed to quit Redis connection cleanly: ${err.message}`,
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleNightlySync() {
    const lockKey = 'cron:nightly-sync:lock';
    const lockTtlMs = 3600000; // 1 hour TTL to guarantee no duplicate daily syncs

    try {
      // Attempt to acquire distributed lock
      const acquired = await this.redis.set(
        lockKey,
        'locked',
        'PX',
        lockTtlMs,
        'NX',
      );
      if (acquired !== 'OK') {
        this.logger.warn(
          '[NightlySyncCron] Nightly sync lock is already held. Skipping execution.',
        );
        return;
      }

      this.logger.log(
        '[NightlySyncCron] Acquired nightly sync lock. Starting sync processes...',
      );

      await this.syncTomorrowFixtures();
      await this.syncStandings();

      this.logger.log('[NightlySyncCron] Completed nightly sync successfully.');
    } catch (err: any) {
      this.logger.error(
        `[NightlySyncCron] Critical error in nightly sync: ${err.message}`,
      );
    } finally {
      // For a daily cron, we don't strictly need to release the lock immediately,
      // but it's good practice. We will keep it locked for at least 5 minutes to prevent rapid accidental triggers,
      // then delete.
      setTimeout(async () => {
        try {
          await this.redis.del(lockKey);
          this.logger.log('[NightlySyncCron] Released nightly lock.');
        } catch (err: any) {
          this.logger.error(
            `[NightlySyncCron] Failed to release lock: ${err.message}`,
          );
        }
      }, 300000); // 5 min delay before lock release
    }
  }

  /**
   * Fetch and sync all fixtures scheduled for tomorrow.
   */
  private async syncTomorrowFixtures() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      this.logger.log(
        `[NightlySyncCron] Syncing fixtures for tomorrow: ${tomorrowStr}`,
      );

      const response = await this.apiFootballClient.getFixturesByDate(tomorrowStr);
      if (
        !response ||
        !response.response ||
        !Array.isArray(response.response)
      ) {
        this.logger.warn(
          `[NightlySyncCron] No fixtures found for tomorrow (${tomorrowStr}).`,
        );
        return;
      }

      const normalized = this.normalizer.normalizeFixtures(response.response);
      let successCount = 0;

      for (const match of normalized) {
        try {
          // A. League upsert
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

          // B. Home Team upsert
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

          // C. Away Team upsert
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

          // D. Match upsert
          await this.prisma.match.upsert({
            where: { id: match.id },
            update: {
              date: new Date(match.date),
              status: match.status,
              elapsedTime: match.elapsedTime,
              homeScore: match.homeScore,
              awayScore: match.awayScore,
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
            },
          });

          successCount++;
        } catch (err: any) {
          this.logger.error(
            `[NightlySyncCron] Failed to upsert fixture ID ${match.id}: ${err.message}`,
          );
        }
      }

      this.logger.log(
        `[NightlySyncCron] Successfully synced ${successCount}/${normalized.length} tomorrow fixtures.`,
      );
    } catch (err: any) {
      this.logger.error(
        `[NightlySyncCron] Failed syncing tomorrow's fixtures: ${err.message}`,
      );
    }
  }

  /**
   * Fetch and sync current standings tables for target leagues.
   */
  private async syncStandings() {
    this.logger.log('[NightlySyncCron] Syncing standings tables...');

    for (const leagueId of this.targetLeagues) {
      try {
        this.logger.log(
          `[NightlySyncCron] Syncing standings for League ID: ${leagueId}, Season: ${this.targetSeason}`,
        );

        const response = await this.apiFootballClient.getStandings(
          leagueId,
          this.targetSeason,
        );

        const results = response?.response || [];
        if (results.length === 0 || !results[0]?.league?.standings?.[0]) {
          this.logger.warn(
            `[NightlySyncCron] No standings data returned for League ID: ${leagueId}`,
          );
          continue;
        }

        const rawRows = results[0].league.standings[0];
        const normalized = this.normalizer.normalizeStandings(
          rawRows,
          leagueId,
          this.targetSeason,
        );

        for (const row of normalized) {
          try {
            // Ensure Team profile exists to satisfy Standing team relation
            await this.prisma.team.upsert({
              where: { id: row.teamId },
              update: {
                name: row.team.name,
                logo: row.team.logo,
              },
              create: {
                id: row.teamId,
                name: row.team.name,
                logo: row.team.logo,
                sport: 'FOOTBALL',
              },
            });

            // Find existing standing row by team, league, and season
            const existing = await this.prisma.standing.findFirst({
              where: {
                leagueId: row.leagueId,
                season: row.season,
                teamId: row.teamId,
              },
            });

            if (existing) {
              await this.prisma.standing.update({
                where: { id: existing.id },
                data: {
                  rank: row.rank,
                  points: row.points,
                  goalsDiff: row.goalsDiff,
                  form: row.form,
                  played: row.played,
                  win: row.win,
                  draw: row.draw,
                  lose: row.lose,
                },
              });
            } else {
              await this.prisma.standing.create({
                data: {
                  leagueId: row.leagueId,
                  season: row.season,
                  teamId: row.teamId,
                  rank: row.rank,
                  points: row.points,
                  goalsDiff: row.goalsDiff,
                  form: row.form,
                  played: row.played,
                  win: row.win,
                  draw: row.draw,
                  lose: row.lose,
                },
              });
            }
          } catch (err: any) {
            this.logger.error(
              `[NightlySyncCron] Failed to upsert standing row for team ID ${row.teamId}: ${err.message}`,
            );
          }
        }

        this.logger.log(
          `[NightlySyncCron] Successfully synchronized standings table for League ID: ${leagueId}`,
        );
      } catch (err: any) {
        this.logger.error(
          `[NightlySyncCron] Failed to sync standings for League ID ${leagueId}: ${err.message}`,
        );
      }
    }
  }
}
