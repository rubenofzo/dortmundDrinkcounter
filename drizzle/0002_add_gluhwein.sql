-- Christmas market Glühwein: a 200 ml mug at about 10%. Runs once; admin edits stay.
INSERT INTO "drink_types" ("name", "category", "icon", "ml", "abv", "sort_order") VALUES
  ('Glühwein', 'Wine', '🎄', 200, 10.0, 75)
ON CONFLICT ("name") DO NOTHING;
