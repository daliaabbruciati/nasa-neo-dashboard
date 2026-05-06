"use client";

import { differenceInCalendarDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MAX_RANGE_DAYS = 90;

type Props = {
  value: DateRange | undefined;
  onChange: (next: DateRange | undefined) => void;
  className?: string;
};

export function DateRangePicker({ value, onChange, className }: Props) {
  const from = value?.from;
  const to = value?.to;

  const label =
    from && to
      ? `${format(from, "MMM d, yyyy")} – ${format(to, "MMM d, yyyy")}`
      : from
        ? `${format(from, "MMM d, yyyy")} – …`
        : "Pick a date range";

  return (
    <div
      className={cn("grid gap-2", className)}
      style={{ color: "var(--foreground)" }}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal sm:w-[320px]",
              !from && "text-zinc-500",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={from}
            selected={value}
            onSelect={(range) => {
              if (!range?.from) {
                onChange(undefined);
                return;
              }
              if (!range.to) {
                onChange({ from: range.from, to: undefined });
                return;
              }
              const span = differenceInCalendarDays(range.to, range.from) + 1;
              if (span > MAX_RANGE_DAYS) {
                toast.warning(
                  `NASA feed is limited to ${MAX_RANGE_DAYS} days in this app. Shrink the range.`,
                );
                return;
              }
              onChange({ from: range.from, to: range.to });
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Backend splits longer ranges into 7-day NASA requests (max{" "}
        {MAX_RANGE_DAYS} days total).
      </p>
    </div>
  );
}
