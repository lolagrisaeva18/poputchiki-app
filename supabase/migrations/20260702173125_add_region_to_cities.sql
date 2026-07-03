/*
# Add region column to cities and seed region cities

## Overview
This migration adds a `region` column to the `cities` table to support a 2-step
region→city selection flow. It also seeds all predefined cities for the 4
regions (Оренбургская область, Челябинская область, Свердловская область,
Башкортостан) and assigns regions to any existing default cities.

## Changes to existing tables

### `cities`
- Added column `region` (text, nullable) — stores the Russian region name
  the city belongs to (e.g. "Оренбургская область"). Nullable so existing
  rows are not broken; new inserts from the frontend will always include it.

## Seeded data
The following cities are inserted (or updated with their region if they
already exist by name):

- Оренбургская область: Оренбург, Орск, Новотроицк, Бузулук, Бугуруслан, Акбулак
- Челябинская область: Челябинск, Магнитогорск, Миасс, Златоуст
- Свердловская область: Екатеринбург, Нижний Тагил, Каменск-Уральский, Первоуральск
- Башкортостан: Уфа, Стерлитамак, Салават, Нефтекамск, Кумертау

Existing default cities (Оренбург, Челябинск, Екатеринбург, Уфа, Орск) are
updated to set their correct `region` value.

## Security
- No changes to RLS policies. The existing `TO anon, authenticated` CRUD
  policies on `cities` already allow reading, inserting, updating, and
  deleting, so the new `region` column is automatically accessible.

## Important notes
1. `region` is nullable to avoid breaking existing rows, but the frontend
   always sends it when creating a new city via `ensureCity()`.
2. The `ON CONFLICT (name) DO UPDATE` upsert ensures that if a city already
   exists (e.g. from the first migration), its `region` is updated to the
   correct value rather than causing a unique constraint violation.
3. "Екатеринбург region" in the user's request maps to Свердловская область
   (Sverdlovsk region), which is the correct official name for the region
   Yekaterinburg is the capital of.
*/

ALTER TABLE cities ADD COLUMN IF NOT EXISTS region text;

-- Upsert all predefined cities with their regions.
-- Existing cities get their region updated; new cities are inserted.
INSERT INTO cities (name, region, is_default) VALUES
  -- Оренбургская область
  ('Оренбург', 'Оренбургская область', true),
  ('Орск', 'Оренбургская область', true),
  ('Новотроицк', 'Оренбургская область', true),
  ('Бузулук', 'Оренбургская область', true),
  ('Бугуруслан', 'Оренбургская область', true),
  ('Акбулак', 'Оренбургская область', true),
  -- Челябинская область
  ('Челябинск', 'Челябинская область', true),
  ('Магнитогорск', 'Челябинская область', true),
  ('Миасс', 'Челябинская область', true),
  ('Златоуст', 'Челябинская область', true),
  -- Свердловская область
  ('Екатеринбург', 'Свердловская область', true),
  ('Нижний Тагил', 'Свердловская область', true),
  ('Каменск-Уральский', 'Свердловская область', true),
  ('Первоуральск', 'Свердловская область', true),
  -- Башкортостан
  ('Уфа', 'Башкортостан', true),
  ('Стерлитамак', 'Башкортостан', true),
  ('Салават', 'Башкортостан', true),
  ('Нефтекамск', 'Башкортостан', true),
  ('Кумертау', 'Башкортостан', true)
ON CONFLICT (name) DO UPDATE SET
  region = EXCLUDED.region,
  is_default = EXCLUDED.is_default;
