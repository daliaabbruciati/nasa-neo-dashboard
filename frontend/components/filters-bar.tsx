"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HazardFilter, SortKey } from "@/hooks/use-asteroids";

type Props = {
  nameQuery: string;
  onNameQuery: (v: string) => void;
  hazardFilter: HazardFilter;
  onHazardFilter: (v: HazardFilter) => void;
  sortKey: SortKey;
  onSortKey: (v: SortKey) => void;
  shownCount: number;
  totalCount: number;
};

export function FiltersBar({
  nameQuery,
  onNameQuery,
  hazardFilter,
  onHazardFilter,
  sortKey,
  onSortKey,
  shownCount,
  totalCount,
}: Props) {
  return (
    <div
      className="flex flex-col gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:flex-row sm:flex-wrap sm:items-end"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <div className="grid w-full gap-2 sm:max-w-xs">
        <Label htmlFor="search">Search name</Label>
        <Input
          id="search"
          placeholder="Filter by designation…"
          value={nameQuery}
          onChange={(e) => onNameQuery(e.target.value)}
        />
      </div>
      <div className="grid w-full gap-2 sm:w-48">
        <Label>Hazardous</Label>
        <Select
          value={hazardFilter}
          onValueChange={(v) => onHazardFilter(v as HazardFilter)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="hazardous">Potentially hazardous</SelectItem>
            <SelectItem value="safe">Not hazardous</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid w-full gap-2 sm:w-56">
        <Label>Sort by</Label>
        <Select value={sortKey} onValueChange={(v) => onSortKey(v as SortKey)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="distance_asc">
              Miss distance ↑ (closest)
            </SelectItem>
            <SelectItem value="distance_desc">Miss distance ↓</SelectItem>
            <SelectItem value="size_asc">Est. size ↑</SelectItem>
            <SelectItem value="size_desc">Est. size ↓</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2 pb-2 sm:ml-auto">
        <span className="text-sm text-zinc-400">Showing</span>
        <Badge variant="secondary">
          {shownCount} / {totalCount}
        </Badge>
      </div>
    </div>
  );
}
