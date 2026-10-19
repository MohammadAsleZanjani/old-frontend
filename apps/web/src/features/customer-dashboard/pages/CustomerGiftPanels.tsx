"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock3, Coins, Gift, Inbox, Loader2, PackageCheck, Send, ShieldCheck, Sparkles, Undo2, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { ProductImage } from "@/domains/catalog/ProductImage";
import { cancelGift, createGift, getGiftOverview, getGiftProducts, type GiftItem, type GiftOverview, type GiftProduct, type GiftStatus, type GiftType } from "@/domains/gifts/gifts-api";
import { useI18n } from "@/shared/i18n";
import { formatPlatformDate } from "@/shared/lib/date-format";
import { formatMobileDisplay, isValidIranianMobile, normalizeIranianMobileInput, toLatinDigits } from "@/shared/lib/phone-format";
import { cn } from "@/shared/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { toast } from "@/shared/ui/sonner";
import { Textarea } from "@/shared/ui/textarea";

type GiftPageMode = "overview" | "received" | "send";

export function CustomerGiftPanel({ pathname }: { pathname: string }) {
  const { lang } = useI18n();
  const mode: GiftPageMode = pathname.endsWith("/send") ? "send" : pathname.endsWith("/received") ? "received" : "overview";
  const queryClient = useQueryClient();
  const overview = useQuery({ queryFn: getGiftOverview, queryKey: ["customer-gifts"], retry: 1 });
  const cancel = useMutation({
    mutationFn: cancelGift,
    onError: (error) => toast.error(error instanceof Error ? error.message : "لغو هدیه انجام نشد."),
    onSuccess: () => {
      toast.success("هدیه لغو شد و موجودی نقره به کیف پول بازگشت.");
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["customer-gifts"] }),
        queryClient.invalidateQueries({ queryKey: ["silver-dashboard-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["gift-products"] }),
      ]);
    },
  });

  if (overview.isLoading) return <div className="space-y-4"><ShadowSkeleton className="h-44 rounded-2xl" /><ShadowSkeleton className="h-96 rounded-2xl" /></div>;
  if (overview.isError || !overview.data) return <Alert variant="destructive"><AlertTitle>هدیه‌ها در دسترس نیستند</AlertTitle><AlertDescription>{overview.error?.message ?? "دریافت اطلاعات هدیه انجام نشد."}</AlertDescription></Alert>;

  const cancelItem = (gift: GiftItem) => {
    if (window.confirm(`هدیه ${gift.giftNumber} لغو شود و موجودی رزروشده بازگردد؟`)) cancel.mutate(gift.id);
  };

  return <div className="space-y-5">
    <GiftHero data={overview.data} mode={mode} />
    {mode === "overview" ? <GiftOverviewPanel data={overview.data} onCancel={cancelItem} cancellingId={cancel.isPending ? cancel.variables : undefined} /> : null}
    {mode === "send" ? <GiftSendPanel data={overview.data} onCancel={cancelItem} cancellingId={cancel.isPending ? cancel.variables : undefined} /> : null}
    {mode === "received" ? <GiftHistory direction="received" items={overview.data.received} lang={lang} /> : null}
  </div>;
}

