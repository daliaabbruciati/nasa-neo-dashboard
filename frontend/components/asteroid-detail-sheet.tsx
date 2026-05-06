"use client";

import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchNeo, type ApiError } from "@/lib/api";
import type { AsteroidDetail } from "@/lib/types";
import { ErrorBanner } from "@/components/error-banner";

type ApproachRow = {
  key: string;
  when: string;
  missKm: string;
  velocityKph: string;
  orbitingBody: string;
};

function extractApproaches(raw: Record<string, unknown>[]): ApproachRow[] {
  return raw.map((row, i) => {
    const miss = row.miss_distance as Record<string, string> | undefined;
    const vel = row.relative_velocity as Record<string, string> | undefined;
    return {
      key: String(row.epoch_date_close_approach ?? i),
      when: String(
        row.close_approach_date_full ?? row.close_approach_date ?? "—",
      ),
      missKm: miss?.kilometers ? String(miss.kilometers) : "—",
      velocityKph: vel?.kilometers_per_hour
        ? String(vel.kilometers_per_hour)
        : "—",
      orbitingBody: String(row.orbiting_body ?? "—"),
    };
  });
}

type Props = {
  asteroidId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AsteroidDetailSheet({ asteroidId, open, onOpenChange }: Props) {
  const [data, setData] = useState<AsteroidDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!open || !asteroidId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const neo = await fetchNeo(asteroidId);
        if (!cancelled) setData(neo);
      } catch (e) {
        if (!cancelled) {
          setData(null);
          setError(e as ApiError);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, asteroidId]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setData(null);
      setError(null);
      setLoading(false);
    }
    onOpenChange(next);
  };

  const approaches = data?.close_approach_data
    ? extractApproaches(data.close_approach_data as Record<string, unknown>[])
    : [];

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        className="flex flex-col overflow-y-auto sm:max-w-xl"
        style={{ background: "var(--background)", color: "var(--foreground)" }}
      >
        <SheetHeader>
          <SheetTitle>
            {loading ? (
              <Skeleton className="h-7 w-48" />
            ) : (
              (data?.name ?? "Asteroid")
            )}
          </SheetTitle>
          <SheetDescription>
            Detailed NASA NeoWs record (cached via backend).
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex flex-1 flex-col gap-4">
          {error ? <ErrorBanner error={error} /> : null}

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : null}

          {data && !loading ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {data.is_potentially_hazardous_asteroid ? (
                  <Badge variant="warning">Potentially hazardous</Badge>
                ) : (
                  <Badge variant="secondary">Not hazardous</Badge>
                )}
                {data.absolute_magnitude_h != null ? (
                  <Badge variant="outline">
                    H = {data.absolute_magnitude_h}
                  </Badge>
                ) : null}
              </div>

              {data.nasa_jpl_url ? (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={data.nasa_jpl_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open JPL page
                  </a>
                </Button>
              ) : null}

              <div>
                <h3 className="mb-2 text-sm font-semibold">Orbital data</h3>
                {data.orbital_data && Object.keys(data.orbital_data).length ? (
                  <pre className="max-h-48 overflow-auto rounded-lg bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
                    {JSON.stringify(data.orbital_data, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-zinc-500">
                    No orbital data block.
                  </p>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold">
                  Close approach history ({approaches.length})
                </h3>
                <div className="max-h-90 overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Miss (km)</TableHead>
                        <TableHead>Velocity (km/h)</TableHead>
                        <TableHead>Body</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approaches.map((r) => (
                        <TableRow key={r.key}>
                          <TableCell className="whitespace-nowrap text-xs">
                            {r.when}
                          </TableCell>
                          <TableCell className="text-xs">{r.missKm}</TableCell>
                          <TableCell className="text-xs">
                            {r.velocityKph}
                          </TableCell>
                          <TableCell className="text-xs">
                            {r.orbitingBody}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
