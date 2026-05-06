"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

import "react-day-picker/style.css";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={cn("rdp-root rounded-md border border-zinc-200 p-2 dark:border-zinc-800", className)}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
