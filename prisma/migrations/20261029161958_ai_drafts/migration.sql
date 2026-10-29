-- CreateEnum
CREATE TYPE "AiDraftStatus" AS ENUM ('QUEUED', 'RUNNING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "AiDraftBatch" (
    "id" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "section" "Section" NOT NULL,
    "domain" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "count" INTEGER NOT NULL,
    "useStyle" BOOLEAN NOT NULL DEFAULT false,
    "codePrefix" TEXT NOT NULL,
    "status" "AiDraftStatus" NOT NULL DEFAULT 'QUEUED',
    "log" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "AiDraftBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiDraftBatch_createdAt_idx" ON "AiDraftBatch"("createdAt");

-- AddForeignKey
ALTER TABLE "AiDraftBatch" ADD CONSTRAINT "AiDraftBatch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
