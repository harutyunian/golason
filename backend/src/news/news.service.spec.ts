import { Test, TestingModule } from '@nestjs/testing';
import { NewsService } from './news.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NewsService', () => {
  let service: NewsService;

  const mockPrisma = {
    newsArticle: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<NewsService>(NewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all articles ordered by desc', async () => {
      const articles = [{ id: 1, title: 'Title' }];
      mockPrisma.newsArticle.findMany.mockResolvedValue(articles);

      const result = await service.findAll();
      expect(result).toEqual(articles);
      expect(mockPrisma.newsArticle.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findBySlug', () => {
    it('should return an article by slug', async () => {
      const article = { id: 1, title: 'Title', slug: 'title' };
      mockPrisma.newsArticle.findUnique.mockResolvedValue(article);

      const result = await service.findBySlug('title');
      expect(result).toEqual(article);
    });

    it('should throw NotFoundException if article not found', async () => {
      mockPrisma.newsArticle.findUnique.mockResolvedValue(null);
      await expect(service.findBySlug('title')).rejects.toThrow();
    });
  });
});
