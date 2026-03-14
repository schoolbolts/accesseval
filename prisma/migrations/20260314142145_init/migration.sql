-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('scan', 'comply', 'fix');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('active', 'trialing', 'past_due', 'canceled');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('owner', 'member');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'expired');

-- CreateEnum
CREATE TYPE "CmsType" AS ENUM ('wordpress', 'squarespace', 'wix', 'civicplus', 'finalsite', 'google_sites', 'other', 'unknown');

-- CreateEnum
CREATE TYPE "ScanFrequency" AS ENUM ('monthly', 'weekly');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('queued', 'crawling', 'scanning', 'completed', 'partial', 'failed');

-- CreateEnum
CREATE TYPE "ScanTrigger" AS ENUM ('scheduled', 'manual');

-- CreateEnum
CREATE TYPE "PageStatus" AS ENUM ('scanned', 'error', 'skipped');

-- CreateEnum
CREATE TYPE "IssueSeverity" AS ENUM ('critical', 'major', 'minor');

-- CreateEnum
CREATE TYPE "SiteIssueStatus" AS ENUM ('open', 'fixed', 'ignored');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('school_district', 'municipality', 'library', 'special_district');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "stripe_customer_id" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'scan',
    "plan_status" "PlanStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'member',
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "invited_by" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "cms_type" "CmsType" NOT NULL DEFAULT 'unknown',
    "scan_frequency" "ScanFrequency" NOT NULL DEFAULT 'monthly',
    "max_pages" INTEGER NOT NULL DEFAULT 100,
    "on_demand_scans_used" INTEGER NOT NULL DEFAULT 0,
    "on_demand_reset_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scans" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "status" "ScanStatus" NOT NULL DEFAULT 'queued',
    "triggered_by" "ScanTrigger" NOT NULL,
    "pages_found" INTEGER NOT NULL DEFAULT 0,
    "pages_scanned" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER,
    "grade" TEXT,
    "critical_count" INTEGER NOT NULL DEFAULT 0,
    "major_count" INTEGER NOT NULL DEFAULT 0,
    "minor_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "scan_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "status" "PageStatus" NOT NULL DEFAULT 'scanned',
    "issue_count" INTEGER NOT NULL DEFAULT 0,
    "page_score" INTEGER,
    "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issues" (
    "id" TEXT NOT NULL,
    "scan_id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "axe_rule_id" TEXT NOT NULL,
    "severity" "IssueSeverity" NOT NULL,
    "impact" TEXT,
    "description" TEXT NOT NULL,
    "fix_instructions" TEXT NOT NULL,
    "fix_instructions_cms" TEXT,
    "element_selector" TEXT NOT NULL,
    "element_html" TEXT NOT NULL,
    "screenshot_path" TEXT,
    "wcag_criteria" TEXT,
    "fingerprint" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_issues" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "first_seen_scan_id" TEXT NOT NULL,
    "last_seen_scan_id" TEXT NOT NULL,
    "resolved_scan_id" TEXT,
    "status" "SiteIssueStatus" NOT NULL DEFAULT 'open',
    "status_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "free_scans" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "email" TEXT,
    "token" TEXT NOT NULL,
    "score" INTEGER,
    "grade" TEXT,
    "critical_count" INTEGER NOT NULL DEFAULT 0,
    "major_count" INTEGER NOT NULL DEFAULT 0,
    "minor_count" INTEGER NOT NULL DEFAULT 0,
    "results_json" JSONB,
    "ip_address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "free_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdf_assets" (
    "id" TEXT NOT NULL,
    "scan_id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL,

    CONSTRAINT "pdf_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_links" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "scan_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "share_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accessibility_statements" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "entity_name" TEXT NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT,
    "statement_html" TEXT NOT NULL,
    "last_generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accessibility_statements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE UNIQUE INDEX "sites_organization_id_key" ON "sites"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "site_issues_site_id_fingerprint_key" ON "site_issues"("site_id", "fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "free_scans_token_key" ON "free_scans"("token");

-- CreateIndex
CREATE UNIQUE INDEX "share_links_token_key" ON "share_links"("token");

-- CreateIndex
CREATE UNIQUE INDEX "accessibility_statements_organization_id_key" ON "accessibility_statements"("organization_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scans" ADD CONSTRAINT "scans_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "scans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "scans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_issues" ADD CONSTRAINT "site_issues_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_issues" ADD CONSTRAINT "site_issues_first_seen_scan_id_fkey" FOREIGN KEY ("first_seen_scan_id") REFERENCES "scans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_issues" ADD CONSTRAINT "site_issues_last_seen_scan_id_fkey" FOREIGN KEY ("last_seen_scan_id") REFERENCES "scans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_issues" ADD CONSTRAINT "site_issues_resolved_scan_id_fkey" FOREIGN KEY ("resolved_scan_id") REFERENCES "scans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdf_assets" ADD CONSTRAINT "pdf_assets_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "scans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdf_assets" ADD CONSTRAINT "pdf_assets_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "scans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accessibility_statements" ADD CONSTRAINT "accessibility_statements_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
