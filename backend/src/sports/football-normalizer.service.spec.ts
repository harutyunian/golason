import { Test, TestingModule } from '@nestjs/testing';
import { FootballNormalizerService } from './football-normalizer.service';
import { MatchStatus } from './interfaces/sports.types';

describe('FootballNormalizerService', () => {
  let service: FootballNormalizerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FootballNormalizerService],
    }).compile();

    service = module.get<FootballNormalizerService>(FootballNormalizerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('normalizeFixture', () => {
    const createRawFixture = (statusShort: string, elapsed: number | null = null) => ({
      fixture: {
        id: 123456,
        date: '2026-08-02T15:00:00Z',
        status: {
          short: statusShort,
          elapsed,
        },
      },
      league: {
        id: 39,
        name: 'Premier League',
        country: 'England',
        logo: 'https://media.api-sports.io/football/leagues/39.png',
      },
      teams: {
        home: {
          id: 42,
          name: 'Arsenal',
          logo: 'https://media.api-sports.io/football/teams/42.png',
        },
        away: {
          id: 49,
          name: 'Chelsea',
          logo: 'https://media.api-sports.io/football/teams/49.png',
        },
      },
      goals: {
        home: 2,
        away: 1,
      },
      score: {
        halftime: {
          home: 1,
          away: 0,
        },
      },
    });

    const testStatusMapping = (shortStatus: string, expectedStatus: MatchStatus) => {
      const raw = createRawFixture(shortStatus, 45);
      const normalized = service.normalizeFixture(raw);
      expect(normalized.status).toBe(expectedStatus);
    };

    it('should map LIVE short status codes correctly', () => {
      testStatusMapping('1H', 'LIVE');
      testStatusMapping('2H', 'LIVE');
      testStatusMapping('ET', 'LIVE');
      testStatusMapping('BT', 'LIVE');
      testStatusMapping('LIVE', 'LIVE');
      testStatusMapping('INT', 'LIVE');
    });

    it('should map HALFTIME short status code correctly', () => {
      testStatusMapping('HT', 'HALFTIME');
    });

    it('should map FINISHED short status codes correctly', () => {
      testStatusMapping('FT', 'FINISHED');
      testStatusMapping('AET', 'FINISHED');
      testStatusMapping('PEN', 'FINISHED');
    });

    it('should map POSTPONED short status codes correctly', () => {
      testStatusMapping('PST', 'POSTPONED');
      testStatusMapping('SUSP', 'POSTPONED');
    });

    it('should map CANCELLED short status codes correctly', () => {
      testStatusMapping('CAN', 'CANCELLED');
      testStatusMapping('ABD', 'CANCELLED');
    });

    it('should fall back to SCHEDULED for unknown short status codes', () => {
      testStatusMapping('NS', 'SCHEDULED');
      testStatusMapping('TBD', 'SCHEDULED');
    });

    it('should map all standard fixture properties correctly', () => {
      const raw = createRawFixture('FT', 90);
      const result = service.normalizeFixture(raw);

      expect(result).toEqual({
        id: 123456,
        date: '2026-08-02T15:00:00Z',
        status: 'FINISHED',
        elapsedTime: 90,
        sport: 'FOOTBALL',
        leagueId: 39,
        homeTeamId: 42,
        awayTeamId: 49,
        homeScore: 2,
        awayScore: 1,
        homeScoreHT: 1,
        awayScoreHT: 0,
        league: {
          id: 39,
          name: 'Premier League',
          country: 'England',
          logo: 'https://media.api-sports.io/football/leagues/39.png',
          sport: 'FOOTBALL',
        },
        homeTeam: {
          id: 42,
          name: 'Arsenal',
          logo: 'https://media.api-sports.io/football/teams/42.png',
          sport: 'FOOTBALL',
        },
        awayTeam: {
          id: 49,
          name: 'Chelsea',
          logo: 'https://media.api-sports.io/football/teams/49.png',
          sport: 'FOOTBALL',
        },
      });
    });

    it('should handle null halftime scores gracefully', () => {
      const raw = createRawFixture('NS');
      delete raw.score.halftime;
      const result = service.normalizeFixture(raw);
      expect(result.homeScoreHT).toBeNull();
      expect(result.awayScoreHT).toBeNull();
    });
  });

  describe('normalizeFixtures', () => {
    it('should map list of raw fixtures', () => {
      const rawFixtures = [
        {
          fixture: { id: 101, date: '2026-08-02T15:00:00Z', status: { short: 'FT', elapsed: 90 } },
          league: { id: 39, name: 'PL', country: 'England', logo: null },
          teams: { home: { id: 42, name: 'Arsenal', logo: null }, away: { id: 49, name: 'Chelsea', logo: null } },
          goals: { home: 1, away: 0 },
        },
        {
          fixture: { id: 102, date: '2026-08-02T17:00:00Z', status: { short: 'NS', elapsed: null } },
          league: { id: 39, name: 'PL', country: 'England', logo: null },
          teams: { home: { id: 50, name: 'Man City', logo: null }, away: { id: 40, name: 'Liverpool', logo: null } },
          goals: { home: null, away: null },
        },
      ];

      const results = service.normalizeFixtures(rawFixtures);
      expect(results).toHaveLength(2);
      expect(results[0].id).toBe(101);
      expect(results[0].status).toBe('FINISHED');
      expect(results[1].id).toBe(102);
      expect(results[1].status).toBe('SCHEDULED');
    });
  });
});
