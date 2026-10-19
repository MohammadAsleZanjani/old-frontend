"use client";

import Image from "next/image";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  Bell,
  BadgeCheck,
  Banknote,
  BarChart3,
  Apple,
  Boxes,
  ChevronDown,
  ChevronLeft,
  CircleCheck,
  Coins,
  FileCheck2,
  Gift,
  Headphones,
  Home,
  Languages,
  Lock,
  LogOut,
  Menu,
  Moon,
  PackageCheck,
  Percent,
  Mail,
  User,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Sun,
  Truck,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead } from "@/domains/notifications/notifications-api";
import { ProductImage } from "@/domains/catalog/ProductImage";
import { getProducts } from "@/domains/catalog/products-api";
import { formatPrice, productCategoryLabel } from "@/domains/catalog/products-data";
import { getCart } from "@/domains/commerce/commerce-api";
import { useAuth } from "@/shared/auth/AuthProvider";
import { languageLabel, languageShortLabel, useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { formatMobileDisplay } from "@/shared/lib/date-format";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { BrandLogo } from "@/shared/ui/brand-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { createSilverOrder, getSilverOverview, getSilverPrice, getSilverPriceHistory, type DashboardOverview, type SilverPrice } from "./api";
import { createChartPolyline } from "./chart-utils";
import { getPublicBlogPost, getPublicBlogPosts, getPublicCmsPage, submitPublicBlogComment, type PublicBlogPost, type PublicCmsPage, type PublicContactChannel } from "./content-api";
import { formatGram, formatJalaliDate, formatToman, toPersianDigits } from "./format";
import { PriceUpdateMeta } from "./price-time";

const navItems = [
  { href: "/", icon: Home, label: "خانه" },
  { href: "/products", icon: Boxes, label: "محصولات نقره" },
  { href: "/wheel", icon: Gift, label: "گردونه شانس" },
  { href: "/user/buy-silver", icon: ArrowLeftRight, label: "خرید و فروش" },
  { href: "/user/delivery", icon: Truck, label: "تحویل فیزیکی" },
];

const MOBILE_WEB_APP_URL = "https://m.noghre.land";
const OFFICIAL_CONTACTS: PublicContactChannel[] = [
  { href: "tel:+982191550859", key: "support-phone", label: "تلفن پشتیبانی", type: "phone", value: "021-9155-0859" },
  { href: "mailto:info@noghre.land", key: "support-email", label: "ایمیل", type: "email", value: "info@noghre.land" },
  {
    key: "operations-address",
    label: "مرکز عملیات",
    type: "address",
    value: "تهران، خیابان ولیعصر، بالاتر از پارک ساعی، نبش کوچه همسایگان، پلاک ۲۴۲۸، طبقه دوم",
  },
];

const noghreLandNavItems = [
  { href: "/fees", label: "کارمزدها" },
  { href: "/blog", label: "آموزش" },
  { href: "/faq", label: "سوالات متداول" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
];

const footerTrustImages = [
  {
    alt: "نماد اعتماد الکترونیکی",
    code: "AQg6tmmdxEIo3iwJv31uqoyzC5UBl3Zn",
    href: "https://trustseal.enamad.ir/?id=775299&Code=AQg6tmmdxEIo3iwJv31uqoyzC5UBl3Zn",
    src: "https://trustseal.enamad.ir/logo.aspx?id=775299&Code=AQg6tmmdxEIo3iwJv31uqoyzC5UBl3Zn",
  },
  {
    alt: "نقره",
    href: "/",
    src: "/assets/trust/noghre.png",
  },
];

export function SilverShell({ children }: { children: ReactNode }) {
  return <SiteChrome><main>{children}</main></SiteChrome>;
}

export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      {children}
      <Footer />
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const { dir } = useI18n();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);
  return (
    <>
      <header className="sticky top-0 z-50 w-full glass-strong border-b border-border/60">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label="نقره - صفحه اصلی">
          <BrandLogo priority className="h-14 w-14 transition duration-300 hover:scale-105 sm:h-[4.25rem] sm:w-[4.25rem]" />
        </Link>
        <nav className="hidden items-center gap-0.5 xl:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href as Route}
              className={`rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                pathname === item.href ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <DropdownMenu dir={dir}>
            <DropdownMenuTrigger asChild>
              <button
                className={`flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                  noghreLandNavItems.some((item) => pathname === item.href)
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                }`}
                type="button"
              >
                نقره لند <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 text-start">
              {noghreLandNavItems.map((item) => (
                <DropdownMenuItem asChild key={item.href}>
                  <Link className="w-full text-start" href={item.href as Route}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageMenu />
          <ThemeToggle />
          <NotificationMenu />
          <HeaderCart />
          <AuthMenuActions />
          <button aria-controls="mobile-site-menu" aria-expanded={open} className="grid h-10 w-10 place-items-center rounded-xl border border-transparent transition hover:border-border hover:bg-accent xl:hidden" onClick={() => setOpen((value) => !value)} aria-label={open ? "بستن منو" : "بازکردن منو"}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        </div>
      </header>
      {open ? (
        <div className="fixed inset-x-0 bottom-0 top-20 z-40 overflow-y-auto border-t border-border/70 bg-background/98 shadow-2xl backdrop-blur-xl xl:hidden" id="mobile-site-menu">
          <div className="mx-auto flex min-h-full max-w-2xl flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 sm:px-6">
            <nav aria-label="منوی اصلی موبایل" className="grid grid-cols-2 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href as Route} onClick={() => setOpen(false)} className={cn("flex min-h-14 items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition", pathname === item.href ? "border-primary/35 bg-primary/10 text-foreground" : "border-border/70 bg-card/60 text-muted-foreground hover:border-primary/30 hover:bg-accent hover:text-foreground")}>
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-background shadow-sm"><Icon className="size-4" /></span>
                    <span className="min-w-0 text-start leading-5">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <section className="mt-5" aria-labelledby="mobile-noghre-land-title">
              <div className="mb-2 flex items-center gap-2 px-1"><span className="h-px flex-1 bg-border" /><h2 className="text-xs font-bold text-muted-foreground" id="mobile-noghre-land-title">نقره لند</h2><span className="h-px flex-1 bg-border" /></div>
              <div className="grid grid-cols-2 gap-1.5">
                {noghreLandNavItems.map((item) => (
                  <Link key={item.href} href={item.href as Route} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-center text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground">
                    {item.label}
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-auto pt-5" aria-labelledby="mobile-quick-tools-title">
              <div className="rounded-2xl border border-border/70 bg-card/70 p-3 shadow-elegant">
                <h2 className="mb-3 px-1 text-xs font-bold text-muted-foreground" id="mobile-quick-tools-title">تنظیمات و دسترسی سریع</h2>
                <div className="grid grid-cols-2 gap-2">
                  <LanguageMenu mobile />
                  <ThemeToggle mobile />
                  <NotificationMenu mobile />
                  <HeaderCart mobile />
                </div>
                <AuthMenuActions mobile />
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </>
  );
}

function HeaderCart({ mobile = false }: { mobile?: boolean }) {
  const { user } = useAuth();
  const { lang } = useI18n();
  const cart = useQuery({
    enabled: Boolean(user),
    queryFn: () => getCart(),
    queryKey: ["commerce-cart"],
    staleTime: 15_000,
  });
  const count = (cart.data?.items ?? []).reduce((total, item) => total + Number(item.quantity || 0), 0);
  const label = translateUiText("Cart", lang);
  return (
    <Button asChild className={mobile ? "min-h-16 w-full justify-start gap-3 rounded-xl border border-border/70 bg-background/70 px-3 text-start hover:border-primary/30" : "relative rounded-lg"} size={mobile ? "default" : "icon"} variant="ghost">
      <Link href="/cart" aria-label={label}>
        <ShoppingCart className={mobile ? "size-5 shrink-0 text-primary" : "h-4 w-4"} />
        {mobile ? <span className="min-w-0 flex-1 text-start"><span className="block text-sm font-bold">{label}</span><span className="mt-0.5 block text-[11px] text-muted-foreground">{count > 0 ? `${toPersianDigits(count)} کالا` : "سبد خالی"}</span></span> : null}
        {count > 0 ? <span className={mobile ? "ms-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground" : "absolute -end-1 -top-1 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-5 text-primary-foreground"}>{toPersianDigits(count)}</span> : null}
      </Link>
    </Button>
  );
}

function ThemeToggle({ mobile = false }: { mobile?: boolean }) {
  const { theme, toggleTheme } = useI18n();
  const isDark = theme === "dark";
  return (
    <Button
      className={mobile ? "min-h-16 w-full justify-start gap-3 rounded-xl border border-border/70 bg-background/70 px-3 text-start hover:border-primary/30" : "hidden rounded-lg sm:inline-flex"}
      onClick={toggleTheme}
      size={mobile ? "default" : "icon"}
      type="button"
      variant="ghost"
      aria-label={isDark ? "فعال کردن حالت روشن" : "فعال کردن حالت تاریک"}
    >
      {isDark ? <Sun className={mobile ? "size-5 shrink-0 text-primary" : "h-4 w-4"} /> : <Moon className={mobile ? "size-5 shrink-0 text-primary" : "h-4 w-4"} />}
      {mobile ? <span className="min-w-0 flex-1 text-start"><span className="block text-sm font-bold">حالت نمایش</span><span className="mt-0.5 block text-[11px] text-muted-foreground">اکنون {isDark ? "تاریک" : "روشن"}</span></span> : null}
      <span className="sr-only">{isDark ? "روشن" : "تاریک"}</span>
    </Button>
  );
}

function LanguageMenu({ mobile = false }: { mobile?: boolean }) {
  const { dir, lang, languages, setLang } = useI18n();
  const currentLanguage = languages.find((option) => option.code === lang);
  return (
    <DropdownMenu dir={dir}>
      <DropdownMenuTrigger asChild>
        <Button className={mobile ? "min-h-16 w-full justify-start gap-3 rounded-xl border border-border/70 bg-background/70 px-3 text-start hover:border-primary/30" : "hidden rounded-lg sm:inline-flex"} size={mobile ? "default" : "icon"} variant="ghost" aria-label="تغییر زبان">
          <Languages className={mobile ? "size-5 shrink-0 text-primary" : "h-4 w-4"} />
          {mobile ? <span className="min-w-0 flex-1 text-start"><span className="block text-sm font-bold">زبان</span><span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{currentLanguage ? languageLabel(currentLanguage) : languageShortLabel(lang)}</span></span> : null}
          <span className="sr-only">{languageShortLabel(lang)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 text-start">
        <DropdownMenuLabel>زبان</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {languages.map((option) => (
          <DropdownMenuItem className={option.code === lang ? "bg-accent font-semibold" : ""} key={option.code} onClick={() => setLang(option.code)}>
            <span className="flex-1">{languageLabel(option)}</span>
            <span className="text-xs text-muted-foreground">{languageShortLabel(option.code)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationMenu({ mobile = false }: { mobile?: boolean }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const notifications = useQuery({
    enabled: Boolean(user),
    queryFn: () => getNotifications({ page: 1, pageSize: 6, sortOrder: "desc" }) as Promise<NotificationPage>,
    queryKey: ["header-notifications"],
    retry: 1,
  });
  const unread = useQuery({
    enabled: Boolean(user),
    queryFn: () => getUnreadNotificationCount() as Promise<{ count?: number; unread?: number }>,
    queryKey: ["header-notifications-unread"],
    retry: 1,
  });
  const markOne = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["header-notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["header-notifications-unread"] });
    },
  });
  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["header-notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["header-notifications-unread"] });
    },
  });
  if (!user) return null;
  const count = unread.data?.count ?? unread.data?.unread ?? notifications.data?.items?.filter((item) => item.status === "UNREAD").length ?? 0;
  const items = notifications.data?.items ?? [];
  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button className={`${mobile ? "min-h-16 w-full justify-start gap-3 border border-border/70 bg-background/70 px-3 text-start hover:border-primary/30" : "relative hidden sm:inline-flex"} rounded-xl`} size={mobile ? "default" : "icon"} variant="ghost" aria-label="اعلان‌ها">
          <Bell className={mobile ? "size-5 shrink-0 text-primary" : "h-4 w-4"} />
          {mobile ? <span className="min-w-0 flex-1 text-start"><span className="block text-sm font-bold">اعلان‌ها</span><span className="mt-0.5 block text-[11px] text-muted-foreground">{count ? `${count > 99 ? "۹۹+" : toPersianDigits(count)} خوانده‌نشده` : "پیام جدیدی نیست"}</span></span> : null}
          {count ? <span className={`${mobile ? "ms-auto" : "absolute -end-1 -top-1"} grid min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-5 text-destructive-foreground`}>{count > 99 ? "۹۹+" : toPersianDigits(count)}</span> : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0 text-start">
        <div className="flex items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <DropdownMenuLabel className="p-0 text-base">اعلان‌ها</DropdownMenuLabel>
            <p className="mt-1 text-xs text-muted-foreground">رویدادهای کیف پول، سفارش، تحویل و پشتیبانی</p>
          </div>
          <Badge variant={count ? "destructive" : "outline"}>{toPersianDigits(count)} خوانده‌نشده</Badge>
        </div>
        <div className="max-h-80 overflow-auto p-2">
          {notifications.isLoading ? <div className="p-4 text-sm text-muted-foreground">در حال دریافت اعلان‌ها...</div> : null}
          {!notifications.isLoading && items.length ? items.map((item) => (
            <Link
              className="block rounded-xl p-3 transition hover:bg-accent/70"
              href={(item.actionUrl || "/user/notifications") as Route}
              key={item.id}
              onClick={() => {
                if (item.status === "UNREAD") markOne.mutate(item.id);
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.body}</p>
                </div>
                <Badge variant={item.status === "UNREAD" ? "destructive" : "outline"}>{item.status === "UNREAD" ? "جدید" : "خوانده‌شده"}</Badge>
              </div>
            </Link>
          )) : null}
          {!notifications.isLoading && !items.length ? <div className="p-4 text-sm text-muted-foreground">اعلانی وجود ندارد.</div> : null}
        </div>
        <DropdownMenuSeparator />
        <div className="grid gap-2 p-3 sm:grid-cols-2">
          <Button asChild variant="outline"><Link href="/user/notifications">همه اعلان‌ها</Link></Button>
          <Button disabled={!count || markAll.isPending} onClick={() => markAll.mutate()} variant="outline">خواندن همه</Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function isAdministrativeRole(role: string) {
  return ["SUPER_ADMIN", "ADMIN", "STAFF"].includes(role.trim().replaceAll("-", "_").toUpperCase());
}

function AuthMenuActions({ mobile = false }: { mobile?: boolean }) {
  const { loading, signOut, user } = useAuth();
  if (loading) return <div className={mobile ? "mt-2 h-12 rounded-xl bg-accent/40" : "hidden h-9 w-24 rounded-lg bg-accent/40 sm:block"} />;
  if (!user) {
    return (
      <Link href="/auth" className={`${mobile ? "mt-2 flex min-h-12 w-full" : "hidden sm:inline-flex"} items-center justify-center rounded-xl bg-gradient-gold px-4 py-2 text-sm font-bold text-gold-foreground shadow-elegant hover:shadow-glow`}>
        ورود / ثبت‌نام
      </Link>
    );
  }
  if (mobile) return null;
  const isAdmin = user.roles?.some(isAdministrativeRole);
  const profileName = [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(" ");
  const title = profileName || user.email || formatMobileDisplay(user.mobile) || "کاربر نقره";
  const initials = title.slice(0, 2).toUpperCase();
  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button aria-label="پروفایل کاربر" className="inline-flex rounded-lg" variant="ghost">
          <span className="flex min-w-0 items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-gradient-metallic text-xs text-primary">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden max-w-28 truncate text-sm xl:inline">{title}</span>
          </span>
          <User className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 text-start">
        <DropdownMenuLabel>
          <span className="block truncate">{title}</span>
          {user.email ? <span className="mt-1 block truncate text-xs font-normal text-muted-foreground" dir="ltr">{user.email}</span> : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAdmin ? (
          <>
            <DropdownMenuItem asChild>
              <Link className="font-semibold text-primary" href="/admin">
                <ShieldCheck className="h-4 w-4" />
                داشبورد مدیریت
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem asChild>
          <Link href="/user">داشبورد</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/user/profile">پروفایل</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/user/notifications">اعلان‌ها</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={() => void signOut()}>
          <LogOut className="h-4 w-4" />
          خروج
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface NotificationPage {
  items: Array<{ actionUrl?: string | null; body: string; id: string; status: string; title: string }>;
  total?: number;
}

export function PriceTicker() {
  const { data: price } = useSilverPriceQuery();
  const change = formatPriceChange(price?.change24h);
  const items = [
    ["XAG", "نقره", price?.pricePerGram, change],
    ["BUY", "خرید هر گرم", price?.buyPricePerGram, change],
    ["SELL", "فروش هر گرم", price?.sellPricePerGram, change],
  ];
  return (
    <div className="relative overflow-hidden border-y border-border bg-card/40 backdrop-blur">
      <div className="flex gap-8 whitespace-nowrap py-3 animate-[ticker-ltr_40s_linear_infinite]">
        {[...items, ...items, ...items].map((item, index) => (
          <div key={`${item[0]}-${index}`} className="flex shrink-0 items-center gap-3 text-sm">
            <span className="text-xs font-mono tracking-wider text-muted-foreground">{item[0]}</span>
            <span className="font-semibold">{item[1]}</span>
            <span className="tabular-nums">{item[2] == null ? "در حال دریافت…" : formatToman(item[2])}</span>
            <span className="font-semibold text-success">{item[3]}</span>
            <span className="text-border">•</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function useSilverPriceQuery() {
  return useQuery({
    queryFn: getSilverPrice,
    queryKey: ["silver-price"],
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}

function formatPriceChange(value?: string | number) {
  const change = Number(value);
  if (!Number.isFinite(change)) return "بدون تغییر";
  return `${change > 0 ? "+" : ""}${toPersianDigits(change.toFixed(2))}٪`;
}

export function HomePage() {
  const { data: price } = useSilverPriceQuery();
  return (
    <SilverShell>
      <PriceTicker />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, oklch(0.78 0.13 82 / 0.25), transparent 40%), radial-gradient(circle at 80% 70%, oklch(0.55 0.15 250 / 0.2), transparent 40%)",
          }}
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2 lg:py-28">
          <div className="animate-fade-up">
            <span className="silver-eyebrow">
              <Sparkles className="h-3.5 w-3.5" /> پلتفرم تخصصی فلزات گرانبها
            </span>
            <h1 className="mt-6 text-4xl font-black leading-[1.15] tracking-tight text-white md:text-5xl lg:text-6xl">
              سرمایه‌گذاری هوشمند در نقره، در دستان شما
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              خرید و فروش لحظه‌ای شمش نقره با قیمت شفاف، کیف پول امن، گواهی اصالت، بسته‌بندی پلمب و ارسال پستی بیمه‌شده.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/user/buy-silver" className="inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-6 py-3.5 text-sm font-bold text-gold-foreground shadow-premium hover:shadow-glow">
                <ShoppingCart className="h-4 w-4" /> همین حالا خرید کنید
              </Link>
              <Link href="/user/buy-silver?side=SELL" className="inline-flex items-center gap-2 rounded-xl border border-border glass-strong px-6 py-3.5 text-sm font-semibold text-foreground hover:border-gold/50 hover:bg-accent/70">
                <Banknote className="h-4 w-4" /> فروش فوری
              </Link>
              <Link href="/wheel" className="inline-flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-6 py-3.5 text-sm font-bold text-gold transition hover:bg-gold/20">
                <Gift className="h-4 w-4" /> گردونه شانس
              </Link>
            </div>
          </div>
          <div className="relative animate-fade-up">
            <div className="absolute -inset-8 rounded-full bg-gradient-gold opacity-20 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-premium animate-float">
              <Image src="/assets/silver/hero-silver.jpg" alt="شمش نقره ممتاز" width={1536} height={1024} priority className="h-auto w-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-6 start-4 max-w-[240px] rounded-2xl border border-gold/30 glass-strong p-4 shadow-premium md:start-8">
              <div className="text-xs text-muted-foreground">نقره • هر گرم</div>
              <div className="mt-1 text-2xl font-black tabular-nums text-gradient-gold">
                {price ? formatToman(price.pricePerGram) : "در حال دریافت…"}
              </div>
              <div className="mt-2 text-xs font-semibold text-success">{formatPriceChange(price?.change24h)} امروز</div>
              {price ? <div className="mt-2"><PriceUpdateMeta intervalMinutes={price.syncIntervalMinutes} updatedAt={price.updatedAt} /></div> : null}
            </div>
          </div>
        </div>
      </section>
      <QuickMarketSection price={price} />
      <TrustBadges />
      <FeatureGrid />
      <SilverProductsShowcase />
      <TradingCards price={price} />
      <ProcessSection />
      <VaultSection />
      <DashboardPreview />
      <FaqPreview />
      <InvestmentCta />
      <AppShowcaseSection price={price} />
    </SilverShell>
  );
}

type MarketPeriod = 1 | 7 | 30;

const marketPeriods = [
  [1, "۲۴ ساعت"],
  [7, "هفتگی"],
  [30, "ماهانه"],
] as const satisfies ReadonlyArray<readonly [MarketPeriod, string]>;

function QuickMarketSection({ price }: { price?: SilverPrice }) {
  const [period, setPeriod] = useState<MarketPeriod>(30);
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [toman, setToman] = useState("");
  const [grams, setGrams] = useState("");
  const histories = useQueries({
    queries: marketPeriods.map(([days]) => ({
      queryFn: () => getSilverPriceHistory(days),
      queryKey: ["silver-price-history", days],
      refetchInterval: days === period ? 60_000 : false,
      retry: 1,
      staleTime: 60_000,
    })),
  });
  const history = histories[marketPeriods.findIndex(([days]) => days === period)]!;
  const unitPrice = Number(side === "BUY" ? price?.buyPricePerGram : price?.sellPricePerGram);
  const periodStart = Date.now() - period * 24 * 60 * 60 * 1_000;
  const allPoints = (history.data ?? [])
    .map((item) => ({ at: Date.parse(item.createdAt), value: Number(item.pricePerGram) }))
    .filter((item) => Number.isFinite(item.at) && item.at >= periodStart && Number.isFinite(item.value) && item.value > 0);
  const values = allPoints.map((item) => item.value);
  const linePoints = values.length > 1 ? createChartPolyline(values, { bottom: 84, top: 20 }) : "";
  const current = Number(price?.pricePerGram) || values.at(-1) || 0;
  const change = Number(price?.change24h);
  const positive = !Number.isFinite(change) || change >= 0;

  const syncFromToman = (value: string) => {
    const clean = value.replace(/[^\d]/g, "");
    setToman(clean);
    setGrams(clean && unitPrice > 0 ? (Number(clean) / unitPrice).toFixed(3) : "");
  };
  const syncFromGrams = (value: string) => {
    const clean = value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
    setGrams(clean);
    setToman(clean && unitPrice > 0 ? String(Math.round(Number(clean) * unitPrice)) : "");
  };
  const tradeParams = new URLSearchParams({ side });
  if (grams) tradeParams.set("grams", grams);
  const tradeHref = `/user/buy-silver?${tradeParams.toString()}` as Route;

  return (
    <section className="border-b border-border bg-card/30 py-14 md:py-20" aria-labelledby="quick-market-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="silver-eyebrow"><BarChart3 className="h-3.5 w-3.5" /> بازار در یک نگاه</span>
            <h2 id="quick-market-title" className="mt-4 text-2xl font-black md:text-4xl">نمودار لحظه‌ای و معامله سریع نقره</h2>
          </div>
          <div className="rounded-2xl border border-border bg-background/70 px-5 py-3">
            <div className="text-xs text-muted-foreground">قیمت فعلی هر گرم</div>
            <div className="mt-1 flex items-center gap-3">
              <strong className="text-xl tabular-nums">{price ? formatToman(current) : "در حال دریافت…"}</strong>
              <span className={cn("text-sm font-bold", positive ? "text-success" : "text-destructive")}>{formatPriceChange(price?.change24h)}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
          <div className="overflow-hidden rounded-3xl border border-border bg-background p-5 shadow-elegant md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black">روند قیمت نقره</h3>
                <p className="mt-1 text-xs text-muted-foreground">قیمت هر گرم نقره به تومان</p>
              </div>
              <div className="flex rounded-xl bg-accent/70 p-1" aria-label="بازه نمودار">
                {marketPeriods.map(([days, label]) => (
                  <button
                    className={cn("rounded-lg px-3 py-2 text-xs font-bold transition", period === days ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
                    key={days}
                    onClick={() => setPeriod(days)}
                    type="button"
                    aria-pressed={period === days}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative mt-8 h-72 md:h-80" aria-busy={history.isFetching}>
              <div className="absolute inset-0 grid grid-rows-4">
                {[0, 1, 2, 3].map((line) => <div className="border-t border-dashed border-border/70" key={line} />)}
              </div>
              <svg className="relative h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100" role="img" aria-label="نمودار روند قیمت نقره">
                <defs>
                  <linearGradient id="quickSilverArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.68 0.12 245)" stopOpacity=".32" />
                    <stop offset="100%" stopColor="oklch(0.68 0.12 245)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {linePoints ? <polygon fill="url(#quickSilverArea)" points={`0,100 ${linePoints} 100,100`} /> : null}
                {linePoints ? <polyline fill="none" points={linePoints} stroke="oklch(0.62 0.14 245)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" vectorEffect="non-scaling-stroke" /> : null}
              </svg>
              {history.isFetching && !history.data ? (
                <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground" role="status">در حال دریافت نمودار…</div>
              ) : null}
              {history.isError && !history.data ? (
                <button className="absolute inset-0 m-auto h-fit w-fit rounded-lg border border-border bg-background/90 px-4 py-2 text-xs font-bold" onClick={() => void history.refetch()} type="button">
                  تلاش دوباره برای دریافت نمودار
                </button>
              ) : null}
              {!history.isPending && !history.isError && values.length === 0 ? (
                <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">در این بازه بروزرسانی قیمت ثبت نشده است.</div>
              ) : null}
              {!history.isPending && !history.isError && values.length === 1 ? (
                <div className="absolute inset-x-0 bottom-4 text-center text-xs text-muted-foreground">برای نمایش روند، حداقل دو بروزرسانی لازم است.</div>
              ) : null}
            </div>
            <div className="mt-3 flex justify-between text-[11px] text-muted-foreground">
              <span>{period === 1 ? "۲۴ ساعت قبل" : period === 7 ? "۷ روز قبل" : "۳۰ روز قبل"}</span>
              <span>اکنون</span>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-background p-5 shadow-elegant md:p-7">
            <h3 className="text-xl font-black">خرید و فروش سریع</h3>
            <p className="mt-1 text-sm text-muted-foreground">مقدار معامله را وارد کنید</p>
            <div className="mt-6 grid grid-cols-2 rounded-xl bg-accent/70 p-1">
              {(["BUY", "SELL"] as const).map((value) => (
                <button
                  className={cn("rounded-lg py-3 text-sm font-black transition", side === value ? (value === "BUY" ? "bg-success text-white shadow-sm" : "bg-destructive text-white shadow-sm") : "text-muted-foreground")}
                  key={value}
                  onClick={() => {
                    setSide(value);
                    setToman("");
                    setGrams("");
                  }}
                  type="button"
                  aria-pressed={side === value}
                >
                  {value === "BUY" ? "خرید" : "فروش"}
                </button>
              ))}
            </div>
            <label className="mt-6 block">
              <span className="text-sm font-semibold">مبلغ به تومان</span>
              <span className="mt-2 flex items-center rounded-xl border border-border bg-card px-4 focus-within:border-gold/60">
                <input className="min-w-0 flex-1 bg-transparent py-3.5 text-left font-bold tabular-nums outline-none" dir="ltr" inputMode="numeric" onChange={(event) => syncFromToman(event.target.value)} placeholder="۱,۰۰۰,۰۰۰" value={toman} />
                <span className="text-sm text-muted-foreground">تومان</span>
              </span>
            </label>
            <label className="mt-4 block">
              <span className="text-sm font-semibold">وزن نقره</span>
              <span className="mt-2 flex items-center rounded-xl border border-border bg-card px-4 focus-within:border-gold/60">
                <input className="min-w-0 flex-1 bg-transparent py-3.5 text-left font-bold tabular-nums outline-none" dir="ltr" inputMode="decimal" onChange={(event) => syncFromGrams(event.target.value)} placeholder="۰.۰۰۰" value={grams} />
                <span className="text-sm text-muted-foreground">گرم</span>
              </span>
            </label>
            <div className="mt-5 flex items-center justify-between rounded-xl bg-accent/50 px-4 py-3 text-xs">
              <span className="text-muted-foreground">{side === "BUY" ? "نرخ خرید هر گرم" : "نرخ فروش هر گرم"}</span>
              <strong>{price ? formatToman(unitPrice) : "—"}</strong>
            </div>
            <Button asChild className={cn("mt-5 h-12 w-full rounded-xl text-base font-black", side === "SELL" && "bg-destructive text-white hover:bg-destructive/90")}>
              <Link href={tradeHref}>{side === "BUY" ? "ادامه خرید" : "ادامه فروش"}</Link>
            </Button>
            <p className="mt-3 text-center text-[11px] leading-5 text-muted-foreground">مبلغ نهایی و کارمزد پیش از تأیید سفارش نمایش داده می‌شود.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SilverProductsShowcase() {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const products = useQuery({
    queryFn: () => getProducts(lang),
    queryKey: ["landing-silver-products", lang],
    staleTime: 60_000,
  });
  const items = (products.data ?? []).filter((item) =>
    ["silver-bars", "silver-capsules", "silver-granules"].includes(String(item.category)),
  ).slice(0, 3);
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <SectionHeader title={t("Physical silver products")} subtitle={t("Sealed silver bars, granules and collectibles with authenticity certificates")} />
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {items.map((product) => (
          <Link className="group rounded-2xl border border-border bg-card/70 p-6 shadow-elegant transition hover:-translate-y-1 hover:border-gold/40 hover:shadow-premium" href={`/products/${product.slug}`} key={product.slug}>
            <div className="h-44 overflow-hidden rounded-xl bg-muted">
              <ProductImage alt={product.title[lang]} src={product.cover} />
            </div>
            <Badge className="mt-5" variant="outline">{productCategoryLabel(product, "fa")}</Badge>
            <h3 className="mt-3 text-lg font-black">{product.title[lang]}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">{product.short[lang]}</p>
            <div className="mt-5 flex items-center justify-between">
              <strong className="text-gradient-gold">{formatPrice(product)}</strong>
              <span className="text-sm font-bold">{t("View and order")} ←</span>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-8 text-center"><Button asChild variant="outline"><Link href="/products">{t("View all silver products")}</Link></Button></div>
    </section>
  );
}

function TrustBadges() {
  return (
    <section className="trust-band border-y border-border bg-card/30">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4">
        {[
          { icon: BadgeCheck, label: "گواهی اصالت" },
          { icon: ShieldCheck, label: "خزانه بیمه‌شده" },
          { icon: PackageCheck, label: "بسته پلمب" },
          { icon: Headphones, label: "پشتیبانی ۲۴/۷" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="trust-icon grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-metallic">
              <Icon className="h-5 w-5 text-platinum" />
            </div>
            <span className="text-sm font-semibold">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeatureGrid() {
  const features: { desc: string; icon: LucideIcon; title: string }[] = [
    { desc: "قیمت خرید و فروش بر اساس تنظیمات اسپرد و کارمزد مدیریت می‌شود.", icon: BarChart3, title: "قیمت شفاف و لحظه‌ای" },
    { desc: "موجودی تومان و گرم نقره با تاریخچه کامل تراکنش‌ها.", icon: Wallet, title: "کیف پول تومان و نقره" },
    { desc: "ارسال پستی بیمه‌شده با رهگیری و وضعیت بسته پلمب.", icon: Truck, title: "تحویل فیزیکی" },
    { desc: "فعالیت‌های مهم مالی ثبت می‌شوند و دسترسی به حساب تحت کنترل است.", icon: FileCheck2, title: "امنیت و پیگیری‌پذیری" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <SectionHeader title="تجربه ممتاز خرید و فروش نقره" subtitle="برای سرمایه‌گذارانی که شفافیت، امنیت و نقدشوندگی می‌خواهند" />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ desc, icon: Icon, title }) => (
          <div key={title} className="rounded-2xl glass p-6 transition-all hover:-translate-y-1 hover:shadow-premium">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-gold shadow-glow">
              <Icon className="h-6 w-6 text-gold-foreground" />
            </div>
            <h3 className="mt-5 text-lg font-bold">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TradingCards({ price }: { price?: SilverPrice }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/user/buy-silver" className="trading-card group relative overflow-hidden rounded-3xl bg-gradient-metallic p-8 shadow-elegant transition-all hover:-translate-y-1 hover:shadow-premium md:p-10">
          <div className="trading-card-image absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: "url(/assets/silver/silver-coins.jpg)", backgroundSize: "cover", backgroundPosition: "center" }} />
          <div className="relative max-w-md">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-foreground/10 backdrop-blur">
              <ShoppingCart className="h-7 w-7" />
            </div>
            <h3 className="mt-6 text-3xl font-black">خرید نقره</h3>
            <div className="mt-2 text-xl font-black">{price ? formatToman(price.buyPricePerGram) : "در حال دریافت قیمت…"}</div>
            <p className="silver-card-copy-muted mt-2 max-w-sm">با موجودی کیف پول تومان، نقره را به صورت گرمی بخرید و دارایی خود را در خزانه نگهداری کنید.</p>
            <div className="silver-card-copy-action mt-6 inline-flex items-center gap-2 text-sm font-bold">شروع خرید <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /></div>
          </div>
        </Link>
        <Link href="/user/buy-silver?side=SELL" className="trading-card group relative overflow-hidden rounded-3xl border border-gold/20 bg-gradient-dark p-8 shadow-elegant transition-all hover:-translate-y-1 hover:shadow-premium md:p-10">
          <div className="trading-card-image absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: "url(/assets/silver/hero-silver.jpg)", backgroundSize: "cover", backgroundPosition: "center" }} />
          <div className="relative max-w-md">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gold/20 backdrop-blur">
              <Banknote className="h-7 w-7 text-gold" />
            </div>
            <h3 className="mt-6 text-3xl font-black">فروش نقره</h3>
            <div className="mt-2 text-xl font-black text-gold">{price ? formatToman(price.sellPricePerGram) : "در حال دریافت قیمت…"}</div>
            <p className="silver-card-copy-muted mt-2 max-w-sm">دارایی نقره را با نرخ فروش لحظه‌ای بفروشید و تسویه را در کیف پول تومان دریافت کنید.</p>
            <div className="silver-card-copy-action mt-6 inline-flex items-center gap-2 text-sm font-bold">شروع فروش <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /></div>
          </div>
        </Link>
      </div>
    </section>
  );
}

function ProcessSection() {
  const steps = [
    ["۰۱", "ساخت حساب امن", "با رمز عبور یا کد تأیید یک‌بارمصرف وارد حساب خود شوید."],
    ["۰۲", "تأیید هویت", "مشخصات و مدارک خود را برای بررسی امن کارشناسان ثبت کنید."],
    ["۰۳", "معامله نقره", "ثبت خرید یا فروش با کنترل موجودی، حداقل سفارش و کارمزد."],
    ["۰۴", "نگهداری یا تحویل", "نگهداری در خزانه یا درخواست ارسال پستی بیمه‌شده با کد رهگیری."],
  ];
  return (
    <section className="border-y border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionHeader title="مسیر روشن خرید تا تحویل" subtitle="در هر مرحله می‌دانید دارایی و درخواست شما در چه وضعیتی قرار دارد" />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([n, title, desc]) => (
            <div key={n} className="rounded-2xl border border-border bg-background p-6">
              <div className="text-5xl font-black text-gradient-gold">{n}</div>
              <h3 className="mt-3 font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function VaultSection() {
  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
      <div className="vault-media relative overflow-hidden rounded-3xl shadow-premium">
        <Image src="/assets/silver/vault.jpg" alt="خزانه نگهداری نقره" width={1200} height={800} className="h-full min-h-[420px] w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-5 right-5 left-5 grid gap-3 sm:grid-cols-3">
          {["خزانه بیمه‌شده", "بسته پلمب", "گواهی اصالت"].map((item) => (
            <div key={item} className="vault-badge rounded-xl p-3 text-center text-sm font-bold">{item}</div>
          ))}
        </div>
      </div>
      <div>
        <span className="text-sm font-semibold text-gold">تحویل و نگهداری</span>
        <h2 className="mt-3 text-3xl font-black md:text-4xl">نقره شما فقط یک عدد روی صفحه نیست</h2>
        <p className="mt-5 leading-8 text-muted-foreground">
          برای دارایی نقره، وضعیت گواهی اصالت، بسته پلمب، حداقل قابل تحویل و روش دریافت مشخص است. از زمان ثبت درخواست تا آماده‌سازی یا ارسال، هر تغییر مهم در حساب شما نمایش داده می‌شود.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {[
            [PackageCheck, "وضعیت بسته پلمب"],
            [Truck, "رهگیری ارسال"],
            [FileCheck2, "گواهی اصالت"],
            [Bell, "اعلان لحظه‌ای"],
          ].map(([Icon, label]) => (
            <div key={label as string} className="flex items-center gap-3 rounded-2xl glass p-4">
              <Icon className="h-5 w-5 text-gold" />
              <span className="text-sm font-bold">{label as string}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section className="border-y border-border bg-card/30">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionHeader title="همه‌چیز در حساب شما" subtitle="دارایی، سفارش‌ها، تحویل، پیام‌ها و اعلان‌های مهم را یکجا و شفاف پیگیری کنید" />
        <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl glass p-6">
            <h3 className="text-xl font-black">پنل کاربر</h3>
            <div className="mt-5 grid gap-3">
              {userMenu.slice(1).map((item) => (
                <div key={item.href} className="flex items-center justify-between rounded-xl bg-background/60 px-4 py-3 text-sm">
                  <span>{item.label}</span>
                  <CircleCheck className="h-4 w-4 text-success" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl glass p-6">
            <h3 className="text-xl font-black">پنل مدیریت</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {adminMenu.slice(1, 13).map((item) => (
                <div key={item.href} className="rounded-xl bg-background/60 px-4 py-3 text-sm font-semibold">{item.label}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AppShowcaseSection({ price }: { price?: SilverPrice }) {
  return (
    <section className="relative overflow-hidden border-y border-border bg-gradient-dark py-20 text-white md:py-28">
      <div className="absolute -right-40 top-16 h-96 w-96 rounded-full bg-gold/15 blur-3xl" />
      <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="app-showcase-device-wrap flex justify-center lg:order-2">
          <div className="app-showcase-device relative w-[290px] rounded-[3.25rem] border-[7px] border-zinc-700 bg-zinc-900 p-2 shadow-[0_30px_90px_rgba(0,0,0,.55)]">
            <div className="absolute left-1/2 top-3 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
            <div className="min-h-[590px] overflow-hidden rounded-[2.55rem] bg-[#f6f7f9] text-zinc-950">
              <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 px-5 pb-8 pt-14 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-white/55">سلام، خوش آمدید</div>
                    <div className="mt-1 text-base font-black">کیف پول نقره من</div>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10"><Coins className="h-5 w-5 text-gold" /></div>
                </div>
                <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
                  <div className="text-[10px] text-white/50">ارزش کل دارایی</div>
                  <div className="mt-2 text-2xl font-black">۲۴,۸۵۰,۰۰۰ <span className="text-xs font-medium text-white/55">تومان</span></div>
                  <div className="mt-2 text-[11px] font-bold text-emerald-400">+۲.۴٪ این ماه</div>
                </div>
              </div>
              <div className="-mt-3 px-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-emerald-500 p-4 text-white shadow-lg shadow-emerald-500/20">
                    <ShoppingCart className="h-5 w-5" />
                    <div className="mt-3 text-sm font-black">خرید نقره</div>
                    <div className="mt-1 text-[9px] text-white/70">سریع و لحظه‌ای</div>
                  </div>
                  <div className="rounded-2xl bg-zinc-900 p-4 text-white shadow-lg">
                    <Banknote className="h-5 w-5 text-gold" />
                    <div className="mt-3 text-sm font-black">فروش نقره</div>
                    <div className="mt-1 text-[9px] text-white/55">تسویه آنی</div>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">قیمت لحظه‌ای نقره</span>
                    <span className="text-[10px] font-bold text-emerald-600">{formatPriceChange(price?.change24h)}</span>
                  </div>
                  <div className="mt-2 text-lg font-black">{price ? formatToman(price.pricePerGram) : "در حال دریافت…"}</div>
                  <div className="mt-5 flex h-16 items-end gap-1">
                    {[28, 44, 36, 55, 49, 68, 61, 78, 71, 88, 82, 94].map((height, index) => (
                      <span
                        className="app-showcase-bar flex-1 origin-bottom rounded-t bg-gradient-to-t from-zinc-200 to-gold"
                        key={index}
                        style={{ height: `${height}%`, animationDelay: `${index * 90}ms` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[
                    [Wallet, "کیف پول"],
                    [BarChart3, "بازار"],
                    [User, "حساب من"],
                  ].map(([Icon, label]) => (
                    <div className="rounded-xl bg-white p-3" key={label as string}>
                      <Icon className="mx-auto h-4 w-4 text-zinc-700" />
                      <div className="mt-1.5 text-[9px] font-bold">{label as string}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <span className="absolute -right-[10px] top-28 h-16 w-1 rounded-full bg-zinc-600" />
            <span className="absolute -left-[10px] top-36 h-10 w-1 rounded-full bg-zinc-600" />
          </div>
        </div>

        <div className="lg:order-1">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-bold text-gold">
            <Smartphone className="h-3.5 w-3.5" /> اپلیکیشن نقره
          </span>
          <h2 className="mt-6 max-w-2xl text-3xl font-black leading-tight md:text-5xl">بازار نقره، همیشه همراه شما</h2>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/65">
            با اپلیکیشن نقره، قیمت لحظه‌ای را دنبال کنید، خرید و فروش انجام دهید و وضعیت کیف پول و سفارش‌های خود را در هر زمان مدیریت کنید.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              [Bell, "اعلان تغییرات قیمت"],
              [Wallet, "مدیریت کیف پول"],
              [ShieldCheck, "ورود و معامله امن"],
              [Truck, "پیگیری تحویل"],
            ].map(([Icon, label]) => (
              <div className="app-showcase-feature flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4" key={label as string}>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold/10"><Icon className="h-5 w-5 text-gold" /></span>
                <span className="text-sm font-bold">{label as string}</span>
              </div>
            ))}
          </div>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href={MOBILE_WEB_APP_URL} target="_blank" rel="noreferrer" className="app-showcase-download flex min-w-48 items-center gap-3 overflow-hidden rounded-2xl bg-white px-5 py-3.5 text-zinc-950 transition hover:-translate-y-0.5">
              <Apple className="h-7 w-7" />
              <span><span className="block text-[10px]">نسخه مناسب آیفون</span><strong className="block text-base">Web App</strong></span>
            </a>
            <a href={MOBILE_WEB_APP_URL} target="_blank" rel="noreferrer" className="app-showcase-download flex min-w-48 items-center gap-3 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-3.5 text-white transition hover:-translate-y-0.5 hover:bg-white/10">
              <Smartphone className="h-7 w-7 text-gold" />
              <span><span className="block text-[10px] text-white/55">نسخه اندروید</span><strong className="block text-base">Direct Download</strong></span>
            </a>
          </div>
          <p className="mt-4 text-xs text-white/40">برای مشاهده همه روش‌های نصب و دریافت مستقیم اپلیکیشن، یکی از گزینه‌ها را انتخاب کنید.</p>
        </div>
      </div>
    </section>
  );
}

function FaqPreview() {
  const items = [
    ["قیمت خرید و فروش نقره چگونه محاسبه می‌شود؟", "قیمت نهایی بر اساس نرخ لحظه‌ای هر گرم نقره، اسپرد خرید یا فروش و کارمزدهای فعال محاسبه و پیش از تأیید سفارش نمایش داده می‌شود."],
    ["نقره خریداری‌شده کجا نمایش داده می‌شود؟", "پس از تکمیل موفق سفارش، مقدار نقره در کیف پول نقره حساب شما ثبت می‌شود و موجودی و سوابق آن از داشبورد قابل مشاهده است."],
    ["چگونه نقره خود را بفروشم و تسویه کنم؟", "در بخش فروش، وزن موردنظر و مبلغ نهایی را بررسی می‌کنید؛ پس از تأیید معامله، وجه آن در کیف پول تومان شما ثبت می‌شود."],
    ["تحویل فیزیکی نقره چگونه انجام می‌شود؟", "اگر موجودی شما به حداقل تحویل برسد، می‌توانید ارسال پستی بیمه‌شده را ثبت کنید و وضعیت آماده‌سازی و رهگیری را در حساب ببینید."],
    ["چرا احراز هویت برای معامله لازم است؟", "احراز هویت برای حفاظت از دارایی، جلوگیری از سوءاستفاده و انجام امن عملیات مالی و تحویل فیزیکی انجام می‌شود."],
  ];
  return (
    <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
      <SectionHeader title="سوالات مهم" subtitle="پاسخ کوتاه به چیزهایی که قبل از معامله باید روشن باشد" />
      <div className="mt-10 grid gap-4">
        {items.map(([q, a]) => (
          <div key={q} className="rounded-2xl glass p-5">
            <h3 className="font-bold">{q}</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function InvestmentCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="investment-cta relative overflow-hidden rounded-3xl border border-gold/25 bg-gradient-dark p-8 shadow-premium md:p-12">
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "url(/assets/silver/silver-coins.jpg)", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-gradient-to-l from-black/85 via-black/70 to-black/35" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold">
              <Sparkles className="h-3.5 w-3.5" /> آماده شروع سرمایه‌گذاری در نقره هستید؟
            </span>
            <h2 className="mt-5 max-w-3xl text-3xl font-black leading-tight text-white md:text-5xl">
              با کیف پول امن، قیمت شفاف و تحویل فیزیکی، اولین سفارش نقره را ثبت کنید.
            </h2>
            <p className="mt-5 max-w-2xl leading-8 text-white/65">
              از ساخت حساب و تأیید هویت تا خرید، فروش، نگهداری و دریافت شمش پلمب، وضعیت هر مرحله در حساب شما قابل مشاهده و پیگیری است.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:flex-col">
            <Link href="/auth" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-gold px-6 py-3.5 text-sm font-black text-gold-foreground shadow-glow">
              شروع سرمایه‌گذاری <ChevronLeft className="h-4 w-4" />
            </Link>
            <Link href="/user/buy-silver" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border glass-strong px-6 py-3.5 text-sm font-semibold text-foreground hover:border-gold/50 hover:bg-accent/70">
              مشاهده قیمت و خرید <BarChart3 className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

type CmsLandingKind = "about" | "contact" | "faq" | "fees";

export function LandingPage({ initialPage, kind }: { initialPage?: PublicCmsPage | null; kind: CmsLandingKind }) {
  return (
    <SilverShell>
      <PriceTicker />
      <LandingSection initialPage={initialPage} kind={kind} />
    </SilverShell>
  );
}

function LandingSection({ initialPage, kind }: { initialPage?: PublicCmsPage | null; kind: CmsLandingKind }) {
  const { data: price } = useSilverPriceQuery();
  const { data: dynamicPage } = useQuery({
    queryFn: () => getPublicCmsPage(kind),
    initialData: initialPage ?? undefined,
    queryKey: ["public-cms-page", kind],
    staleTime: 30_000,
  });
  const copy = landingCopy[kind];
  const page = {
    description: dynamicPage?.description ?? copy.description,
    eyebrow: dynamicPage?.eyebrow ?? copy.eyebrow,
    image: dynamicPage?.image ?? copy.image,
    points: dynamicPage?.points?.length ? dynamicPage.points : copy.points,
    title: dynamicPage?.title ?? copy.title,
    updatedAt: dynamicPage?.updatedAt,
    body: dynamicPage?.body,
  };
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <span className="silver-eyebrow">
            <Sparkles className="h-3.5 w-3.5" /> {page.eyebrow}
          </span>
          <h1 className="mt-6 text-4xl font-black leading-[1.15] md:text-5xl">{page.title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">{page.description}</p>
          {page.body ? <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-8 text-muted-foreground">{page.body}</p> : null}
          {kind === "fees" && price ? <FeeDetails price={price} /> : null}
          {kind === "contact" ? <ContactDetails contacts={officialContacts(dynamicPage?.contacts)} /> : null}
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {page.points.map((point) => (
              <div key={point} className="flex items-center gap-3 rounded-2xl glass p-4">
                <CircleCheck className="h-5 w-5 text-gold" />
                <span className="text-sm font-semibold">{point}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-premium">
          <Image src={page.image} alt={page.title} width={900} height={620} className="h-full min-h-[360px] w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          <div className="absolute bottom-5 right-5 left-5 rounded-2xl glass-strong p-5">
            <div className="text-xs text-muted-foreground">آخرین به‌روزرسانی</div>
            <div className="mt-1 text-xl font-black text-gradient-gold">{formatJalaliDate(page.updatedAt)}</div>
          </div>
        </div>
      </div>
      {kind === "faq" && dynamicPage?.faqs?.length ? <FaqDetails faqs={dynamicPage.faqs} /> : null}
    </section>
  );
}

function FeeDetails({ price }: { price: SilverPrice }) {
  const values = [
    ["کارمزد خرید", `${toPersianDigits(price.buyFeePercent)}٪`],
    ["کارمزد فروش", `${toPersianDigits(price.sellFeePercent)}٪`],
    ["اسپرد خرید", `${toPersianDigits(price.spreadBuyPercent)}٪`],
    ["اسپرد فروش", `${toPersianDigits(price.spreadSellPercent)}٪`],
    ["هزینه تحویل پستی", formatToman(price.deliveryFeeToman)],
    ["حداقل خرید", formatToman(price.minBuyToman)],
    ["حداقل فروش", formatGram(price.minSellGram)],
    ["حداقل تحویل فیزیکی", formatGram(price.deliveryMinGram)],
  ];
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="کارمزدها و حداقل‌های فعال سامانه">
      {values.map(([label, value]) => (
        <div className="rounded-2xl border border-gold/20 glass p-4" key={label}>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-2 text-lg font-black text-gradient-gold">{value}</div>
        </div>
      ))}
      <div className="sm:col-span-2">
        <PriceUpdateMeta intervalMinutes={price.syncIntervalMinutes} updatedAt={price.updatedAt} />
      </div>
    </div>
  );
}

function ContactDetails({ contacts }: { contacts: NonNullable<PublicCmsPage["contacts"]> }) {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2">
      {contacts.map((contact) => {
        const content = (
          <>
            <div className="text-xs text-muted-foreground">{contact.label}</div>
            <div className="mt-2 text-sm font-black text-foreground">{contact.value}</div>
          </>
        );
        return contact.href ? (
          <a className="rounded-2xl border border-gold/20 glass p-4 transition hover:border-gold/50" href={contact.href} key={contact.key}>{content}</a>
        ) : (
          <div className="rounded-2xl border border-gold/20 glass p-4" key={contact.key}>{content}</div>
        );
      })}
    </div>
  );
}

function FaqDetails({ faqs }: { faqs: NonNullable<PublicCmsPage["faqs"]> }) {
  return (
    <div className="mx-auto mt-16 max-w-4xl">
      <h2 className="text-center text-2xl font-black">پرسش‌ها و پاسخ‌ها</h2>
      <div className="mt-6 grid gap-3">
        {faqs.map((faq) => (
          <details className="group rounded-2xl border border-border glass p-5" key={faq.id}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">
              {faq.question}
              <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" />
            </summary>
            <p className="mt-4 border-t border-border pt-4 text-sm leading-8 text-muted-foreground">{faq.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

export function BlogPage({ initialPosts = [] }: { initialPosts?: PublicBlogPost[] }) {
  const { data: posts = [] } = useQuery({
    queryFn: getPublicBlogPosts,
    initialData: initialPosts,
    queryKey: ["public-blog-posts-noghre"],
    staleTime: 30_000,
  });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const categories = useMemo(() => Array.from(new Set(posts.map((post) => post.category || "آموزش نقره"))), [posts]);
  const filtered = useMemo(() => posts.filter((post) => {
    if (category && (post.category || "آموزش نقره") !== category) return false;
    const haystack = `${post.title} ${post.excerpt} ${post.tags.map((tag) => tag.title).join(" ")}`.toLowerCase();
    return !search.trim() || haystack.includes(search.trim().toLowerCase());
  }), [category, posts, search]);
  return (
    <SilverShell>
      <PriceTicker />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="silver-eyebrow">
              <Sparkles className="h-3.5 w-3.5" /> مجله نقره
            </span>
            <h1 className="mt-5 text-4xl font-black md:text-5xl">آموزش و تحلیل بازار نقره</h1>
            <p className="mt-4 max-w-2xl text-sm leading-8 text-muted-foreground">راهنماها و مطالب آموزشی این بخش برای تصمیم‌گیری آگاهانه درباره خرید، فروش، نگهداری و تحویل نقره منتشر می‌شوند.</p>
          </div>
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="h-12 rounded-xl border border-input bg-background px-4 text-sm outline-none md:w-80" placeholder="جستجوی مقاله..." />
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          <button onClick={() => setCategory(null)} className={`rounded-full border px-4 py-2 text-xs font-semibold ${!category ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground"}`}>همه</button>
          {categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`rounded-full border px-4 py-2 text-xs font-semibold ${category === item ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground"}`}>{item}</button>)}
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((post) => <BlogCard key={post.slug} post={post} />)}
        </div>
        {!filtered.length ? <div className="mt-10 rounded-2xl glass p-8 text-center text-sm text-muted-foreground">مقاله‌ای پیدا نشد.</div> : null}
      </section>
    </SilverShell>
  );
}

