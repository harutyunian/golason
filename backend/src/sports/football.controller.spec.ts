import { Test, TestingModule } from '@nestjs/testing';
import { FootballController } from './football.controller';
import { ApiFootballClientService } from './api-football-client.service';
import { FootballNormalizerService } from './football-normalizer.service';
import { HttpException } from '@nestjs/common';

describe('FootballController', () => {
  let controller: FootballController;
  let mockApiFootballClient: any;
  let mockFootballNormalizer: any;

  beforeEach(async () => {
    mockApiFootballClient = {
      getFixturesByDate: jest.fn().mockResolvedValue({ response: [] }),
      getFixtureById: jest.fn().mockResolvedValue({ response: [] }),
      getStandings: jest.fn().mockResolvedValue({
        response: [
          {
            league: {
              standings: [
                [
                  {
                    rank: 1,
                    team: { id: 42, name: "Arsenal", logo: null },
                    points: 3,
                    goalsDiff: 2,
                    form: "W",
                    all: { played: 1, win: 1, draw: 0, lose: 0 },
                  },
                ],
              ],
            },
          },
        ],
      }),
      getTeamProfile: jest.fn().mockResolvedValue({ response: [] }),
      getPlayerProfile: jest.fn().mockResolvedValue({ response: [] }),
    };

    mockFootballNormalizer = {
      normalizeFixture: jest.fn().mockReturnValue({ id: 101, status: 'FINISHED' }),
      normalizeFixtures: jest.fn().mockReturnValue([{ id: 101, status: 'FINISHED' }]),
      normalizeStandings: jest.fn().mockReturnValue([]),
      getDemoMatchById: jest.fn().mockReturnValue({ id: 101, status: 'LIVE' }),
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
      ],
    }).compile();

    controller = module.get<FootballController>(FootballController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFixtures', () => {
    it('should call getFixturesByDate and normalizeFixtures', async () => {
      const results = await controller.getFixtures('2026-08-02');
      expect(mockApiFootballClient.getFixturesByDate).toHaveBeenCalledWith('2026-08-02');
      expect(mockFootballNormalizer.normalizeFixtures).toHaveBeenCalled();
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(101);
    });
  });

  describe('getFixtureById', () => {
    it('should throw HttpException if fixture not found', async () => {
      mockApiFootballClient.getFixtureById.mockResolvedValueOnce({ response: [] });
      await expect(controller.getFixtureById('999')).rejects.toThrow(HttpException);
    });

    it('should return normalized fixture if found', async () => {
      mockApiFootballClient.getFixtureById.mockResolvedValueOnce({ response: [{ fixture: { id: 123456 } }] });
      const result = await controller.getFixtureById('123456');
      expect(mockApiFootballClient.getFixtureById).toHaveBeenCalledWith(123456);
      expect(mockFootballNormalizer.normalizeFixture).toHaveBeenCalled();
      expect(result.id).toBe(101); // mockFootballNormalizer returns { id: 101 } in mock configuration
    });
  });

  describe('getStandings', () => {
    it('should call normalizeStandings', async () => {
      const result = await controller.getStandings('39', '2026');
      expect(mockFootballNormalizer.normalizeStandings).toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
