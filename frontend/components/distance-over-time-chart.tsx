"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { parseNeoApproach } from "@/lib/dates";
import type { AsteroidSummary } from "@/lib/types";

type Point = {
  id: string;
  name: string;
  t: number;
  /** Value used for plotting (positive, log-safe). */
  miss_km_plot: number;
  /** Original miss distance in km. */
  miss_km: number;
  hazardous: boolean;
};

export function DistanceOverTimeChart({
  asteroids,
}: {
  asteroids: AsteroidSummary[];
}) {
  const [logY, setLogY] = useState(false);

  const data = useMemo(() => {
    const pts: Point[] = [];
    for (const a of asteroids) {
      const d = parseNeoApproach(a.close_approach_date_full);
      if (!d) continue;
      pts.push({
        id: a.id,
        name: a.name,
        t: d.getTime(),
        miss_km: a.miss_distance_km,
        miss_km_plot: Math.max(a.miss_distance_km, 1e-6),
        hazardous: a.is_potentially_hazardous_asteroid,
      });
    }
    return pts.sort((x, y) => x.t - y.t);
  }, [asteroids]);

  return (
    <Card
      className="h-full"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Close approach distance</CardTitle>
          <CardDescription>
            Each point is one NEO in your filtered set (closest approach in
            range).
          </CardDescription>
        </div>
        <Button
          type="button"
          variant={logY ? "default" : "outline"}
          size="sm"
          onClick={() => setLogY((v) => !v)}
        >
          Log Y axis
        </Button>
      </CardHeader>
      <CardContent className="h-[300px] sm:h-[320px]">
        {data.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No chartable approaches in view.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-zinc-200 dark:stroke-zinc-800"
              />
              <XAxis
                type="number"
                dataKey="t"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                }
                name="Time"
              />
              <YAxis
                type="number"
                dataKey="miss_km_plot"
                scale={logY ? "log" : "linear"}
                domain={logY ? [1, "auto"] : [0, "auto"]}
                tickFormatter={(v) =>
                  v >= 1e6
                    ? `${(v / 1e6).toFixed(1)}M`
                    : `${(v / 1e3).toFixed(0)}k`
                }
                name="Miss (km)"
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as Point;
                  return (
                    <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs shadow-md dark:border-zinc-800 dark:bg-zinc-950">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-zinc-500">
                        {new Date(p.t).toLocaleString()}
                      </p>
                      <p>
                        {p.miss_km.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}{" "}
                        km
                      </p>
                      <p>
                        {p.hazardous
                          ? "Potentially hazardous"
                          : "Not hazardous"}
                      </p>
                    </div>
                  );
                }}
              />
              <Scatter dataKey="miss_km_plot" data={data} fill="#3b82f6">
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.id}-${index}`}
                    fill={entry.hazardous ? "#ef4444" : "#3b82f6"}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
