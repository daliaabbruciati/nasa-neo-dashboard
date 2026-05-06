"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ApiError } from "@/lib/api";

const MESSAGES: Record<string, string> = {
  RATE_LIMITED:
    "NASA rate limit hit (DEMO_KEY is heavily throttled). Add your own key in backend `.env` as NASA_API_KEY.",
  RANGE_TOO_LONG: "That date range is too long for this app (max 90 days).",
  INVALID_DATE: "Check your dates — use YYYY-MM-DD and end ≥ start.",
  UPSTREAM_ERROR: "NASA or the network had a problem. Try again in a moment.",
  NOT_FOUND: "That asteroid could not be found.",
  UNKNOWN: "Something went wrong.",
};

function friendlyMessage(err: ApiError): string {
  return MESSAGES[err.code] ?? err.message ?? MESSAGES.UNKNOWN;
}

type Props = {
  error: ApiError;
  onRetry?: () => void;
};

export function ErrorBanner({ error, onRetry }: Props) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium">{friendlyMessage(error)}</p>
          <p className="mt-1 text-xs opacity-80">
            Code: <code>{error.code}</code> · HTTP {error.status}
          </p>
        </div>
      </div>
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