function BlogCard({ post }: { post: PublicBlogPost }) {
  return (
    <Link href={`/blog/${post.slug}` as Route} className="group overflow-hidden rounded-2xl border border-border glass shadow-elegant transition hover:border-gold/40">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image src={post.featuredImageUrl || "/assets/silver/silver-bar.jpg"} alt={post.title} width={800} height={500} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <span className="absolute bottom-4 right-4 rounded-full glass-strong px-3 py-1 text-xs text-gold">{post.category || "آموزش نقره"}</span>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{formatJalaliDate(post.publishedAt)}</span>
          <span>{toPersianDigits(post.readMinutes)} دقیقه</span>
        </div>
        <h2 className="mt-3 line-clamp-2 text-lg font-black leading-8 transition group-hover:text-gold">{post.title}</h2>
        <p className="mt-2 line-clamp-3 text-sm leading-7 text-muted-foreground">{post.excerpt}</p>
      </div>
    </Link>
  );
}

export function BlogDetailPage({ initialPost, slug }: { initialPost?: PublicBlogPost | null; slug: string }) {
  const queryClient = useQueryClient();
  const { data: post, isLoading } = useQuery({
    queryFn: () => getPublicBlogPost(slug),
    initialData: initialPost ?? undefined,
    queryKey: ["public-blog-post-noghre", slug],
    staleTime: 30_000,
  });
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [body, setBody] = useState("");
  const comment = useMutation({
    mutationFn: () => submitPublicBlogComment(slug, { authorEmail, authorName, body }),
    onSuccess: () => {
      setAuthorName("");
      setAuthorEmail("");
      setBody("");
      void queryClient.invalidateQueries({ queryKey: ["public-blog-post-noghre", slug] });
    },
  });
  if (isLoading) return <SilverShell><section className="mx-auto max-w-4xl px-4 py-20 text-muted-foreground">در حال دریافت مقاله...</section></SilverShell>;
  if (!post) return <SilverShell><section className="mx-auto max-w-4xl px-4 py-20 text-muted-foreground">مقاله پیدا نشد.</section></SilverShell>;
  return (
    <SilverShell>
      <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6 md:py-20">
        <Link href="/blog" className="text-sm text-gold">بازگشت به مجله</Link>
        <h1 className="mt-5 text-4xl font-black leading-tight md:text-5xl">{post.title}</h1>
        <p className="mt-5 text-base leading-8 text-muted-foreground">{post.excerpt}</p>
        <div className="mt-5 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>{post.category || "آموزش نقره"}</span>
          <span>{formatJalaliDate(post.publishedAt)}</span>
          <span>{toPersianDigits(post.readMinutes)} دقیقه مطالعه</span>
        </div>
        <div className="relative mt-8 overflow-hidden rounded-3xl border border-border shadow-premium">
          <Image src={post.featuredImageUrl || "/assets/silver/silver-bar.jpg"} alt={post.title} width={1200} height={720} className="h-auto w-full" />
        </div>
        <div className="prose prose-invert mt-10 max-w-none whitespace-pre-line rounded-2xl glass p-6 leading-9 text-foreground">
          {post.contentMarkdown}
        </div>
        <section className="mt-10 rounded-2xl glass p-6">
          <h2 className="text-xl font-black">دیدگاه‌ها</h2>
          <div className="mt-5 grid gap-3">
            {(post.comments ?? []).map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-card/40 p-4">
                <div className="text-sm font-bold">{item.authorName}</div>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.body}</p>
              </div>
            ))}
            {!post.comments?.length ? <p className="text-sm text-muted-foreground">هنوز دیدگاهی ثبت نشده است.</p> : null}
          </div>
          <form className="mt-6 grid gap-3" onSubmit={(event) => { event.preventDefault(); comment.mutate(); }}>
            <div className="grid gap-3 md:grid-cols-2">
              <input value={authorName} onChange={(event) => setAuthorName(event.target.value)} required className="h-11 rounded-xl border border-input bg-background px-3 text-sm" placeholder="نام" />
              <input value={authorEmail} onChange={(event) => setAuthorEmail(event.target.value)} className="h-11 rounded-xl border border-input bg-background px-3 text-sm" placeholder="ایمیل" />
            </div>
            <textarea value={body} onChange={(event) => setBody(event.target.value)} required className="min-h-28 rounded-xl border border-input bg-background p-3 text-sm" placeholder="دیدگاه شما" />
            <button disabled={comment.isPending} className="h-11 rounded-xl bg-gradient-gold px-5 text-sm font-bold text-gold-foreground disabled:opacity-50">ثبت دیدگاه</button>
          </form>
        </section>
      </article>
    </SilverShell>
  );
}

