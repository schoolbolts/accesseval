-- AlterTable
ALTER TABLE "organizations" ADD COLUMN "po_number" TEXT,
ADD COLUMN "billing_type" TEXT NOT NULL DEFAULT 'card';
