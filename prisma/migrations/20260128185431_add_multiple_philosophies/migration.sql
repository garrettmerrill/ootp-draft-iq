-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftPhilosophy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "settings" JSONB NOT NULL,
    "presetName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DraftPhilosophy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "age" INTEGER NOT NULL,
    "height" TEXT NOT NULL,
    "weight" TEXT NOT NULL,
    "bats" TEXT NOT NULL,
    "throws" TEXT NOT NULL,
    "overall" INTEGER NOT NULL,
    "potential" INTEGER NOT NULL,
    "leadership" TEXT,
    "loyalty" TEXT,
    "adaptability" TEXT,
    "financialAmbition" TEXT,
    "workEthic" TEXT,
    "intelligence" TEXT,
    "injuryProne" TEXT,
    "school" TEXT,
    "committedSchool" TEXT,
    "competitionLevel" TEXT,
    "highSchoolClass" TEXT,
    "battingRatings" JSONB,
    "pitchingRatings" JSONB,
    "defenseRatings" JSONB,
    "speedRatings" JSONB,
    "pitchArsenal" JSONB,
    "demandAmount" TEXT,
    "signability" TEXT,
    "scoutAccuracy" TEXT,
    "risk" TEXT,
    "compositeScore" DOUBLE PRECISION,
    "tier" TEXT,
    "isSleeper" BOOLEAN NOT NULL DEFAULT false,
    "sleeperScore" DOUBLE PRECISION,
    "archetypes" TEXT[],
    "redFlags" TEXT[],
    "greenFlags" TEXT[],
    "hasSplitsIssues" BOOLEAN NOT NULL DEFAULT false,
    "isTwoWay" BOOLEAN NOT NULL DEFAULT false,
    "isDrafted" BOOLEAN NOT NULL DEFAULT false,
    "draftRound" INTEGER,
    "draftPick" INTEGER,
    "draftTeam" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comparison" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playerIds" TEXT[],
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftPick" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "pick" INTEGER NOT NULL,
    "overallPick" INTEGER NOT NULL,
    "teamName" TEXT NOT NULL,
    "playerId" TEXT,
    "playerName" TEXT NOT NULL,
    "wasReach" BOOLEAN,
    "wasValue" BOOLEAN,
    "reachAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DraftPick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "DraftPhilosophy_userId_key" ON "DraftPhilosophy"("userId");

-- CreateIndex
CREATE INDEX "Player_userId_idx" ON "Player"("userId");

-- CreateIndex
CREATE INDEX "Player_position_idx" ON "Player"("position");

-- CreateIndex
CREATE INDEX "Player_tier_idx" ON "Player"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "Player_userId_playerId_key" ON "Player"("userId", "playerId");

-- CreateIndex
CREATE INDEX "Note_userId_idx" ON "Note"("userId");

-- CreateIndex
CREATE INDEX "Note_playerId_idx" ON "Note"("playerId");

-- CreateIndex
CREATE INDEX "Comparison_userId_idx" ON "Comparison"("userId");

-- CreateIndex
CREATE INDEX "DraftPick_userId_idx" ON "DraftPick"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DraftPick_userId_round_pick_key" ON "DraftPick"("userId", "round", "pick");

-- AddForeignKey
ALTER TABLE "DraftPhilosophy" ADD CONSTRAINT "DraftPhilosophy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comparison" ADD CONSTRAINT "Comparison_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftPick" ADD CONSTRAINT "DraftPick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
