export type CacheStats = {
  hits: number;
  misses: number;
};

export type FeedMeta = {
  start_date: string;
  end_date: string;
  count: number;
  hazardous_count: number;
  chunks: number;
  cache: CacheStats;
};

export type AsteroidSummary = {
  id: string;
  name: string;
  nasa_jpl_url: string;
  is_potentially_hazardous_asteroid: boolean;
  close_approach_date_full: string;
  miss_distance_km: number;
  relative_velocity_kph: number;
  estimated_diameter_km_min: number;
  estimated_diameter_km_max: number;
};

export type FeedResponse = {
  asteroids: AsteroidSummary[];
  meta: FeedMeta;
};

export type AsteroidDetail = {
  id: string;
  name: string;
  nasa_jpl_url?: string | null;
  absolute_magnitude_h?: number | null;
  is_potentially_hazardous_asteroid: boolean;
  estimated_diameter: Record<string, unknown>;
  orbital_data?: Record<string, unknown> | null;
  close_approach_data: Record<string, unknown>[];
};
