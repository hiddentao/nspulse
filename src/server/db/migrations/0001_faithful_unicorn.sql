CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"luma_id" text NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"cover_url" text,
	"start_time" timestamp with time zone NOT NULL,
	"creator" text,
	"categories" json DEFAULT '[]'::json NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_luma_id_unique" UNIQUE("luma_id")
);
--> statement-breakpoint
CREATE INDEX "events_start_time_idx" ON "events" USING btree ("start_time");