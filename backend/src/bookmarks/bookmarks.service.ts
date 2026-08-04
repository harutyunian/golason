import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookmarkDto } from './interfaces/bookmarks.dto';

@Injectable()
export class BookmarksService {
  constructor(private readonly prisma: PrismaService) {}

  async createBookmark(userId: number, dto: CreateBookmarkDto) {
    const { leagueId, teamId, matchId } = dto;

    // Validate that exactly ONE of the keys is specified
    const providedCount = [leagueId, teamId, matchId].filter((id) => id !== undefined && id !== null).length;
    if (providedCount !== 1) {
      throw new BadRequestException(
        'Exactly one identifier (leagueId, teamId, or matchId) must be provided.',
      );
    }

    const normLeagueId = leagueId || null;
    const normTeamId = teamId || null;
    const normMatchId = matchId || null;

    // Use findFirst instead of findUnique to support nulls cleanly in typescript-eslint
    const existing = await this.prisma.bookmark.findFirst({
      where: {
        userId,
        leagueId: normLeagueId,
        teamId: normTeamId,
        matchId: normMatchId,
      },
    });

    if (existing) {
      throw new ConflictException('This item is already bookmarked.');
    }

    // Create the bookmark
    const bookmark = await this.prisma.bookmark.create({
      data: {
        userId,
        sport: 'FOOTBALL',
        leagueId: normLeagueId,
        teamId: normTeamId,
        matchId: normMatchId,
      },
    });

    return bookmark;
  }

  async getBookmarks(userId: number) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (bookmarks.length === 0) return [];

    const leagueIds = bookmarks.filter((b) => b.leagueId).map((b) => b.leagueId) as number[];
    const teamIds = bookmarks.filter((b) => b.teamId).map((b) => b.teamId) as number[];
    const matchIds = bookmarks.filter((b) => b.matchId).map((b) => b.matchId) as number[];

    const [leagues, teams, matches] = await Promise.all([
      leagueIds.length > 0 ? this.prisma.league.findMany({ where: { id: { in: leagueIds } } }) : [],
      teamIds.length > 0 ? this.prisma.team.findMany({ where: { id: { in: teamIds } } }) : [],
      matchIds.length > 0
        ? this.prisma.match.findMany({
            where: { id: { in: matchIds } },
            include: { league: true, homeTeam: true, awayTeam: true },
          })
        : [],
    ]);

    const leaguesMap = new Map(leagues.map((l) => [l.id, l]));
    const teamsMap = new Map(teams.map((t) => [t.id, t]));
    const matchesMap = new Map(matches.map((m) => [m.id, m]));

    return bookmarks.map((b) => {
      let entity: any = null;
      let type = 'competition';

      if (b.leagueId) {
        entity = leaguesMap.get(b.leagueId) || null;
        type = 'competition';
      } else if (b.teamId) {
        entity = teamsMap.get(b.teamId) || null;
        type = 'team';
      } else if (b.matchId) {
        entity = matchesMap.get(b.matchId) || null;
        type = 'match';
      }

      return {
        id: b.id,
        sport: b.sport,
        type,
        entity,
        createdAt: b.createdAt,
      };
    });
  }

  async deleteBookmark(userId: number, id: number) {
    const existing = await this.prisma.bookmark.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Bookmark not found.');
    }

    await this.prisma.bookmark.delete({
      where: { id },
    });

    return { success: true };
  }

  async deleteByComposite(userId: number, type: 'competition' | 'team' | 'match', entityId: number) {
    const leagueId = type === 'competition' ? entityId : null;
    const teamId = type === 'team' ? entityId : null;
    const matchId = type === 'match' ? entityId : null;

    // Use findFirst instead of findUnique to cleanly handle optional keys in types
    const existing = await this.prisma.bookmark.findFirst({
      where: {
        userId,
        leagueId,
        teamId,
        matchId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Bookmark not found.');
    }

    await this.prisma.bookmark.delete({
      where: { id: existing.id },
    });

    return { success: true };
  }
}
