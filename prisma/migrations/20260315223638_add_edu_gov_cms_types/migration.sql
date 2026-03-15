-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CmsType" ADD VALUE 'edlio';
ALTER TYPE "CmsType" ADD VALUE 'blackboard';
ALTER TYPE "CmsType" ADD VALUE 'thrillshare';
ALTER TYPE "CmsType" ADD VALUE 'drupal';
ALTER TYPE "CmsType" ADD VALUE 'joomla';
ALTER TYPE "CmsType" ADD VALUE 'foxbright';
ALTER TYPE "CmsType" ADD VALUE 'campussuite';
ALTER TYPE "CmsType" ADD VALUE 'schoolpointe';
ALTER TYPE "CmsType" ADD VALUE 'granicus';
ALTER TYPE "CmsType" ADD VALUE 'revize';
