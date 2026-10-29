-- CreateEnum
CREATE TYPE "ImportPageRole" AS ENUM ('QUESTIONS', 'ANSWER_KEY');

-- CreateEnum
CREATE TYPE "ImportPageStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

-- AlterTable
ALTER TABLE "SourceFile" ADD COLUMN     "importBatchId" TEXT,
ADD COLUMN     "uploaded" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "ImportPage" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "role" "ImportPageRole" NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "status" "ImportPageStatus" NOT NULL DEFAULT 'PENDING',
    "method" TEXT,
    "textLayer" TEXT,
    "imageKey" TEXT,
    "imageWidth" INTEGER,
    "imageHeight" INTEGER,
    "result" JSONB,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "feature" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "cacheReadTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheWriteTokens" INTEGER NOT NULL DEFAULT 0,
    "costMicroUsd" INTEGER NOT NULL,
    "refId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportPage_batchId_status_idx" ON "ImportPage"("batchId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ImportPage_fileId_pageNumber_key" ON "ImportPage"("fileId", "pageNumber");

-- CreateIndex
CREATE INDEX "AiUsage_userId_createdAt_idx" ON "AiUsage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiUsage_feature_createdAt_idx" ON "AiUsage"("feature", "createdAt");

-- CreateIndex
CREATE INDEX "SourceFile_importBatchId_idx" ON "SourceFile"("importBatchId");

-- AddForeignKey
ALTER TABLE "SourceFile" ADD CONSTRAINT "SourceFile_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportPage" ADD CONSTRAINT "ImportPage_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportPage" ADD CONSTRAINT "ImportPage_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "SourceFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsage" ADD CONSTRAINT "AiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
