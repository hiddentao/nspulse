ALTER TABLE "events" ADD COLUMN "category" text NOT NULL DEFAULT 'Other';--> statement-breakpoint
UPDATE "events" SET "category" = COALESCE(categories->>0, 'Other');--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "categories";
