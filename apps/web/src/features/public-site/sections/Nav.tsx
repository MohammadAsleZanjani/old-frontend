"use client";

import { motion } from "framer-motion";
import { useEffect, useState, type ComponentType } from "react";
import { Sun, Moon, Globe, LogIn, LogOut, ChevronDown, LifeBuoy, Ticket, Boxes, Brain, Smartphone, Home, Package, BookOpen, Info, Mail, MessageCircle, Headphones, Coins, Bitcoin, ShoppingBag, FileText, Send, Building2, Bell, ReceiptText, User, Users, ShieldCheck, ShoppingCart, AlertTriangle, Archive, Megaphone, Settings, Wallet, CheckCircle2, Search, Menu, X } from "lucide-react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { languageLabel, useI18n } from "@/shared/i18n";
import { SERVICES } from "@/domains/services/data";
import { getServices } from "@/domains/services/services-api";
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead } from "@/domains/notifications/notifications-api";
import { getCart, type CartSummary } from "@/domains/commerce/commerce-api";
import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import { useAuth } from "@/shared/auth/AuthProvider";
import { formatPlatformDate } from "@/shared/lib/date-format";
import { PRODUCTS, type ProductCategory } from "@/domains/catalog/products-data";
import { getProducts } from "@/domains/catalog/products-api";
import { BrandLogo } from "@/shared/ui/brand-logo";

interface NotificationPreviewPage {
  items: Array<{ actionUrl?: string | null; body: string; createdAt?: string; entityType?: string | null; event?: string | null; id: string; priority: string; status: string; title: string }>;
}

type NotificationFilterKey =
  | "all"
  | "unread"
  | "orders"
  | "payments"
  | "invoices"
  | "refunds"
  | "wallet"
  | "referrals"
  | "support"
  | "live-chat"
  | "security"
  | "system"
  | "products"
  | "downloads"
  | "marketing";

