-- Seed drink menu. Runs once as a migration, so a fresh deploy has the menu; admin edits stay.
INSERT INTO "drink_types" ("name", "category", "icon", "ml", "abv", "sort_order") VALUES
  ('Pils (small)', 'Beer', '🍺', 330, 4.8, 10),
  ('Pils (Halbe)', 'Beer', '🍺', 500, 4.8, 20),
  ('Weizen', 'Beer', '🌾', 500, 5.4, 30),
  ('Radler', 'Beer', '🍋', 500, 2.5, 40),
  ('Strong beer / Bock', 'Beer', '🐐', 330, 7.5, 50),
  ('Glass of wine', 'Wine', '🍷', 150, 12.0, 60),
  ('Sekt / Prosecco', 'Wine', '🥂', 100, 11.0, 70),
  ('Aperol Spritz', 'Mixed', '🍊', 200, 11.0, 80),
  ('Long drink', 'Mixed', '🍹', 250, 6.4, 90),
  ('Cocktail', 'Mixed', '🍸', 200, 12.0, 100),
  ('Hard seltzer / Alcopop', 'Mixed', '🫧', 330, 5.0, 110),
  ('Shot', 'Shots', '🥃', 20, 40.0, 120),
  ('Jägermeister', 'Shots', '🦌', 20, 35.0, 130),
  ('Double shot', 'Shots', '🥃', 40, 40.0, 140)
ON CONFLICT ("name") DO NOTHING;
