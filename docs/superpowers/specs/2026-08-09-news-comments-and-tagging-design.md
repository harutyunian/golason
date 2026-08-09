# SPECIFICATION: SofaScore-Style News Discussion, Tagging, and Live WebSocket Comments

## 1. Executive Summary
This spec outlines the design for the SofaScore-style **News Section** on Golason, featuring dynamic Markdown articles, a secure **Admin Panel** to compose/publish news, a threaded **Comments & Reply** system, real-time **WebSocket comment streams**, and dynamic **Match/Player Tagging** for contextual side-feeds.

---

## 2. Goals & Scope
- **Admin Publishing:** Admin-authenticated users can compose, publish, edit, and delete news articles using Markdown formatting.
- **Dynamic Meta & SEO:** Article pages fetch content server-side to inject optimized meta titles, descriptions, self-referencing canonical links, and Schema.org `Article` markup.
- **Live Comments Engine:** Threaded (parent-child) user discussions on news articles.
  - Regular logged-in users can post top-level comments and write a maximum of **one reply** per comment.
  - Unregistered users are presented with a friendly visual card prompting them to Login or Register to join the discussion.
- **Real-Time WebSockets:** Comments and replies are pushed in real-time to active readers using WebSockets.
- **Contextual Tagging:** Articles can be tagged with an optional `matchId` and `playerId`. Relevant news feeds are dynamically displayed on `/match/[id]` and `/player/[id]` profiles.

---

## 3. Data Models (Prisma Database Schema)

We will expand our `prisma.schema` to add the `Comment` model and update `NewsArticle` with optional tag linkages:

```prisma
model NewsArticle {
  id        Int       @id @default(autoincrement())
  title     String
  slug      String    @unique
  summary   String
  content   String    // Markdown formatted text
  imageUrl  String?
  
  // Dynamic Tagging Fields
  matchId   Int?      // Optional: Associated Match ID
  playerId  Int?      // Optional: Associated Player ID
  
  comments  Comment[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Comment {
  id        Int       @id @default(autoincrement())
  content   String    // Safe HTML/plain text
  articleId Int
  article   NewsArticle @relation(fields: [articleId], references: [id], onDelete: Cascade)
  userId    Int
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Threaded self-referencing relationship
  parentId  Int?
  parent    Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies   Comment[] @relation("CommentReplies")
  
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

---

## 4. API & Business Logic Specification

### 4.1 Comments Controller (`football/news/:id/comments`)
- `GET /football/news/:id/comments` (Public): Returns a structured, hierarchical JSON list of top-level comments along with their nested replies, sorted by `createdAt` descending.
- `POST /football/news/:id/comments` (USER/ADMIN): Publishes a top-level comment.
- `POST /football/news/:id/comments/:parentId/reply` (USER/ADMIN):
  * Checks if the authenticated user has already replied to this parent comment:
    `const hasReplied = await prisma.comment.findFirst({ where: { parentId, userId } })`
  * If `hasReplied` is true, throw `ConflictException("You are permitted only one reply per comment thread.")` to enforce the single-reply rule.
  * If valid, create the reply and broadcast it over WebSockets.

---

## 5. WebSockets & Real-Time Sync Specification

When an active user is reading `/news/[slug]`, the page establishes/joins a dedicated WebSocket room themed around the article's numeric ID:
- **Room Name:** `news:id` (e.g., `news:5` for news article with ID 5).
- **Client Join Event:** Client emits `joinArticleRoom({ articleId: 5 })`.
- **Server Broadcast Event:** When a comment or reply is posted, the NestJS `LiveScoreGateway` broadcasts a `newComment` payload containing the comment, author name, and optional parent ID:
  ```json
  {
    "id": 42,
    "content": "What an incredible performance!",
    "articleId": 5,
    "parentId": null,
    "createdAt": "2026-08-09T20:45:00Z",
    "user": {
      "id": 12,
      "name": "Alex"
    }
  }
  ```
- **Real-Time Ingestion:** Other clients' pages receive the event and slide the new comment into their UI tree immediately without requiring manual reloads.

---

## 6. User Interface Specification (Next.js)

### 6.1 Guest Prompt
If a visitor is not logged in (`AuthContext.user === null`):
- Hide the comment write boxes.
- Render a modern card:
  ```
  ╔══════════════════════════════════════════════════════════════╗
  ║ 💬 Want to join the discussion?                             ║
  ║ Log in or Create an Account to share your thoughts and reply.║
  ║ [ Log In ]  [ Create Account ]                               ║
  ╚══════════════════════════════════════════════════════════════╝
  ```

### 6.2 Admin Control Panel Form
Accessible at `/admin` (admin-validated only):
- Inputs: Title, Summary, Image URL, Match Tag (select box or ID input), Player Tag (select box or ID input), Markdown Content Editor.
- Layout: Side-by-side splitscreen (Left: input text area; Right: dynamic rendered preview showing headers, lists, codeblocks).

### 6.3 Contextual News Feeds
- **Match Details Page:** Sidebar widget "Match Contextual News" displaying articles tagged with `matchId`.
- **Player Page:** Bottom feed "Related Articles" showing news tagged with `playerId`.

---

## 7. Execution Acceptance Criteria
- [ ] Prisma schema extended with tagging support and the self-referential `Comment` model.
- [ ] Backend API endpoints created and unit tested.
- [ ] Custom validation prevents more than one reply per user per parent comment.
- [ ] WebSocket event rooms successfully created in `LiveScoreGateway` to broadcast comments in real-time.
- [ ] Next.js components render beautiful threaded layouts, handle live markdown previews, and show clean, friendly registration prompts for guests.
