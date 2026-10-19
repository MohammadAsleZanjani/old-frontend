"use client";

import { useState } from "react";

function isImageCover(value?: string) {
  return Boolean(value && (value.startsWith("/") || value.startsWith("data:image/") || value.startsWith("https://") || value.startsWith("http://")));
}

export function MediaBackdrop({
  alt = "",
  className = "",
  fit = "cover",
  value,
}: {
  alt?: string;
  className?: string;
  fit?: "contain" | "cover";
  value: string;
}) {
  const [failedValue, setFailedValue] = useState<string>();
  const [loadedValue, setLoadedValue] = useState<string>();

  if (isImageCover(value)) {
    const failed = failedValue === value;
    const loaded = loadedValue === value;

    return (
      <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        {!loaded || failed ? <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-foreground/5" /> : null}
        <img
          alt={alt}
          className={`h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"} transition-opacity duration-200 ${loaded && !failed ? "opacity-100" : "opacity-0"} ${className}`}
          decoding="async"
          onError={() => setFailedValue(value)}
          onLoad={() => setLoadedValue(value)}
          src={value}
        />
      </div>
    );
  }

  return <div className={`h-full w-full bg-gradient-to-br ${value} ${className}`} />;
}
