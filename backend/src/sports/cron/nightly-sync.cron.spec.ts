import { Test, TestingModule } from '@nestjs/testing';
import { NightlySyncCronService } from './nightly-sync.cron';
import { ApiFootballClientService } from '../api-football-client.service';
import { FootballNormalizerService } from '../football-normalizer.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('NightlySyncCronService', () => {
  let service: NightlySyncCronService;
  let mockApiFootballClient: Record<string, jest.Mock>;
  let mockFootballNormalizer: Record<string, jest.Mock>;
  let mockRedis: Record<string, jest.Mock>;
  let mockPrismaService: {
    league: { upsert: jest.Mock };
    team: { upsert: jest.Mock };
    match: { upsert: jest.Mock };
    standing: { findFirst: jest.Mock; update: jest.Mock; create: jest.Mock };
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockApiFootballClient = {
      getFixturesByDate: jest.fn(),
      getStandings: jest.fn(),
    };

    mockFootballNormalizer = {
      normalizeFixtures: jest.fn(),
      normalizeStandings: jest.fn(),
    };

    mockRedis = {
      on: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      quit: jest.fn(),
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
      standing: {
        findFirst: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockResolvedValue({}),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NightlySyncCronService,
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
      ],
    }).compile();

    service = module.get<NightlySyncCronService>(NightlySyncCronService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleNightlySync', () => {
    it('should skip execution if lock is already held', async () => {
      mockRedis.set.mockResolvedValue(null);

      await service.handleNightlySync();

      expect(mockRedis.set).toHaveBeenCalledWith('cron:nightly-sync:lock', 'locked', 'PX', 3600000, 'NX');
      expect(mockApiFootballClient.getFixturesByDate).not.toHaveBeenCalled();
    });

    it('should execute syncs when lock is successfully acquired', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockApiFootballClient.getFixturesByDate.mockResolvedValue({ response: [] });
      mockApiFootballClient.getStandings.mockResolvedValue({ response: [] });

      await service.handleNightlySync();

      expect(mockRedis.set).toHaveBeenCalledWith('cron:nightly-sync:lock', 'locked', 'PX', 3600000, 'NX');
      expect(mockApiFootballClient.getFixturesByDate).toHaveBeenCalled();
      expect(mockApiFootballClient.getStandings).toHaveBeenCalledTimes(3); // 3 leagues

      // Fast-forward 5 minutes to trigger lock release
      jest.advanceTimersByTime(300000);
      await Promise.resolve(); // flush microtasks
      expect(mockRedis.del).toHaveBeenCalledWith('cron:nightly-sync:lock');
    });

    it('should safely upsert tomorrow fixtures', async () => {
      mockRedis.set.mockResolvedValue('OK');
      const mockRawFixtures = { response: [{ fixture: { id: 111 } }] };
      const mockMatch = {
        id: 111,
        date: '2026-08-03T15:00:00Z',
        status: 'SCHEDULED',
        elapsedTime: null,
        leagueId: 39,
        homeTeamId: 42,
        awayTeamId: 49,
        homeScore: null,
        awayScore: null,
        league: { id: 39, name: 'EPL', country: 'England', logo: '' },
        homeTeam: { id: 42, name: 'Arsenal', logo: '' },
        awayTeam: { id: 49, name: 'Chelsea', logo: '' },
      };

      mockApiFootballClient.getFixturesByDate.mockResolvedValue(mockRawFixtures);
      mockFootballNormalizer.normalizeFixtures.mockReturnValue([mockMatch]);
      mockApiFootballClient.getStandings.mockResolvedValue({ response: [] });

      await service.handleNightlySync();

      expect(mockFootballNormalizer.normalizeFixtures).toHaveBeenCalledWith(mockRawFixtures.response);
      expect(mockPrismaService.league.upsert).toHaveBeenCalledWith({
        where: { id: 39 },
        update: { name: 'EPL', country: 'England', logo: '' },
        create: { id: 39, name: 'EPL', country: 'England', logo: '', sport: 'FOOTBALL' },
      });
      expect(mockPrismaService.match.upsert).toHaveBeenCalledWith({
        where: { id: 111 },
        update: {
          date: new Date(mockMatch.date),
          status: 'SCHEDULED',
          elapsedTime: null,
          homeScore: null,
          awayScore: null,
        },
        create: {
          id: 111,
          date: new Date(mockMatch.date),
          status: 'SCHEDULED',
          elapsedTime: null,
          sport: 'FOOTBALL',
          leagueId: 39,
          homeTeamId: 42,
          awayTeamId: 49,
          homeScore: null,
          awayScore: null,
        },
      });
    });

    it('should create new standings rows if none exist', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockApiFootballClient.getFixturesByDate.mockResolvedValue({ response: [] });

      const mockRawStandings = {
        response: [
          {
            league: {
              standings: [
                [
                  {
                    rank: 1,
                    team: { id: 42, name: 'Arsenal', logo: '' },
                    points: 10,
                    goalsDiff: 5,
                    form: 'W',
                    all: { played: 4, win: 3, draw: 1, lose: 0 },
                  },
                ],
              ],
            },
          },
        ],
      };

      const mockStanding = {
        leagueId: 39,
        season: 2026,
        rank: 1,
        teamId: 42,
        points: 10,
        goalsDiff: 5,
        form: 'W',
        played: 4,
        win: 3,
        draw: 1,
        lose: 0,
        team: { id: 42, name: 'Arsenal', logo: '' },
      };

      mockApiFootballClient.getStandings.mockResolvedValue(mockRawStandings);
      mockFootballNormalizer.normalizeStandings.mockReturnValue([mockStanding]);
      mockPrismaService.standing.findFirst.mockResolvedValue(null); // doesn't exist

      await service.handleNightlySync();

      expect(mockPrismaService.team.upsert).toHaveBeenCalledWith({
        where: { id: 42 },
        update: { name: 'Arsenal', logo: '' },
        create: { id: 42, name: 'Arsenal', logo: '', sport: 'FOOTBALL' },
      });

      expect(mockPrismaService.standing.create).toHaveBeenCalledWith({
        data: {
          leagueId: 39,
          season: 2026,
          teamId: 42,
          rank: 1,
          points: 10,
          goalsDiff: 5,
          form: 'W',
          played: 4,
          win: 3,
          draw: 1,
          lose: 0,
        },
      });
    });

    it('should update existing standings rows if they exist', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockApiFootballClient.getFixturesByDate.mockResolvedValue({ response: [] });

      const mockStanding = {
        leagueId: 39,
        season: 2026,
        rank: 1,
        teamId: 42,
        points: 10,
        goalsDiff: 5,
        form: 'W',
        played: 4,
        win: 3,
        draw: 1,
        lose: 0,
        team: { id: 42, name: 'Arsenal', logo: '' },
      };

      mockApiFootballClient.getStandings.mockResolvedValue({ response: [{ league: { standings: [[]] } }] });
      mockFootballNormalizer.normalizeStandings.mockReturnValue([mockStanding]);
      mockPrismaService.standing.findFirst.mockResolvedValue({ id: 999 }); // exists

      await service.handleNightlySync();

      expect(mockPrismaService.standing.update).toHaveBeenCalledWith({
        where: { id: 999 },
        data: {
          rank: 1,
          points: 10,
          goalsDiff: 5,
          form: 'W',
          played: 4,
          win: 3,
          draw: 1,
          lose: 0,
        },
      });
    });
  });

  describe('onModuleDestroy', () => {
    it('should quit Redis cleanly', async () => {
      mockRedis.quit.mockResolvedValue('OK');
      await service.onModuleDestroy();
      expect(mockRedis.quit).toHaveBeenCalled();
    });
  });
});