function GiftHero({ data, mode }: { data: GiftOverview; mode: GiftPageMode }) {
  const title = mode === "send" ? "ارسال یک هدیه نقره‌ای" : mode === "received" ? "هدیه‌های دریافتی" : "هدیه‌های نقره‌لند";
  const description = mode === "send"
    ? data.sendGiftEnabled ? "مقداری نقره یا یک محصول پلمب‌شده را با شماره موبایل برای دوستتان بفرستید." : "ارسال هدیه در حال حاضر موقتاً غیرفعال است."
    : mode === "received"
      ? "هدیه‌های فعال، در انتظار احراز هویت و محصولات آماده تحویل را اینجا ببینید."
      : "ارسال و دریافت امن نقره؛ حتی اگر گیرنده هنوز عضو نقره‌لند نباشد.";
  return <section className="relative overflow-hidden rounded-3xl border border-fuchsia-500/20 bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,.16),transparent_42%),linear-gradient(135deg,rgba(245,158,11,.10),rgba(255,255,255,.02))] p-6 shadow-[0_28px_90px_-58px_var(--glow)]">
    <div className="pointer-events-none absolute -start-12 -top-12 size-40 rounded-full bg-primary/10 blur-3xl" />
    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-4"><span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-rose-500 text-white shadow-lg shadow-fuchsia-500/20"><Gift className="size-7" /></span><div><Badge className="mb-2 border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-700" variant="outline"><Sparkles className="size-3.5" /> هدیه امن</Badge><h2 className="text-2xl font-black md:text-3xl">{title}</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p></div></div>
      <div className="grid min-w-64 grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur"><div><p className="text-xs text-muted-foreground">موجودی قابل هدیه</p><strong className="mt-1 block text-xl text-primary">{formatGram(data.silverBalance)}</strong></div><div><p className="text-xs text-muted-foreground">وضعیت ارسال</p><strong className={cn("mt-1 block text-sm", !data.sendGiftEnabled ? "text-destructive" : data.kycStatus === "APPROVED" ? "text-emerald-600" : "text-amber-600")}>{!data.sendGiftEnabled ? "غیرفعال" : data.kycStatus === "APPROVED" ? "فعال" : "نیازمند احراز هویت"}</strong></div></div>
    </div>
    <div className="relative mt-5 flex flex-wrap gap-2"><Button asChild size="sm" variant={mode === "overview" ? "default" : "outline"}><Link href="/user/gifts"><Gift className="size-4" />همه هدیه‌ها</Link></Button>{data.sendGiftEnabled ? <Button asChild size="sm" variant={mode === "send" ? "default" : "outline"}><Link href="/user/gifts/send"><Send className="size-4" />ارسال هدیه</Link></Button> : <Button disabled size="sm" variant="outline"><Send className="size-4" />ارسال هدیه</Button>}<Button asChild size="sm" variant={mode === "received" ? "default" : "outline"}><Link href="/user/gifts/received"><Inbox className="size-4" />دریافتی‌ها</Link></Button></div>
  </section>;
}

function GiftOverviewPanel({ cancellingId, data, onCancel }: { cancellingId?: string; data: GiftOverview; onCancel: (gift: GiftItem) => void }) {
  const pendingReceived = data.received.filter((gift) => gift.status === "PENDING_KYC" || gift.status === "PENDING_REGISTRATION").length;
  const readyProducts = data.received.filter((gift) => gift.status === "AVAILABLE" && gift.type === "SILVER_PRODUCT").length;
  return <>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <GiftStat icon={Send} label="هدیه‌های ارسالی" tone="violet" value={data.sent.length} />
      <GiftStat icon={Inbox} label="هدیه‌های دریافتی" tone="cyan" value={data.received.length} />
      <GiftStat icon={Clock3} label="در انتظار فعال‌سازی" tone="amber" value={pendingReceived} />
      <GiftStat icon={PackageCheck} label="محصول آماده دریافت" tone="emerald" value={readyProducts} />
    </section>
    <section className="grid gap-5 xl:grid-cols-2">
      <GiftHistory allowSend={data.sendGiftEnabled} compact cancellingId={cancellingId} direction="sent" items={data.sent.slice(0, 4)} lang="fa" onCancel={onCancel} />
      <GiftHistory compact direction="received" items={data.received.slice(0, 4)} lang="fa" />
    </section>
  </>;
}

function GiftStat({ icon: Icon, label, tone, value }: { icon: typeof Gift; label: string; tone: "amber" | "cyan" | "emerald" | "violet"; value: number }) {
  const styles = { amber: "from-amber-500/15 text-amber-600", cyan: "from-cyan-500/15 text-cyan-600", emerald: "from-emerald-500/15 text-emerald-600", violet: "from-violet-500/15 text-violet-600" }[tone];
  return <Card className={cn("overflow-hidden border-border bg-gradient-to-br to-card", styles.split(" ")[0])}><CardContent className="flex items-center gap-4 p-5"><span className={cn("grid size-11 place-items-center rounded-xl bg-muted/70", styles.split(" ")[1])}><Icon className="size-5" /></span><div><p className="text-xs text-muted-foreground">{label}</p><strong className="mt-1 block text-2xl font-black">{value.toLocaleString("fa-IR")}</strong></div></CardContent></Card>;
}

