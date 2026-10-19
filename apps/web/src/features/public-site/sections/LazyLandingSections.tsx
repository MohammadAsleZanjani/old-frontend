"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const LandingSections = dynamic(() => import("./LandingSections").then((module) => module.LandingSections), {
  loading: () => null,
  ssr: false,
});

export function LazyLandingSections() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const load = () => setReady(true);

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(load, { timeout: 1_800 });
    } else {
      timeoutId = setTimeout(load, 1_000);
    }

    return () => {
      if (idleId) window.cancelIdleCallback(idleId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return ready ? <LandingSections /> : <div aria-hidden className="min-h-screen" />;
}
