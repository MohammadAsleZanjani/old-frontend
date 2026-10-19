import { ShadowSkeleton } from "@/shared/ui/skeleton-state";

export default function Loading() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-7xl space-y-6">
        <ShadowSkeleton className="h-16" />
        <ShadowSkeleton className="h-[420px]" />
        <div className="grid gap-4 md:grid-cols-3">
          <ShadowSkeleton className="h-40" />
          <ShadowSkeleton className="h-40" />
          <ShadowSkeleton className="h-40" />
        </div>
      </div>
    </main>
  );
}
