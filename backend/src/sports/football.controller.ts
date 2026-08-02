import { Controller, Get, Query } from '@nestjs/common';
import {
  StandardMatch,
  StandardLeague,
  StandardTeam,
} from './interfaces/sports.types';

export interface StandardMatchWithDetails extends StandardMatch {
  league: StandardLeague;
  homeTeam: StandardTeam;
  awayTeam: StandardTeam;
}

@Controller('football')
export class FootballController {
  @Get('fixtures')
  getFixtures(@Query('date') date?: string): StandardMatchWithDetails[] {
    // If no date is provided, default to '2026-08-02'
    const targetDate = date || '2026-08-02';

    return [
      {
        id: 101,
        date: `${targetDate}T15:00:00`,
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
        date: `${targetDate}T16:15:00`,
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
        date: `${targetDate}T20:45:00`,
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
        date: `${targetDate}T12:30:00`,
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
        date: `${targetDate}T18:00:00`,
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
}
