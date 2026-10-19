"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const LiveChat = dynamic(() => import("./LiveChat"), {
  loading: () => null,
  ssr: false,
});

export function DeferredLiveChat() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const show = () => setReady(true);

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(show, { timeout: 2_500 });
    } else {
      timeoutId = globalThis.setTimeout(show, 1_500);
    }

    return () => {
      if (idleId) window.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  return ready ? <LiveChat /> : null;
}
