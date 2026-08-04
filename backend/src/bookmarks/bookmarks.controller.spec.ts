import { Test, TestingModule } from '@nestjs/testing';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

describe('BookmarksController', () => {
  let controller: BookmarksController;
  let mockBookmarksService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockBookmarksService = {
      createBookmark: jest.fn().mockResolvedValue({ id: 1 }),
      getBookmarks: jest.fn().mockResolvedValue([]),
      deleteBookmark: jest.fn().mockResolvedValue({ success: true }),
      deleteByComposite: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookmarksController],
      providers: [
        {
          provide: BookmarksService,
          useValue: mockBookmarksService,
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn().mockResolvedValue({ sub: '42', email: 'john@example.com' }),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => true, // bypass guard for controller unit tests
      })
      .compile();

    controller = module.get<BookmarksController>(BookmarksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should delegate create call to BookmarksService', async () => {
      const mockReq = { user: { id: 42, email: 'john@example.com' } } as any;
      const dto = { teamId: 10 };
      const res = await controller.create(mockReq, dto);

      expect(mockBookmarksService.createBookmark).toHaveBeenCalledWith(42, dto);
      expect(res).toEqual({ id: 1 });
    });
  });

  describe('findAll', () => {
    it('should delegate getBookmarks call to BookmarksService', async () => {
      const mockReq = { user: { id: 42, email: 'john@example.com' } } as any;
      const res = await controller.findAll(mockReq);

      expect(mockBookmarksService.getBookmarks).toHaveBeenCalledWith(42);
      expect(res).toEqual([]);
    });
  });

  describe('remove', () => {
    it('should delegate deleteBookmark call to BookmarksService', async () => {
      const mockReq = { user: { id: 42, email: 'john@example.com' } } as any;
      const res = await controller.remove(mockReq, '100');

      expect(mockBookmarksService.deleteBookmark).toHaveBeenCalledWith(42, 100);
      expect(res).toEqual({ success: true });
    });
  });

  describe('removeByComposite', () => {
    it('should delegate deleteByComposite call to BookmarksService', async () => {
      const mockReq = { user: { id: 42, email: 'john@example.com' } } as any;
      const res = await controller.removeByComposite(mockReq, 'team', '10');

      expect(mockBookmarksService.deleteByComposite).toHaveBeenCalledWith(42, 'team', 10);
      expect(res).toEqual({ success: true });
    });
  });
});
