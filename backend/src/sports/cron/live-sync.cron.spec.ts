import { Test, TestingModule } from '@nestjs/testing';
import { LiveSyncCronService } from './live-sync.cron';
import { ApiFootballClientService } from '../api-football-client.service';
import { FootballNormalizerService } from '../football-normalizer.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LiveScoreGateway } from '../../gateway/live-score.gateway';

describe('LiveSyncCronService', () => {
  let service: LiveSyncCronService;
  let mockApiFootballClient: Record<string, jest.Mock>;
  let mockFootballNormalizer: Record<string, jest.Mock>;
  let mockRedis: Record<string, jest.Mock>;
  let mockLiveScoreGateway: Record<string, jest.Mock>;
  let mockPrismaService: {
    league: { upsert: jest.Mock };
    team: { upsert: jest.Mock };
    match: { upsert: jest.Mock };
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockApiFootballClient = {
      getLiveFixtures: jest.fn(),
    };

    mockFootballNormalizer = {
      normalizeFixtures: jest.fn(),
    };

    mockRedis = {
      on: jest.fn(),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
      del: jest.fn(),
      quit: jest.fn(),
    };

    mockLiveScoreGateway = {
      broadcastMatchUpdate: jest.fn(),
    };

    mockPrismaService = {
      league: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      team: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      match: {
        upsert: jest.fn().mockResolvedValue({}),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveSyncCronService,
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedis,
        },
        {
          provide: ApiFootballClientService,
          useValue: mockApiFootballClient,
        },
        {
          provide: FootballNormalizerService,
          useValue: mockFootballNormalizer,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: LiveScoreGateway,
          useValue: mockLiveScoreGateway,
        },
      ],
    }).compile();

    service = module.get<LiveSyncCronService>(LiveSyncCronService);
    // Simulate at least one active client in the tests to test the main execution path
    LiveScoreGateway.activeClients = 1;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleLiveSync', () => {
    it('should skip execution if there are 0 active connected clients', async () => {
      LiveScoreGateway.activeClients = 0;

      await service.handleLiveSync();

      expect(mockRedis.set).not.toHaveBeenCalled();
      expect(mockApiFootballClient.getLiveFixtures).not.toHaveBeenCalled();
    });

    it('should skip execution if Redis lock is already held', async () => {
      mockRedis.set.mockResolvedValue(null);

      await service.handleLiveSync();

      expect(mockRedis.set).toHaveBeenCalledWith('cron:live-sync:lock', 'locked', 'PX', 45000, 'NX');
      expect(mockApiFootballClient.getLiveFixtures).not.toHaveBeenCalled();
    });

    it('should skip if API response is invalid or empty', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockApiFootballClient.getLiveFixtures.mockResolvedValue(null);

      await service.handleLiveSync();

      expect(mockApiFootballClient.getLiveFixtures).toHaveBeenCalled();
      expect(mockFootballNormalizer.normalizeFixtures).not.toHaveBeenCalled();
      expect(mockRedis.del).toHaveBeenCalledWith('cron:live-sync:lock');
    });

    it('should fetch, normalize, and upsert live fixtures into the database', async () => {
      const mockRawResponse = { response: [{ fixture: { id: 12345 } }] };
      const mockMatch = {
        id: 12345,
        date: '2026-08-02T15:00:00Z',
        status: 'LIVE',
        elapsedTime: 45,
        leagueId: 39,
        homeTeamId: 42,
        awayTeamId: 49,
        homeScore: 2,
        awayScore: 1,
        homeScoreHT: 1,
        awayScoreHT: 0,
        stats: [],
        lineups: [],
        events: [],
        league: {
          id: 39,
          name: 'Premier League',
          country: 'England',
          logo: 'https://media.api-sports.io/football/leagues/39.png',
        },
        homeTeam: {
          id: 42,
          name: 'Arsenal',
          logo: 'https://media.api-sports.io/football/teams/42.png',
        },
        awayTeam: {
          id: 49,
          name: 'Chelsea',
          logo: 'https://media.api-sports.io/football/teams/49.png',
        },
      };

      mockRedis.set.mockResolvedValue('OK');
      mockApiFootballClient.getLiveFixtures.mockResolvedValue(mockRawResponse);
      mockFootballNormalizer.normalizeFixtures.mockReturnValue([mockMatch]);

      await service.handleLiveSync();

      expect(mockRedis.set).toHaveBeenCalledWith('cron:live-sync:lock', 'locked', 'PX', 45000, 'NX');
      expect(mockFootballNormalizer.normalizeFixtures).toHaveBeenCalledWith(mockRawResponse.response);

      expect(mockPrismaService.league.upsert).toHaveBeenCalledWith({
        where: { id: 39 },
        update: {
          name: 'Premier League',
          country: 'England',
          logo: 'https://media.api-sports.io/football/leagues/39.png',
        },
        create: {
          id: 39,
          name: 'Premier League',
          country: 'England',
          logo: 'https://media.api-sports.io/football/leagues/39.png',
          sport: 'FOOTBALL',
        },
      });

      expect(mockPrismaService.team.upsert).toHaveBeenCalledWith({
        where: { id: 42 },
        update: {
          name: 'Arsenal',
          logo: 'https://media.api-sports.io/football/teams/42.png',
        },
        create: {
          id: 42,
          name: 'Arsenal',
          logo: 'https://media.api-sports.io/football/teams/42.png',
          sport: 'FOOTBALL',
        },
      });

      expect(mockPrismaService.team.upsert).toHaveBeenCalledWith({
        where: { id: 49 },
        update: {
          name: 'Chelsea',
          logo: 'https://media.api-sports.io/football/teams/49.png',
        },
        create: {
          id: 49,
          name: 'Chelsea',
          logo: 'https://media.api-sports.io/football/teams/49.png',
          sport: 'FOOTBALL',
        },
      });

      expect(mockPrismaService.match.upsert).toHaveBeenCalledWith({
        where: { id: 12345 },
        update: {
          date: new Date(mockMatch.date),
          status: 'LIVE',
          elapsedTime: 45,
          homeScore: 2,
          awayScore: 1,
          homeScoreHT: 1,
          awayScoreHT: 0,
          stats: mockMatch.stats,
          lineups: mockMatch.lineups,
          events: mockMatch.events,
        },
        create: {
          id: 12345,
          date: new Date(mockMatch.date),
          status: 'LIVE',
          elapsedTime: 45,
          sport: 'FOOTBALL',
          leagueId: 39,
          homeTeamId: 42,
          awayTeamId: 49,
          homeScore: 2,
          awayScore: 1,
          homeScoreHT: 1,
          awayScoreHT: 0,
          stats: mockMatch.stats,
          lineups: mockMatch.lineups,
          events: mockMatch.events,
        },
      });

      expect(mockRedis.del).toHaveBeenCalledWith('cron:live-sync:lock');
    });

    it('should continue processing other fixtures if one database upsert throws an error', async () => {
      const mockRawResponse = { response: [{ fixture: { id: 1 } }, { fixture: { id: 2 } }] };
      const mockMatches = [
        {
          id: 1,
          date: '2026-08-02T15:00:00Z',
          status: 'LIVE',
          elapsedTime: 45,
          leagueId: 39,
          homeTeamId: 42,
          awayTeamId: 49,
          homeScore: 1,
          awayScore: 0,
          league: { id: 39, name: 'PL', country: 'England', logo: '' },
          homeTeam: { id: 42, name: 'Arsenal', logo: '' },
          awayTeam: { id: 49, name: 'Chelsea', logo: '' },
        },
        {
          id: 2,
          date: '2026-08-02T15:00:00Z',
          status: 'LIVE',
          elapsedTime: 45,
          leagueId: 39,
          homeTeamId: 42,
          awayTeamId: 49,
          homeScore: 2,
          awayScore: 0,
          league: { id: 39, name: 'PL', country: 'England', logo: '' },
          homeTeam: { id: 42, name: 'Arsenal', logo: '' },
          awayTeam: { id: 49, name: 'Chelsea', logo: '' },
        },
      ];

      mockRedis.set.mockResolvedValue('OK');
      mockApiFootballClient.getLiveFixtures.mockResolvedValue(mockRawResponse);
      mockFootballNormalizer.normalizeFixtures.mockReturnValue(mockMatches);

      mockPrismaService.league.upsert
        .mockRejectedValueOnce(new Error('Prisma error'))
        .mockResolvedValue({});

      await service.handleLiveSync();

      expect(mockPrismaService.league.upsert).toHaveBeenCalledTimes(2);
      expect(mockRedis.del).toHaveBeenCalledWith('cron:live-sync:lock');
    });

    it('should handle critical error and release Redis lock', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockApiFootballClient.getLiveFixtures.mockRejectedValue(new Error('Network issue'));

      await service.handleLiveSync();

      expect(mockRedis.del).toHaveBeenCalledWith('cron:live-sync:lock');
    });
  });

  describe('onModuleDestroy', () => {
    it('should quit Redis client on destroy', async () => {
      mockRedis.quit.mockResolvedValue('OK');

      await service.onModuleDestroy();

      expect(mockRedis.quit).toHaveBeenCalled();
    });

    it('should handle error if quit Redis fails', async () => {
      mockRedis.quit.mockRejectedValue(new Error('Quit failed'));

      await expect(service.onModuleDestroy()).resolves.not.toThrow();
    });
  });
});
