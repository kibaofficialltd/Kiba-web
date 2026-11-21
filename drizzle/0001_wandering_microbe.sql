CREATE TABLE "online_players" (
	"uuid" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"edition" "edition" DEFAULT 'java' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "online_players_name_idx" ON "online_players" USING btree (lower("username"));