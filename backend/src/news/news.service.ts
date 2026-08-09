import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNewsDto, UpdateNewsDto } from './dto/news.dto';

@Injectable()
export class NewsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateSlug(title: string): string {
    const safeTitle = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove non-alphanumeric, except hyphens/spaces
      .replace(/[\s_]+/g, '-')  // Replace spaces/underscores with hyphens
      .replace(/-+/g, '-');     // Remove duplicates of hyphens

    // Add a short random suffix to prevent slug collisions
    const suffix = Math.random().toString(36).substring(2, 6);
    return `${safeTitle}-${suffix}`;
  }

  async findAll() {
    return this.prisma.newsArticle.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const article = await this.prisma.newsArticle.findUnique({
      where: { slug },
    });
    if (!article) {
      throw new NotFoundException(`News article with slug "${slug}" not found.`);
    }
    return article;
  }

  async create(dto: CreateNewsDto) {
    const slug = this.generateSlug(dto.title);
    return this.prisma.newsArticle.create({
      data: {
        title: dto.title,
        slug,
        summary: dto.summary,
        content: dto.content,
        imageUrl: dto.imageUrl || null,
      },
    });
  }

  async update(id: number, dto: UpdateNewsDto) {
    const existing = await this.prisma.newsArticle.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`News article with ID ${id} not found.`);
    }

    const data: any = { ...dto };
    if (dto.title && dto.title !== existing.title) {
      data.slug = this.generateSlug(dto.title);
    }

    return this.prisma.newsArticle.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    const existing = await this.prisma.newsArticle.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`News article with ID ${id} not found.`);
    }

    await this.prisma.newsArticle.delete({
      where: { id },
    });

    return { success: true };
  }
}