interface NotificationFilterOption {
  desc: string;
  entityType?: string;
  event?: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  key: NotificationFilterKey;
  label: string;
  status?: "UNREAD" | "READ" | "ARCHIVED";
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<NotificationFilterKey>("unread");
  const [notificationSearch, setNotificationSearch] = useState("");
  const [servicesOpen, setServicesOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [setayeshOpen, setSetayeshOpen] = useState(false);
  const { dir, t, lang, languages, setLang, theme, toggleTheme } = useI18n();
  const builtInLang = (lang === "en" || lang === "ar" || lang === "fa") ? lang : "fa";
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const unreadNotifications = useQuery({
    enabled: Boolean(user),
    queryFn: () => getUnreadNotificationCount() as Promise<{ count: number }>,
    queryKey: ["top-nav-unread-notifications", user?.id],
    refetchInterval: 60_000,
    retry: 1,
  });
  const cart = useQuery({
    enabled: Boolean(user),
    queryFn: () => getCart(),
    queryKey: ["commerce-cart", user?.id],
    refetchInterval: cartOpen ? 30_000 : false,
    retry: 1,
  });
  const notificationFilters = getNotificationFilters(lang);
  const activeNotificationFilter = notificationFilters.find((item) => item.key === notificationFilter) ?? notificationFilters[0];
  const recentNotifications = useQuery({
    enabled: Boolean(user) && notificationsOpen,
    queryFn: () => getNotifications({
      entityType: activeNotificationFilter.entityType,
      event: activeNotificationFilter.event,
      page: 1,
      pageSize: 8,
      search: notificationSearch.trim() || undefined,
      sortOrder: "desc",
      status: activeNotificationFilter.status,
    }) as Promise<NotificationPreviewPage>,
    queryKey: ["top-nav-recent-notifications", user?.id, activeNotificationFilter.key, notificationSearch],
    retry: 1,
  });
  const notificationAction = useMutation({
    mutationFn: ({ id, type }: { id?: string; type: "read" | "read-all" }) => {
      if (type === "read-all") return markAllNotificationsRead();
      if (!id) throw new Error("Notification id is required");
      return markNotificationRead(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["top-nav-unread-notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["top-nav-recent-notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-notifications"] });
    },
  });
  const adminAccess = useQuery({
    enabled: Boolean(user),
    queryFn: () => getAdminOverview(),
    queryKey: ["top-nav-admin-access", user?.id],
    retry: false,
    staleTime: 120_000,
  });
  const { data: cmsServices = SERVICES } = useQuery({
    enabled: servicesOpen,
    queryFn: () => getServices(lang),
    queryKey: ["public-services", lang],
    staleTime: 60_000,
  });
  const { data: navProducts = PRODUCTS } = useQuery({
    enabled: productsOpen,
    queryFn: () => getProducts(lang),
    queryKey: ["public-products", lang],
    staleTime: 60_000,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const productsLabel = lang === "fa" ? "محصولات" : lang === "ar" ? "المنتجات" : "Products";
  const loginLabel = lang === "fa" ? "ورود" : lang === "ar" ? "دخول" : "Sign in";
  const logoutLabel = lang === "fa" ? "خروج" : lang === "ar" ? "خروج" : "Sign out";
  const supportLabel = lang === "fa" ? "پشتیبانی" : lang === "ar" ? "الدعم" : "Support";
  const setayeshLabel = lang === "fa" ? "ستایش" : lang === "ar" ? "ستايش" : "Setayesh";
  const ticketsLabel = lang === "fa" ? "تیکت‌ها" : lang === "ar" ? "التذاكر" : "Tickets";
  const chatLabel = lang === "fa" ? "چت آنلاین" : lang === "ar" ? "الدردشة المباشرة" : "Chat online";
  const helpDeskLabel = lang === "fa" ? "میز کمک" : lang === "ar" ? "مكتب المساعدة" : "Help desk";
  const ticketsDesc = lang === "fa" ? "ثبت و پیگیری درخواست پشتیبانی" : lang === "ar" ? "إرسال ومتابعة طلبات الدعم" : "Submit & track support requests";
  const chatDesc = lang === "fa" ? "گفتگوی فوری با کارشناسان" : lang === "ar" ? "محادثة فورية مع الخبراء" : "Instant chat with our experts";
  const helpDeskDesc = lang === "fa" ? "راهنماها و مستندات کمکی" : lang === "ar" ? "أدلة ومستندات المساعدة" : "Guides & knowledge base";
  const aboutDesc = lang === "fa" ? "تیم، مسیر و تجربه ستایش" : lang === "ar" ? "فريق ستايش ومسيرها وخبرتها" : "Team, story, and experience";
  const contactDesc = lang === "fa" ? "راه‌های ارتباط و شروع گفتگو" : lang === "ar" ? "طرق التواصل وبدء الحوار" : "Contact details and project inquiry";

  const supportItems: { icon: ComponentType<{ className?: string }>; title: string; desc: string; href: string }[] = [
    { icon: Ticket, title: ticketsLabel, desc: ticketsDesc, href: user ? "/user/support/tickets" : "/auth?redirect=%2Fdashboard%2Fsupport%2Ftickets" },
    { icon: MessageCircle, title: chatLabel, desc: chatDesc, href: user ? "/user/support/live-chat" : "/auth?redirect=%2Fdashboard%2Fsupport%2Flive-chat" },
    { icon: Headphones, title: helpDeskLabel, desc: helpDeskDesc, href: user ? "/user/support/help" : "/auth?redirect=%2Fdashboard%2Fsupport%2Fhelp" },
  ];
  const setayeshItems: { icon: ComponentType<{ className?: string }>; title: string; desc: string; href: string }[] = [
    { icon: Info, title: t.nav.about, desc: aboutDesc, href: "/about" },
    { icon: Mail, title: t.nav.contact, desc: contactDesc, href: "/contact" },
  ];

  const services = cmsServices.slice(0, 8).map((s) => ({
    slug: s.slug,
    icon: s.icon,
    title: s.title[builtInLang],
    desc: s.short[builtInLang],
  }));




  const isAdmin = Boolean(adminAccess.data?.access?.isSuperAdmin || (adminAccess.data?.access?.permissions?.length ?? 0) > 0);
  const userName = [user?.profile?.firstName, user?.profile?.lastName].filter(Boolean).join(" ") || user?.email || "";
  const initial = (userName || "?").charAt(0).toUpperCase();
  const unreadCount = unreadNotifications.data?.count ?? 0;
  const notificationItems = recentNotifications.data?.items ?? [];
  const cartItems = cart.data?.items ?? [];
  const cartCount = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const navLinkClass = "inline-flex items-center gap-1.5 px-2.5 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-foreground/5 2xl:px-3";
  const mobileLinkClass = "flex items-center gap-3 rounded-xl border border-border/70 bg-foreground/5 px-3 py-3 text-sm font-semibold text-foreground transition hover:border-primary/35 hover:bg-foreground/10";
  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Products dropdown — categories from products-data
  const categoryMeta: Record<ProductCategory, { icon: ComponentType<{ className?: string }>; label: string; desc: string }> = {
    "silver-bars": { icon: Coins, label: "شمش نقره", desc: "شمش سرمایه‌گذاری با گواهی عیار" },
    "silver-capsules": { icon: ShoppingBag, label: "کپسول نقره", desc: "بسته‌های پلمب برای هدیه و سرمایه‌گذاری" },
    "silver-granules": { icon: Coins, label: "ساچمه نقره", desc: "ساچمه خالص با وزن تضمین‌شده" },
  };
  const productCategoryKeys = Array.from(new Set(navProducts.map((product) => product.category)));
  const productCategories = productCategoryKeys.map(c => ({
    key: c,
    ...categoryMeta[c],
    count: navProducts.filter(p => p.category === c).length,
  }));

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav className={`relative flex w-full max-w-7xl items-center justify-between gap-4 rounded-2xl border border-border px-4 py-2.5 transition-all ${scrolled ? "glass glow-ring" : "bg-transparent"}`} dir={dir}>
        <Link href="/#top" className="flex items-center gap-2">
          <BrandLogo className="h-14 w-14" />
          <div className="hidden sm:block text-[10px] font-mono text-muted-foreground leading-tight">OS · v15.0</div>
        </Link>
        <ul className="hidden xl:flex items-center gap-0.5 2xl:gap-1">
          <li>
            <Link href="/" className={navLinkClass}>
              <Home className="h-3.5 w-3.5" />
              {t.nav.home}
            </Link>
          </li>
          {/* Products mega-dropdown */}
          <li
            className="relative"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button
              type="button"
              className={navLinkClass}
              aria-expanded={productsOpen}
              onClick={() => setProductsOpen((current) => !current)}
            >
              <Package className="h-3.5 w-3.5" />
              {productsLabel}
              <ChevronDown className={`h-3 w-3 transition-transform ${productsOpen ? "rotate-180" : ""}`} />
            </button>
            {productsOpen && (
              <div className="absolute top-full start-0 pt-2 z-50 w-[640px] max-w-[92vw]">
                <div className="glass rounded-2xl border border-border p-3 shadow-[0_20px_60px_-20px_var(--glow)]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {productCategories.map(c => {
                      const Icon = c.icon;
                      return (
                        <Link
                          key={c.key}
                          href={`/products#cat=${encodeURIComponent(c.key)}` as never}
                          className="group flex items-start gap-3 rounded-xl p-3 hover:bg-foreground/5 transition"
                          onClick={() => setProductsOpen(false)}
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-foreground/5 group-hover:bg-gradient-gold transition-colors">
                            <Icon className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-colors" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-foreground truncate">{c.label}</span>
                              <span className="text-[10px] font-mono text-muted-foreground bg-foreground/5 px-1.5 py-0.5 rounded">{c.count}</span>
                            </span>
                            <span className="block text-[11px] text-muted-foreground leading-5 line-clamp-1">{c.desc}</span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                  <Link href="/products"
                    onClick={() => setProductsOpen(false)}
                    className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-foreground/5 px-3 py-2 text-xs font-semibold text-foreground hover:bg-gradient-gold hover:text-primary-foreground transition"
                  >
                    <Package className="h-3.5 w-3.5" />
                    {lang === "fa" ? "همه محصولات" : lang === "ar" ? "كل المنتجات" : "Browse all products"}
                  </Link>
                </div>
              </div>
            )}
          </li>

          <li>
            <Link href="/blog" className={navLinkClass}>
              <BookOpen className="h-3.5 w-3.5" />
              {t.nav.blog}
            </Link>
          </li>
          {/* Services mega-dropdown */}
          <li
            className="relative"
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <button
              type="button"
              className={navLinkClass}
              aria-expanded={servicesOpen}
              onClick={() => setServicesOpen((current) => !current)}
            >
              <Boxes className="h-3.5 w-3.5" />
              {t.nav.services}
              <ChevronDown className={`h-3 w-3 transition-transform ${servicesOpen ? "rotate-180" : ""}`} />
            </button>
            {servicesOpen && (
              <div className="absolute top-full start-0 pt-2 z-50 w-[640px] max-w-[92vw]">
                <div className="glass rounded-2xl border border-border p-3 shadow-[0_20px_60px_-20px_var(--glow)]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {services.map(s => {
                      const Icon = s.icon;
                      return (
                        <Link
                          key={s.slug} href={`/services/${s.slug}`}
                          className="group flex items-start gap-3 rounded-xl p-3 hover:bg-foreground/5 transition"
                          onClick={() => setServicesOpen(false)}
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-foreground/5 group-hover:bg-gradient-gold transition-colors">
                            <Icon className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-colors" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-foreground truncate">{s.title}</span>
                            <span className="block text-[11px] text-muted-foreground leading-5 line-clamp-1">{s.desc}</span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                  <Link href="/services"
                    onClick={() => setServicesOpen(false)}
                    className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-foreground/5 px-3 py-2 text-xs font-semibold text-foreground hover:bg-gradient-gold hover:text-primary-foreground transition"
                  >
                    <Boxes className="h-3.5 w-3.5" />
                    {lang === "fa" ? "همه خدمات" : lang === "ar" ? "كل الخدمات" : "Browse all services"}
                  </Link>
                </div>
              </div>
            )}
          </li>
          {/* Support dropdown — all items gated behind /auth */}
          <li
            className="relative"
            onMouseEnter={() => setSupportOpen(true)}
            onMouseLeave={() => setSupportOpen(false)}
          >
            <button
              type="button"
              className={navLinkClass}
              aria-expanded={supportOpen}
              onClick={() => setSupportOpen((current) => !current)}
            >
              <LifeBuoy className="h-3.5 w-3.5" />
              {supportLabel}
              <ChevronDown className={`h-3 w-3 transition-transform ${supportOpen ? "rotate-180" : ""}`} />
            </button>
            {supportOpen && (
              <div className="absolute top-full start-0 pt-2 z-50 w-[320px] max-w-[92vw]">
                <div className="glass rounded-2xl border border-border p-2 grid grid-cols-1 gap-1 shadow-[0_20px_60px_-20px_var(--glow)]">
                  {supportItems.map(s => {
                    const Icon = s.icon;
                    return (
                      <Link
                        key={s.title} href={s.href as never}
                        className="group flex items-start gap-3 rounded-xl p-3 hover:bg-foreground/5 transition"
                        onClick={() => setSupportOpen(false)}
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-foreground/5 group-hover:bg-gradient-gold transition-colors">
                          <Icon className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-colors" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-foreground truncate">{s.title}</span>
                          <span className="block text-[11px] text-muted-foreground leading-5 line-clamp-2">{s.desc}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </li>
          <li
            className="relative"
            onMouseEnter={() => setSetayeshOpen(true)}
            onMouseLeave={() => setSetayeshOpen(false)}
          >
            <button
              type="button"
              className={navLinkClass}
              aria-expanded={setayeshOpen}
              onClick={() => setSetayeshOpen((current) => !current)}
            >
              <Info className="h-3.5 w-3.5" />
              {setayeshLabel}
              <ChevronDown className={`h-3 w-3 transition-transform ${setayeshOpen ? "rotate-180" : ""}`} />
            </button>
            {setayeshOpen && (
              <div className="absolute top-full start-0 pt-2 z-50 w-[320px] max-w-[92vw]">
                <div className="glass rounded-2xl border border-border p-2 grid grid-cols-1 gap-1 shadow-[0_20px_60px_-20px_var(--glow)]">
                  {setayeshItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href as never}
                        className="group flex items-start gap-3 rounded-xl p-3 hover:bg-foreground/5 transition"
                        onClick={() => setSetayeshOpen(false)}
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-foreground/5 group-hover:bg-gradient-gold transition-colors">
                          <Icon className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-colors" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-foreground truncate">{item.title}</span>
                          <span className="block text-[11px] text-muted-foreground leading-5 line-clamp-2">{item.desc}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </li>
        </ul>

        <div className="flex items-center gap-2">
          <button
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground xl:hidden"
            onClick={() => {
              setCartOpen(false);
              setNotificationsOpen(false);
              setUserMenu(false);
              setMobileMenuOpen((current) => !current);
            }}
            type="button"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          {/* Lang switcher */}
          <div className="relative">
            <button
              onClick={() => setOpen(o => !o)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition"
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="uppercase font-mono">{lang}</span>
            </button>
            {open && (
              <div onMouseLeave={() => setOpen(false)} className="absolute end-0 mt-2 w-32 glass rounded-lg border border-border p-1 z-50">
                {languages.map(language => (
                  <button
                    key={language.code}
                    onClick={() => { setLang(language.code); setOpen(false); }}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-xs hover:bg-foreground/5 ${language.code === lang ? "text-primary" : "text-foreground"}`}
                  >
                    <span>{languageLabel(language)}</span>
                    <span className="font-mono opacity-60 uppercase">{language.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Theme */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {!user ? (
            <Link
              aria-label="Cart"
              className="relative grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
              href={"/cart" as never}
            >
              <ShoppingCart className="h-4 w-4" />
            </Link>
          ) : null}

          {/* Auth */}
          {user ? (
            <>
            <div className="relative">
              <button
                aria-label="Cart"
                className="relative grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
                onClick={() => {
                  setNotificationsOpen(false);
                  setCartOpen((current) => !current);
                }}
              >
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 ? (
                  <span className="absolute -end-1 -top-1 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                ) : null}
              </button>
              {cartOpen ? (
                <div dir={dir} onMouseLeave={() => setCartOpen(false)} className="absolute end-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border glass p-2 text-start shadow-[0_20px_60px_-24px_var(--glow)] rtl:text-right ltr:text-left">
                  <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{lang === "fa" ? "سبد خرید" : lang === "ar" ? "سلة التسوق" : "Cart"}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{cartCount} {lang === "fa" ? "آیتم" : lang === "ar" ? "عنصر" : "items"}</p>
                    </div>
                    <span className="rounded-full border border-border px-2 py-1 text-[10px] font-semibold text-primary">{formatCartMoney(cart.data)}</span>
                  </div>
                  <div className="max-h-80 overflow-auto py-1">
                    {cart.isLoading ? (
                      <div className="space-y-2 p-2">
                        {Array.from({ length: 3 }).map((_, index) => <div className="h-14 animate-pulse rounded-lg bg-foreground/5" key={index} />)}
                      </div>
                    ) : cartItems.length ? (
                      cartItems.slice(0, 5).map((item) => (
                        <Link
                          className="block rounded-lg px-3 py-2.5 transition hover:bg-foreground/5"
                          href={`/products/${item.product.slug}` as never}
                          key={item.id}
                          onClick={() => setCartOpen(false)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-semibold text-foreground">{cartTitle(item.product.title, lang, item.product.slug)}</span>
                              <span className="mt-1 block text-[11px] text-muted-foreground">x{item.quantity} · {formatCartLine(item.unitPrice, item.currency)}</span>
                            </span>
                            <span className="shrink-0 rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">+{item.quantity}</span>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                        {lang === "fa" ? "سبد خرید شما خالی است." : lang === "ar" ? "سلة التسوق فارغة." : "Your cart is empty."}
                      </div>
                    )}
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <Link
                      className="flex items-center justify-center gap-2 rounded-lg border border-border bg-foreground/5 px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-foreground/10"
                      href="/cart"
                      onClick={() => setCartOpen(false)}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      {lang === "fa" ? "مشاهده" : lang === "ar" ? "عرض" : "View"}
                    </Link>
                    <Link
                      className="flex items-center justify-center gap-2 rounded-lg bg-gradient-gold px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:scale-[1.02]"
                      href={"/checkout" as never}
                      onClick={() => setCartOpen(false)}
                    >
                      <ReceiptText className="h-3.5 w-3.5" />
                      {lang === "fa" ? "تسویه" : lang === "ar" ? "الدفع" : "Checkout"}
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="relative">
              <button
                aria-label="Notifications"
                className={`relative grid h-9 w-9 place-items-center rounded-lg border border-border transition hover:bg-foreground/5 hover:text-foreground ${notificationsOpen ? "border-primary/50 text-foreground" : "text-muted-foreground"}`}
                onClick={() => {
                  setCartOpen(false);
                  setUserMenu(false);
                  setNotificationsOpen((current) => !current);
                }}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 ? (
                  <span className="absolute -end-1 -top-1 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-[0_0_0_2px_var(--background)]">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </button>
              {notificationsOpen ? (
                <div dir={dir} onMouseLeave={() => setNotificationsOpen(false)} className="absolute end-0 z-50 mt-2 w-[27rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border glass text-start shadow-[0_20px_70px_-24px_var(--glow)]">
                  <div className="border-b border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-foreground">{notificationCopy(lang).title}</p>
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{notificationCopy(lang).subtitle}</p>
                      </div>
                      <button
                        className="shrink-0 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-semibold text-primary transition hover:bg-foreground/5 disabled:text-muted-foreground"
                        disabled={!unreadCount || notificationAction.isPending}
                        onClick={() => notificationAction.mutate({ type: "read-all" })}
                      >
                        <CheckCircle2 className="me-1 inline h-3.5 w-3.5" />
                        {notificationCopy(lang).markAll}
                      </button>
                    </div>

                    <div className="relative mt-3">
                      <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        className="h-9 w-full rounded-lg border border-border bg-background/35 px-3 ps-9 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50"
                        onChange={(event) => setNotificationSearch(event.target.value)}
                        placeholder={notificationCopy(lang).search}
                        value={notificationSearch}
                      />
                    </div>

                    <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
                      {notificationFilters.map((filter) => {
                        const Icon = filter.icon;
                        const active = filter.key === activeNotificationFilter.key;
                        return (
                          <button
                            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-foreground/5 text-muted-foreground hover:text-foreground"}`}
                            key={filter.key}
                            onClick={() => setNotificationFilter(filter.key)}
                            title={filter.desc}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {filter.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-px border-b border-border bg-border/50">
                    {notificationFilters.slice(2, 11).map((filter) => {
                      const Icon = filter.icon;
                      return (
                        <Link
                          className="group bg-background/45 p-2.5 transition hover:bg-foreground/5"
                          href={filter.href as never}
                          key={`route-${filter.key}`}
                          onClick={() => setNotificationsOpen(false)}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5 text-primary" />
                            <span className="truncate text-[11px] font-semibold text-foreground">{filter.label}</span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-muted-foreground">{filter.desc}</p>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="max-h-80 overflow-auto p-2">
                    {recentNotifications.isLoading ? (
                      <div className="space-y-2 p-2">
                        {Array.from({ length: 3 }).map((_, index) => <div className="h-14 animate-pulse rounded-lg bg-foreground/5" key={index} />)}
                      </div>
                    ) : notificationItems.length ? (
                      notificationItems.map((item) => (
                        <Link
                          className="group block rounded-lg border border-transparent px-3 py-2.5 transition hover:border-border hover:bg-foreground/5"
                          href={(item.actionUrl || "/user/notifications") as never}
                          key={item.id}
                          onClick={() => {
                            setNotificationsOpen(false);
                            if (item.status === "UNREAD") notificationAction.mutate({ id: item.id, type: "read" });
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="min-w-0">
                              <span className="flex min-w-0 items-center gap-2">
                                {item.status === "UNREAD" ? <span className="size-2 shrink-0 rounded-full bg-primary" /> : null}
                                <span className="block truncate text-xs font-semibold text-foreground">{item.title}</span>
                              </span>
                              <span className="mt-1 line-clamp-2 block text-[11px] leading-5 text-muted-foreground">{item.body}</span>
                              <span className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                                <span className="rounded-full border border-border px-1.5 py-0.5">{notificationEventLabel(item.event, item.entityType, lang)}</span>
                                {item.createdAt ? <span>{formatNotificationDate(item.createdAt, lang)}</span> : null}
                              </span>
                            </span>
                            <span className={`mt-0.5 shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] ${notificationPriorityClass(item.priority)}`}>{notificationPriorityLabel(item.priority, lang)}</span>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                        {notificationCopy(lang).empty}
                      </div>
                    )}
                  </div>
                  <Link
                    className="m-2 flex items-center justify-center gap-2 rounded-lg border border-border bg-foreground/5 px-3 py-2.5 text-xs font-semibold text-foreground transition hover:bg-gradient-gold hover:text-primary-foreground"
                    href="/user/notifications"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    <Bell className="h-3.5 w-3.5" />
                    {notificationCopy(lang).viewAll}
                  </Link>
                </div>
              ) : null}
            </div>
            <div className="relative">
              <button
                onClick={() => setUserMenu(o => !o)}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-foreground/5 ps-1.5 pe-3 text-xs hover:border-primary/40 transition"
              >
                <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-gold text-[11px] font-bold text-primary-foreground">
                  {initial}
                </span>
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {userName}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
              {userMenu && (
                <div dir={dir} onMouseLeave={() => setUserMenu(false)} className="absolute end-0 mt-2 w-72 glass rounded-xl border border-border p-2 text-start z-50 shadow-[0_20px_60px_-24px_var(--glow)]">
                  <div className="px-3 py-2 text-[11px] text-muted-foreground border-b border-border mb-1 truncate" dir="ltr">
                    {user.email}
                  </div>
                  {isAdmin ? (
                    <Link href={"/admin" as never}
                      onClick={() => setUserMenu(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-primary hover:bg-foreground/5 transition"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" /> {lang === "fa" ? "داشبورد مدیریت" : lang === "ar" ? "لوحة الإدارة" : "Admin dashboard"}
                    </Link>
                  ) : null}
                  <Link href="/user"
                    onClick={() => setUserMenu(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-foreground hover:bg-foreground/5 transition"
                  >
                    <Home className="h-3.5 w-3.5" /> {lang === "fa" ? "داشبورد من" : lang === "ar" ? "لوحة التحكم" : "My dashboard"}
                  </Link>
                  <Link href="/user/profile" onClick={() => setUserMenu(false)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-foreground hover:bg-foreground/5 transition">
                    <User className="h-3.5 w-3.5" /> {lang === "fa" ? "پروفایل" : lang === "ar" ? "الملف الشخصي" : "Profile"}
                  </Link>
                  <Link href="/user/support/tickets" onClick={() => setUserMenu(false)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-foreground hover:bg-foreground/5 transition">
                    <Ticket className="h-3.5 w-3.5" /> {ticketsLabel}
                  </Link>
                  <Link href="/user/support/live-chat" onClick={() => setUserMenu(false)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-foreground hover:bg-foreground/5 transition">
                    <MessageCircle className="h-3.5 w-3.5" /> {chatLabel}
                  </Link>
                  <Link href="/user/invoices" onClick={() => setUserMenu(false)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-foreground hover:bg-foreground/5 transition">
                    <ReceiptText className="h-3.5 w-3.5" /> {lang === "fa" ? "فاکتورها" : lang === "ar" ? "الفواتير" : "Invoices"}
                  </Link>
                  <button
                    onClick={async () => { setUserMenu(false); await signOut(); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-foreground hover:bg-foreground/5 transition"
                  >
                    <LogOut className="h-3.5 w-3.5" /> {logoutLabel}
                  </button>
                </div>
              )}
            </div>
            </>
          ) : (
            <Link href="/auth"
              className="group relative inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-lg bg-gradient-gold px-4 text-sm font-semibold text-primary-foreground shadow-[0_0_30px_-8px_var(--glow)] transition-transform hover:scale-[1.03] active:scale-95"
            >
              <LogIn className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10">{loginLabel}</span>
              <span className="absolute inset-0 animate-shimmer opacity-50" />
            </Link>
          )}
        </div>
        {mobileMenuOpen ? (
          <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-[calc(100vh-6rem)] overflow-auto rounded-2xl border border-border glass p-3 text-start shadow-[0_24px_80px_-28px_var(--glow)] xl:hidden">
            <div className="grid gap-2">
              <Link href="/" className={mobileLinkClass} onClick={closeMobileMenu}>
                <Home className="h-4 w-4 text-primary" />
                {t.nav.home}
              </Link>
              <Link href="/products" className={mobileLinkClass} onClick={closeMobileMenu}>
                <Package className="h-4 w-4 text-primary" />
                {productsLabel}
              </Link>
              <Link href="/blog" className={mobileLinkClass} onClick={closeMobileMenu}>
                <BookOpen className="h-4 w-4 text-primary" />
                {t.nav.blog}
              </Link>
              <Link href="/services" className={mobileLinkClass} onClick={closeMobileMenu}>
                <Boxes className="h-4 w-4 text-primary" />
                {t.nav.services}
              </Link>
              <Link href={user ? "/user/support/tickets" : "/auth"} className={mobileLinkClass} onClick={closeMobileMenu}>
                <LifeBuoy className="h-4 w-4 text-primary" />
                {supportLabel}
              </Link>
            </div>

            <div className="mt-3 rounded-2xl border border-border/70 bg-background/25 p-2">
              <div className="flex items-center gap-2 px-2 pb-2 text-xs font-bold text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
                {setayeshLabel}
              </div>
              <div className="grid gap-1">
                {setayeshItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href as never}
                      className="flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-foreground/5"
                      onClick={closeMobileMenu}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-foreground/5">
                        <Icon className="h-4 w-4 text-primary" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-foreground">{item.title}</span>
                        <span className="block text-[11px] leading-5 text-muted-foreground">{item.desc}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </nav>
    </motion.header>
  );
}

function cartTitle(title: Record<string, string> | string, lang: string, fallback: string) {
  if (typeof title === "string") return title;
  return title[lang] ?? title.fa ?? title.en ?? fallback;
}

function formatCartMoney(cart?: CartSummary) {
  if (!cart) return "0";
  return formatCartLine(cart.total, cart.currency);
}

function formatCartLine(value?: string | number, currency = "USD") {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en", { currency, style: "currency" }).format(Number.isFinite(amount) ? amount : 0);
}

function notificationCopy(lang: string) {
  const copy = {
    ar: {
      empty: "لا توجد إشعارات تطابق هذا الفلتر.",
      markAll: "قراءة الكل",
      search: "ابحث في الإشعارات",
      subtitle: "طلبات، مدفوعات، دعم، أمان، نظام، تسويق وكل تنبيهات الحساب في مكان واحد.",
      title: "مركز الإشعارات",
      viewAll: "عرض كل الإشعارات",
    },
    en: {
      empty: "No notifications match this filter.",
      markAll: "Mark all read",
      search: "Search notifications",
      subtitle: "Orders, payments, support, security, system, marketing, and every account signal in one place.",
      title: "Notification center",
      viewAll: "View all notifications",
    },
    fa: {
      empty: "اعلانی با این فیلتر پیدا نشد.",
      markAll: "خواندن همه",
      search: "جستجوی اعلان‌ها",
      subtitle: "سفارش‌ها، پرداخت‌ها، پشتیبانی، امنیت، سیستم، بازاریابی و همه هشدارهای حساب در یک مرکز.",
      title: "مرکز اعلان‌ها",
      viewAll: "مشاهده همه اعلان‌ها",
    },
  };
  return copy[lang as keyof typeof copy] ?? copy.fa;
}

function getNotificationFilters(lang: string): NotificationFilterOption[] {
  const l = {
    all: lang === "fa" ? "همه" : lang === "ar" ? "الكل" : "All",
    downloads: lang === "fa" ? "دانلودها" : lang === "ar" ? "التنزيلات" : "Downloads",
    downloadsDesc: lang === "fa" ? "فایل‌های محصول، لینک‌های امن و دسترسی دانلود" : lang === "ar" ? "ملفات المنتجات والروابط الآمنة ووصول التنزيل" : "Product files, signed links, and download access",
    invoices: lang === "fa" ? "فاکتورها" : lang === "ar" ? "الفواتير" : "Invoices",
    invoicesDesc: lang === "fa" ? "فاکتورهای صادرشده، سررسید و PDF" : lang === "ar" ? "الفواتير الصادرة والاستحقاق وPDF" : "Issued invoices, due dates, and PDFs",
    liveChat: lang === "fa" ? "چت زنده" : lang === "ar" ? "الدردشة" : "Live chat",
    liveChatDesc: lang === "fa" ? "پیام‌های گفتگو، تخصیص کارشناس و پایان مکالمه" : lang === "ar" ? "رسائل المحادثة وإسناد الوكيل وإغلاق المحادثة" : "Conversation replies, assignment, and close notices",
    marketing: lang === "fa" ? "کمپین‌ها" : lang === "ar" ? "الحملات" : "Campaigns",
    marketingDesc: lang === "fa" ? "اطلاعیه‌های محصول، پیشنهادها و پیام‌های بازاریابی" : lang === "ar" ? "إعلانات المنتجات والعروض ورسائل التسويق" : "Product announcements, offers, and marketing messages",
    orders: lang === "fa" ? "سفارش‌ها" : lang === "ar" ? "الطلبات" : "Orders",
    ordersDesc: lang === "fa" ? "ایجاد، پرداخت، آماده‌سازی، تحویل و لغو سفارش" : lang === "ar" ? "إنشاء الطلب والدفع والتحضير والتسليم والإلغاء" : "Creation, payment, fulfillment, delivery, and cancellation",
    payments: lang === "fa" ? "پرداخت‌ها" : lang === "ar" ? "المدفوعات" : "Payments",
    paymentsDesc: lang === "fa" ? "پرداخت موفق، ناموفق، درگاه و اقدام‌های مالی" : lang === "ar" ? "الدفع الناجح والفاشل والبوابات والإجراءات المالية" : "Paid, failed, gateway, and payment action alerts",
    products: lang === "fa" ? "محصولات" : lang === "ar" ? "المنتجات" : "Products",
    productsDesc: lang === "fa" ? "به‌روزرسانی محصول، نسخه، مجوز و تغییرات" : lang === "ar" ? "تحديث المنتج والإصدار والترخيص والتغييرات" : "Product updates, versions, licenses, and changelog",
    referrals: lang === "fa" ? "ارجاع‌ها" : lang === "ar" ? "الإحالات" : "Referrals",
    referralsDesc: lang === "fa" ? "کلیک، تبدیل، کمیسیون و پرداخت همکاری فروش" : lang === "ar" ? "النقرات والتحويلات والعمولات ودفعات الشركاء" : "Clicks, conversions, commissions, and payouts",
    refunds: lang === "fa" ? "بازپرداخت‌ها" : lang === "ar" ? "الاستردادات" : "Refunds",
    refundsDesc: lang === "fa" ? "درخواست، تایید، رد، پردازش و تکمیل بازپرداخت" : lang === "ar" ? "طلب الاسترداد واعتماده ورفضه ومعالجته وإكماله" : "Refund request, approval, rejection, processing, and completion",
    security: lang === "fa" ? "امنیت" : lang === "ar" ? "الأمان" : "Security",
    securityDesc: lang === "fa" ? "ورود، نشست‌ها، رمز عبور، 2FA و هشدارهای حساب" : lang === "ar" ? "الدخول والجلسات وكلمة المرور و2FA وتنبيهات الحساب" : "Login, sessions, password, 2FA, and account alerts",
    support: lang === "fa" ? "تیکت‌ها" : lang === "ar" ? "التذاكر" : "Tickets",
    supportDesc: lang === "fa" ? "پاسخ تیکت، تغییر وضعیت و پیوست‌های پشتیبانی" : lang === "ar" ? "ردود التذاكر وتغييرات الحالة ومرفقات الدعم" : "Ticket replies, status changes, and support attachments",
    system: lang === "fa" ? "سیستم" : lang === "ar" ? "النظام" : "System",
    systemDesc: lang === "fa" ? "سیاست‌ها، عملیات پلتفرم، اعلان‌های سرویس و نگهداری" : lang === "ar" ? "السياسات وعمليات المنصة وإشعارات الخدمة والصيانة" : "Policies, platform operations, service notices, and maintenance",
    unread: lang === "fa" ? "خوانده‌نشده" : lang === "ar" ? "غير مقروء" : "Unread",
    unreadDesc: lang === "fa" ? "اعلان‌هایی که هنوز دیده نشده‌اند" : lang === "ar" ? "الإشعارات التي لم تتم قراءتها بعد" : "Notifications you have not read yet",
    wallet: lang === "fa" ? "کیف پول" : lang === "ar" ? "المحفظة" : "Wallet",
    walletDesc: lang === "fa" ? "مانده، برداشت، شارژ و تغییرات کیف پول" : lang === "ar" ? "الرصيد والسحب والشحن وتغييرات المحفظة" : "Balance, withdrawals, top-ups, and wallet movement",
  };

  return [
    { desc: lang === "fa" ? "همه اعلان‌های حساب" : lang === "ar" ? "كل إشعارات الحساب" : "Every account notification", href: "/user/notifications", icon: Bell, key: "all", label: l.all },
    { desc: l.unreadDesc, href: "/user/notifications", icon: AlertTriangle, key: "unread", label: l.unread, status: "UNREAD" },
    { desc: l.ordersDesc, entityType: "order", href: "/user/notifications/orders", icon: ShoppingBag, key: "orders", label: l.orders },
    { desc: l.paymentsDesc, entityType: "payment", href: "/user/notifications/payments", icon: ReceiptText, key: "payments", label: l.payments },
    { desc: l.invoicesDesc, entityType: "invoice", href: "/user/invoices", icon: FileText, key: "invoices", label: l.invoices },
    { desc: l.refundsDesc, entityType: "refund", href: "/user/payments/refunds", icon: Archive, key: "refunds", label: l.refunds },
    { desc: l.walletDesc, entityType: "wallet", href: "/user/wallet", icon: Wallet, key: "wallet", label: l.wallet },
    { desc: l.referralsDesc, entityType: "referral", href: "/user/notifications/referrals", icon: Users, key: "referrals", label: l.referrals },
    { desc: l.supportDesc, entityType: "ticket", href: "/user/notifications/support", icon: Ticket, key: "support", label: l.support },
    { desc: l.liveChatDesc, event: "live_chat", href: "/user/support/live-chat", icon: MessageCircle, key: "live-chat", label: l.liveChat },
    { desc: l.securityDesc, entityType: "security", href: "/user/account/security", icon: ShieldCheck, key: "security", label: l.security },
    { desc: l.systemDesc, entityType: "system", href: "/user/notifications/system", icon: Settings, key: "system", label: l.system },
    { desc: l.productsDesc, entityType: "product", href: "/user/purchases/updates", icon: Package, key: "products", label: l.products },
    { desc: l.downloadsDesc, entityType: "download", href: "/user/downloads", icon: FileText, key: "downloads", label: l.downloads },
    { desc: l.marketingDesc, entityType: "marketing", href: "/user/notifications", icon: Megaphone, key: "marketing", label: l.marketing },
  ];
}

function notificationPriorityClass(priority: string) {
  const value = priority.toUpperCase();
  if (value === "URGENT") return "border-destructive/40 bg-destructive/10 text-destructive";
  if (value === "HIGH") return "border-primary/40 bg-primary/10 text-primary";
  return "border-border text-muted-foreground";
}

function notificationPriorityLabel(priority: string, lang: string) {
  const value = priority.toUpperCase();
  const labels: Record<string, Record<"fa" | "en" | "ar", string>> = {
    HIGH: { ar: "مهم", en: "High", fa: "مهم" },
    LOW: { ar: "منخفض", en: "Low", fa: "کم" },
    NORMAL: { ar: "عادي", en: "Normal", fa: "عادی" },
    URGENT: { ar: "عاجل", en: "Urgent", fa: "فوری" },
  };
  return labels[value]?.[lang as "fa" | "en" | "ar"] ?? labels[value]?.fa ?? priority;
}

function notificationEventLabel(event: string | null | undefined, entityType: string | null | undefined, lang: string) {
  const key = (event || entityType || "system").toLowerCase();
  const exactLabels: Record<string, Record<"fa" | "en" | "ar", string>> = {
    "admin.test": { ar: "إشعار تجريبي للمشرف", en: "Admin test notification", fa: "اعلان آزمایشی مدیر" },
    commerce_order_created: { ar: "تم إنشاء الطلب", en: "Order created", fa: "ثبت سفارش" },
    factorcreate: { ar: "تم إنشاء الفاتورة", en: "Invoice created", fa: "ایجاد فاکتور" },
    "kyc.status": { ar: "تغيير حالة التحقق من الهوية", en: "Identity verification status", fa: "تغییر وضعیت احراز هویت" },
    "live_chat.agent_reply_sms": { ar: "رد موظف المحادثة المباشرة", en: "Live-chat agent reply", fa: "پاسخ کارشناس در گفتگوی آنلاین" },
    "order.created": { ar: "تم إنشاء الطلب", en: "Order created", fa: "ایجاد سفارش" },
    promotion_reward_credited: { ar: "إيداع مكافأة الرمز الترويجي", en: "Promotion reward credited", fa: "واریز پاداش کد تبلیغاتی" },
    referral_commission_created: { ar: "تم تسجيل مكافأة الإحالة", en: "Referral reward created", fa: "ثبت پاداش معرفی" },
    referral_silver_commission_created: { ar: "تم تسجيل مكافأة إحالة شراء الفضة", en: "Silver referral reward created", fa: "ثبت پاداش معرفی خرید نقره" },
    referral_silver_welcome_reward_credited: { ar: "تم إيداع هدية أول شراء للمستخدم المُحال", en: "Silver referral welcome reward credited", fa: "واریز هدیه اولین خرید کاربر معرفی‌شده" },
    referral_user_registered: { ar: "تم تسجيل المستخدم المُحال", en: "Referred user registered", fa: "ثبت‌نام کاربر معرفی‌شده" },
    referral_welcome_reward_credited: { ar: "تم إيداع هدية الإحالة", en: "Referral welcome reward credited", fa: "واریز هدیه معرفی" },
    refund_requested: { ar: "تم تسجيل طلب استرداد", en: "Refund requested", fa: "ثبت درخواست بازپرداخت" },
    security_new_session: { ar: "تسجيل دخول جديد إلى الحساب", en: "New account sign-in", fa: "ورود جدید به حساب" },
    "silver.delivery.status": { ar: "تغيير حالة تسليم الفضة", en: "Silver delivery status", fa: "تغییر وضعیت تحویل نقره" },
    "silver.order.completed": { ar: "اكتمل طلب الفضة", en: "Silver order completed", fa: "تکمیل سفارش نقره" },
    "support.ticket.reply": { ar: "رد على تذكرة الدعم", en: "Support ticket reply", fa: "پاسخ تیکت پشتیبانی" },
    "system.announcement": { ar: "إعلان النظام", en: "System announcement", fa: "اعلان سامانه" },
    "toman.withdrawal.created": { ar: "تم تسجيل طلب سحب التومان", en: "Toman withdrawal requested", fa: "ثبت درخواست برداشت تومان" },
    "toman.withdrawal.status": { ar: "تغيير حالة سحب التومان", en: "Toman withdrawal status", fa: "تغییر وضعیت برداشت تومان" },
    wheel_prize_won: { ar: "الفوز بجائزة العجلة", en: "Wheel prize won", fa: "برنده‌شدن جایزه گردونه" },
  };
  const locale = lang as "fa" | "en" | "ar";
  const exact = exactLabels[key];
  if (exact) return exact[locale] ?? exact.fa;

  const paymentStatus = key.match(/^payment_(pending|processing|paid|failed|cancelled|refunded)$/)?.[1];
  if (paymentStatus) {
    const statusLabels: Record<string, Record<"fa" | "en" | "ar", string>> = {
      cancelled: { ar: "إلغاء الدفع", en: "Payment cancelled", fa: "لغو پرداخت" },
      failed: { ar: "فشل الدفع", en: "Payment failed", fa: "ناموفق‌شدن پرداخت" },
      paid: { ar: "اكتمل الدفع", en: "Payment completed", fa: "تکمیل پرداخت" },
      pending: { ar: "الدفع قيد الانتظار", en: "Payment pending", fa: "در انتظار پرداخت" },
      processing: { ar: "الدفع قيد المعالجة", en: "Payment processing", fa: "پردازش پرداخت" },
      refunded: { ar: "تم رد المبلغ", en: "Payment refunded", fa: "بازپرداخت وجه" },
    };
    return statusLabels[paymentStatus][locale] ?? statusLabels[paymentStatus].fa;
  }

  const payoutStatus = key.match(/^referral_payout_(requested|pending|processing|approved|paid|failed|rejected|cancelled)$/)?.[1];
  if (payoutStatus) {
    const statusLabels: Record<string, Record<"fa" | "en" | "ar", string>> = {
      approved: { ar: "تمت الموافقة على تسوية الإحالة", en: "Referral payout approved", fa: "تأیید تسویه پاداش معرفی" },
      cancelled: { ar: "أُلغيت تسوية الإحالة", en: "Referral payout cancelled", fa: "لغو تسویه پاداش معرفی" },
      failed: { ar: "فشلت تسوية الإحالة", en: "Referral payout failed", fa: "ناموفق‌شدن تسویه پاداش معرفی" },
      paid: { ar: "دُفعت تسوية الإحالة", en: "Referral payout paid", fa: "پرداخت تسویه پاداش معرفی" },
      pending: { ar: "تسوية الإحالة قيد الانتظار", en: "Referral payout pending", fa: "انتظار برای تسویه پاداش معرفی" },
      processing: { ar: "تسوية الإحالة قيد المعالجة", en: "Referral payout processing", fa: "پردازش تسویه پاداش معرفی" },
      rejected: { ar: "رُفضت تسوية الإحالة", en: "Referral payout rejected", fa: "رد تسویه پاداش معرفی" },
      requested: { ar: "تم طلب تسوية الإحالة", en: "Referral payout requested", fa: "ثبت درخواست تسویه پاداش معرفی" },
    };
    return statusLabels[payoutStatus][locale] ?? statusLabels[payoutStatus].fa;
  }

  const labels: Record<string, Record<"fa" | "en" | "ar", string>> = {
    delivery: { ar: "تسليم", en: "Delivery", fa: "تحویل" },
    invoice: { ar: "فاتورة", en: "Invoice", fa: "فاکتور" },
    live_chat: { ar: "دردشة", en: "Live chat", fa: "چت زنده" },
    marketing: { ar: "حملة", en: "Campaign", fa: "کمپین" },
    order: { ar: "طلب", en: "Order", fa: "سفارش" },
    payment: { ar: "دفع", en: "Payment", fa: "پرداخت" },
    product: { ar: "منتج", en: "Product", fa: "محصول" },
    referral: { ar: "إحالة", en: "Referral", fa: "معرفی" },
    refund: { ar: "استرداد", en: "Refund", fa: "بازپرداخت" },
    security: { ar: "أمان", en: "Security", fa: "امنیت" },
    system: { ar: "النظام", en: "System", fa: "سیستم" },
    ticket: { ar: "تذكرة", en: "Ticket", fa: "تیکت" },
    wallet: { ar: "محفظة", en: "Wallet", fa: "کیف پول" },
  };
  const category = key.startsWith("live_chat") ? "live_chat"
    : key.startsWith("support.") ? "ticket"
      : key.startsWith("silver.delivery") ? "delivery"
        : key.startsWith("silver.order") || key.startsWith("commerce_") ? "order"
          : key.startsWith("toman.withdrawal") ? "wallet"
            : key.startsWith("kyc.") || key.startsWith("security_") ? "security"
              : key.startsWith("wheel_") || key.startsWith("promotion_") ? "marketing"
                : key.split(/[._]/)[0];
  return labels[category]?.[locale] ?? labels[category]?.fa ?? labels.system[locale] ?? labels.system.fa;
}

function formatNotificationDate(value: string, lang: string) {
  return formatPlatformDate(value, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }, lang);
}
