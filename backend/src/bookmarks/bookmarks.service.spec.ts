import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BookmarksService', () => {
  let service: BookmarksService;
  let mockPrismaService: {
    bookmark: { findMany: jest.Mock; findUnique: jest.Mock; findFirst: jest.Mock; create: jest.Mock; delete: jest.Mock };
    league: { findMany: jest.Mock };
    team: { findMany: jest.Mock; upsert: jest.Mock };
    match: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrismaService = {
      bookmark: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      league: {
        findMany: jest.fn(),
      },
      team: {
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
      match: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BookmarksService>(BookmarksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBookmark', () => {
    it('should throw BadRequestException if multiple identifiers provided', async () => {
      await expect(service.createBookmark(42, { teamId: 1, matchId: 2 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if zero identifiers provided', async () => {
      await expect(service.createBookmark(42, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if bookmark already exists', async () => {
      mockPrismaService.bookmark.findFirst.mockResolvedValue({ id: 1 }); // exists

      await expect(service.createBookmark(42, { teamId: 10 })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should create and return bookmark if input is valid and new', async () => {
      mockPrismaService.bookmark.findFirst.mockResolvedValue(null); // new
      mockPrismaService.bookmark.create.mockResolvedValue({ id: 100, teamId: 10 });

      const result = await service.createBookmark(42, { teamId: 10 });

      expect(mockPrismaService.bookmark.create).toHaveBeenCalledWith({
        data: {
          userId: 42,
          sport: 'FOOTBALL',
          leagueId: null,
          teamId: 10,
          matchId: null,
        },
      });
      expect(result.id).toBe(100);
    });
  });

  describe('getBookmarks', () => {
    it('should return empty list if user has no bookmarks', async () => {
      mockPrismaService.bookmark.findMany.mockResolvedValue([]);

      const result = await service.getBookmarks(42);

      expect(result).toEqual([]);
    });

    it('should batch-fetch associated details and return combined bookmark list', async () => {
      const mockBookmarks = [
        { id: 1, teamId: 10, leagueId: null, matchId: null, sport: 'FOOTBALL', createdAt: 'date' },
        { id: 2, teamId: null, leagueId: 39, matchId: null, sport: 'FOOTBALL', createdAt: 'date' },
      ];
      mockPrismaService.bookmark.findMany.mockResolvedValue(mockBookmarks);

      mockPrismaService.team.findMany.mockResolvedValue([{ id: 10, name: 'Arsenal' }]);
      mockPrismaService.league.findMany.mockResolvedValue([{ id: 39, name: 'Premier League' }]);

      const result = await service.getBookmarks(42);

      expect(mockPrismaService.team.findMany).toHaveBeenCalledWith({ where: { id: { in: [10] } } });
      expect(mockPrismaService.league.findMany).toHaveBeenCalledWith({ where: { id: { in: [39] } } });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        sport: 'FOOTBALL',
        type: 'team',
        entity: { id: 10, name: 'Arsenal' },
        createdAt: 'date',
      });
      expect(result[1]).toEqual({
        id: 2,
        sport: 'FOOTBALL',
        type: 'competition',
        entity: { id: 39, name: 'Premier League' },
        createdAt: 'date',
      });
    });
  });

  describe('deleteBookmark', () => {
    it('should throw NotFoundException if bookmark is missing or belongs to another user', async () => {
      mockPrismaService.bookmark.findUnique.mockResolvedValue({ id: 1, userId: 100 }); // belongs to 100, requesting user is 42

      await expect(service.deleteBookmark(42, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete bookmark successfully', async () => {
      mockPrismaService.bookmark.findUnique.mockResolvedValue({ id: 1, userId: 42 });

      const result = await service.deleteBookmark(42, 1);

      expect(mockPrismaService.bookmark.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result.success).toBe(true);
    });
  });
});
