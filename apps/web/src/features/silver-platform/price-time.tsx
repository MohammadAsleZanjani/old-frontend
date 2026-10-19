"use client";

import { useEffect, useMemo, useState } from "react";

import { formatSilverPriceTimestamp, toPersianDigits } from "./format";

export function PriceUpdateMeta({
  intervalMinutes,
  updatedAt,
}: {
  intervalMinutes: number;
  updatedAt: string;
}) {
  const remainingSeconds = usePriceCountdown(updatedAt, intervalMinutes);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return (
    <div className="space-y-1 text-xs text-muted-foreground">
      <div>آخرین بروزرسانی: {formatSilverPriceTimestamp(updatedAt)}</div>
      <div>
        بروزرسانی بعدی:{" "}
        <span className="font-bold tabular-nums text-foreground">
          {toPersianDigits(String(minutes).padStart(2, "0"))}:{toPersianDigits(String(seconds).padStart(2, "0"))}
        </span>
      </div>
    </div>
  );
}

function usePriceCountdown(updatedAt: string, intervalMinutes: number) {
  const target = useMemo(() => {
    const updated = new Date(updatedAt).getTime();
    const safeInterval = Number.isFinite(intervalMinutes) && intervalMinutes > 0 ? intervalMinutes : 5;
    return updated + safeInterval * 60_000;
  }, [intervalMinutes, updatedAt]);
  const [remaining, setRemaining] = useState(() => secondsUntil(target));

  useEffect(() => {
    const update = () => setRemaining(secondsUntil(target));
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, [target]);

  return remaining;
}

function secondsUntil(target: number) {
  return Math.max(0, Math.ceil((target - Date.now()) / 1_000));
}
