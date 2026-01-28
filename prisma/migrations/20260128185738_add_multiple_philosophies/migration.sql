/*
  Warnings:

  - You are about to drop the column `presetName` on the `DraftPhilosophy` table. All the data in the column will be lost.
  - Added the required column `name` to the `DraftPhilosophy` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "DraftPhilosophy_userId_key";

-- AlterTable
ALTER TABLE "DraftPhilosophy" DROP COLUMN "presetName",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPreset" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "DraftPhilosophy_userId_idx" ON "DraftPhilosophy"("userId");

-- CreateIndex
CREATE INDEX "DraftPhilosophy_userId_isActive_idx" ON "DraftPhilosophy"("userId", "isActive");
