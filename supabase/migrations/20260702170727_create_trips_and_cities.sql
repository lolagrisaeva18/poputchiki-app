/*
# Create trips and cities tables (single-tenant, no auth)

## Overview
This migration creates the core schema for a VK Mini App that helps users find
travel companions (попутчики) between Russian cities. The app has no sign-in
screen, so all data is intentionally public/shared and readable/writable by
the anon-key frontend client.

## New Tables

### 1. `cities`
Stores the list of cities shown in the city selector dropdown.
- `id` (uuid, primary key)
- `name` (text, unique, not null) — city name in Russian
- `is_default` (boolean, default false) — true for the 5 pre-seeded cities
- `created_at` (timestamptz, default now())

### 2. `trips`
Stores travel companion listings created by users.
- `id` (uuid, primary key)
- `from_city` (text, not null) — departure city
- `to_city` (text, not null) — destination city
- `trip_date` (date, not null) — date of travel
- `trip_time` (text, not null) — time of travel (HH:MM)
- `seats` (integer, not null, default 1) — number of available seats
- `price` (text, nullable) — price per seat (text to allow "по договоренности")
- `description` (text, nullable) — free-form comment / details
- `contact` (text, not null) — phone or VK link for contacting the driver
- `author_name` (text, not null) — name of the person offering the trip
- `created_at` (timestamptz, default now())

## Security
- RLS enabled on both tables.
- All CRUD policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because the data is intentionally public/shared (no-auth single-tenant app).
- Anyone can read, create, update, and delete trips and cities.

## Important Notes
1. The 5 default Russian cities (Оренбург, Челябинск, Екатеринбург, Уфа, Орск)
   are seeded with `is_default = true`.
2. When a user types a custom city name, the frontend inserts it into `cities`
   with `is_default = false` so it appears in future dropdowns.
3. `from_city` and `to_city` are stored as plain text in `trips` (not FK to
   `cities`) so trips remain even if a city row is later removed, and so users
   can type any city name freely.
*/

CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_city text NOT NULL,
  to_city text NOT NULL,
  trip_date date NOT NULL,
  trip_time text NOT NULL,
  seats integer NOT NULL DEFAULT 1,
  price text,
  description text,
  contact text NOT NULL,
  author_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Cities: public CRUD (single-tenant, no auth)
DROP POLICY IF EXISTS "anon_select_cities" ON cities;
CREATE POLICY "anon_select_cities" ON cities FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_cities" ON cities;
CREATE POLICY "anon_insert_cities" ON cities FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_cities" ON cities;
CREATE POLICY "anon_update_cities" ON cities FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_cities" ON cities;
CREATE POLICY "anon_delete_cities" ON cities FOR DELETE
  TO anon, authenticated USING (true);

-- Trips: public CRUD (single-tenant, no auth)
DROP POLICY IF EXISTS "anon_select_trips" ON trips;
CREATE POLICY "anon_select_trips" ON trips FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_trips" ON trips;
CREATE POLICY "anon_insert_trips" ON trips FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_trips" ON trips;
CREATE POLICY "anon_update_trips" ON trips FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_trips" ON trips;
CREATE POLICY "anon_delete_trips" ON trips FOR DELETE
  TO anon, authenticated USING (true);

-- Index for sorting trips by creation time (newest first)
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips (created_at DESC);
-- Index for filtering trips by date
CREATE INDEX IF NOT EXISTS idx_trips_trip_date ON trips (trip_date);

-- Seed the 5 default Russian cities
INSERT INTO cities (name, is_default) VALUES
  ('Оренбург', true),
  ('Челябинск', true),
  ('Екатеринбург', true),
  ('Уфа', true),
  ('Орск', true)
ON CONFLICT (name) DO NOTHING;
