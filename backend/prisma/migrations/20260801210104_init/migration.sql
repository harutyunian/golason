-- CreateEnum
CREATE TYPE "SportType" AS ENUM ('FOOTBALL', 'TENNIS', 'HOCKEY', 'UFC');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'LIVE', 'HALFTIME', 'FINISHED', 'POSTPONED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VoteChoice" AS ENUM ('HOME', 'DRAW', 'AWAY');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "sport" "SportType" NOT NULL DEFAULT 'FOOTBALL',
    "leagueId" INTEGER,
    "teamId" INTEGER,
    "matchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "matchId" INTEGER NOT NULL,
    "choice" "VoteChoice" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "League" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "logo" TEXT,
    "sport" "SportType" NOT NULL DEFAULT 'FOOTBALL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "League_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "current" BOOLEAN NOT NULL DEFAULT false,
    "leagueId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "logo" TEXT,
    "founded" INTEGER,
    "venueName" TEXT,
    "venueCity" TEXT,
    "sport" "SportType" NOT NULL DEFAULT 'FOOTBALL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "firstname" TEXT,
    "lastname" TEXT,
    "age" INTEGER,
    "birthDate" TEXT,
    "nationality" TEXT,
    "height" TEXT,
    "weight" TEXT,
    "photo" TEXT,
    "position" TEXT,
    "injured" BOOLEAN NOT NULL DEFAULT false,
    "sport" "SportType" NOT NULL DEFAULT 'FOOTBALL',
    "teamId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "elapsedTime" INTEGER,
    "sport" "SportType" NOT NULL DEFAULT 'FOOTBALL',
    "leagueId" INTEGER NOT NULL,
    "homeTeamId" INTEGER NOT NULL,
    "awayTeamId" INTEGER NOT NULL,
    "homeScore" INTEGER DEFAULT 0,
    "awayScore" INTEGER DEFAULT 0,
    "homeScoreHT" INTEGER DEFAULT 0,
    "awayScoreHT" INTEGER DEFAULT 0,
    "stats" JSONB,
    "lineups" JSONB,
    "events" JSONB,
    "h2h" JSONB,
    "momentum" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Standing" (
    "id" SERIAL NOT NULL,
    "leagueId" INTEGER NOT NULL,
    "season" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "goalsDiff" INTEGER NOT NULL,
    "form" TEXT,
    "played" INTEGER NOT NULL,
    "win" INTEGER NOT NULL,
    "draw" INTEGER NOT NULL,
    "lose" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Standing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_LeagueToTeam" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_leagueId_teamId_matchId_key" ON "Bookmark"("userId", "leagueId", "teamId", "matchId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_userId_matchId_key" ON "Vote"("userId", "matchId");

-- CreateIndex
CREATE INDEX "Match_date_idx" ON "Match"("date");

-- CreateIndex
CREATE INDEX "Match_status_idx" ON "Match"("status");

-- CreateIndex
CREATE UNIQUE INDEX "_LeagueToTeam_AB_unique" ON "_LeagueToTeam"("A", "B");

-- CreateIndex
CREATE INDEX "_LeagueToTeam_B_index" ON "_LeagueToTeam"("B");

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Standing" ADD CONSTRAINT "Standing_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LeagueToTeam" ADD CONSTRAINT "_LeagueToTeam_A_fkey" FOREIGN KEY ("A") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LeagueToTeam" ADD CONSTRAINT "_LeagueToTeam_B_fkey" FOREIGN KEY ("B") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
