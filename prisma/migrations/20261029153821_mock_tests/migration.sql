-- CreateEnum
CREATE TYPE "MockTestKind" AS ENUM ('CURATED', 'GENERATED');

-- CreateEnum
CREATE TYPE "MockTestStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Attempt" ADD COLUMN     "breakEndsAt" TIMESTAMP(3),
ADD COLUMN     "mockTestId" TEXT,
ADD COLUMN     "scores" JSONB;

-- CreateTable
CREATE TABLE "Annotation" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "highlights" JSONB NOT NULL DEFAULT '[]',
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Annotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockTest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" "MockTestKind" NOT NULL,
    "status" "MockTestStatus" NOT NULL DEFAULT 'DRAFT',
    "sections" "Section"[],
    "seed" INTEGER NOT NULL,
    "assemblyLog" JSONB,
    "createdById" TEXT,
    "forUserId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MockTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockModule" (
    "id" TEXT NOT NULL,
    "mockTestId" TEXT NOT NULL,
    "section" "Section" NOT NULL,
    "moduleNumber" INTEGER NOT NULL,
    "variant" TEXT NOT NULL,
    "questionIds" TEXT[],

    CONSTRAINT "MockModule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Annotation_attemptId_questionId_key" ON "Annotation"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "MockTest_status_kind_idx" ON "MockTest"("status", "kind");

-- CreateIndex
CREATE INDEX "MockTest_forUserId_idx" ON "MockTest"("forUserId");

-- CreateIndex
CREATE UNIQUE INDEX "MockModule_mockTestId_section_moduleNumber_variant_key" ON "MockModule"("mockTestId", "section", "moduleNumber", "variant");

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_mockTestId_fkey" FOREIGN KEY ("mockTestId") REFERENCES "MockTest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockModule" ADD CONSTRAINT "MockModule_mockTestId_fkey" FOREIGN KEY ("mockTestId") REFERENCES "MockTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
