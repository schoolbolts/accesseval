-- CreateTable
CREATE TABLE "districts" (
    "id" TEXT NOT NULL,
    "nces_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "website" TEXT,
    "city" TEXT,
    "state" TEXT,
    "state_code" TEXT,
    "phone" TEXT,
    "lea_type" TEXT,
    "grade_range" TEXT,
    "score" INTEGER,
    "grade" TEXT,
    "critical_count" INTEGER NOT NULL DEFAULT 0,
    "major_count" INTEGER NOT NULL DEFAULT 0,
    "minor_count" INTEGER NOT NULL DEFAULT 0,
    "last_scanned_at" TIMESTAMP(3),
    "scan_results_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "districts_nces_id_key" ON "districts"("nces_id");

-- CreateIndex
CREATE UNIQUE INDEX "districts_slug_key" ON "districts"("slug");

-- CreateIndex
CREATE INDEX "districts_state_code_idx" ON "districts"("state_code");

-- CreateIndex
CREATE INDEX "districts_score_idx" ON "districts"("score");
