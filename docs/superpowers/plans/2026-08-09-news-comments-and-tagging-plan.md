# SofaScore News, Dynamic Tagging & WebSocket Comments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, SofaScore-style football news section with markdown-supported article creation, admin panel access, threaded (parent-child) comment sections with a one-time reply restriction, live WebSocket comment broadcasts, and contextual match/player tagging feeds.

**Architecture:** We will implement the commenting database tables and endpoints, expose WebSocket rooms in the existing NestJS `LiveScoreGateway`, design front-end admin route layouts with live markdown previews, and build public-facing, SEO-optimized news feed/profile widgets.

**Tech Stack:** React, Next.js (App Router, TS), NestJS (Prisma, Socket.io), vanilla CSS.

## Global Constraints
- **Staging Target:** All features developed across individual branches must be pushed and merged specifically to the `main-today-tasks` staging branch.
- **TypeScript Security:** No `any` casts, no `@ts-ignore` comments.
- **Modular CSS:** All components must use CSS Modules (e.g., `*.module.css`).

---

### Task 1: Comment Database Tables and Backend Endpoints
*This task implements the database schema changes and the protected comments API on NestJS.*

**Files:**
- Create: `backend/src/news/news-comments.controller.ts`
- Create: `backend/src/news/news-comments.service.ts`
- Modify: `backend/prisma/schema.prisma`
- Modify: `backend/src/news/news.module.ts`

**Interfaces:**
- Consumes: NewsArticle database structures from Task 1.
- Produces: `GET /football/news/:id/comments`, `POST /football/news/:id/comments`, `POST /football/news/:id/comments/:parentId/reply`.

- [ ] **Step 1: Write the schema modifications**
Add the `Comment` model to `/backend/prisma/schema.prisma` with the self-referencing relationship:
```prisma
model Comment {
  id        Int          @id @default(autoincrement())
  content   String
  articleId Int
  article   NewsArticle  @relation(fields: [articleId], references: [id], onDelete: Cascade)
  userId    Int
  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  parentId  Int?
  parent    Comment?     @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies   Comment[]    @relation("CommentReplies")
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
}
```
And add `comments Comment[]` inside `NewsArticle` model.

- [ ] **Step 2: Generate the Prisma client**
Run: `npx prisma generate` in `/backend` to register types.

- [ ] **Step 3: Implement comments service with one-time reply constraint**
Create `backend/src/news/news-comments.service.ts`:
```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NewsCommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findTree(articleId: number) {
    return this.prisma.comment.findMany({
      where: { articleId, parentId: null },
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
  }

  async createComment(articleId: number, userId: number, content: string) {
    return this.prisma.comment.create({
      data: { articleId, userId, content },
      include: { user: { select: { id: true, name: true } } }
    });
  }

  async createReply(articleId: number, parentId: number, userId: number, content: string) {
    const parent = await this.prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent) throw new NotFoundException('Parent comment not found');

    const hasReplied = await this.prisma.comment.findFirst({
      where: { parentId, userId }
    });
    if (hasReplied) {
      throw new ConflictException('You are permitted only one reply per comment thread.');
    }

    return this.prisma.comment.create({
      data: { articleId, parentId, userId, content },
      include: { user: { select: { id: true, name: true } } }
    });
  }
}
```

- [ ] **Step 4: Implement comments controller**
Create `backend/src/news/news-comments.controller.ts`:
```typescript
import { Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe, Req } from '@nestjs/common';
import { NewsCommentsService } from './news-comments.service';
import { JwtAuthGuard, AuthenticatedRequest } from '../auth/guards/jwt-auth.guard';

@Controller('football/news/:articleId/comments')
export class NewsCommentsController {
  constructor(private readonly commentsService: NewsCommentsService) {}

  @Get()
  async findTree(@Param('articleId', ParseIntPipe) articleId: number) {
    return this.commentsService.findTree(articleId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Param('articleId', ParseIntPipe) articleId: number,
    @Req() req: AuthenticatedRequest,
    @Body('content') content: string
  ) {
    return this.commentsService.createComment(articleId, req.user.id, content);
  }

  @Post(':parentId/reply')
  @UseGuards(JwtAuthGuard)
  async createReply(
    @Param('articleId', ParseIntPipe) articleId: number,
    @Param('parentId', ParseIntPipe) parentId: number,
    @Req() req: AuthenticatedRequest,
    @Body('content') content: string
  ) {
    return this.commentsService.createReply(articleId, parentId, req.user.id, content);
  }
}
```

- [ ] **Step 5: Register Controller/Service inside NewsModule**
Add `NewsCommentsController` and `NewsCommentsService` to `backend/src/news/news.module.ts`.

- [ ] **Step 6: Write unit tests & verify**
Create `backend/src/news/news-comments.service.spec.ts` mocking `PrismaService` and test query structures and reply constraint checks.
Run: `npm run test` and `npm run build` in `/backend` to verify success.

- [ ] **Step 7: Commit changes**
Run: `git checkout -b feature/news-comment-engine && git add backend/ && git commit -m "feat(news): implement comments table and API backend endpoints with single-reply rule"`

---

### Task 2: Live WebSocket Comment Streams
*This task enables real-time message broadcasting when users write comments.*

