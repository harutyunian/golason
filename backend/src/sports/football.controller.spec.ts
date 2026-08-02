import { Test, TestingModule } from '@nestjs/testing';
import { FootballController } from './football.controller';

describe('FootballController', () => {
  let controller: FootballController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FootballController],
    }).compile();

    controller = module.get<FootballController>(FootballController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFixtures', () => {
    it('should return fixtures with targetDate', () => {
      const fixtures = controller.getFixtures('2026-08-02');
      expect(Array.isArray(fixtures)).toBe(true);
      expect(fixtures.length).toBeGreaterThan(0);
      expect(fixtures[0].date).toContain('2026-08-02');
      expect(fixtures[0].homeTeam.name).toBeDefined();
      expect(fixtures[0].awayTeam.name).toBeDefined();
    });

    it('should default targetDate if none provided', () => {
      const fixtures = controller.getFixtures();
      expect(fixtures[0].date).toContain('2026-08-02');
    });
  });
});
