import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import {
  StandardMatch,
  StandardLeague,
  StandardTeam,
} from './interfaces/sports.types';
import { LiveScoreGateway } from '../gateway/live-score.gateway';

export interface StandardMatchWithDetails extends StandardMatch {
  league: StandardLeague;
  homeTeam: StandardTeam;
  awayTeam: StandardTeam;
}

@Controller('football')
export class FootballController {
  private fixtures: StandardMatchWithDetails[] = [];

  constructor(private readonly liveScoreGateway: LiveScoreGateway) {
    // Initialize the list of default fixtures
    this.fixtures = [
      {
        id: 101,
        date: `2026-08-02T15:00:00`,
        status: 'LIVE',
        elapsedTime: 64,
        sport: 'FOOTBALL',
        leagueId: 1,
        homeTeamId: 11,
        awayTeamId: 12,
        homeScore: 2,
        awayScore: 1,
        league: {
          id: 1,
          name: 'Premier League',
          country: 'England',
          logo: '🇬🇧',
          sport: 'FOOTBALL',
        },
        homeTeam: { id: 11, name: 'Arsenal', sport: 'FOOTBALL' },
        awayTeam: { id: 12, name: 'Chelsea', sport: 'FOOTBALL' },
      },
      {
        id: 102,
        date: `2026-08-02T16:15:00`,
        status: 'HALFTIME',
        elapsedTime: null,
        sport: 'FOOTBALL',
        leagueId: 2,
        homeTeamId: 21,
        awayTeamId: 22,
        homeScore: 0,
        awayScore: 0,
        league: {
          id: 2,
          name: 'La Liga',
          country: 'Spain',
          logo: '🇪🇸',
          sport: 'FOOTBALL',
        },
        homeTeam: { id: 21, name: 'Real Madrid', sport: 'FOOTBALL' },
        awayTeam: { id: 22, name: 'Barcelona', sport: 'FOOTBALL' },
      },
      {
        id: 103,
        date: `2026-08-02T20:45:00`,
        status: 'SCHEDULED',
        elapsedTime: null,
        sport: 'FOOTBALL',
        leagueId: 3,
        homeTeamId: 31,
        awayTeamId: 32,
        homeScore: null,
        awayScore: null,
        league: {
          id: 3,
          name: 'Serie A',
          country: 'Italy',
          logo: '🇮🇹',
          sport: 'FOOTBALL',
        },
        homeTeam: { id: 31, name: 'Inter Milan', sport: 'FOOTBALL' },
        awayTeam: { id: 32, name: 'AC Milan', sport: 'FOOTBALL' },
      },
      {
        id: 104,
        date: `2026-08-02T12:30:00`,
        status: 'FINISHED',
        elapsedTime: null,
        sport: 'FOOTBALL',
        leagueId: 1,
        homeTeamId: 13,
        awayTeamId: 14,
        homeScore: 3,
        awayScore: 1,
        league: {
          id: 1,
          name: 'Premier League',
          country: 'England',
          logo: '🇬🇧',
          sport: 'FOOTBALL',
        },
        homeTeam: { id: 13, name: 'Manchester City', sport: 'FOOTBALL' },
        awayTeam: { id: 14, name: 'Manchester United', sport: 'FOOTBALL' },
      },
      {
        id: 105,
        date: `2026-08-02T18:00:00`,
        status: 'SCHEDULED',
        elapsedTime: null,
        sport: 'FOOTBALL',
        leagueId: 2,
        homeTeamId: 23,
        awayTeamId: 24,
        homeScore: null,
        awayScore: null,
        league: {
          id: 2,
          name: 'La Liga',
          country: 'Spain',
          logo: '🇪🇸',
          sport: 'FOOTBALL',
        },
        homeTeam: { id: 23, name: 'Atletico Madrid', sport: 'FOOTBALL' },
        awayTeam: { id: 24, name: 'Sevilla', sport: 'FOOTBALL' },
      },
    ];
  }

  @Get('fixtures')
  getFixtures(@Query('date') date?: string): StandardMatchWithDetails[] {
    const targetDate = date || '2026-08-02';
    return this.fixtures.map((fixture) => {
      const timePart = String(fixture.date).split('T')[1] || '12:00:00';
      return {
        ...fixture,
        date: `${targetDate}T${timePart}`,
      };
    });
  }

  @Get('fixtures/:id')
  getFixtureById(@Param('id') id: string): StandardMatchWithDetails {
    const matchId = parseInt(id, 10);
    const found = this.fixtures.find((f) => f.id === matchId);
    if (found) {
      return found;
    }

    const generated: StandardMatchWithDetails = {
      id: matchId,
      date: '2026-08-02T15:00:00',
      status: 'LIVE',
      elapsedTime: 45,
      sport: 'FOOTBALL',
      leagueId: 1,
      homeTeamId: 11,
      awayTeamId: 12,
      homeScore: 1,
      awayScore: 0,
      league: {
        id: 1,
        name: 'Premier League',
        country: 'England',
        logo: '🇬🇧',
        sport: 'FOOTBALL',
      },
      homeTeam: { id: 11, name: 'Home Team', sport: 'FOOTBALL' },
      awayTeam: { id: 12, name: 'Away Team', sport: 'FOOTBALL' },
    };
    this.fixtures.push(generated);
    return generated;
  }

  @Post('fixtures/:id/mock-goal')
  mockGoal(
    @Param('id') id: string,
    @Body() body: { team?: 'home' | 'away' },
  ): StandardMatchWithDetails {
    const matchId = parseInt(id, 10);
    let found = this.fixtures.find((f) => f.id === matchId);
    if (!found) {
      found = {
        id: matchId,
        date: '2026-08-02T15:00:00',
        status: 'LIVE',
        elapsedTime: 45,
        sport: 'FOOTBALL',
        leagueId: 1,
        homeTeamId: 11,
        awayTeamId: 12,
        homeScore: 0,
        awayScore: 0,
        league: {
          id: 1,
          name: 'Premier League',
          country: 'England',
          logo: '🇬🇧',
          sport: 'FOOTBALL',
        },
        homeTeam: { id: 11, name: 'Home Team', sport: 'FOOTBALL' },
        awayTeam: { id: 12, name: 'Away Team', sport: 'FOOTBALL' },
      };
      this.fixtures.push(found);
    }

    const team = body?.team || 'home';
    if (team === 'away') {
      found.awayScore = (found.awayScore || 0) + 1;
    } else {
      found.homeScore = (found.homeScore || 0) + 1;
    }

    if (found.status === 'SCHEDULED') {
      found.status = 'LIVE';
      found.elapsedTime = 1;
    }

    // Broadcast update via WS
    this.liveScoreGateway.broadcastMatchUpdate(found);

    return found;
  }
}
