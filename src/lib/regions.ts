import type { City } from './supabase';

export const REGIONS = [
  'Оренбургская область',
  'Челябинская область',
  'Башкортостан',
] as const;

export type Region = (typeof REGIONS)[number];

export const REGION_SHORT: Record<Region, string> = {
  'Оренбургская область': 'Оренбургская обл.',
  'Челябинская область': 'Челябинская обл.',
  'Башкортостан': 'Респ. Башкортостан',
};

export function citiesByRegion(cities: City[]): Record<string, City[]> {
  const map: Record<string, City[]> = {};
  for (const region of REGIONS) {
    map[region] = [];
  }
  for (const city of cities) {
    const region = city.region ?? 'Без региона';
    if (!map[region]) map[region] = [];
    map[region].push(city);
  }
  return map;
}

export function regionOfCity(cities: City[], cityName: string): string | null {
  const found = cities.find((c) => c.name === cityName);
  return found?.region ?? null;
}

export function tripMatchesRegion(
  trip: { from_city: string; to_city: string },
  cities: City[],
  region: string,
): boolean {
  const fromRegion = regionOfCity(cities, trip.from_city);
  const toRegion = regionOfCity(cities, trip.to_city);
  return fromRegion === region || toRegion === region;
}
