CREATE TABLE IF NOT EXISTS "card_set" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"author" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"tags" json
);
--> statement-breakpoint
INSERT INTO "card_set" ("id", "title")
SELECT DISTINCT c."set_id", c."set_id"
FROM "card" c
LEFT JOIN "card_set" s ON s."id" = c."set_id"
WHERE c."set_id" IS NOT NULL AND s."id" IS NULL;
--> statement-breakpoint
INSERT INTO "card_set" ("id", "title", "description", "author", "created_at", "updated_at", "tags")
VALUES
  (
    'set_1001',
    '基础英语动词',
    '常用的100个英语动词',
    'user_001',
    '2025-09-26T10:00:00Z',
    '2025-09-26T10:00:00Z',
    '["英语","动词","基础"]'::json
  )
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "author" = EXCLUDED."author",
  "updated_at" = EXCLUDED."updated_at",
  "tags" = EXCLUDED."tags";
--> statement-breakpoint
DO $$
BEGIN
	ALTER TABLE "card" ADD CONSTRAINT "card_set_id_card_set_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."card_set"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
