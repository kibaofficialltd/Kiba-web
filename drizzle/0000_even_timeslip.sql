CREATE TYPE "public"."announcement_category" AS ENUM('update', 'feature', 'maintenance', 'event', 'giveaway', 'notice');--> statement-breakpoint
CREATE TYPE "public"."claim_status" AS ENUM('pending', 'delivered', 'failed');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('queued', 'claimed', 'delivered', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."edition" AS ENUM('java', 'bedrock');--> statement-breakpoint
CREATE TYPE "public"."email_token_type" AS ENUM('verify_email', 'reset_password');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('upcoming', 'active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('event', 'giveaway');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('system', 'reward', 'purchase', 'event', 'ticket');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'processing', 'delivered', 'failed', 'refunded', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."ticket_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('open', 'pending', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."transaction_reason" AS ENUM('daily_reward', 'spin', 'purchase', 'admin_grant', 'refund', 'event', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('player', 'helper', 'moderator', 'admin', 'owner');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended');--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"icon" text DEFAULT 'trophy' NOT NULL,
	"metric" text,
	"threshold" bigint,
	CONSTRAINT "achievements_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"category" "announcement_category" DEFAULT 'update' NOT NULL,
	"cover_image" text,
	"author_id" uuid,
	"pinned" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"meta" jsonb,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coin_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"delta" bigint NOT NULL,
	"balance_after" bigint NOT NULL,
	"reason" "transaction_reason" NOT NULL,
	"ref_type" text,
	"ref_id" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_number" integer NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"coins" bigint DEFAULT 0 NOT NULL,
	"commands" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"icon" text DEFAULT 'gift' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"minecraft_uuid" text,
	"minecraft_username" text,
	"commands" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"payload" jsonb,
	"status" "delivery_status" DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"idempotency_key" text NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"claimed_at" timestamp with time zone,
	"delivered_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "email_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "email_token_type" NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emergency_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"to_email" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"cover_image" text,
	"type" "event_type" DEFAULT 'event' NOT NULL,
	"status" "event_status" DEFAULT 'upcoming' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"registration_open" boolean DEFAULT true NOT NULL,
	"prize" text,
	"winner" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "link_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "minecraft_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"username" text NOT NULL,
	"uuid" text NOT NULL,
	"edition" "edition" NOT NULL,
	"xuid" text,
	"verified" boolean DEFAULT false NOT NULL,
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" DEFAULT 'system' NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"link" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"product_name" text NOT NULL,
	"unit_coins" bigint NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"commands" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"delivery_status" "delivery_status" DEFAULT 'queued' NOT NULL,
	"delivery_id" uuid
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"total_coins" bigint NOT NULL,
	"item_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone,
	"failure_reason" text
);
--> statement-breakpoint
CREATE TABLE "player_stats" (
	"uuid" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"playtime_seconds" bigint DEFAULT 0 NOT NULL,
	"kills" integer DEFAULT 0 NOT NULL,
	"deaths" integer DEFAULT 0 NOT NULL,
	"mob_kills" integer DEFAULT 0 NOT NULL,
	"killstreak" integer DEFAULT 0 NOT NULL,
	"best_killstreak" integer DEFAULT 0 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"blocks_broken" integer DEFAULT 0 NOT NULL,
	"blocks_placed" integer DEFAULT 0 NOT NULL,
	"first_joined_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugin_nonces" (
	"nonce" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"icon" text DEFAULT 'package' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "product_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category_id" uuid,
	"tagline" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price_coins" bigint NOT NULL,
	"compare_at_coins" bigint,
	"image" text,
	"badge" text,
	"commands" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"per_player_limit" integer,
	"stock" integer,
	"active" boolean DEFAULT true NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reward_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"day_number" integer NOT NULL,
	"streak" integer DEFAULT 1 NOT NULL,
	"claim_date" date NOT NULL,
	"coins" bigint DEFAULT 0 NOT NULL,
	"status" "claim_status" DEFAULT 'pending' NOT NULL,
	"delivery_id" uuid,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "server_status" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"online" boolean DEFAULT false NOT NULL,
	"motd" text,
	"version" text,
	"players_online" integer DEFAULT 0 NOT NULL,
	"max_players" integer DEFAULT 0 NOT NULL,
	"java_players" integer DEFAULT 0 NOT NULL,
	"bedrock_players" integer DEFAULT 0 NOT NULL,
	"uptime_seconds" bigint DEFAULT 0 NOT NULL,
	"tps" text,
	"host" text,
	"port" integer,
	"last_heartbeat_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spin_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"prize_id" uuid,
	"prize_label" text NOT NULL,
	"coins" bigint DEFAULT 0 NOT NULL,
	"spin_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spin_prizes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"coins" bigint DEFAULT 0 NOT NULL,
	"weight" integer DEFAULT 1 NOT NULL,
	"color" text DEFAULT '#4faf7a' NOT NULL,
	"rarity" text DEFAULT 'common' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"author_id" uuid,
	"body" text NOT NULL,
	"is_staff" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"user_id" uuid NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"subject" text NOT NULL,
	"status" "ticket_status" DEFAULT 'open' NOT NULL,
	"priority" "ticket_priority" DEFAULT 'normal' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"user_id" uuid NOT NULL,
	"achievement_id" uuid NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'player' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"email_verified_at" timestamp with time zone,
	"balance" bigint DEFAULT 0 NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_tokens" ADD CONSTRAINT "email_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_codes" ADD CONSTRAINT "link_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "minecraft_accounts" ADD CONSTRAINT "minecraft_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_claims" ADD CONSTRAINT "reward_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spin_history" ADD CONSTRAINT "spin_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spin_history" ADD CONSTRAINT "spin_history_prize_id_spin_prizes_id_fk" FOREIGN KEY ("prize_id") REFERENCES "public"."spin_prizes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "announcements_slug_uq" ON "announcements" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "announcements_pub_idx" ON "announcements" USING btree ("published","published_at");--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "coin_tx_user_idx" ON "coin_transactions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "deliveries_idem_uq" ON "deliveries" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "deliveries_status_idx" ON "deliveries" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "email_tokens_hash_uq" ON "email_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "email_tokens_user_idx" ON "email_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_reg_uq" ON "event_registrations" USING btree ("event_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "events_slug_uq" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "events_status_idx" ON "events" USING btree ("status","starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "link_codes_code_uq" ON "link_codes" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "mc_user_uq" ON "minecraft_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mc_uuid_uq" ON "minecraft_accounts" USING btree ("uuid");--> statement-breakpoint
CREATE INDEX "mc_username_idx" ON "minecraft_accounts" USING btree (lower("username"));--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_ref_uq" ON "orders" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ps_kills_idx" ON "player_stats" USING btree ("kills");--> statement-breakpoint
CREATE INDEX "ps_playtime_idx" ON "player_stats" USING btree ("playtime_seconds");--> statement-breakpoint
CREATE INDEX "ps_beststreak_idx" ON "player_stats" USING btree ("best_killstreak");--> statement-breakpoint
CREATE INDEX "ps_mobkills_idx" ON "player_stats" USING btree ("mob_kills");--> statement-breakpoint
CREATE INDEX "ps_wins_idx" ON "player_stats" USING btree ("wins");--> statement-breakpoint
CREATE INDEX "plugin_nonces_created_idx" ON "plugin_nonces" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_uq" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "products_cat_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "products_active_idx" ON "products" USING btree ("active","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "reward_claims_day_uq" ON "reward_claims" USING btree ("user_id","claim_date");--> statement-breakpoint
CREATE INDEX "reward_claims_user_idx" ON "reward_claims" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "spin_user_date_uq" ON "spin_history" USING btree ("user_id","spin_date");--> statement-breakpoint
CREATE INDEX "spin_user_idx" ON "spin_history" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "ticket_messages_ticket_idx" ON "ticket_messages" USING btree ("ticket_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tickets_ref_uq" ON "tickets" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "tickets_user_idx" ON "tickets" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "tickets_status_idx" ON "tickets" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "user_achievements_uq" ON "user_achievements" USING btree ("user_id","achievement_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_uq" ON "users" USING btree (lower("username"));--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");