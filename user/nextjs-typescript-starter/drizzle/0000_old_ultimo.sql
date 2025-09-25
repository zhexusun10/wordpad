CREATE EXTENSION IF NOT EXISTS "pgcrypto";--> statement-breakpoint
CREATE TYPE "public"."card_mastery_status" AS ENUM('unknown', 'mastered', 'review');--> statement-breakpoint
CREATE TYPE "public"."card_visibility" AS ENUM('private', 'public');--> statement-breakpoint
CREATE TYPE "public"."exam_answer_field" AS ENUM('single_choice', 'multi_choice', 'fill_blank', 'essay', 'upload', 'text');--> statement-breakpoint
CREATE TYPE "public"."exam_processing_stage" AS ENUM('uploaded', 'ocr', 'parse', 'postprocess');--> statement-breakpoint
CREATE TYPE "public"."exam_processing_status" AS ENUM('pending', 'running', 'success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."exam_question_type" AS ENUM('single_choice', 'multi_choice', 'fill_blank', 'essay', 'upload');--> statement-breakpoint
CREATE TYPE "public"."exam_status" AS ENUM('uploaded', 'ocr', 'parsed', 'failed', 'completed');--> statement-breakpoint
CREATE TYPE "public"."file_resource_type" AS ENUM('word_set', 'exam_document', 'exam_asset', 'card_media', 'other');--> statement-breakpoint
CREATE TABLE "ai_waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"email" varchar(255),
	"source" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"event_type" varchar(128) NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "card_set_tag" (
	"set_id" text NOT NULL,
	"tag" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "card_set_tag_pk" PRIMARY KEY("set_id","tag")
);
--> statement-breakpoint
CREATE TABLE "card_set" (
	"set_id" text PRIMARY KEY NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"author_id" uuid NOT NULL,
	"visibility" "card_visibility" DEFAULT 'private' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "card" (
	"id" text PRIMARY KEY NOT NULL,
	"set_id" text NOT NULL,
	"ordinal" integer NOT NULL,
	"front_text" text NOT NULL,
	"front_audio_url" text,
	"back_definition" text,
	"back_content" text,
	"example_sentence" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"subject" varchar(128),
	"grade" varchar(64),
	"source" varchar(128),
	"status" "exam_status" DEFAULT 'uploaded' NOT NULL,
	"file_url" text NOT NULL,
	"structured_json_url" text,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "exam_option" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"key" varchar(16) NOT NULL,
	"text" text,
	"media_url" text,
	"is_correct" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_processing_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"stage" "exam_processing_stage" NOT NULL,
	"status" "exam_processing_status" DEFAULT 'pending' NOT NULL,
	"message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_question" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"type" "exam_question_type" NOT NULL,
	"prompt" text NOT NULL,
	"media" jsonb,
	"answer_field" "exam_answer_field" DEFAULT 'text' NOT NULL,
	"answer_key" text,
	"analysis" text,
	"points" numeric(5, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_section" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"title" varchar(255),
	"instruction" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_user_response" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"response_payload" jsonb NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"score" numeric(5, 2),
	"feedback" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"resource_type" "file_resource_type" NOT NULL,
	"url" text NOT NULL,
	"checksum" varchar(128),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"set_id" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"total_cards" integer DEFAULT 0 NOT NULL,
	"correct" integer DEFAULT 0 NOT NULL,
	"incorrect" integer DEFAULT 0 NOT NULL,
	"device_info" text
);
--> statement-breakpoint
CREATE TABLE "user_card_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"card_id" text NOT NULL,
	"status" "card_mastery_status" DEFAULT 'unknown' NOT NULL,
	"last_result" varchar(32),
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_reviewed_at" timestamp with time zone,
	"next_review_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_card_set_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"set_id" text NOT NULL,
	"studied_card_count" integer DEFAULT 0 NOT NULL,
	"mastered_card_count" integer DEFAULT 0 NOT NULL,
	"accuracy" numeric(5, 2) DEFAULT '0' NOT NULL,
	"last_reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" varchar(128),
	"email" varchar(255) NOT NULL,
	"avatar_url" text,
	"password_hash" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_waitlist" ADD CONSTRAINT "ai_waitlist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_set_tag" ADD CONSTRAINT "card_set_tag_set_id_card_set_set_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."card_set"("set_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_set" ADD CONSTRAINT "card_set_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card" ADD CONSTRAINT "card_set_id_card_set_set_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."card_set"("set_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_document" ADD CONSTRAINT "exam_document_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_option" ADD CONSTRAINT "exam_option_question_id_exam_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."exam_question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_processing_log" ADD CONSTRAINT "exam_processing_log_exam_id_exam_document_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exam_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_question" ADD CONSTRAINT "exam_question_section_id_exam_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."exam_section"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_section" ADD CONSTRAINT "exam_section_exam_id_exam_document_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exam_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_user_response" ADD CONSTRAINT "exam_user_response_exam_id_exam_document_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exam_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_user_response" ADD CONSTRAINT "exam_user_response_question_id_exam_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."exam_question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_user_response" ADD CONSTRAINT "exam_user_response_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_asset" ADD CONSTRAINT "file_asset_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_session" ADD CONSTRAINT "study_session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_session" ADD CONSTRAINT "study_session_set_id_card_set_set_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."card_set"("set_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_card_progress" ADD CONSTRAINT "user_card_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_card_progress" ADD CONSTRAINT "user_card_progress_card_id_card_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."card"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_card_set_progress" ADD CONSTRAINT "user_card_set_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_card_set_progress" ADD CONSTRAINT "user_card_set_progress_set_id_card_set_set_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."card_set"("set_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_waitlist_email_unique" ON "ai_waitlist" USING btree ("email");--> statement-breakpoint
CREATE INDEX "audit_event_user_idx" ON "audit_event" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_event_type_idx" ON "audit_event" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "card_set_tag_tag_idx" ON "card_set_tag" USING btree ("tag");--> statement-breakpoint
CREATE INDEX "card_set_author_id_idx" ON "card_set" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "card_set_updated_at_idx" ON "card_set" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "card_set_id_idx" ON "card" USING btree ("set_id");--> statement-breakpoint
CREATE UNIQUE INDEX "card_set_ordinal_unique" ON "card" USING btree ("set_id","ordinal");--> statement-breakpoint
CREATE INDEX "exam_document_owner_idx" ON "exam_document" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "exam_document_status_idx" ON "exam_document" USING btree ("status");--> statement-breakpoint
CREATE INDEX "exam_option_question_idx" ON "exam_option" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_option_question_key_unique" ON "exam_option" USING btree ("question_id","key");--> statement-breakpoint
CREATE INDEX "exam_processing_log_exam_idx" ON "exam_processing_log" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "exam_question_section_idx" ON "exam_question" USING btree ("section_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_question_section_ordinal_unique" ON "exam_question" USING btree ("section_id","ordinal");--> statement-breakpoint
CREATE INDEX "exam_section_exam_idx" ON "exam_section" USING btree ("exam_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_section_exam_ordinal_unique" ON "exam_section" USING btree ("exam_id","ordinal");--> statement-breakpoint
CREATE INDEX "exam_user_response_exam_idx" ON "exam_user_response" USING btree ("exam_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_user_response_user_question_unique" ON "exam_user_response" USING btree ("user_id","question_id");--> statement-breakpoint
CREATE INDEX "file_asset_owner_idx" ON "file_asset" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "file_asset_resource_type_idx" ON "file_asset" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "study_session_user_idx" ON "study_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "study_session_set_idx" ON "study_session" USING btree ("set_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_card_progress_user_card_unique" ON "user_card_progress" USING btree ("user_id","card_id");--> statement-breakpoint
CREATE INDEX "user_card_progress_card_idx" ON "user_card_progress" USING btree ("card_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_card_set_progress_user_set_unique" ON "user_card_set_progress" USING btree ("user_id","set_id");--> statement-breakpoint
CREATE INDEX "user_card_set_progress_set_idx" ON "user_card_set_progress" USING btree ("set_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");