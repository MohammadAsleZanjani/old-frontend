"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { captureReferralAttribution } from "./referral-attribution";

export function ReferralAttributionCapture() {
  const pathname = usePathname();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("ref") ?? params.get("referral") ?? params.get("referral_code");
    if (!code) return;
    const utm = Object.fromEntries(
      [...params.entries()].filter(([key]) => key.startsWith("utm_")),
    );
    void captureReferralAttribution(code, `${pathname}${window.location.search}`, utm);
  }, [pathname]);

  return null;
}
