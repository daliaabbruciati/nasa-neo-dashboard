import type { AsteroidDetail, FeedResponse } from "@/lib/types";

const BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let code = "UNKNOWN";
  let detail = res.statusText || "Request failed";
  try {
    const body = (await res.json()) as { code?: string; detail?: string };
    if (body.code) code = body.code;
    if (body.detail) detail = String(body.detail);
  } catch {
    /* ignore */
  }
  return new ApiError(res.status, code, detail);
}

export async function fetchFeed(
  startDate: string,
  endDate: string,
): Promise<FeedResponse> {
  const url = new URL("/api/feed", BASE);
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw await parseError(res);
  return res.json() as Promise<FeedResponse>;
}

export async function fetchNeo(id: string): Promise<AsteroidDetail> {
  const url = new URL(`/api/neo/${encodeURIComponent(id)}`, BASE);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw await parseError(res);
  return res.json() as Promise<AsteroidDetail>;
}
