/*
  Warnings:

  - You are about to drop the `channel_backgrounds` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `channel_members` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `channel_message_likes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `channel_messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `channel_user_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `forbidden_word_violations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `forum_channels` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "activity_type" AS ENUM ('tournament', 'workshop', 'meetup', 'competition', 'event');

-- CreateEnum
CREATE TYPE "activity_status" AS ENUM ('active', 'completed', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "participant_status" AS ENUM ('registered', 'confirmed', 'cancelled', 'completed');

-- CreateEnum
CREATE TYPE "operation_action" AS ENUM ('CREATE_USER', 'UPDATE_USER', 'DELETE_USER', 'UPDATE_USER_STATUS', 'RESET_USER_PASSWORD', 'CREATE_POST', 'UPDATE_POST', 'DELETE_POST', 'UPDATE_POST_STATUS', 'PIN_POST', 'UNPIN_POST', 'CREATE_CIRCLE', 'UPDATE_CIRCLE', 'DELETE_CIRCLE', 'UPDATE_CIRCLE_STATUS', 'CREATE_CHANNEL', 'UPDATE_CHANNEL', 'DELETE_CHANNEL', 'CREATE_COMMENT', 'UPDATE_COMMENT', 'DELETE_COMMENT', 'UPDATE_COMMENT_STATUS', 'ADMIN_LOGIN', 'ADMIN_LOGOUT', 'CHANGE_PASSWORD', 'UPDATE_SYSTEM_SETTINGS', 'ADD_SENSITIVE_WORD', 'UPDATE_SENSITIVE_WORD', 'DELETE_SENSITIVE_WORD', 'HANDLE_REPORT', 'BATCH_UPDATE_POST_STATUS', 'BATCH_UPDATE_USER_STATUS', 'BACKUP_DATABASE', 'RESTORE_DATABASE', 'CLEAR_CACHE', 'SEND_NOTIFICATION', 'EXPORT_DATA', 'IMPORT_DATA', 'OTHER');

-- CreateEnum
CREATE TYPE "operation_module" AS ENUM ('AUTH', 'USER', 'CONTENT', 'SYSTEM', 'ANALYTICS', 'SECURITY', 'BACKUP', 'NOTIFICATION', 'OTHER');

-- CreateEnum
CREATE TYPE "setting_type" AS ENUM ('string', 'number', 'boolean', 'json', 'text');

-- CreateEnum
CREATE TYPE "sensitive_word_category" AS ENUM ('PROFANITY', 'SPAM', 'POLITICAL', 'VIOLENCE', 'ADULT', 'DISCRIMINATION', 'HARASSMENT', 'ILLEGAL', 'CUSTOM', 'OTHER');

-- CreateEnum
CREATE TYPE "report_status" AS ENUM ('PENDING', 'PROCESSING', 'RESOLVED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "report_type" AS ENUM ('POST', 'COMMENT', 'USER', 'CHANNEL_MESSAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "report_category" AS ENUM ('SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'VIOLENCE', 'HATE_SPEECH', 'MISINFORMATION', 'COPYRIGHT', 'PRIVACY', 'FRAUD', 'OTHER');

-- CreateEnum
CREATE TYPE "report_result" AS ENUM ('NO_ACTION', 'WARNING', 'CONTENT_REMOVED', 'USER_SUSPENDED', 'USER_BANNED', 'OTHER');

-- CreateEnum
CREATE TYPE "circle_status" AS ENUM ('active', 'inactive', 'deleted');

-- DropForeignKey
ALTER TABLE "channel_backgrounds" DROP CONSTRAINT "channel_backgrounds_channel_id_fkey";

-- DropForeignKey
ALTER TABLE "channel_backgrounds" DROP CONSTRAINT "channel_backgrounds_uploaded_by_fkey";

-- DropForeignKey
ALTER TABLE "channel_members" DROP CONSTRAINT "channel_members_channel_id_fkey";

-- DropForeignKey
ALTER TABLE "channel_members" DROP CONSTRAINT "channel_members_muted_by_fkey";

-- DropForeignKey
ALTER TABLE "channel_members" DROP CONSTRAINT "channel_members_user_id_fkey";

-- DropForeignKey
ALTER TABLE "channel_message_likes" DROP CONSTRAINT "channel_message_likes_message_id_fkey";

-- DropForeignKey
ALTER TABLE "channel_message_likes" DROP CONSTRAINT "channel_message_likes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "channel_messages" DROP CONSTRAINT "channel_messages_author_id_fkey";

-- DropForeignKey
ALTER TABLE "channel_messages" DROP CONSTRAINT "channel_messages_channel_id_fkey";

-- DropForeignKey
ALTER TABLE "channel_messages" DROP CONSTRAINT "channel_messages_deleted_by_fkey";

-- DropForeignKey
ALTER TABLE "channel_messages" DROP CONSTRAINT "channel_messages_pinned_by_fkey";

-- DropForeignKey
ALTER TABLE "channel_messages" DROP CONSTRAINT "channel_messages_reply_to_id_fkey";

-- DropForeignKey
ALTER TABLE "channel_user_settings" DROP CONSTRAINT "channel_user_settings_channel_id_fkey";

-- DropForeignKey
ALTER TABLE "channel_user_settings" DROP CONSTRAINT "channel_user_settings_last_read_message_id_fkey";

-- DropForeignKey
ALTER TABLE "channel_user_settings" DROP CONSTRAINT "channel_user_settings_user_id_fkey";

-- DropForeignKey
ALTER TABLE "forbidden_word_violations" DROP CONSTRAINT "forbidden_word_violations_channel_id_fkey";

-- DropForeignKey
ALTER TABLE "forbidden_word_violations" DROP CONSTRAINT "forbidden_word_violations_user_id_fkey";

-- DropForeignKey
ALTER TABLE "forum_channels" DROP CONSTRAINT "forum_channels_created_by_fkey";

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "avatar" TEXT;

-- DropTable
DROP TABLE "channel_backgrounds";

-- DropTable
DROP TABLE "channel_members";

-- DropTable
DROP TABLE "channel_message_likes";

-- DropTable
DROP TABLE "channel_messages";

-- DropTable
DROP TABLE "channel_user_settings";

-- DropTable
DROP TABLE "forbidden_word_violations";

-- DropTable
DROP TABLE "forum_channels";

-- DropEnum
DROP TYPE "channel_status";

-- DropEnum
DROP TYPE "channel_type";

-- DropEnum
DROP TYPE "message_type";

-- CreateTable
CREATE TABLE "forum_activities" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "type" "activity_type" NOT NULL,
    "status" "activity_status" NOT NULL DEFAULT 'active',
    "start_time" TIMESTAMPTZ NOT NULL,
    "end_time" TIMESTAMPTZ NOT NULL,
    "registration_deadline" TIMESTAMPTZ NOT NULL,
    "location" VARCHAR(255),
    "max_participants" INTEGER,
    "current_participants" INTEGER NOT NULL DEFAULT 0,
    "rewards" JSONB,
    "restrictions" JSONB,
    "organizer_id" UUID NOT NULL,
    "organizer_name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "forum_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_participants" (
    "id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "user_name" VARCHAR(50) NOT NULL,
    "user_avatar" TEXT,
    "user_role" VARCHAR(20) NOT NULL,
    "status" "participant_status" NOT NULL DEFAULT 'registered',
    "registered_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "activity_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operation_logs" (
    "id" UUID NOT NULL,
    "operator_id" UUID NOT NULL,
    "action" "operation_action" NOT NULL,
    "module" "operation_module" NOT NULL,
    "description" TEXT NOT NULL,
    "target_id" UUID,
    "target_type" VARCHAR(50),
    "old_data" JSONB,
    "new_data" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "type" "setting_type" NOT NULL DEFAULT 'string',
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensitive_words" (
    "id" UUID NOT NULL,
    "word" VARCHAR(100) NOT NULL,
    "category" "sensitive_word_category" NOT NULL,
    "replacement" VARCHAR(100),
    "level" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sensitive_words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "reported_user_id" UUID,
    "target_id" UUID NOT NULL,
    "targetType" "report_type" NOT NULL,
    "category" "report_category" NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "evidence_urls" TEXT[],
    "status" "report_status" NOT NULL DEFAULT 'PENDING',
    "result" "report_result",
    "handler_id" UUID,
    "handler_reason" TEXT,
    "action" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "handled_at" TIMESTAMPTZ,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_notifications" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'info',
    "priority" VARCHAR(20) NOT NULL DEFAULT 'normal',
    "target_users" UUID[],
    "target_roles" TEXT[],
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_by" UUID[],
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ,

    CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_backups" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "file_path" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "backup_type" VARCHAR(50) NOT NULL DEFAULT 'full',
    "status" VARCHAR(20) NOT NULL DEFAULT 'completed',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_backups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circles" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "avatar" TEXT,
    "cover_image" TEXT,
    "status" "circle_status" NOT NULL DEFAULT 'active',
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "member_count" INTEGER NOT NULL DEFAULT 0,
    "post_count" INTEGER NOT NULL DEFAULT 0,
    "creator_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "circles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circle_members" (
    "id" UUID NOT NULL,
    "circle_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "circle_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circle_posts" (
    "id" UUID NOT NULL,
    "circle_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "status" "post_status" NOT NULL DEFAULT 'active',
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "circle_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "author_id" UUID NOT NULL,
    "author_name" VARCHAR(50) NOT NULL,
    "status" "post_status" NOT NULL DEFAULT 'active',
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "author_id" UUID NOT NULL,
    "author_name" VARCHAR(50) NOT NULL,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "status" "post_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_likes" (
    "id" UUID NOT NULL,
    "comment_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pokemon" (
    "id" INTEGER NOT NULL,
    "name_chinese" VARCHAR(100) NOT NULL,
    "name_english" VARCHAR(100) NOT NULL,
    "name_japanese" VARCHAR(100) NOT NULL,
    "types" JSONB NOT NULL,
    "base_stats" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pokemon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "pokemon_id" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "level" SMALLINT NOT NULL,
    "nature" VARCHAR(50) NOT NULL,
    "ability" VARCHAR(100),
    "item" VARCHAR(100),
    "ivs" JSON,
    "evs" JSON,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "data_hash" VARCHAR(64) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_moves" (
    "id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "move_id" INTEGER NOT NULL,
    "move_name" VARCHAR(100) NOT NULL,
    "move_category" VARCHAR(50) NOT NULL,
    "position" SMALLINT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_moves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "static_data_cache" (
    "id" UUID NOT NULL,
    "data_type" VARCHAR(50) NOT NULL,
    "data_content" JSONB NOT NULL,
    "last_updated" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "static_data_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activity_participants_activity_id_user_id_key" ON "activity_participants"("activity_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_category_key_key" ON "system_settings"("category", "key");

-- CreateIndex
CREATE UNIQUE INDEX "sensitive_words_word_key" ON "sensitive_words"("word");

-- CreateIndex
CREATE UNIQUE INDEX "circle_members_circle_id_user_id_key" ON "circle_members"("circle_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "comment_likes_comment_id_user_id_key" ON "comment_likes"("comment_id", "user_id");

-- CreateIndex
CREATE INDEX "pokemon_name_chinese_idx" ON "pokemon"("name_chinese");

-- CreateIndex
CREATE INDEX "pokemon_types_idx" ON "pokemon" USING GIN ("types");

-- CreateIndex
CREATE INDEX "templates_user_id_idx" ON "templates"("user_id");

-- CreateIndex
CREATE INDEX "templates_pokemon_id_idx" ON "templates"("pokemon_id");

-- CreateIndex
CREATE INDEX "templates_created_at_idx" ON "templates"("created_at" DESC);

-- CreateIndex
CREATE INDEX "templates_usage_count_idx" ON "templates"("usage_count" DESC);

-- CreateIndex
CREATE INDEX "templates_data_hash_idx" ON "templates"("data_hash");

-- CreateIndex
CREATE UNIQUE INDEX "templates_user_id_data_hash_key" ON "templates"("user_id", "data_hash");

-- CreateIndex
CREATE INDEX "template_moves_template_id_idx" ON "template_moves"("template_id");

-- CreateIndex
CREATE UNIQUE INDEX "template_moves_template_id_position_key" ON "template_moves"("template_id", "position");

-- CreateIndex
CREATE INDEX "favorites_user_id_idx" ON "favorites"("user_id");

-- CreateIndex
CREATE INDEX "favorites_template_id_idx" ON "favorites"("template_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_template_id_key" ON "favorites"("user_id", "template_id");

-- CreateIndex
CREATE UNIQUE INDEX "static_data_cache_data_type_key" ON "static_data_cache"("data_type");

-- RenameForeignKey
ALTER TABLE "post_likes" RENAME CONSTRAINT "post_likes_post_id_fkey" TO "post_likes_forum_post_fkey";

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_participants" ADD CONSTRAINT "activity_participants_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "forum_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation_logs" ADD CONSTRAINT "operation_logs_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_handler_id_fkey" FOREIGN KEY ("handler_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_backups" ADD CONSTRAINT "data_backups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circles" ADD CONSTRAINT "circles_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circle_members" ADD CONSTRAINT "circle_members_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circle_members" ADD CONSTRAINT "circle_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circle_posts" ADD CONSTRAINT "circle_posts_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circle_posts" ADD CONSTRAINT "circle_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_pokemon_id_fkey" FOREIGN KEY ("pokemon_id") REFERENCES "pokemon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_moves" ADD CONSTRAINT "template_moves_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
