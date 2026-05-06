import { Orbit } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type Props = {
  title?: string;
  description?: string;
};

export function EmptyState({
  title = "No asteroids match",
  description = "Try widening the date range, clearing filters, or picking different sort options.",
}: Props) {
  return (
    <Card
      className="border-dashed"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <Orbit className="h-10 w-10 text-zinc-400" />
        <p className="text-lg font-medium">{title}</p>
        <p className="max-w-md text-sm" style={{ color: "var(--foreground)" }}>
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
