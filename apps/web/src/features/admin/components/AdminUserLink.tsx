import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

function adminUserProfileHref(userId: string) {
  return `/admin/users/${encodeURIComponent(userId)}/edit`;
}

export function AdminUserLink({ children, className, userId }: { children: ReactNode; className?: string; userId?: string | null }) {
  if (!userId) return <span className={className}>{children}</span>;
  return (
    <Link
      className={cn("font-semibold text-foreground underline decoration-primary/35 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary", className)}
      href={adminUserProfileHref(userId) as never}
      title="مشاهده و ویرایش پروفایل کاربر"
    >
      {children}
    </Link>
  );
}
