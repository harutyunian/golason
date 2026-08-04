import { Test, TestingModule } from '@nestjs/testing';
import { MomentumService } from './momentum.service';

describe('MomentumService', () => {
  let service: MomentumService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MomentumService],
    }).compile();

    service = module.get<MomentumService>(MomentumService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateMomentum', () => {
    it('should generate base values based on possession ratio', () => {
      // 60% possession should result in a positive base weight
      const result = service.calculateMomentum(5, [], 60);

      expect(result).toHaveLength(90); // Default minimum is 90 minutes for matches
      // Because alpha smoothing is 0.25, it will rise toward base value (60-50)*0.4 = 4
      expect(result[0].value).toBeGreaterThan(0);
      expect(result[4].value).toBeCloseTo(4, 1);
    });

    it('should inject a large positive spike when home team scores a goal', () => {
      const mockEvents = [
        {
          time: { elapsed: 10 },
          type: 'Goal',
          side: 'home',
        },
      ];

      const result = service.calculateMomentum(12, mockEvents, 50);

      // Value at minute 10 should be highly positive due to home goal
      const pointMin10 = result.find((p) => p.minute === 10);
      expect(pointMin10).toBeDefined();
      expect(pointMin10!.value).toBeGreaterThan(5);

      // The effect should smooth and carry over into minute 11
      const pointMin11 = result.find((p) => p.minute === 11);
      expect(pointMin11!.value).toBeGreaterThan(3);
    });

    it('should penalize a team with persistent negative shift after receiving a red card', () => {
      const mockEvents = [
        {
          time: { elapsed: 20 },
          type: 'Card',
          detail: 'Red Card',
          side: 'home', // home gets red card
        },
      ];

      const result = service.calculateMomentum(50, mockEvents, 50);

      // Before red card (minute 15), momentum should be flat at 0 (since 50% possession)
      const before = result.find((p) => p.minute === 15);
      expect(before!.value).toBeCloseTo(0);

      // After red card (minute 40), momentum should be persistently negative (away advantage)
      const after = result.find((p) => p.minute === 40);
      expect(after!.value).toBeLessThan(-5);
    });
  });
});