**Files:**
- Modify: `backend/src/gateway/live-score.gateway.ts`
- Modify: `backend/src/news/news-comments.controller.ts`

**Interfaces:**
- Consumes: Comments service events from Task 1.
- Produces: WebSocket room join/leave triggers and real-time broadcasts.

- [ ] **Step 1: Expand LiveScoreGateway with news subscription rooms**
Update `/backend/src/gateway/live-score.gateway.ts` to add join/leave methods:
```typescript
  @SubscribeMessage('subscribeNews')
  handleSubscribeNews(client: Socket, payload: { articleId: number }) {
    client.join(`news:${payload.articleId}`);
    return { status: 'subscribed' };
  }

  @SubscribeMessage('unsubscribeNews')
  handleUnsubscribeNews(client: Socket, payload: { articleId: number }) {
    client.leave(`news:${payload.articleId}`);
    return { status: 'unsubscribed' };
  }

  broadcastNewComment(articleId: number, commentPayload: any) {
    this.server.to(`news:${articleId}`).emit('newComment', commentPayload);
  }
```

- [ ] **Step 2: Connect Controller comment creators to LiveScoreGateway**
Inject `LiveScoreGateway` inside `NewsCommentsController` constructor and call `broadcastNewComment` on successful posts:
```typescript
  // Inside NewsCommentsController:
  constructor(
    private readonly commentsService: NewsCommentsService,
    private readonly gateway: LiveScoreGateway
  ) {}
```
Trigger broadcast upon creating comments and replies.

- [ ] **Step 3: Run compilation and test coverage check**
Verify compilation builds beautifully with 100% success.
Run: `npm run build` inside `/backend`.

- [ ] **Step 4: Commit changes**
Run: `git checkout -b feature/news-websockets && git add . && git commit -m "feat(news): connect comment creations to WebSocket live room streams"`

---

### Task 3: Admin Publisher Dashboard UI
*This task designs the secure frontend `/admin` layout enabling administrators to compose news.*

**Files:**
- Create: `frontend/app/admin/page.tsx`
- Create: `frontend/app/admin/admin.module.css`
- Modify: `frontend/components/Header.tsx`

**Interfaces:**
- Consumes: Backend roles JWT payloads from Task 1.
- Produces: Markdown article editor with Live Preview and database storage creation.

- [ ] **Step 1: Secure admin header link**
Update `frontend/components/Header.tsx` to conditionally render a link to `/admin` only if `user?.role === 'ADMIN'`.

- [ ] **Step 2: Create Admin Dashboard layout**
Create `/frontend/app/admin/page.tsx`:
Implement state hooks for: `title`, `summary`, `content` (Markdown), `imageUrl`, `matchId`, `playerId`, `previewMode` (split-screen boolean).
Verify on mount: If `user?.role !== 'ADMIN'`, gracefully redirect the client to the homepage using Next.js `useRouter`.
On form submission, fetch `POST /football/news` carrying admin JWT credentials.

- [ ] **Step 3: Implement modular styling**
Create `/frontend/app/admin/admin.module.css` with responsive dashboard grids, input fields, markdown style pre-sets, and preview panels.

- [ ] **Step 4: Compile and check**
Run: `npm run build` inside `/frontend` to verify Next.js builds successfully.

- [ ] **Step 5: Commit changes**
Run: `git checkout -b feature/news-admin-dashboard && git add . && git commit -m "feat(news): build secure dynamic admin news publisher UI in frontend"`

---

### Task 4: Public News Section UI (Feed, Article View, & Widget)
*This task implements the public-facing news feed, article readers, sitemap overrides, and homepage lists.*

**Files:**
- Create: `frontend/app/news/page.tsx`
- Create: `frontend/app/news/[slug]/page.tsx`
- Create: `frontend/app/news/news.module.css`
- Modify: `frontend/app/page.tsx` (Homepage feed addition)

**Interfaces:**
- Consumes: REST and WebSocket commenter layers from Task 1 and 2.
- Produces: Public news widgets and live-broadcasting threaded comments interface.

- [ ] **Step 1: Create News Feed listing page**
Create `/frontend/app/news/page.tsx` to display a responsive grid listing of cover photo news cards.

- [ ] **Step 2: Create dynamic slug reading page**
Create `/frontend/app/news/[slug]/page.tsx`:
- Server-side fetch `GET /football/news/:slug`.
- Inject SEO meta properties (dynamic canonical, dynamic descriptions, and schema JSON-LD Article markup).
- Parse Markdown content into beautifully rendered typography blocks.
- Render the threaded `Comments` section:
  - If authenticated: render top-level post input + single reply buttons.
  - If guest: render the Login / Create Account registration invitation card.
  - Establish connection to standard WebSockets, subscribing to room `news:id`, and stream new comments dynamically on the fly.

- [ ] **Step 3: Integrate Homepage News bar**
Open `frontend/app/page.tsx` and place a modern horizontal news list bar at the top of the feed showing recent items.

- [ ] **Step 4: Compile, verify, and complete**
Run: `npm run build` inside `/frontend` to verify 100% production build success.

- [ ] **Step 5: Commit & Merge**
Run: `git checkout -b feature/news-public-ui && git add . && git commit -m "feat(news): implement public news feeds, dynamic sitemaps, and real-time threaded comments UI"`
