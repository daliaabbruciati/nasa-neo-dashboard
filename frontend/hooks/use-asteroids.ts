"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { fetchFeed, type ApiError } from "@/lib/api";
import type { AsteroidSummary, FeedResponse } from "@/lib/types";

export type HazardFilter = "all" | "hazardous" | "safe";
export type SortKey = "distance_asc" | "distance_desc" | "size_asc" | "size_desc";

type CacheEntry = {
  data: FeedResponse;
  fetchedAt: number;
};

function avgDiameterKm(a: AsteroidSummary): number {
  return (a.estimated_diameter_km_min + a.estimated_diameter_km_max) / 2;
}

export function useAsteroids(
  startDate: string,
  endDate: string,
  enabled: boolean,
  hazardFilter: HazardFilter,
  sortKey: SortKey,
  nameQuery: string,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [raw, setRaw] = useState<FeedResponse | null>(null);
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  const rangeKey = `${startDate}|${endDate}`;

  const load = useCallback(
    async (force?: boolean) => {
      setError(null);
      if (force) cacheRef.current.delete(rangeKey);
      const cached = cacheRef.current.get(rangeKey);
      if (cached && !force) {
        setRaw(cached.data);
        return;
      }
      setLoading(true);
      setRaw(null);
      try {
        const data = await fetchFeed(startDate, endDate);
        cacheRef.current.set(rangeKey, { data, fetchedAt: Date.now() });
        setRaw(data);
      } catch (e) {
        setRaw(null);
        setError(e as ApiError);
      } finally {
        setLoading(false);
      }
    },
    [rangeKey, startDate, endDate],
  );

  useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(t);
  }, [enabled, load]);

  const filtered = useMemo(() => {
    if (!raw) return [];
    let list = [...raw.asteroids];
    const q = nameQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((a) => a.name.toLowerCase().includes(q));
    }
    if (hazardFilter === "hazardous") {
      list = list.filter((a) => a.is_potentially_hazardous_asteroid);
    } else if (hazardFilter === "safe") {
      list = list.filter((a) => !a.is_potentially_hazardous_asteroid);
    }
    list.sort((a, b) => {
      switch (sortKey) {
        case "distance_asc":
          return a.miss_distance_km - b.miss_distance_km;
        case "distance_desc":
          return b.miss_distance_km - a.miss_distance_km;
        case "size_asc":
          return avgDiameterKm(a) - avgDiameterKm(b);
        case "size_desc":
          return avgDiameterKm(b) - avgDiameterKm(a);
        default:
          return 0;
      }
    });
    return list;
  }, [raw, hazardFilter, sortKey, nameQuery]);

  return {
    loading,
    error,
    raw,
    asteroids: filtered,
    load,
  };
}
