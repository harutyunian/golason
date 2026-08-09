import { Test, TestingModule } from '@nestjs/testing';
import { FootballController } from './football.controller';
import { ApiFootballClientService } from './api-football-client.service';
import { FootballNormalizerService } from './football-normalizer.service';
import { MomentumService } from './momentum.service';
import { PrismaService } from '../prisma/prisma.service';
import { HttpException } from '@nestjs/common';

describe('FootballController', () => {
  let controller: FootballController;
  let mockApiFootballClient: any;
  let mockFootballNormalizer: any;
  let mockMomentumService: any;
  let mockPrismaService: any;

  beforeEach(async () => {
    mockApiFootballClient = {
      getFixturesByDate: jest.fn().mockResolvedValue({ response: [] }),
      getFixtureById: jest.fn().mockResolvedValue({ response: [] }),
      getOddsByFixtureId: jest.fn().mockResolvedValue({ response: [] }),
      getStandings: jest.fn().mockResolvedValue({
        response: [
          {
            league: {
              standings: [
                [
                  {
                    rank: 1,
                    team: { id: 42, name: 'Arsenal', logo: null },
                    points: 3,
                    goalsDiff: 2,
                    form: 'W',
                    all: { played: 1, win: 1, draw: 0, lose: 0 },
                  },
                ],
              ],
            },
          },
        ],
      }),
      getTeamProfile: jest.fn().mockResolvedValue({ response: [] }),
      getTeamFixtures: jest.fn().mockResolvedValue({ response: [] }),
      getPlayerProfile: jest.fn().mockResolvedValue({ response: [] }),
      searchTeams: jest.fn().mockResolvedValue({ response: [] }),
      searchLeagues: jest.fn().mockResolvedValue({ response: [] }),
      searchPlayers: jest.fn().mockResolvedValue({ response: [] }),
    };

    mockFootballNormalizer = {
      normalizeFixture: jest
        .fn()
        .mockReturnValue({ id: 101, status: 'FINISHED', league: { id: 1 }, homeTeam: { id: 11 }, awayTeam: { id: 12 } }),
      normalizeFixtures: jest
        .fn()
        .mockReturnValue([{ id: 101, status: 'FINISHED', league: { id: 1 }, homeTeam: { id: 11 }, awayTeam: { id: 12 } }]),
      normalizeStandings: jest.fn().mockReturnValue([]),
      getDemoMatchById: jest.fn().mockReturnValue({ id: 101, status: 'LIVE' }),
    };

    mockMomentumService = {
      calculateMomentum: jest.fn().mockReturnValue([]),
    };

    mockPrismaService = {
      team: {
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn().mockResolvedValue({}),
      },
      player: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      league: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      match: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FootballController],
      providers: [
        {
          provide: ApiFootballClientService,
          useValue: mockApiFootballClient,
        },
        {
          provide: FootballNormalizerService,
          useValue: mockFootballNormalizer,
        },
        {
          provide: MomentumService,
          useValue: mockMomentumService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue('OK'),
            hgetall: jest.fn().mockResolvedValue({}),
            keys: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    controller = module.get<FootballController>(FootballController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFixtures', () => {
    it('should call getFixturesByDate and normalizeFixtures when DB is empty', async () => {
      const results = await controller.getFixtures('2026-08-02');
      expect(mockPrismaService.match.findMany).toHaveBeenCalled();
      expect(mockApiFootballClient.getFixturesByDate).toHaveBeenCalledWith(
        '2026-08-02',
      );
      expect(mockFootballNormalizer.normalizeFixtures).toHaveBeenCalled();
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(101);
    });

    it('should return fixtures from database if present, without calling API-Football', async () => {
      const mockDbMatch = { id: 101, status: 'FINISHED', date: new Date('2026-08-02T15:00:00Z') };
      mockPrismaService.match.findMany.mockResolvedValueOnce([mockDbMatch]);

      const result = await controller.getFixtures('2026-08-02');
      expect(mockPrismaService.match.findMany).toHaveBeenCalled();
      expect(mockApiFootballClient.getFixturesByDate).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(101);
    });
  });

  describe('getFixtureById', () => {
    it('should throw HttpException if fixture not found in DB or API', async () => {
      mockPrismaService.match.findUnique.mockResolvedValueOnce(null);
      mockApiFootballClient.getFixtureById.mockResolvedValueOnce({
        response: [],
      });
      await expect(controller.getFixtureById('999')).rejects.toThrow(
        HttpException,
      );
    });

    it('should return normalized fixture if found via API and DB is empty', async () => {
      mockPrismaService.match.findUnique.mockResolvedValueOnce(null);
      mockApiFootballClient.getFixtureById.mockResolvedValueOnce({
        response: [{ fixture: { id: 123456 } }],
      });
      const result = await controller.getFixtureById('123456');
      expect(mockPrismaService.match.findUnique).toHaveBeenCalledWith({
        where: { id: 123456 },
        include: { league: true, homeTeam: true, awayTeam: true },
      });
      expect(mockApiFootballClient.getFixtureById).toHaveBeenCalledWith(123456);
      expect(mockFootballNormalizer.normalizeFixture).toHaveBeenCalled();
      expect(result.id).toBe(101);
    });

    it('should return match from database if finished, without calling API-Football', async () => {
      const mockDbMatch = { id: 101, status: 'FINISHED', date: new Date('2026-08-02T15:00:00Z') };
      mockPrismaService.match.findUnique.mockResolvedValueOnce(mockDbMatch);

      const result = await controller.getFixtureById('101');
      expect(mockPrismaService.match.findUnique).toHaveBeenCalledWith({
        where: { id: 101 },
        include: { league: true, homeTeam: true, awayTeam: true },
      });
      expect(mockApiFootballClient.getFixtureById).not.toHaveBeenCalled();
      expect(result.id).toBe(101);
    });
  });

  describe('getStandings', () => {
    it('should call normalizeStandings', async () => {
      const result = await controller.getStandings('39', '2026');
      expect(mockFootballNormalizer.normalizeStandings).toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getTeamProfile', () => {
    it('should return cached team profile from Redis if available', async () => {
      const cachedProfile = { id: 33, name: 'Manchester United' };
      jest.spyOn(controller['redis'], 'get').mockResolvedValueOnce(JSON.stringify(cachedProfile));

      const result = await controller.getTeamProfile('33');

      expect(controller['redis'].get).toHaveBeenCalledWith('cache:team:33');
      expect(mockApiFootballClient.getTeamProfile).not.toHaveBeenCalled();
      expect(result).toEqual(cachedProfile);
    });

    it('should throw HttpException 404 if team profile is not found in API-Football', async () => {
      jest.spyOn(controller['redis'], 'get').mockResolvedValueOnce(null);
      mockApiFootballClient.getTeamProfile.mockResolvedValueOnce({ response: [] });

      await expect(controller.getTeamProfile('999')).rejects.toThrow(
        HttpException,
      );
    });

    it('should fetch from API-Football, normalize fixtures, save to Redis, and return profile', async () => {
      jest.spyOn(controller['redis'], 'get').mockResolvedValueOnce(null);
      
      const apiTeamResponse = {
        response: [
          {
            team: {
              id: 33,
              name: 'Manchester United',
              logo: 'logo-url',
              founded: 1878,
              country: 'England',
            },
            venue: {
              name: 'Old Trafford',
              city: 'Manchester',
            },
          },
        ],
      };

      mockApiFootballClient.getTeamProfile.mockResolvedValueOnce(apiTeamResponse);

      const getTeamFixturesSpy = jest
        .spyOn(mockApiFootballClient, 'getTeamFixtures')
        .mockImplementation((teamId, type, count) => {
          if (type === 'last') {
            return Promise.resolve({
              response: [{ fixture: { id: 201 } }],
            });
          }
          if (type === 'next') {
            return Promise.resolve({
              response: [{ fixture: { id: 301 } }],
            });
          }
          return Promise.resolve({ response: [] });
        });

      mockFootballNormalizer.normalizeFixtures.mockImplementation((fixtures: any[]) => {
        return fixtures.map(f => ({ id: f.fixture.id }));
      });

      const redisSetSpy = jest.spyOn(controller['redis'], 'set').mockResolvedValueOnce('OK');

      const result = await controller.getTeamProfile('33');

      expect(mockApiFootballClient.getTeamProfile).toHaveBeenCalledWith(33);
      expect(getTeamFixturesSpy).toHaveBeenCalledWith(33, 'last', 5);
      expect(getTeamFixturesSpy).toHaveBeenCalledWith(33, 'next', 5);
      expect(mockFootballNormalizer.normalizeFixtures).toHaveBeenCalledTimes(2);

      expect(redisSetSpy).toHaveBeenCalledWith(
        'cache:team:33',
        expect.any(String),
        'EX',
        43200,
      );

      expect(result).toEqual({
        id: 33,
        name: 'Manchester United',
        logo: 'logo-url',
        founded: 1878,
        venueName: 'Old Trafford',
        venueCity: 'Manchester',
        country: 'England',
        recentMatches: [{ id: 201 }],
        upcomingMatches: [{ id: 301 }],
      });
    });
  });
});
