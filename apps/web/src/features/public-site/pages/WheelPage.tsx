"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, Coins, Gift, Loader2, LockKeyhole, RotateCw, ShieldCheck, ShoppingBag, Sparkles, TicketPercent, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/shared/ui/sonner";

import {
  getActiveWheel,
  getWheelEligibility,
  getWheelFingerprint,
  getWheelSessionId,
  spinWheel,
  trackAuthenticatedWheelEvent,
  trackWheelEvent,
  type PublicWheelPrize,
  type WheelSpinResult,
} from "@/domains/wheel/wheel-api";
import { SiteBackground } from "@/features/public-site/sections/Background";
import { Footer } from "@/features/public-site/sections/Footer";
import { Header } from "@/features/silver-platform/components";
import { useAuth } from "@/shared/auth/AuthProvider";
import { useI18n } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";

const SEGMENT_COUNT = 10;
const SEGMENT_DEGREES = 360 / SEGMENT_COUNT;

export function WheelPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { lang } = useI18n();
  const isFa = lang === "fa";
  const { user } = useAuth();
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<WheelSpinResult | null>(null);
  const viewTracked = useRef(false);
  const intentHandled = useRef(false);
  const wheel = useQuery({ queryFn: getActiveWheel, queryKey: ["active-wheel"], staleTime: 30_000 });
  const campaign = wheel.data?.campaign;
  const eligibility = useQuery({ enabled: Boolean(user && campaign), queryFn: getWheelEligibility, queryKey: ["wheel-eligibility", user?.id, campaign?.id] });

  useEffect(() => {
    if (!campaign || viewTracked.current) return;
    viewTracked.current = true;
    void trackWheelEvent("WHEEL_VIEWED", campaign.id, { path: "/wheel" }).catch(() => undefined);
  }, [campaign]);

  const spin = useMutation({
    mutationFn: () => spinWheel({ fingerprint: getWheelFingerprint(), sessionId: getWheelSessionId() }, crypto.randomUUID()),
    onError: (error) => toast.error(error instanceof Error ? error.message : (isFa ? "چرخش انجام نشد" : "Spin failed")),
    onSuccess: (value) => {
      const desired = (360 - value.selectedSegment * 36 - 18 + 360) % 360;
      setRotation((current) => current + 6 * 360 + ((desired - (current % 360) + 360) % 360));
      window.setTimeout(() => setResult(value), 4_250);
      void queryClient.invalidateQueries({ queryKey: ["wheel-eligibility"] });
      void queryClient.invalidateQueries({ queryKey: ["wheel-rewards"] });
    },
  });

  useEffect(() => {
    if (!user || !campaign || !eligibility.data?.eligible || intentHandled.current) return;
    if (window.sessionStorage.getItem("noghre:wheel-intent") !== "spin") return;
    intentHandled.current = true;
    window.sessionStorage.removeItem("noghre:wheel-intent");
    void trackAuthenticatedWheelEvent("REGISTRATION_COMPLETED", campaign.id, { returnedTo: "/wheel" }).catch(() => undefined);
    spin.mutate();
  }, [campaign, eligibility.data?.eligible, spin, user]);

  const handleSpin = () => {
    if (!campaign || spin.isPending) return;
    void trackWheelEvent("SPIN_CTA_CLICKED", campaign.id, { authenticated: Boolean(user) }).catch(() => undefined);
    if (!user) {
      window.sessionStorage.setItem("noghre:wheel-intent", "spin");
      void trackWheelEvent("REGISTRATION_INITIATED", campaign.id, { returnTo: "/wheel" }).catch(() => undefined);
      router.push(`/auth?redirect=${encodeURIComponent("/wheel")}`);
      return;
    }
    spin.mutate();
  };

  const buttonLabel = useMemo(() => {
    if (spin.isPending) return isFa ? "در حال انتخاب امن جایزه…" : "Selecting your prize securely…";
    if (!user) return isFa ? "ورود و دریافت چرخش رایگان" : "Sign in for a free spin";
    if (eligibility.isLoading) return isFa ? "بررسی شانس‌ها…" : "Checking spins…";
    if (eligibility.data && !eligibility.data.eligible) return isFa ? eligibilityMessageFa(eligibility.data.reasonCode) : eligibility.data.message;
    return isFa ? "بچرخان و برنده شو" : "Spin & win";
  }, [eligibility.data, eligibility.isLoading, isFa, spin.isPending, user]);

  return (
    <main className="relative min-h-screen overflow-hidden text-foreground">
      <SiteBackground />
      <Header />
      <section className="relative px-5 pb-24 pt-20 sm:pt-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="border-primary/30 bg-primary/10 text-primary" variant="outline"><Sparkles className="me-1 size-3.5" />{isFa ? "جایزه تضمینی در هر چرخش" : "A reward on every spin"}</Badge>
            <h1 className="mt-5 bg-gradient-to-b from-foreground to-foreground/55 bg-clip-text font-display text-4xl font-black text-transparent sm:text-6xl">
              {isFa ? "گردونه نقره‌ای شانس" : "The Silver Prize Wheel"}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-muted-foreground sm:text-base">
              {isFa ? "یک چرخش رایگان برای شروع؛ از اعتبار خرید و کد تخفیف تا شمش نقره واقعی. نتیجه فقط روی سرور امن انتخاب می‌شود." : "Start with a free spin—from shopping credit and private discounts to a real silver bar. Every result is selected securely on the server."}
            </p>
          </div>

          {wheel.isLoading ? <ShadowSkeleton className="mx-auto mt-12 aspect-square max-w-[620px] rounded-full" /> : null}
          {wheel.isError ? <Card className="mx-auto mt-12 max-w-xl border-destructive/40"><CardContent className="p-8 text-center text-destructive">{wheel.error.message}</CardContent></Card> : null}
          {!wheel.isLoading && !campaign ? <Card className="mx-auto mt-12 max-w-xl"><CardContent className="p-10 text-center"><Gift className="mx-auto size-12 text-muted-foreground" /><h2 className="mt-4 text-xl font-bold">{isFa ? "کمپین بعدی به‌زودی شروع می‌شود" : "The next campaign starts soon"}</h2></CardContent></Card> : null}

          {campaign ? (
            <div className="mt-10 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="relative mx-auto w-full max-w-[650px]">
                <MetalPointer />
                <PrizeWheel prizes={campaign.prizes} rotation={rotation} isFa={isFa} />
                <button
                  aria-label={isFa ? "چرخاندن گردونه" : "Spin the wheel"}
                  className="absolute left-1/2 top-1/2 z-10 size-[31%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-transparent transition hover:scale-[1.025] hover:shadow-[0_0_42px_4px_rgba(220,178,80,.28)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/70 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={spin.isPending || Boolean(user && eligibility.data && !eligibility.data.eligible)}
                  onClick={handleSpin}
                  type="button"
                ><span className="sr-only">{isFa ? "بچرخان" : "Spin"}</span></button>
                {spin.isPending ? <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 grid size-[31%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-amber-100 backdrop-blur-sm"><Loader2 className="size-10 animate-spin" /></div> : null}
              </div>

              <div className="space-y-4">
                <Card className="overflow-hidden border-primary/25 bg-card/75 shadow-[0_24px_70px_-45px_var(--glow)]">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{isFa ? "شانس‌های قابل استفاده" : "Available spins"}</span>
                      <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-xl font-black text-primary">{user ? eligibility.data?.spinsRemaining ?? "—" : "1"}</span>
                    </div>
                    <Button className="mt-5 h-12 w-full" disabled={spin.isPending || Boolean(user && eligibility.data && !eligibility.data.eligible)} onClick={handleSpin}>
                      {spin.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}{buttonLabel}
                    </Button>
                    {user ? <Button asChild className="mt-2 w-full" variant="ghost"><Link href="/user/rewards"><Trophy className="size-4" />{isFa ? "مشاهده جوایز من" : "View my rewards"}</Link></Button> : null}
                  </CardContent>
                </Card>
                <Feature icon={ShieldCheck} title={isFa ? "انتخاب امن و شفاف" : "Secure selection"} text={isFa ? "نتیجه و محدودیت‌ها در تراکنش اتمیک سرور کنترل می‌شوند." : "Results and limits are enforced in one atomic server transaction."} />
                <Feature icon={LockKeyhole} title={isFa ? "جوایز اختصاصی شما" : "Rewards owned by you"} text={isFa ? "اعتبار خرید و کدهای برنده‌شده فقط در حساب شما قابل استفاده‌اند." : "Won credit and coupon codes can only be used by your account."} />
                <Feature icon={Award} title={isFa ? "شمش واقعی با رهگیری" : "Tracked physical jackpot"} text={isFa ? "برنده شمش، آدرس را ثبت و وضعیت ارسال را لحظه‌ای دنبال می‌کند." : "Jackpot winners submit shipping details and track fulfillment."} />
              </div>
            </div>
          ) : null}
        </div>
      </section>
      <Footer />

      <Dialog open={Boolean(result)} onOpenChange={(open) => { if (!open) setResult(null); }}>
        <DialogContent className="overflow-hidden border-primary/30 text-center sm:max-w-md">
          {result ? <>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/20 to-transparent" />
            <DialogHeader className="relative items-center text-center">
              <div className="grid size-20 place-items-center rounded-full border border-primary/30 bg-primary/10 text-primary"><ResultIcon type={result.prize.prizeType} /></div>
              <Badge className="mt-3" variant="secondary">{result.prize.isJackpot ? (isFa ? "جک‌پات بزرگ" : "JACKPOT") : (isFa ? "برنده شدید!" : "YOU WON!")}</Badge>
              <DialogTitle className="pt-2 text-2xl font-black">{isFa ? result.prize.titleFa : result.prize.titleEn}</DialogTitle>
              <DialogDescription className="leading-7">{isFa ? result.prize.descriptionFa : result.prize.descriptionEn}</DialogDescription>
            </DialogHeader>
            {result.reward?.promotionCode?.code ? <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 font-mono text-lg font-bold tracking-wider">{result.reward.promotionCode.code}</div> : null}
            <DialogFooter className="relative grid gap-2 sm:grid-cols-2 sm:space-x-0">
              <Button asChild><Link href={result.prize.prizeType === "PHYSICAL_PRIZE" ? "/user/rewards" : "/products"}><ShoppingBag className="size-4" />{result.prize.prizeType === "PHYSICAL_PRIZE" ? (isFa ? "ثبت اطلاعات ارسال" : "Claim prize") : (isFa ? "استفاده از جایزه" : "Use reward")}</Link></Button>
              <Button onClick={() => setResult(null)} variant="outline">{isFa ? "چرخش بعدی" : "Spin again"}</Button>
            </DialogFooter>
          </> : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function PrizeWheel({ prizes, rotation, isFa }: { prizes: PublicWheelPrize[]; rotation: number; isFa: boolean }) {
  const ordered = [...prizes].sort((a, b) => a.displayOrder - b.displayOrder).slice(0, SEGMENT_COUNT);
  return (
    <div
      aria-label={isFa ? "گردونه جوایز نقره‌لند" : "Noghreh Land prize wheel"}
      className="relative aspect-square w-full drop-shadow-[0_22px_34px_rgba(8,10,14,.3)] transition-transform duration-[4000ms] ease-[cubic-bezier(.12,.7,.1,1)] [container-type:inline-size]"
      role="img"
      style={{ transform: `rotate(${rotation}deg)` }}
      suppressHydrationWarning
    >
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 400 400">
        <defs>
          <linearGradient id="web-wheel-rim" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#3D4147" /><stop offset=".18" stopColor="#F8F9FA" /><stop offset=".42" stopColor="#777D84" /><stop offset=".66" stopColor="#FFFFFF" /><stop offset="1" stopColor="#25282D" /></linearGradient>
          <linearGradient id="web-wheel-dark" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#30343A" /><stop offset=".45" stopColor="#111318" /><stop offset="1" stopColor="#050609" /></linearGradient>
          <linearGradient id="web-wheel-silver" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset=".38" stopColor="#C9CDD1" /><stop offset=".68" stopColor="#F4F5F6" /><stop offset="1" stopColor="#858B92" /></linearGradient>
          <linearGradient id="web-wheel-gold" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#80601D" /><stop offset=".28" stopColor="#FFE6A3" /><stop offset=".53" stopColor="#B9892D" /><stop offset=".78" stopColor="#FFF0BA" /><stop offset="1" stopColor="#745115" /></linearGradient>
          <radialGradient cx="38%" cy="32%" id="web-wheel-hub-metal" r="72%"><stop offset="0" stopColor="#FFFFFF" /><stop offset=".24" stopColor="#BFC4C9" /><stop offset=".58" stopColor="#5F656D" /><stop offset=".82" stopColor="#E6E8EA" /><stop offset="1" stopColor="#1B1E23" /></radialGradient>
          <radialGradient cx="50%" cy="45%" id="web-wheel-hub-dark" r="65%"><stop offset="0" stopColor="#353A42" /><stop offset=".55" stopColor="#12151A" /><stop offset="1" stopColor="#040507" /></radialGradient>
        </defs>

        <circle cx="200" cy="200" fill="#050608" r="199" />
        <circle cx="200" cy="200" fill="url(#web-wheel-rim)" r="197" stroke="#E6C878" strokeWidth="2" />
        <circle cx="200" cy="200" fill="#07080B" r="188" stroke="#665025" strokeWidth="3" />
        <circle cx="200" cy="200" fill="#080A0D" r="184" stroke="#F0D38A" strokeWidth="1.5" />

        {ordered.map((prize, index) => {
          const start = -90 + index * SEGMENT_DEGREES;
          const end = start + SEGMENT_DEGREES;
          const center = start + SEGMENT_DEGREES / 2;
          const iconPosition = polar(200, 200, 107, center);
          const dark = index % 2 === 0;
          const textColor = dark ? "#FFFFFF" : "#090B0E";
          return <g key={prize.id}>
            <path d={wedgePath(200, 200, 181, start, end)} fill={dark ? "url(#web-wheel-dark)" : "url(#web-wheel-silver)"} stroke="#C49B4D" strokeWidth="1.25" />
            {prize.isJackpot ? <path d={wedgePath(200, 200, 178, start + 1.2, end - 1.2)} fill="none" stroke="#FFF0B3" strokeWidth="2" /> : null}
            <PrizeMark color={textColor} cx={iconPosition.x} cy={iconPosition.y} type={prize.prizeType} />
          </g>;
        })}

        {Array.from({ length: SEGMENT_COUNT }, (_, index) => {
          const pin = polar(200, 200, 182, -90 + index * SEGMENT_DEGREES);
          return <g key={`pin-${index}`}><circle cx={pin.x} cy={pin.y} fill="#21170A" r="5.4" stroke="#F8D98D" strokeWidth="1.2" /><circle cx={pin.x - 1} cy={pin.y - 1} fill="url(#web-wheel-gold)" r="3.4" /></g>;
        })}

        <circle cx="200" cy="200" fill="#050609" r="76" stroke="#B38635" strokeWidth="2" />
        <circle cx="200" cy="200" fill="url(#web-wheel-hub-metal)" r="70" stroke="#FFE5A0" strokeWidth="2.2" />
        <circle cx="200" cy="200" fill="url(#web-wheel-hub-dark)" r="59" stroke="#EFF1F2" strokeWidth="1.4" />
        <image height="70" href="/logo.png" preserveAspectRatio="xMidYMin slice" width="110" x="145" y="165" />
      </svg>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {ordered.map((prize, index) => {
          const center = -90 + index * SEGMENT_DEGREES + SEGMENT_DEGREES / 2;
          const position = polar(200, 200, 145, center);
          const lines = prizeLabelLines(isFa ? prize.titleFa : prize.titleEn, 10, 4);
          return <span
            dir={isFa ? "rtl" : "ltr"}
            key={`label-${prize.id}`}
            className={`absolute flex h-[17%] w-[22%] -translate-x-1/2 -translate-y-1/2 items-center justify-center whitespace-pre-line text-center font-black leading-[1.08] ${index % 2 === 0 ? "text-white" : "text-[#090B0E]"}`}
            style={{ fontSize: "clamp(9px, 2.7cqw, 15px)", left: `${stableNumber(position.x / 4)}%`, top: `${stableNumber(position.y / 4)}%` }}
            suppressHydrationWarning
          >{lines.join("\n")}</span>;
        })}
      </div>
    </div>
  );
}

function MetalPointer() {
  return <svg aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[-11px] z-20 h-[17%] w-[14%] -translate-x-1/2 drop-shadow-[0_6px_8px_rgba(0,0,0,.42)]" viewBox="0 0 56 68">
    <defs><linearGradient id="web-wheel-pointer" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#3A2A10" /><stop offset=".27" stopColor="#FFE3A0" /><stop offset=".5" stopColor="#7C5A1D" /><stop offset=".74" stopColor="#FFF0BE" /><stop offset="1" stopColor="#2F210D" /></linearGradient></defs>
    <path d="M 28 66 L 7 25 Q 4 8 28 3 Q 52 8 49 25 Z" fill="url(#web-wheel-pointer)" stroke="#F4D483" strokeWidth="2" />
    <path d="M 28 57 L 14 24 Q 13 13 28 10 Q 43 13 42 24 Z" fill="#11141A" stroke="#FFF0BB" strokeWidth="1.2" />
    <path d="M 28 12 L 28 55" stroke="#697078" strokeWidth="1" />
  </svg>;
}

function PrizeMark({ color, cx, cy, type }: { color: string; cx: number; cy: number; type: PublicWheelPrize["prizeType"] }) {
  if (type === "PHYSICAL_PRIZE") return <g><rect fill="url(#web-wheel-rim)" height="15" rx="3" stroke="#C99D45" strokeWidth="1" width="28" x={cx - 14} y={cy - 8} /><path d={`M ${cx - 11} ${cy - 3} L ${cx + 10} ${cy - 3}`} stroke="#737980" strokeWidth="1" /></g>;
  if (type === "WALLET_CREDIT") return <g><rect fill="none" height="17" rx="3" stroke={color} strokeWidth="2" width="26" x={cx - 13} y={cy - 8.5} /><path d={`M ${cx + 3} ${cy - 3} L ${cx + 15} ${cy - 3} L ${cx + 15} ${cy + 4} L ${cx + 3} ${cy + 4} Z`} fill="url(#web-wheel-gold)" stroke={color} strokeWidth="1" /><circle cx={cx + 8} cy={cy + .5} fill="#16191D" r="1.5" /></g>;
  if (type === "EXTRA_SPIN") return <g><circle cx={cx} cy={cy} fill="none" r="11" stroke={color} strokeWidth="1.8" /><path d={`M ${cx - 5} ${cy - 7} A 8 8 0 1 1 ${cx + 7} ${cy + 4} M ${cx + 7} ${cy + 4} L ${cx + 7} ${cy - 2} M ${cx + 7} ${cy + 4} L ${cx + 1} ${cy + 4}`} fill="none" stroke="url(#web-wheel-gold)" strokeLinecap="round" strokeWidth="2.4" /></g>;
  if (type === "PERCENTAGE_DISCOUNT") return <text fill={color} fontSize="23" fontWeight="800" textAnchor="middle" x={cx} y={cy + 8}>٪</text>;
  return <g><path d={`M ${cx - 14} ${cy - 7} L ${cx + 14} ${cy - 7} L ${cx + 11} ${cy + 8} L ${cx - 11} ${cy + 8} Z`} fill="url(#web-wheel-gold)" stroke={color} strokeWidth="1" /><circle cx={cx - 8} cy={cy} fill="#2B210E" r="1.5" /><circle cx={cx + 8} cy={cy} fill="#2B210E" r="1.5" /></g>;
}

function Feature({ icon: Icon, title, text }: { icon: typeof ShieldCheck; title: string; text: string }) {
  return <div className="flex gap-3 rounded-2xl border border-border bg-card/55 p-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span><div><h3 className="text-sm font-bold">{title}</h3><p className="mt-1 text-xs leading-6 text-muted-foreground">{text}</p></div></div>;
}

function ResultIcon({ type }: { type: WheelSpinResult["prize"]["prizeType"] }) {
  if (type === "WALLET_CREDIT") return <Coins className="size-10" />;
  if (type === "FIXED_DISCOUNT" || type === "PERCENTAGE_DISCOUNT") return <TicketPercent className="size-10" />;
  if (type === "EXTRA_SPIN") return <RotateCw className="size-10" />;
  return <Trophy className="size-10" />;
}

function polar(cx: number, cy: number, radius: number, degrees: number) {
  const angle = degrees * Math.PI / 180;
  return { x: stableNumber(cx + radius * Math.cos(angle)), y: stableNumber(cy + radius * Math.sin(angle)) };
}

function stableNumber(value: number) {
  return Math.round(value * 10_000) / 10_000;
}

function wedgePath(cx: number, cy: number, radius: number, start: number, end: number) {
  const from = polar(cx, cy, radius, start);
  const to = polar(cx, cy, radius, end);
  return `M ${cx} ${cy} L ${from.x} ${from.y} A ${radius} ${radius} 0 0 1 ${to.x} ${to.y} Z`;
}

function prizeLabelLines(value: string, maxCharacters = 10, maxLines = 4) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines: string[] = [];
  for (const word of words) {
    const current = lines.at(-1);
    if (!current || current.length + 1 + word.length > maxCharacters) lines.push(word);
    else lines[lines.length - 1] = `${current} ${word}`;
  }
  if (lines.length <= maxLines) return lines;
  const visible = lines.slice(0, maxLines);
  visible[maxLines - 1] = `${visible[maxLines - 1]}…`;
  return visible;
}

function eligibilityMessageFa(code: string) {
  const labels: Record<string, string> = { DAILY_LIMIT: "سقف چرخش امروز تکمیل شده", GLOBAL_LIMIT: "ظرفیت کمپین تکمیل شده", NO_SPINS: "فعلاً شانس فعالی ندارید", USER_LIMIT: "سقف شانس این کمپین تکمیل شده", VERIFY_EMAIL: "ابتدا ایمیل را تأیید کنید", VERIFY_MOBILE: "ابتدا موبایل را تأیید کنید" };
  return labels[code] ?? "امکان چرخش وجود ندارد";
}
