import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{ background: "var(--background)", color: "var(--foreground)" }}
      className={cn("animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
