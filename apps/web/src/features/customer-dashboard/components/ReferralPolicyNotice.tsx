"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, BellRing, ShieldCheck } from "lucide-react";

import { acknowledgeReferralPolicy, getReferralPolicyAcknowledgement, type ReferralPolicyAcknowledgement } from "@/features/customer-dashboard/api/customer-dashboard-api";
import { useAuth } from "@/shared/auth/AuthProvider";
import { Button } from "@/shared/ui/button";
import { BrandLogo } from "@/shared/ui/brand-logo";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";

const QUERY_KEY = ["referral-policy-acknowledgement"] as const;

export function ReferralPolicyNotice() {
  const { loading, user } = useAuth();
  const queryClient = useQueryClient();
  const policy = useQuery({
    enabled: Boolean(user) && !loading,
    queryFn: () => getReferralPolicyAcknowledgement(),
    queryKey: QUERY_KEY,
    retry: 1,
    staleTime: 60_000,
  });
  const acknowledge = useMutation({
    mutationFn: () => acknowledgeReferralPolicy(),
    onSuccess: (result) => queryClient.setQueryData<ReferralPolicyAcknowledgement>(QUERY_KEY, result),
  });

  return (
    <Dialog onOpenChange={() => undefined} open={policy.data?.required === true}>
      <DialogContent
        className="max-h-[94vh] max-w-[680px] overflow-y-auto border-0 bg-transparent p-2 text-right shadow-none [&>button]:hidden sm:p-4"
        dir="rtl"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <div className="relative overflow-hidden rounded-[2rem] border border-amber-500/65 bg-gradient-to-br from-white via-zinc-200 to-amber-100/80 p-px shadow-[0_32px_90px_rgba(0,0,0,.48),0_0_48px_rgba(190,136,35,.22)] dark:from-zinc-500 dark:via-zinc-900 dark:to-amber-700/70">
          <div className="pointer-events-none absolute -start-16 -top-20 size-52 rounded-full border-[18px] border-amber-400/10" />
          <div className="pointer-events-none absolute -end-20 -bottom-24 size-64 rounded-full border-[22px] border-zinc-400/10" />
          <div className="relative overflow-hidden rounded-[calc(2rem-1px)] border border-white/80 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,255,255,.98),rgba(250,250,249,.96)_44%,rgba(238,238,235,.98)_100%)] px-5 pb-4 pt-4 text-zinc-900 dark:border-white/10 dark:bg-[radial-gradient(circle_at_50%_-10%,rgba(63,63,70,.98),rgba(24,24,27,.98)_48%,rgba(9,9,11,.99)_100%)] dark:text-zinc-50 sm:px-8 sm:pb-6 sm:pt-5">
            <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
            <DialogHeader className="items-center space-y-0 text-center sm:text-center">
              <div className="relative grid size-24 place-items-center">
                <div className="absolute inset-x-4 bottom-2 h-8 rounded-full bg-amber-500/15 blur-2xl" />
                <BrandLogo className="relative h-full w-full" />
              </div>
              <DialogTitle className="mt-5 text-center text-2xl font-black leading-[1.55] sm:text-3xl">
                شرایط دریافت <span className="text-amber-600 dark:text-amber-400">پاداش معرفی</span>
              </DialogTitle>
              <div className="my-3 flex w-full items-center justify-center gap-3" aria-hidden="true">
                <span className="h-px w-16 bg-gradient-to-l from-amber-500 to-transparent" />
                <span className="size-1.5 rotate-45 border border-amber-600 bg-amber-200 dark:bg-amber-700" />
                <span className="h-px w-16 bg-gradient-to-r from-amber-500 to-transparent" />
              </div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-600/35 bg-gradient-to-b from-amber-200/90 to-amber-500/35 px-4 py-1.5 text-xs font-bold text-amber-950 shadow-[0_7px_18px_rgba(180,128,25,.18)] dark:from-amber-400/25 dark:to-amber-700/20 dark:text-amber-200">
                <BellRing className="size-4" />
                اطلاعیه مهم نقره‌لند
              </div>
              <DialogDescription asChild>
                <div className="w-full space-y-3 text-right text-sm leading-8 text-zinc-700 dark:text-zinc-200 sm:text-[15px]">
                  <p className="text-center">کاربر گرامی، به اطلاع می‌رساند برای دریافت پاداش معرفی، لازم است:</p>

                  <div className="rounded-2xl border border-amber-600/35 bg-white/80 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_10px_30px_rgba(82,64,32,.08)] dark:bg-white/[.06] sm:p-4">
                    <p className="text-center leading-8">
                      <strong className="font-black text-zinc-950 dark:text-white">هم شخص دعوت‌کننده و هم کاربر دعوت‌شده</strong>، هر کدام حداقل
                    </p>
                    <p className="my-2 text-center text-2xl font-black text-amber-600 dark:text-amber-400 sm:text-3xl">یک میلیون تومان</p>
                    <p className="text-center leading-8">تراکنش خرید نقره در نقره‌لند داشته باشند.</p>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-zinc-300 bg-gradient-to-br from-zinc-100 to-zinc-200/80 p-3 shadow-inner dark:border-white/15 dark:from-white/10 dark:to-white/[.04]">
                    <span className="grid size-12 shrink-0 place-items-center rounded-full border border-amber-600/45 bg-gradient-to-br from-amber-200 to-amber-500 text-amber-950 shadow-[0_5px_14px_rgba(180,128,25,.28)]">
                      <ShieldCheck className="size-7" />
                    </span>
                    <p className="leading-7">پس از احراز این شرایط، پاداش معرفی مطابق قوانین و شرایط نقره‌لند به کاربر واجد شرایط تعلق خواهد گرفت.</p>
                  </div>

                  <p className="text-center">از همراهی و اعتماد شما به <strong className="text-amber-700 dark:text-amber-400">نقره‌لند</strong> سپاسگزاریم.</p>
                </div>
              </DialogDescription>
            </DialogHeader>
            {acknowledge.isError ? <p className="mt-4 text-center text-sm text-destructive">ثبت تأیید انجام نشد. لطفاً دوباره تلاش کنید.</p> : null}
            <DialogFooter className="sticky -bottom-4 z-10 mt-3 bg-gradient-to-t from-zinc-100 via-zinc-100/95 to-transparent pb-1 pt-3 backdrop-blur-sm dark:from-zinc-950 dark:via-zinc-950/95 sm:-bottom-6 sm:justify-center sm:pb-1">
              <Button
                className="h-12 w-full rounded-xl border border-amber-700/40 bg-gradient-to-b from-amber-300 to-amber-500 font-black text-amber-950 shadow-[0_10px_24px_rgba(180,128,25,.25)] hover:from-amber-200 hover:to-amber-400 sm:max-w-72"
                disabled={acknowledge.isPending}
                onClick={() => acknowledge.mutate()}
              >
                <BadgeCheck className="size-5" />
                {acknowledge.isPending ? "در حال ثبت…" : "خواندم و متوجه شدم"}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
