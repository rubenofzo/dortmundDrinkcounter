ALTER TABLE "drink_types" ADD COLUMN "custom" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Custom drinks saved before this change all have category "Custom".
UPDATE "drink_types" SET "custom" = true WHERE "category" = 'Custom';
