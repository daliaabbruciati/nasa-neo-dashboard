"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AsteroidSummary } from "@/lib/types";

const columnHelper = createColumnHelper<AsteroidSummary>();

function formatKm(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M km`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k km`;
  return `${n.toFixed(0)} km`;
}

type Props = {
  asteroids: AsteroidSummary[];
  onRowClick: (row: AsteroidSummary) => void;
};

export function AsteroidTable({ asteroids, onRowClick }: Props) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.display({
        id: "hazard",
        header: "Hazard",
        cell: ({ row }) =>
          row.original.is_potentially_hazardous_asteroid ? (
            <Badge variant="warning">PHA</Badge>
          ) : (
            <Badge variant="secondary">No</Badge>
          ),
      }),
      columnHelper.accessor("miss_distance_km", {
        header: "Miss distance",
        cell: (info) => formatKm(info.getValue()),
      }),
      columnHelper.display({
        id: "size",
        header: "Est. Ø (km)",
        cell: ({ row }) => {
          const a = row.original;
          return `${a.estimated_diameter_km_min.toFixed(3)} – ${a.estimated_diameter_km_max.toFixed(3)}`;
        },
      }),
      columnHelper.accessor("relative_velocity_kph", {
        header: "Velocity",
        cell: (info) =>
          `${info.getValue().toLocaleString(undefined, { maximumFractionDigits: 0 })} km/h`,
      }),
      columnHelper.accessor("close_approach_date_full", {
        header: "Approach",
        cell: (info) => (
          <span className="whitespace-nowrap text-zinc-600 dark:text-zinc-300">
            {info.getValue()}
          </span>
        ),
      }),
    ],
    [],
  );

  /* eslint-disable react-hooks/incompatible-library -- TanStack Table API */
  const table = useReactTable({
    data: asteroids,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  /* eslint-enable react-hooks/incompatible-library */

  return (
    <div
      className="rounded-xl border border-zinc-200 dark:border-zinc-800"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() => onRowClick(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No rows.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
