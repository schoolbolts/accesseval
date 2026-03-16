-- AlterTable
ALTER TABLE "issues" ADD COLUMN     "check_data" JSONB,
ADD COLUMN     "failure_summary" TEXT,
ADD COLUMN     "help_url" TEXT;
