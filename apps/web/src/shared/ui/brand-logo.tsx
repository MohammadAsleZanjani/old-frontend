import Image from "next/image";

import { cn } from "@/shared/lib/utils";

export function BrandLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      alt="نقره"
      className={cn("object-contain drop-shadow-[0_5px_10px_rgba(0,0,0,0.25)] dark:brightness-110", className)}
      height={1024}
      priority={priority}
      src="/logo.png"
      width={1024}
    />
  );
}