const landingCopy: Record<string, { description: string; eyebrow: string; image: string; points: string[]; title: string }> = {
  fees: {
    eyebrow: "کارمزدها",
    title: "کارمزد، اسپرد و حداقل معامله کاملا شفاف",
    description: "نرخ خرید و فروش، کارمزدها و حداقل سفارش پیش از ثبت معامله به‌صورت روشن نمایش داده می‌شوند و سوابق تغییرات مهم نگهداری می‌شود.",
    image: "/assets/silver/silver-bar.jpg",
    points: ["اسپرد خرید", "اسپرد فروش", "کارمزد تحویل", "حداقل سفارش"],
  },
  faq: {
    eyebrow: "سوالات متداول",
    title: "پاسخ‌های روشن برای سرمایه‌گذاری در نقره",
    description: "از نحوه محاسبه قیمت و کارمزد تا تحویل فیزیکی، کیف پول‌ها، احراز هویت و پشتیبانی، همه چیز فارسی و روشن توضیح داده شده است.",
    image: "/assets/silver/silver-coins.jpg",
    points: ["قیمت‌گذاری", "کیف پول", "تحویل", "پشتیبانی"],
  },
  contact: {
    eyebrow: "تماس و پشتیبانی",
    title: "پشتیبانی فارسی برای خرید، فروش و تحویل",
    description: "از طریق تیکت و گفتگوی آنلاین می‌توانید پرسش‌های خود درباره حساب، معامله یا تحویل را مطرح و پاسخ را در همان مسیر پیگیری کنید.",
    image: "/assets/silver/vault.jpg",
    points: ["تیکت", "گفتگوی زنده", "پیگیری تحویل", "مشاوره خرید"],
  },
  about: {
    eyebrow: "درباره نقره لند",
    title: "نقره لند؛ بازار شفاف و قابل پیگیری نقره",
    description: "با مأموریت، رویکرد و خدمات نقره لند آشنا شوید.",
    image: "/assets/silver/vault.jpg",
    points: ["قیمت‌گذاری شفاف", "ثبت و پیگیری سفارش", "نگهداری امن", "تحویل فیزیکی"],
  },
};

