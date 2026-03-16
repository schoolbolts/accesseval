-- AlterTable
ALTER TABLE "issues" ADD COLUMN "ai_fix_suggestion" TEXT,
ADD COLUMN "ai_fix_model" TEXT,
ADD COLUMN "ai_fix_generated_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "issues_fingerprint_idx" ON "issues"("fingerprint");