function GiftSendPanel({ cancellingId, data, onCancel }: { cancellingId?: string; data: GiftOverview; onCancel: (gift: GiftItem) => void }) {
  const { lang } = useI18n();
  const queryClient = useQueryClient();
  const [type, setType] = useState<GiftType>("SILVER_AMOUNT");
  const [recipientMobile, setRecipientMobile] = useState("");
  const [silverGrams, setSilverGrams] = useState("");
  const [productId, setProductId] = useState("");
  const [message, setMessage] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const idempotencyKey = useRef(crypto.randomUUID());
  const products = useQuery({ enabled: data.sendGiftEnabled, queryFn: () => getGiftProducts(lang), queryKey: ["gift-products", lang], retry: 1 });
  const availableProducts = (products.data ?? []).filter(isGiftProductAvailable);
  const selectedProduct = availableProducts.find((product) => product.id === productId);
  const quote = productQuote(selectedProduct);
  const amount = Number(silverGrams || 0);
  const required = type === "SILVER_AMOUNT" ? amount : quote.total;
  const balance = toNumber(data.silverBalance);
  const ownMobile = formatMobileDisplay(data.mobile);
  const mobileValid = isValidIranianMobile(recipientMobile);
  const canReview = data.sendGiftEnabled && data.kycStatus === "APPROVED" && data.mobileVerified && mobileValid && recipientMobile !== ownMobile && required >= 0.001 && required <= balance && (type === "SILVER_AMOUNT" || Boolean(selectedProduct));
  const resetAttempt = () => { idempotencyKey.current = crypto.randomUUID(); setReviewing(false); };
  const submit = useMutation({
    mutationFn: () => createGift({
      ...(message.trim() ? { message: message.trim() } : {}),
      ...(type === "SILVER_AMOUNT" ? { silverGrams: amount } : { productId }),
      recipientMobile,
      type,
    }, idempotencyKey.current),
    onError: (error) => toast.error(error instanceof Error ? error.message : "ارسال هدیه انجام نشد."),
    onSuccess: () => {
      toast.success("هدیه ثبت شد و پیامک اطلاع‌رسانی برای گیرنده ارسال می‌شود.");
      setRecipientMobile(""); setSilverGrams(""); setProductId(""); setMessage(""); setReviewing(false); idempotencyKey.current = crypto.randomUUID();
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["customer-gifts"] }),
        queryClient.invalidateQueries({ queryKey: ["silver-dashboard-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["gift-products"] }),
      ]);
    },
  });

  if (!data.sendGiftEnabled) {
    return <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
      <Alert className="border-amber-500/35 bg-amber-500/10">
        <Clock3 className="size-5 text-amber-600" />
        <AlertTitle>ارسال هدیه موقتاً غیرفعال است</AlertTitle>
        <AlertDescription>در حال حاضر امکان ثبت هدیه جدید وجود ندارد. هدیه‌های قبلی شما محفوظ هستند و همچنان می‌توانید موارد در انتظار را لغو کنید.</AlertDescription>
      </Alert>
      <GiftHistory allowSend={false} cancellingId={cancellingId} direction="sent" items={data.sent} lang={lang} onCancel={onCancel} />
    </section>;
  }

  return <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
    <Card className="overflow-hidden border-primary/25 bg-card/80 shadow-elegant">
      <CardHeader><CardTitle className="flex items-center gap-2"><Send className="size-5 text-primary" />مشخصات هدیه</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        {data.kycStatus !== "APPROVED" || !data.mobileVerified ? <Alert className="border-amber-500/35 bg-amber-500/10"><ShieldCheck className="size-5 text-amber-600" /><AlertTitle>فعال‌سازی ارسال هدیه</AlertTitle><AlertDescription>برای برداشت امن از موجودی، شماره موبایل و احراز هویت فرستنده باید تأیید شده باشد. <Link className="font-bold text-primary" href="/user/profile">تکمیل احراز هویت</Link></AlertDescription></Alert> : null}
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted/55 p-1.5"><button className={cn("flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition", type === "SILVER_AMOUNT" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")} onClick={() => { setType("SILVER_AMOUNT"); resetAttempt(); }} type="button"><Coins className="size-4" />مقدار نقره</button><button className={cn("flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition", type === "SILVER_PRODUCT" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")} onClick={() => { setType("SILVER_PRODUCT"); resetAttempt(); }} type="button"><PackageCheck className="size-4" />محصول نقره</button></div>
        <label className="block space-y-2"><span className="text-sm font-bold">شماره موبایل گیرنده</span><Input dir="ltr" inputMode="numeric" maxLength={11} onChange={(event) => { setRecipientMobile(normalizeIranianMobileInput(event.target.value)); resetAttempt(); }} placeholder="09121234567" value={recipientMobile} /><span className={cn("block text-xs", recipientMobile && (!mobileValid || recipientMobile === ownMobile) ? "text-destructive" : "text-muted-foreground")}>{recipientMobile && !mobileValid ? "شماره باید با 09 شروع شود و 11 رقم باشد." : recipientMobile === ownMobile ? "نمی‌توانید برای شماره خودتان هدیه بفرستید." : "گیرنده حتی بدون حساب کاربری، پیامک هدیه را دریافت می‌کند."}</span></label>
        {type === "SILVER_AMOUNT" ? <label className="block space-y-2"><span className="text-sm font-bold">مقدار نقره هدیه</span><div className="relative"><Input className="ps-16" dir="ltr" inputMode="decimal" onChange={(event) => { setSilverGrams(normalizeDecimal(event.target.value)); resetAttempt(); }} placeholder="1.500" value={silverGrams} /><span className="absolute start-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">گرم</span></div><span className="block text-xs text-muted-foreground">حداقل مقدار قابل ارسال ۰٫۰۰۱ گرم است.</span></label> : <div className="space-y-3"><p className="text-sm font-bold">انتخاب محصول پلمب‌شده</p>{products.isLoading ? <ShadowSkeleton className="h-56 rounded-2xl" /> : availableProducts.length ? <div className="grid gap-3 sm:grid-cols-2">{availableProducts.map((product) => <GiftProductOption active={product.id === productId} key={product.id} onClick={() => { setProductId(product.id); resetAttempt(); }} product={product} />)}</div> : <Alert><AlertTitle>محصول قابل هدیه موجود نیست</AlertTitle><AlertDescription>در حال حاضر موجودی محصول فیزیکی مناسب هدیه تمام شده است.</AlertDescription></Alert>}</div>}
        <label className="block space-y-2"><span className="text-sm font-bold">پیام همراه هدیه <small className="font-normal text-muted-foreground">(اختیاری)</small></span><Textarea maxLength={240} onChange={(event) => { setMessage(event.target.value); resetAttempt(); }} placeholder="یک پیام کوتاه برای دوستتان بنویسید…" value={message} /></label>
        {required > 0 ? <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4"><div className="flex items-center justify-between gap-4"><span className="text-sm text-muted-foreground">مجموع کسر از کیف پول نقره</span><strong className="text-xl text-primary">{formatGram(required)}</strong></div>{type === "SILVER_PRODUCT" ? <p className="mt-2 text-xs leading-6 text-muted-foreground">شامل {formatGram(quote.weight)} نقره و {formatGram(quote.fee)} کارمزد ساخت؛ هزینه ارسال پستی هنگام ثبت نشانی توسط گیرنده محاسبه می‌شود.</p> : null}</div> : null}
        {required > balance ? <Alert variant="destructive"><AlertTitle>موجودی کافی نیست</AlertTitle><AlertDescription>برای این هدیه {formatGram(required - balance)} نقره بیشتر نیاز دارید.</AlertDescription></Alert> : null}
        {!reviewing ? <Button className="w-full" disabled={!canReview} onClick={() => setReviewing(true)} size="lg"><UserRoundCheck className="size-5" />بررسی نهایی هدیه</Button> : <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/8 p-5"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-600" /><div><p className="font-black">تأیید ارسال به {recipientMobile}</p><p className="mt-1 text-sm leading-7 text-muted-foreground">{type === "SILVER_AMOUNT" ? formatGram(amount) : selectedProduct?.title} با کسر {formatGram(required)} از موجودی شما ارسال می‌شود.</p></div></div><div className="mt-4 flex flex-col gap-2 sm:flex-row"><Button className="flex-1" disabled={submit.isPending} onClick={() => submit.mutate()}>{submit.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}تأیید و ارسال هدیه</Button><Button disabled={submit.isPending} onClick={() => setReviewing(false)} variant="outline">ویرایش</Button></div></div>}
      </CardContent>
    </Card>
    <div className="space-y-5">
      <Card className="border-border bg-card/70"><CardHeader><CardTitle className="text-lg">چطور دریافت می‌شود؟</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><GiftStep icon={Send} text="پس از ثبت، موجودی هدیه به‌صورت امن رزرو می‌شود." /><GiftStep icon={Inbox} text="گیرنده با شماره 09… پیامک اطلاع‌رسانی دریافت می‌کند." /><GiftStep icon={ShieldCheck} text="اگر عضو نباشد، هدیه پس از ثبت‌نام و تأیید احراز هویت آزاد می‌شود." /><GiftStep icon={PackageCheck} text="محصول هدیه‌شده پس از ثبت نشانی به گیرنده ارسال می‌شود." /></CardContent></Card>
      <GiftHistory compact cancellingId={cancellingId} direction="sent" items={data.sent.slice(0, 5)} lang={lang} onCancel={onCancel} />
    </div>
  </section>;
}

function GiftProductOption({ active, onClick, product }: { active: boolean; onClick: () => void; product: GiftProduct }) {
  const quote = productQuote(product);
  const image = product.cover || product.images?.[0]?.url;
  return <button aria-pressed={active} className={cn("overflow-hidden rounded-2xl border bg-card text-start transition", active ? "border-primary ring-2 ring-primary/15" : "border-border hover:border-primary/40")} onClick={onClick} type="button"><div className="h-32 bg-muted/40"><ProductImage alt={product.title} fit="contain" src={image} /></div><div className="p-3"><p className="line-clamp-2 font-bold">{product.title}</p><p className="mt-2 text-xs text-muted-foreground">{formatGram(quote.weight)} · هزینه {formatGram(quote.total)}</p><p className="mt-1 text-[11px] text-emerald-600">{Number(product.silver?.stockQuantity ?? product.stockQuantity ?? 0).toLocaleString("fa-IR")} عدد موجود</p></div></button>;
}

function GiftStep({ icon: Icon, text }: { icon: typeof Gift; text: string }) {
  return <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></span><p className="leading-7 text-muted-foreground">{text}</p></div>;
}

function GiftHistory({ allowSend = true, cancellingId, compact = false, direction, items, lang, onCancel }: { allowSend?: boolean; cancellingId?: string; compact?: boolean; direction: "received" | "sent"; items: GiftItem[]; lang: string; onCancel?: (gift: GiftItem) => void }) {
  const title = direction === "received" ? "هدیه‌های دریافتی" : "هدیه‌های ارسالی";
  return <Card className="border-border bg-card/75">
    <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2 text-lg">{direction === "received" ? <Inbox className="size-5 text-cyan-600" /> : <Send className="size-5 text-violet-600" />}{title}</CardTitle>{compact ? <Button asChild size="sm" variant="ghost"><Link href={direction === "received" ? "/user/gifts/received" : "/user/gifts/send"}>مشاهده همه</Link></Button> : null}</CardHeader>
    <CardContent className="space-y-3">
      {items.length ? items.map((gift) => <GiftRow cancelling={cancellingId === gift.id} direction={direction} gift={gift} key={gift.id} lang={lang} onCancel={onCancel} />) : <div className="rounded-2xl border border-dashed border-border py-12 text-center"><Gift className="mx-auto size-10 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">هنوز هدیه‌ای در این بخش ندارید.</p>{direction === "sent" && allowSend ? <Button asChild className="mt-4" size="sm"><Link href="/user/gifts/send">ارسال اولین هدیه</Link></Button> : null}</div>}
    </CardContent>
  </Card>;
}

function GiftRow({ cancelling, direction, gift, lang, onCancel }: { cancelling: boolean; direction: "received" | "sent"; gift: GiftItem; lang: string; onCancel?: (gift: GiftItem) => void }) {
  const content = gift.type === "SILVER_AMOUNT" ? formatGram(gift.silverGrams) : gift.productTitle ?? "محصول نقره";
  const mobile = formatMobileDisplay(direction === "received" ? gift.senderMobile : gift.recipientMobile);
  const person = direction === "received" ? fullName(gift.sender?.profile) : fullName(gift.recipientUser?.profile);
  const image = gift.product?.images?.[0]?.url;
  const cancellable = gift.status === "PENDING_KYC" || gift.status === "PENDING_REGISTRATION";
  return <article className="rounded-2xl border border-border bg-background/35 p-4 transition hover:border-primary/25">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-fuchsia-500/15 to-cyan-500/15 text-primary">{image ? <ProductImage alt={content} className="size-full" fit="contain" src={image} /> : gift.type === "SILVER_AMOUNT" ? <Coins className="size-6" /> : <Gift className="size-6" />}</div>
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-black">{content}</h3><p className="mt-1 text-xs text-muted-foreground">{gift.giftNumber} · {formatPlatformDate(gift.createdAt, { dateStyle: "medium", timeStyle: "short" }, lang)}</p></div><GiftStatusBadge status={gift.status} /></div><p className="mt-3 text-sm text-muted-foreground">{direction === "received" ? "فرستنده" : "گیرنده"}: <strong className="text-foreground" dir="ltr">{person ? `${person} · ${mobile}` : mobile}</strong></p>{gift.message ? <blockquote className="mt-3 rounded-xl border-s-4 border-primary/40 bg-muted/45 px-4 py-3 text-sm leading-7">{gift.message}</blockquote> : null}</div>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">{direction === "received" && gift.type === "SILVER_PRODUCT" && gift.status === "AVAILABLE" ? <Button asChild size="sm"><Link href={`/user/delivery?gift=${encodeURIComponent(gift.id)}&product=${encodeURIComponent(gift.productId ?? "")}`}><PackageCheck className="size-4" />ثبت نشانی و دریافت محصول</Link></Button> : null}{direction === "received" && gift.deliveryRequest ? <Button asChild size="sm" variant="outline"><Link href="/user/delivery/tracking"><Clock3 className="size-4" />پیگیری ارسال {gift.deliveryRequest.requestNumber}</Link></Button> : null}{direction === "sent" && cancellable && onCancel ? <Button disabled={cancelling} onClick={() => onCancel(gift)} size="sm" variant="outline">{cancelling ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />}لغو و بازگشت موجودی</Button> : null}</div>
  </article>;
}

function GiftStatusBadge({ status }: { status: GiftStatus }) {
  const meta: Record<GiftStatus, { className: string; label: string }> = {
    AVAILABLE: { className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700", label: "آماده دریافت" },
    CANCELLED: { className: "border-border bg-muted text-muted-foreground", label: "لغوشده" },
    COMPLETED: { className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700", label: "تکمیل‌شده" },
    DELIVERY_REQUESTED: { className: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700", label: "در حال ارسال" },
    PENDING_KYC: { className: "border-amber-500/30 bg-amber-500/10 text-amber-700", label: "در انتظار احراز هویت" },
    PENDING_REGISTRATION: { className: "border-violet-500/30 bg-violet-500/10 text-violet-700", label: "در انتظار ثبت‌نام" },
  };
  return <Badge className={meta[status].className} variant="outline">{meta[status].label}</Badge>;
}

function isGiftProductAvailable(product: GiftProduct) {
  const stock = Number(product.silver?.stockQuantity ?? product.stockQuantity ?? 0);
  return Boolean(product.id && product.silver?.formFactor && Number(product.silver.weightGrams ?? 0) > 0 && stock > 0);
}

function productQuote(product?: GiftProduct) {
  const weight = toNumber(product?.silver?.weightGrams);
  const fee = Math.ceil(weight * toNumber(product?.silver?.productFeePercent) / 100 * 1_000) / 1_000;
  return { fee, total: weight + fee, weight };
}

function normalizeDecimal(value: string) {
  const normalized = toLatinDigits(value).replace(/[٫,]/g, ".").replace(/[^\d.]/g, "");
  const [whole = "", ...fraction] = normalized.split(".");
  return fraction.length ? `${whole}.${fraction.join("").slice(0, 3)}` : whole;
}

function formatGram(value: unknown) {
  const amount = Math.round(toNumber(value) * 1_000) / 1_000;
  return `${amount.toLocaleString("fa-IR", { maximumFractionDigits: 3 })} گرم`;
}

function toNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fullName(profile?: { firstName?: string | null; lastName?: string | null } | null) {
  return [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim();
}