export function DashboardPage({ admin = false }: { admin?: boolean }) {
  const { loading, user } = useAuth();
  if (loading) {
    return (
      <SilverShell>
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="rounded-3xl glass p-8 text-center text-muted-foreground">در حال بررسی ورود...</div>
        </section>
      </SilverShell>
    );
  }
  if (!user) return <LoginRequired />;
  if (admin && !user.roles?.some(isAdministrativeRole)) return <AdminRequired />;
  return <DashboardContent admin={admin} />;
}

function DashboardContent({ admin = false }: { admin?: boolean }) {
  const menu = admin ? adminMenu : userMenu;
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [price, setPrice] = useState<SilverPrice | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void Promise.all([getSilverOverview(), getSilverPrice()])
      .then(([nextOverview, nextPrice]) => {
        setOverview(nextOverview);
        setPrice(nextPrice);
        setError("");
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const wallets = useMemo(() => {
    const list = overview?.wallets ?? [];
    return {
      silver: list.find((wallet) => wallet.currency === "SILVER_GRAM"),
      toman: list.find((wallet) => wallet.currency === "TOMAN"),
    };
  }, [overview]);

  async function runAction(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      const [nextOverview, nextPrice] = await Promise.all([getSilverOverview(), getSilverPrice()]);
      setOverview(nextOverview);
      setPrice(nextPrice);
      setMessage("عملیات با موفقیت ثبت شد.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "عملیات با خطا روبه‌رو شد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SilverShell>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm text-gold">{admin ? "پنل مدیریت" : "داشبورد کاربر"}</div>
            <h1 className="mt-2 text-3xl font-black md:text-4xl">{admin ? "مدیریت پلتفرم نقره" : "دارایی و معاملات نقره"}</h1>
          </div>
          <div className="rounded-2xl glass px-4 py-3 text-sm text-muted-foreground">امروز: {formatJalaliDate()}</div>
        </div>
        {error ? <div className="mb-5 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</div> : null}
        {message ? <div className="mb-5 rounded-2xl border border-success/40 bg-success/10 p-4 text-sm text-success">{message}</div> : null}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { icon: BarChart3, label: "قیمت خرید", value: price ? formatToman(price.buyPricePerGram) : "در حال دریافت…" },
            { icon: Wallet, label: "کیف پول تومان", value: formatToman(wallets.toman?.balance ?? 0) },
            { icon: Coins, label: "دارایی نقره", value: formatGram(overview?.holding?.availableGrams ?? wallets.silver?.balance ?? 0) },
            { icon: Truck, label: "درخواست تحویل", value: toPersianDigits(overview?.deliveryRequests?.length ?? 0) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-2xl glass p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Icon className="h-5 w-5 text-gold" />
              </div>
              <div className="mt-4 text-2xl font-black">{value}</div>
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-2xl glass p-3">
            {menu.map((item) => (
              <Link key={item.href} href={item.href as Route} className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold hover:bg-accent">
                <span>{item.label}</span>
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </aside>
          <div className="space-y-6">
            {!admin ? <UserActionPanel busy={busy} runAction={runAction} /> : <AdminSyncPanel />}
            <div className="rounded-2xl glass p-5">
              <h2 className="text-xl font-black">{admin ? "صف عملیات مالی" : "آخرین تراکنش‌ها"}</h2>
              <div className="mt-5 overflow-hidden rounded-xl border border-border">
                {(overview?.transactions?.length ? overview.transactions : []).map((row) => (
                  <div key={row.id} className="grid grid-cols-3 gap-3 border-b border-border p-4 text-sm last:border-b-0">
                    <span className="font-semibold">{row.description}</span>
                    <span className="text-muted-foreground">{formatJalaliDate(row.createdAt)}</span>
                    <span className="text-left text-success">{formatGram(row.amount)}</span>
                  </div>
                ))}
                {!overview?.transactions?.length ? (
                  <div className="p-5 text-sm text-muted-foreground">هنوز تراکنشی ثبت نشده است. پس از شارژ کیف پول یا ثبت نخستین سفارش، سوابق شما در این بخش نمایش داده می‌شود.</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </SilverShell>
  );
}

function UserActionPanel({ busy, runAction }: { busy: boolean; runAction: (action: () => Promise<unknown>) => Promise<void> }) {
  const [grams, setGrams] = useState("10");

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void runAction(() => createSilverOrder("BUY", Number(grams)));
        }}
        className="rounded-2xl glass p-5"
      >
        <h3 className="font-black">خرید نقره</h3>
        <input value={grams} onChange={(event) => setGrams(event.target.value)} className="mt-4 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" placeholder="گرم" />
        <button disabled={busy} className="mt-4 h-11 w-full rounded-xl bg-gradient-gold text-sm font-bold text-gold-foreground disabled:opacity-50">ثبت خرید</button>
      </form>
      <div className="rounded-2xl glass p-5">
        <h3 className="font-black">درخواست تحویل</h3>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">تحویل نقره فقط با ارسال پستی بیمه‌شده و به نام صاحب حساب انجام می‌شود.</p>
        <Link href="/user/delivery" className="mt-4 flex h-11 w-full items-center justify-center rounded-xl border border-gold/40 text-sm font-bold text-gold">ثبت درخواست پستی</Link>
      </div>
      <div className="rounded-2xl glass p-5">
        <h3 className="font-black">احراز خودکار</h3>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">ابتدا نام، نام خانوادگی و کد ملی را در پروفایل ذخیره کنید؛ سپس تطبیق کد ملی با شماره موبایل به‌صورت خودکار انجام می‌شود.</p>
        <Link href="/user/profile" className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">تکمیل پروفایل و احراز خودکار</Link>
      </div>
    </div>
  );
}

function AdminSyncPanel() {
  return (
    <div className="rounded-2xl glass p-5">
      <h3 className="font-black">اطلاعات به‌روز و قابل پیگیری</h3>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">
        تغییرات قیمت و کارمزد، نتیجه تأیید هویت، وضعیت کیف پول و مراحل تحویل در حساب کاربر و اعلان‌ها به‌صورت هماهنگ نمایش داده می‌شود.
      </p>
    </div>
  );
}

function LoginRequired() {
  return (
    <SilverShell>
      <section className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <div className="rounded-3xl glass p-8 shadow-premium">
          <ShieldAlert className="mx-auto h-12 w-12 text-gold" />
          <h1 className="mt-5 text-2xl font-black">برای مشاهده داشبورد وارد شوید</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">برای محافظت از اطلاعات مالی، دارایی، سفارش‌ها، پیام‌ها و درخواست‌های تحویل فقط پس از ورود امن نمایش داده می‌شوند.</p>
          <Link href="/auth?redirect=/user" className="mt-6 inline-flex rounded-xl bg-gradient-gold px-5 py-3 text-sm font-bold text-gold-foreground">ورود / ثبت‌نام</Link>
        </div>
      </section>
    </SilverShell>
  );
}

function AdminRequired() {
  return (
    <SilverShell>
      <section className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <div className="rounded-3xl glass p-8 shadow-premium">
          <Lock className="mx-auto h-12 w-12 text-gold" />
          <h1 className="mt-5 text-2xl font-black">دسترسی مدیریت لازم است</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">این بخش فقط برای نقش‌های مدیریتی فعال است.</p>
        </div>
      </section>
    </SilverShell>
  );
}

const userMenu = [
  ["overview", "نمای کلی"],
  ["buy", "خرید نقره"],
  ["sell", "فروش نقره"],
  ["silver-wallet", "دارایی نقره"],
  ["toman-wallet", "کیف پول تومان"],
  ["orders", "سفارش‌ها"],
  ["transactions", "تراکنش‌ها"],
  ["delivery", "تحویل فیزیکی"],
  ["tickets", "تیکت‌ها"],
  ["live-chat", "گفتگوی زنده"],
  ["kyc", "پروفایل و احراز هویت"],
  ["notifications", "اعلان‌ها"],
].map(([slug, label]) => ({ href: `/user${slug === "overview" ? "" : `/${slug}`}`, label }));

const adminMenu = [
  "نمای کلی",
  "کاربران",
  "بررسی تأیید هویت",
  "قیمت لحظه‌ای نقره",
  "تنظیمات اسپرد و کارمزد",
  "سفارش‌های خرید و فروش",
  "تراکنش‌های کیف پول",
  "دارایی‌های نقره",
  "درخواست‌های تحویل",
  "تیکت‌ها",
  "گفتگوی زنده",
  "بلاگ",
  "سوالات متداول",
  "سوابق تغییرات",
  "تنظیمات",
].map((label, index) => ({ href: `/admin${index === 0 ? "" : `/${index}`}`, label }));

export function Footer() {
  const { data: contactPage } = useQuery({
    queryFn: () => getPublicCmsPage("contact"),
    queryKey: ["public-cms-page", "contact"],
    staleTime: 60_000,
  });
  const contacts = officialContacts(contactPage?.contacts);
  return (
    <footer className="site-footer premium-footer relative mt-24 overflow-hidden border-t border-gold/20 text-platinum">
      <div className="footer-ambient footer-ambient-a" />
      <div className="footer-ambient footer-ambient-b" />
      <div className="relative mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:pt-14">
        <div className="premium-footer-hero overflow-hidden rounded-[2.5rem]">
          <div className="premium-footer-top grid gap-8 p-5 sm:p-7 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
            <div className="premium-footer-brand rounded-[2rem] p-7 sm:p-8">
              <div className="flex items-center gap-3">
                <BrandLogo className="h-20 w-20 shrink-0" />
                <div>
                  <div className="text-2xl font-black text-white">نقره</div>
                  <div className="mt-1 text-xs font-medium text-white/48">پلتفرم سرمایه‌گذاری حرفه‌ای نقره</div>
                </div>
              </div>
              <p className="mt-6 max-w-xl text-sm leading-8 text-white/64">خرید و فروش نقره با قیمت شفاف، کیف پول تومان، نگهداری امن در خزانه و امکان تحویل فیزیکی بسته‌های پلمب برای سرمایه‌گذاران فارسی‌زبان.</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {["قیمت لحظه‌ای", "گواهی اصالت", "تحویل امن"].map((item) => (
                  <div key={item} className="premium-footer-stat rounded-2xl px-4 py-3 text-sm font-bold text-white">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="premium-footer-actions grid gap-5">
              <div className="premium-footer-apps rounded-[2rem] p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-base font-black text-white">اپلیکیشن نقره</div>
                    <div className="mt-1 text-xs text-white/48">دسترسی سریع به خرید، فروش و کیف پول</div>
                  </div>
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-gold text-gold-foreground shadow-glow">
                    <Smartphone className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <AppDownloadBadge href={MOBILE_WEB_APP_URL} icon={Apple} label="نسخه مناسب آیفون" meta="Web App" />
                  <AppDownloadBadge href={MOBILE_WEB_APP_URL} icon={Smartphone} label="نسخه اندروید" meta="Direct Download" />
                </div>
              </div>
              <form className="premium-footer-newsletter rounded-[2rem] p-5">
                <label className="text-sm font-black text-white" htmlFor="footer-subscribe">خبرنامه بازار نقره</label>
                <div className="mt-4 flex gap-2">
                  <input id="footer-subscribe" type="email" className="h-12 min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm text-white outline-none placeholder:text-white/38" placeholder="ایمیل شما" />
                  <button className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-gold text-gold-foreground shadow-glow" aria-label="عضویت">
                    <Mail className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="premium-footer-body grid gap-6 border-t border-white/10 p-5 sm:p-7 lg:grid-cols-[0.85fr_0.85fr_1.3fr]">
            <FooterLinks title="دسترسی سریع" links={[
              { href: "/user/buy-silver", label: "خرید و فروش" },
              { href: "/user/delivery", label: "تحویل فیزیکی" },
              { href: "/products", label: "محصولات نقره" },
              { href: "/wheel", label: "گردونه شانس" },
            ]} />
            <FooterLinks title="نقره لند" links={noghreLandNavItems} />
            <div className="premium-footer-trust rounded-[1.75rem] p-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-black text-white">اعتماد و مجوزها</div>
                  <div className="mt-1 text-xs leading-6 text-white/48">نشانه‌های اعتبار عملیاتی و صنفی پلتفرم</div>
                </div>
                <div className="footer-cert-gallery grid w-fit grid-cols-2 items-center justify-items-center gap-4">
                  {footerTrustImages.map((item) => (
                    <a
                      key={item.alt}
                      href={item.href}
                      target="_blank"
                      rel={item.code ? undefined : "noreferrer"}
                      referrerPolicy={item.code ? "origin" : undefined}
                      className="footer-cert-card group flex h-24 w-24 items-center justify-center rounded-3xl transition duration-300 hover:-translate-y-1 sm:h-28 sm:w-28"
                      aria-label={item.alt}
                    >
                      <img
                        src={item.src}
                        alt={item.code ? "" : item.alt}
                        loading="lazy"
                        referrerPolicy={item.code ? "origin" : undefined}
                        style={item.code ? { cursor: "pointer" } : undefined}
                        {...(item.code ? { code: item.code } : {})}
                        className="footer-cert-image max-h-[4.75rem] w-auto max-w-[4.75rem] object-contain transition duration-300 group-hover:scale-105 sm:max-h-[5.75rem] sm:max-w-[5.75rem]"
                      />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="premium-footer-contact grid gap-3 border-t border-white/10 p-5 text-sm text-white/58 sm:grid-cols-3 sm:p-7">
            {contacts.map((contact) => (
              <div key={contact.key}>
                <span className="block text-xs text-white/36">{contact.label}</span>
                {"href" in contact && contact.href ? (
                  <a className="mt-1 block font-bold text-white transition hover:text-gold" href={contact.href}>{contact.value}</a>
                ) : (
                  <span className="mt-1 block font-bold text-white">{contact.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="premium-footer-legal relative mt-8 border-t border-white/10 py-5">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-xs text-white/50 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>© {toPersianDigits(1405)} نقره. تمامی حقوق محفوظ است.</div>
          <div className="flex flex-wrap gap-4">
            <Link className="transition hover:text-gold" href="/terms">قوانین و مقررات</Link>
            <span>حریم خصوصی</span>
            <span>گواهی اصالت</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function AppDownloadBadge({ href, icon: Icon, label, meta }: { href: string; icon: LucideIcon; label: string; meta: string }) {
  return (
    <a className="footer-app-badge flex min-h-[4.35rem] items-center gap-3 rounded-2xl px-4 py-3 text-start transition hover:-translate-y-0.5" href={href} rel="noreferrer" target="_blank">
      <span className="footer-app-icon grid h-11 w-11 shrink-0 place-items-center rounded-xl">
        <Icon className="h-5 w-5 text-gold" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block whitespace-nowrap text-[11px] font-semibold text-white/58">{label}</span>
        <span className="mt-0.5 block whitespace-nowrap text-sm font-black text-white">{meta}</span>
      </span>
    </a>
  );
}

function officialContacts(contacts?: PublicContactChannel[]) {
  return OFFICIAL_CONTACTS.map((official) => {
    const stored = contacts?.find((contact) => contact.key === official.key || contact.type === official.type);
    return { ...stored, ...official, label: stored?.label || official.label };
  });
}

function FooterLinks({ links, title }: { links: Array<{ href: string; label: string }>; title: string }) {
  return (
    <div className="premium-footer-links rounded-[1.75rem] p-5">
      <h4 className="mb-4 text-sm font-semibold text-white">{title}</h4>
      <ul className="space-y-2.5 text-sm text-white/60">
        {links.map((link) => (
          <li key={link.href}>
            <Link className="transition hover:text-gold" href={link.href as Route}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SectionHeader({ subtitle, title }: { subtitle: string; title: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-3xl font-black md:text-4xl">{title}</h2>
      <p className="mt-3 text-muted-foreground">{subtitle}</p>
    </div>
  );
}
