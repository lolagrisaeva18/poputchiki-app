import { supabase, type City, type Trip, type TripInput } from './supabase';

export async function fetchCities(): Promise<City[]> {
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchTrip(id: string): Promise<Trip | null> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createTrip(input: TripInput): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) throw error;
}

export async function ensureCity(name: string, region?: string): Promise<City> {
  const trimmed = name.trim();
  const { data: existing } = await supabase
    .from('cities')
    .select('*')
    .eq('name', trimmed)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from('cities')
    .insert({ name: trimmed, region: region ?? null, is_default: false })
    .select()
    .single();

  if (error) throw error;
  return data;
}
