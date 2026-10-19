"use client";

import { useState } from "react";

import { isProductImageSource } from "./products-api";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";

type ProductImageProps = {
  alt: string;
  className?: string;
  fit?: "contain" | "cover";
  imageClassName?: string;
  src?: string | null;
};

export function ProductImage({
  alt,
  className,
  fit = "contain",
  imageClassName,
  src,
}: ProductImageProps) {
  const source = isProductImageSource(src) ? src!.trim() : undefined;
  const [failedSource, setFailedSource] = useState<string>();
  const [loadedSource, setLoadedSource] = useState<string>();
  const failed = Boolean(source && failedSource === source);
  const loaded = Boolean(source && loadedSource === source && !failed);

  return (
    <div
      aria-busy={!loaded}
      className={cn("relative h-full w-full overflow-hidden", className)}
    >
      {!loaded ? (
        <Skeleton
          aria-hidden="true"
          className="absolute inset-0 h-full w-full rounded-none bg-foreground/10"
        />
      ) : null}
      {source && !failed ? (
        <img
          alt={alt}
          className={cn(
            "h-full w-full transition-opacity duration-200",
            fit === "contain" ? "object-contain" : "object-cover",
            loaded ? "opacity-100" : "opacity-0",
            imageClassName,
          )}
          decoding="async"
          onError={() => setFailedSource(source)}
          onLoad={() => setLoadedSource(source)}
          src={source}
        />
      ) : null}
    </div>
  );
}
