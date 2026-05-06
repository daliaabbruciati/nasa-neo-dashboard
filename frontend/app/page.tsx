"use client";

import { addDays, format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

import { AsteroidDetailSheet } from "@/components/asteroid-detail-sheet";
import { AsteroidMissionList } from "@/components/asteroid-mission-list";
import { DateRangePicker } from "@/components/date-range-picker";
import { DistanceOverTimeChart } from "@/components/distance-over-time-chart";
import { EmptyState } from "@/components/empty-state";
import { ErrorBanner } from "@/components/error-banner";
import { FiltersBar } from "@/components/filters-bar";
import { SizeDistributionChart } from "@/components/size-distribution-chart";
import { ChartSkeleton, TableSkeleton } from "@/components/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type HazardFilter,
  type SortKey,
  useAsteroids,
} from "@/hooks/use-asteroids";
import type { AsteroidSummary } from "@/lib/types";

const ASTEROIDS_PER_PAGE = 6;

export default function Home() {
  const [range, setRange] = useState<DateRange | undefined>(() => {
    const from = new Date();
    const to = addDays(from, 7);
    return { from, to };
  });

  const [hazardFilter, setHazardFilter] = useState<HazardFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("distance_asc");
  const [nameQuery, setNameQuery] = useState("");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const startStr = range?.from ? format(range.from, "yyyy-MM-dd") : "";
  const endStr = range?.to ? format(range.to, "yyyy-MM-dd") : "";
  const ready = Boolean(range?.from && range?.to);

  const { loading, error, raw, asteroids, load } = useAsteroids(
    startStr,
    endStr,
    ready,
    hazardFilter,
    sortKey,
    nameQuery,
  );

  const totalCount = raw?.asteroids.length ?? 0;
  const hazardousCount = raw?.meta.hazardous_count ?? 0;
  const totalPages = Math.max(
    1,
    Math.ceil(asteroids.length / ASTEROIDS_PER_PAGE),
  );
  const currentPage = Math.min(page, totalPages);
  const visibleAsteroids = asteroids.slice(
    (currentPage - 1) * ASTEROIDS_PER_PAGE,
    currentPage * ASTEROIDS_PER_PAGE,
  );

  useEffect(() => {
    if (!error) return;
    toast.error("Could not load asteroids", {
      description: error.message,
    });
  }, [error]);

  const handleRowClick = (row: AsteroidSummary) => {
    setSelectedId(row.id);
    setSheetOpen(true);
  };

  const handleRangeChange = (nextRange: DateRange | undefined) => {
    setRange(nextRange);
    setPage(1);
  };

  const handleHazardFilter = (nextFilter: HazardFilter) => {
    setHazardFilter(nextFilter);
    setPage(1);
  };

  const handleSortKey = (nextSortKey: SortKey) => {
    setSortKey(nextSortKey);
    setPage(1);
  };

  const handleNameQuery = (nextNameQuery: string) => {
    setNameQuery(nextNameQuery);
    setPage(1);
  };

  const metaLine = useMemo(() => {
    if (!raw) return null;
    const m = raw.meta;
    return (
      <span>
        Range {m.start_date} → {m.end_date} · {m.count} unique NEOs ·{" "}
        {m.hazardous_count} flagged hazardous · {m.chunks} NASA chunk
        {m.chunks === 1 ? "" : "s"} · cache hits {m.cache.hits} / misses{" "}
        {m.cache.misses}
      </span>
    );
  }, [raw]);

  return (
    <div className="min-h-full flex-1 bg-zinc-50 text-zinc-900 dark:bg-[#06070a] dark:text-zinc-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-zinc-200 pb-8 dark:border-zinc-800">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-rose-500 dark:text-rose-400">
                NASA NeoWs · via FastAPI proxy
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Near-Earth asteroid explorer
              </h1>
              <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
                Live public data from NASA&apos;s Near Earth Object Web Service.
                The frontend never calls NASA directly—only your cached backend.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
              >
                {totalCount} asteroids found
              </Badge>
              <Badge className="bg-rose-600 text-white hover:bg-rose-600">
                {hazardousCount} potentially dangerous
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <DateRangePicker value={range} onChange={handleRangeChange} />
            <Button
              type="button"
              variant="secondary"
              disabled={!ready || loading}
              onClick={() => void load(true)}
            >
              Refresh range
            </Button>
          </div>

          {metaLine ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              {metaLine}
            </p>
          ) : null}
        </header>

        {error && ready ? (
          <ErrorBanner error={error} onRetry={() => void load(true)} />
        ) : null}

        {!ready ? (
          <Card>
            <CardHeader>
              <CardTitle>Select a full range</CardTitle>
              <CardDescription>
                Choose a start and end date in the calendar (max 90 days).
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {ready && loading && !raw ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
            <div className="lg:col-span-2">
              <TableSkeleton />
            </div>
          </div>
        ) : null}

        {ready && raw && !error ? (
          <>
            <FiltersBar
              nameQuery={nameQuery}
              onNameQuery={handleNameQuery}
              hazardFilter={hazardFilter}
              onHazardFilter={handleHazardFilter}
              sortKey={sortKey}
              onSortKey={handleSortKey}
              shownCount={asteroids.length}
              totalCount={totalCount}
            />

            <section className="grid gap-6 lg:grid-cols-2">
              {loading ? (
                <>
                  <ChartSkeleton />
                  <ChartSkeleton />
                </>
              ) : (
                <>
                  <DistanceOverTimeChart asteroids={asteroids} />
                  <SizeDistributionChart asteroids={asteroids} />
                </>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Asteroids
              </h2>
              {loading ? (
                <TableSkeleton />
              ) : asteroids.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="space-y-4">
                  <AsteroidMissionList
                    asteroids={visibleAsteroids}
                    onOpenDetails={handleRowClick}
                  />

                  {totalPages > 1 ? (
                    <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-zinc-600">
                        Showing {(currentPage - 1) * ASTEROIDS_PER_PAGE + 1}-
                        {Math.min(
                          currentPage * ASTEROIDS_PER_PAGE,
                          asteroids.length,
                        )}{" "}
                        of {asteroids.length}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={currentPage === 1}
                          onClick={() =>
                            setPage((value) => Math.max(1, value - 1))
                          }
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <span className="min-w-20 text-center text-sm font-medium text-zinc-700">
                          {currentPage} / {totalPages}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={currentPage === totalPages}
                          onClick={() =>
                            setPage((value) => Math.min(totalPages, value + 1))
                          }
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>

      <AsteroidDetailSheet
        asteroidId={selectedId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
