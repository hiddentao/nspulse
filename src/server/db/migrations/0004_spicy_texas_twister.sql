ALTER TABLE "events" ALTER COLUMN "luma_id" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "events_title_start_time_idx" ON "events" USING btree ("title","start_time");