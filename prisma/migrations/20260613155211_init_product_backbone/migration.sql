-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "phone" TEXT,
    "nickname" TEXT,
    "avatar_url" TEXT,
    "login_type" TEXT NOT NULL DEFAULT 'email_code',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "auth_codes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "target" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "scene" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "used_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auth_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "asset_type" TEXT NOT NULL,
    "source_name" TEXT NOT NULL,
    "storage_url" TEXT NOT NULL,
    "mime_type" TEXT,
    "file_size" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "metadata" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "media_assets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "generation_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "task_type" TEXT NOT NULL,
    "task_status" TEXT NOT NULL DEFAULT 'pending',
    "input_payload" JSONB,
    "result_payload" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "generation_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "generation_task_assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "task_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "role" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "generation_task_assets_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "generation_tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "generation_task_assets_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "media_assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "generation_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "task_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "result_kind" TEXT NOT NULL DEFAULT 'primary',
    "display_name" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "generation_results_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "generation_tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "generation_results_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "media_assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "auth_codes_target_scene_idx" ON "auth_codes"("target", "scene");

-- CreateIndex
CREATE INDEX "auth_codes_user_id_idx" ON "auth_codes"("user_id");

-- CreateIndex
CREATE INDEX "media_assets_user_id_asset_type_idx" ON "media_assets"("user_id", "asset_type");

-- CreateIndex
CREATE INDEX "generation_tasks_user_id_task_type_task_status_idx" ON "generation_tasks"("user_id", "task_type", "task_status");

-- CreateIndex
CREATE INDEX "generation_task_assets_asset_id_idx" ON "generation_task_assets"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "generation_task_assets_task_id_asset_id_key" ON "generation_task_assets"("task_id", "asset_id");

-- CreateIndex
CREATE INDEX "generation_results_task_id_result_kind_idx" ON "generation_results"("task_id", "result_kind");

-- CreateIndex
CREATE INDEX "generation_results_asset_id_idx" ON "generation_results"("asset_id");
