import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

export type City = {
  id: string;
  name: string;
  region: string | null;
  is_default: boolean;
  created_at: string;
};

export type TripType = 'driver' | 'passenger';

export type Trip = {
  id: string;
  from_city: string;
  to_city: string;
  trip_date: string;
  trip_time: string;
  seats: number;
  price: string | null;
  description: string | null;
  contact: string;
  author_name: string;
  trip_type: TripType;
  created_at: string;
};

export type TripInput = Omit<Trip, 'id' | 'created_at'>;
