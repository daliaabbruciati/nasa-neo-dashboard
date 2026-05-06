"use client";

import { format } from "date-fns";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { parseNeoApproach } from "@/lib/dates";
import type { AsteroidSummary } from "@/lib/types";

type Props = {
  asteroids: AsteroidSummary[];
  onOpenDetails: (row: AsteroidSummary) => void;
};

function kmToDisplay(km: number): string {
  return `${km.toLocaleString(undefined, { maximumFractionDigits: 0 })} km`;
}

function kmhToKms(kmh: number): string {
  return `${(kmh / 3600).toFixed(1)} km/s`;
}

function formatCountdown(deltaMs: number) {
  const total = Math.max(0, Math.floor(deltaMs / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { days, hours, minutes, seconds };
}

function diameterMeters(a: AsteroidSummary) {
  return (
    ((a.estimated_diameter_km_min + a.estimated_diameter_km_max) / 2) *
    1000
  ).toFixed(0);
}

export function AsteroidMissionList({ asteroids, onOpenDetails }: Props) {
  const [now, setNow] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const items = useMemo(
    () =>
      asteroids.map((a) => {
        const approachDate = parseNeoApproach(a.close_approach_date_full);
        const approachMs = approachDate?.getTime() ?? now;
        const countdown = formatCountdown(approachMs - now);
        return { asteroid: a, approachDate, countdown };
      }),
    [asteroids, now],
  );

  return (
    <div className="space-y-4">
      {items.map(({ asteroid: a, approachDate, countdown }) => (
        <Card
          key={a.id}
          className="border-zinc-200 bg-white text-zinc-950 shadow-sm"
        >
          <CardContent className="p-4 md:p-6">
            <div className="grid gap-4 md:grid-cols-12 md:items-center">
              <div className="space-y-3 md:col-span-5">
                <div className="flex items-center gap-3">
                  <h3 className="text-3xl font-bold tracking-tight">
                    {a.name}
                  </h3>
                  {a.is_potentially_hazardous_asteroid ? (
                    <Badge className="bg-rose-500 text-white hover:bg-rose-500">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Dangerous
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      Safe
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-zinc-500">Approach date</p>
                    <p className="font-medium">
                      {approachDate
                        ? format(approachDate, "dd MMM yyyy HH:mm:ss")
                        : a.close_approach_date_full}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Speed</p>
                    <p className="font-medium">
                      {kmhToKms(a.relative_velocity_kph)}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Distance</p>
                    <p className="font-medium">
                      {kmToDisplay(a.miss_distance_km)}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Diameter (avg)</p>
                    <p className="font-medium">{diameterMeters(a)} m</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-2 md:col-span-2">
                <Image
                  src={
                    a.is_potentially_hazardous_asteroid
                      ? "/asteroid-danger.png"
                      : "/asteroid-safe.png"
                  }
                  alt={
                    a.is_potentially_hazardous_asteroid
                      ? "Dangerous asteroid"
                      : "Safe asteroid"
                  }
                  width={120}
                  height={96}
                  className="h-24 rounded-md object-contain select-none opacity-95"
                  style={{ width: "auto", height: "auto" }}
                  priority={false}
                />
                <p className="text-center text-sm text-zinc-700">
                  {diameterMeters(a)} m
                  <span className="block text-xs text-zinc-500">(approx)</span>
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 md:col-span-5">
                <p className="mb-2 text-center text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Countdown
                </p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-md bg-white p-2 shadow-sm">
                    <p className="text-2xl font-semibold">
                      {String(countdown.days).padStart(2, "0")}
                    </p>
                    <p className="text-[10px] uppercase text-zinc-500">days</p>
                  </div>
                  <div className="rounded-md bg-white p-2 shadow-sm">
                    <p className="text-2xl font-semibold">
                      {String(countdown.hours).padStart(2, "0")}
                    </p>
                    <p className="text-[10px] uppercase text-zinc-500">hours</p>
                  </div>
                  <div className="rounded-md bg-white p-2 shadow-sm">
                    <p className="text-2xl font-semibold">
                      {String(countdown.minutes).padStart(2, "0")}
                    </p>
                    <p className="text-[10px] uppercase text-zinc-500">
                      minutes
                    </p>
                  </div>
                  <div className="rounded-md bg-white p-2 shadow-sm">
                    <p className="text-2xl font-semibold">
                      {String(countdown.seconds).padStart(2, "0")}
                    </p>
                    <p className="text-[10px] uppercase text-zinc-500">
                      seconds
                    </p>
                  </div>
                </div>
                <Button
                  className="mt-4 w-full"
                  variant="outline"
                  onClick={() => onOpenDetails(a)}
                >
                  Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
