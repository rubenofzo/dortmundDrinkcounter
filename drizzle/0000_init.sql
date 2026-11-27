CREATE TABLE "drink_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"icon" text NOT NULL,
	"ml" integer NOT NULL,
	"abv" numeric(4, 1) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	CONSTRAINT "drink_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "drinks" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"drink_type_id" integer,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"ml" integer NOT NULL,
	"abv" numeric(4, 1) NOT NULL,
	"consumed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"logged_by_player_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"color_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_name_unique" UNIQUE("name"),
	CONSTRAINT "players_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "drinks" ADD CONSTRAINT "drinks_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drinks" ADD CONSTRAINT "drinks_drink_type_id_drink_types_id_fk" FOREIGN KEY ("drink_type_id") REFERENCES "public"."drink_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drinks" ADD CONSTRAINT "drinks_logged_by_player_id_players_id_fk" FOREIGN KEY ("logged_by_player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "drinks_consumed_at_idx" ON "drinks" USING btree ("consumed_at");--> statement-breakpoint
CREATE INDEX "drinks_player_consumed_at_idx" ON "drinks" USING btree ("player_id","consumed_at");