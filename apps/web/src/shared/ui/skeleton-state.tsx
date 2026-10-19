import { cn } from "@/shared/lib/utils";

export function ShadowSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card/50 shadow-[0_18px_60px_-35px_var(--glow)]",
        "before:absolute before:inset-0 before:animate-shimmer before:content-['']",
        className,
      )}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <ShadowSkeleton key={index} className="h-28" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <ShadowSkeleton className="h-80" />
        <ShadowSkeleton className="h-80" />
      </div>
    </div>
  );
}
