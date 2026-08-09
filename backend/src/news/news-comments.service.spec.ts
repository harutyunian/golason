import { Test, TestingModule } from '@nestjs/testing';
import { NewsCommentsService } from './news-comments.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('NewsCommentsService', () => {
  let service: NewsCommentsService;

  const mockPrisma = {
    comment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsCommentsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<NewsCommentsService>(NewsCommentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findTree', () => {
    it('should return nested comment trees ordered by desc', async () => {
      const tree = [
        {
          id: 1,
          content: 'Hello',
          parentId: null,
          user: { id: 10, name: 'Alice' },
          replies: [
            { id: 2, content: 'Reply', parentId: 1, user: { id: 11, name: 'Bob' } }
          ],
        },
      ];
      mockPrisma.comment.findMany.mockResolvedValue(tree);

      const result = await service.findTree(1);
      expect(result).toEqual(tree);
      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith({
        where: { articleId: 1, parentId: null },
        include: {
          user: { select: { id: true, name: true } },
          replies: {
            include: {
              user: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('createComment', () => {
    it('should create a top-level comment', async () => {
      const comment = { id: 1, content: 'New Comment', articleId: 1, userId: 10 };
      mockPrisma.comment.create.mockResolvedValue(comment);

      const result = await service.createComment(1, 10, 'New Comment');
      expect(result).toEqual(comment);
      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: { articleId: 1, userId: 10, content: 'New Comment' },
        include: { user: { select: { id: true, name: true } } }
      });
    });
  });

  describe('createReply', () => {
    it('should throw NotFoundException if parent comment is not found', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(null);

      await expect(service.createReply(1, 999, 10, 'My reply')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if the user has already replied to this comment thread', async () => {
      const parent = { id: 1, content: 'Parent comment' };
      mockPrisma.comment.findUnique.mockResolvedValue(parent);
      mockPrisma.comment.findFirst.mockResolvedValue({ id: 2, parentId: 1, userId: 10 });

      await expect(service.createReply(1, 1, 10, 'Duplicate reply')).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrisma.comment.findFirst).toHaveBeenCalledWith({
        where: { parentId: 1, userId: 10 }
      });
    });

    it('should create a reply if parent exists and user has not replied yet', async () => {
      const parent = { id: 1, content: 'Parent comment' };
      const reply = { id: 3, content: 'First reply', parentId: 1, userId: 10 };
      mockPrisma.comment.findUnique.mockResolvedValue(parent);
      mockPrisma.comment.findFirst.mockResolvedValue(null);
      mockPrisma.comment.create.mockResolvedValue(reply);

      const result = await service.createReply(1, 1, 10, 'First reply');
      expect(result).toEqual(reply);
      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: { articleId: 1, parentId: 1, userId: 10, content: 'First reply' },
        include: { user: { select: { id: true, name: true } } }
      });
    });
  });
});
