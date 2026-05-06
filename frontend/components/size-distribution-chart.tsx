"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AsteroidSummary } from "@/lib/types";

const BUCKETS: { label: string; min: number; max: number }[] = [
  { label: "Under 0.05 km", min: 0, max: 0.05 },
  { label: "0.05–0.2", min: 0.05, max: 0.2 },
  { label: "0.2–0.5", min: 0.2, max: 0.5 },
  { label: "0.5–1", min: 0.5, max: 1 },
  { label: "1–2", min: 1, max: 2 },
  { label: "2+ km", min: 2, max: Number.POSITIVE_INFINITY },
];

function avgKm(a: AsteroidSummary): number {
  return (a.estimated_diameter_km_min + a.estimated_diameter_km_max) / 2;
}

export function SizeDistributionChart({
  asteroids,
}: {
  asteroids: AsteroidSummary[];
}) {
  const data = useMemo(() => {
    const counts = BUCKETS.map((b) => ({ label: b.label, count: 0 }));
    for (const a of asteroids) {
      const d = avgKm(a);
      const idx = BUCKETS.findIndex((b) => d >= b.min && d < b.max);
      const i = idx === -1 ? BUCKETS.length - 1 : idx;
      counts[i].count += 1;
    }
    return counts;
  }, [asteroids]);

  return (
    <Card
      className="h-full"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <CardHeader>
        <CardTitle>Estimated size distribution</CardTitle>
        <CardDescription>
          Histogram of average estimated diameter (min–max midpoint) in
          kilometers.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] sm:h-[320px]">
        {asteroids.length === 0 ? (
          <p className="text-sm text-zinc-500">No asteroids in view.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-zinc-200 dark:stroke-zinc-800"
              />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0].payload as {
                    label: string;
                    count: number;
                  };
                  return (
                    <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs shadow-md dark:border-zinc-800 dark:bg-zinc-950">
                      <p className="font-medium">{row.label}</p>
                      <p>{row.count} asteroid(s)</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
