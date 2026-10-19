"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Star, ShoppingCart, Heart, Share2, Download, Eye, Clock, Tag, ArrowUpRight,
  Check, Shield, RefreshCw, Award, ChevronRight, Twitter, Facebook, Linkedin,
  Loader2, Minus, Plus,
} from "lucide-react";
import { SiteBackground } from "@/features/public-site/sections/Background";
import { ProductImage } from "@/domains/catalog/ProductImage";
import { PRODUCTS, getProduct, relatedProducts, formatPrice, productCategoryLabel, type Product } from "@/domains/catalog/products-data";
import { getProductFromApi } from "@/domains/catalog/products-api";
import { addCartItem } from "@/domains/commerce/commerce-api";
import { recordCustomerRecentlyViewed, saveCustomerProduct } from "@/features/customer-dashboard/api/customer-dashboard-api";
import { useAuth } from "@/shared/auth/AuthProvider";
import { platformAuth } from "@/shared/auth/platform-auth-client";
import { formatPlatformDate } from "@/shared/lib/date-format";
import { formatTomanMoney, isTomanCurrency } from "@/shared/lib/toman-money";
import { renderMarkdown } from "@/shared/lib/markdown";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { BrandLogo } from "@/shared/ui/brand-logo";
import { toast } from "@/shared/ui/sonner";

const COPY = {
  fa: {
    home: "خانه", products: "محصولات", buy: "خرید فوری", cart: "افزودن به سبد", live: "پیش‌نمایش زنده",
    wishlist: "علاقه‌مندی", share: "اشتراک‌گذاری", overview: "معرفی", features: "ویژگی‌ها",
    changelog: "اصالت و تحویل", faq: "سوالات متداول", reviews: "نظرات",
    stock: "موجودی", stockUnit: "عدد", outOfStock: "ناموجود", rating: "امتیاز", lastUpdate: "آخرین به‌روزرسانی", created: "تاریخ انتشار",
    version: "وزن", framework: "سازنده", database: "بسته‌بندی", license: "عیار",
    included: "آنچه دریافت می‌کنید", related: "محصولات مرتبط", author: "ناشر",
    secure: "پرداخت امن", support: "تحویل مطمئن", updates: "گواهی اصالت", quality: "عیار تضمینی",
    onSale: "تخفیف ویژه", off: "تخفیف",
  },
  en: {
    home: "Home", products: "Products", buy: "Buy now", cart: "Add to cart", live: "Live preview",
    wishlist: "Wishlist", share: "Share",
    overview: "Overview", features: "Features", changelog: "Changelog", faq: "FAQ", reviews: "Reviews",
    stock: "Stock", stockUnit: "items", outOfStock: "Out of stock", rating: "rating", lastUpdate: "Last update", created: "Released",
    version: "Version", framework: "Framework", database: "Database", license: "License",
    included: "What you get", related: "Related products", author: "Author",
    secure: "Secure checkout", support: "6 months support", updates: "Free updates", quality: "Quality guaranteed",
    onSale: "Limited offer", off: "OFF",
  },
  ar: {
    home: "الرئيسية", products: "المنتجات", buy: "اشترِ الآن", cart: "أضف إلى السلة", live: "معاينة حية",
    wishlist: "المفضلة", share: "مشاركة",
    overview: "نظرة عامة", features: "المميزات", changelog: "السجل", faq: "الأسئلة", reviews: "التقييمات",
    stock: "المخزون", stockUnit: "قطعة", outOfStock: "غير متوفر", rating: "تقييم", lastUpdate: "آخر تحديث", created: "تاريخ النشر",
    version: "الإصدار", framework: "الإطار", database: "قاعدة البيانات", license: "الترخيص",
    included: "ما ستحصل عليه", related: "منتجات مشابهة", author: "الناشر",
    secure: "دفع آمن", support: "دعم ۶ أشهر", updates: "تحديثات مجانية", quality: "جودة مضمونة",
    onSale: "عرض محدود", off: "خصم",
  },
};

type Tab = "overview" | "features" | "changelog" | "faq" | "reviews";

export function ProductDetailPage({ slug }: { slug: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const c = COPY[lang as keyof typeof COPY] ?? COPY.fa;
  const fallbackProduct = useMemo(() => getProduct(slug), [slug]);
  const { data, isFetched, isLoading } = useQuery({
    gcTime: 0,
    queryFn: () => getProductFromApi(slug, lang),
    queryKey: ["public-product", slug, lang],
    staleTime: 0,
  });
  const resolvedProduct = data ?? (isFetched ? fallbackProduct : undefined);
  const p = useMemo(() => resolvedProduct ?? fallbackProduct ?? PRODUCTS[0], [fallbackProduct, resolvedProduct]);
  const related = useMemo(() => data?.related?.length ? data.related : relatedProducts(slug, 4), [data, slug]);
  const [activeImg, setActiveImg] = useState(0);
  const [tab, setTab] = useState<Tab>("overview");
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState<"cart" | "buy" | null>(null);
  const [addedCount, setAddedCount] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const productId = p.id;
  const galleryKey = p.gallery.join("\u0000");
  const safeActiveImg = activeImg < p.gallery.length ? activeImg : 0;
  const activeImage = p.gallery[safeActiveImg] ?? p.cover;
  const availableStock = p.silver ? Math.max(0, Math.trunc(Number(p.silver.stockQuantity ?? 0))) : 999;

  const hasSale = p.salePrice && p.salePrice < p.price;
  const pct = hasSale ? Math.round((1 - p.salePrice! / p.price) * 100) : 0;
  const md = useMemo(() => renderMarkdown(p.description[lang]), [p, lang]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  useEffect(() => {
    if (!productId || !user) return;
    void recordCustomerRecentlyViewed(productId).catch(() => undefined);
  }, [productId, user]);

  useEffect(() => {
    setActiveImg(0);
    setQuantity(1);
  }, [galleryKey, p.slug]);

  async function ensureSignedIn() {
    if (platformAuth.getAccessToken() || user) return true;
    toast.info(t("Please sign in to continue."));
    router.push(`/auth?redirect=${encodeURIComponent(`/products/${slug}`)}`);
    return false;
  }

  async function addToCart() {
    if (!(await ensureSignedIn())) return;
    if (!productId) {
      toast.error(t("This product cannot be added right now."));
      return;
    }
    setBusy("cart");
    try {
      await addCartItem({ productId, productSlug: p.slug, quantity });
      toast.success(t("Added to cart."));
      setAddedCount((current) => current + quantity);
      void queryClient.invalidateQueries({ queryKey: ["commerce-cart"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not add the product to your cart."));
    } finally {
      setBusy(null);
    }
  }

  async function buyNow() {
    if (!(await ensureSignedIn())) return;
    if (!productId) {
      toast.error(t("This product cannot be purchased right now."));
      return;
    }
    setBusy("buy");
    try {
      router.push(`/user/delivery?product=${encodeURIComponent(productId)}` as never);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Checkout failed."));
    } finally {
      setBusy(null);
    }
  }

  async function toggleWishlist() {
    if (!(await ensureSignedIn())) return;
    if (!productId) {
      toast.error(t("This product cannot be saved right now."));
      return;
    }
    try {
      await saveCustomerProduct({ productId });
      setLiked(true);
      toast.success(t("Product saved."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not save the product."));
    }
  }

  if (!resolvedProduct && isLoading) {
    return <main className="grid min-h-screen place-items-center bg-background text-foreground"><Loader2 className="size-8 animate-spin text-primary" /></main>;
  }

  if (!resolvedProduct && isFetched) {
    return (
      <main className="relative min-h-screen text-foreground">
        <SiteBackground />
        <section className="mx-auto max-w-2xl px-6 pb-28 pt-40 text-center">
          <h1 className="text-3xl font-black">{t("Product not found")}</h1>
          <p className="mt-3 text-muted-foreground">{t("This product is not published or its address is incorrect.")}</p>
          <Link className="mt-6 inline-flex rounded-xl bg-gradient-gold px-5 py-3 font-bold text-primary-foreground" href="/products">{t("Back to silver products")}</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen text-foreground">
      <SiteBackground />

      {/* Breadcrumbs */}
      <section className="relative pt-32 pb-4">
        <div className="mx-auto max-w-7xl px-6">
          <nav className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Link href="/" className="hover:text-foreground">{c.home}</Link>
            <ChevronRight className="h-3 w-3 rtl:rotate-180" />
            <Link href="/products" className="hover:text-foreground">{c.products}</Link>
            <ChevronRight className="h-3 w-3 rtl:rotate-180" />
            <span className="text-foreground truncate">{p.title[lang]}</span>
          </nav>
        </div>
      </section>

      {/* Hero */}
      <section className="relative pb-12">
        <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-[1fr_400px] gap-8">
          {/* Gallery + meta */}
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              <span className="rounded bg-primary/10 text-primary px-2 py-0.5">{productCategoryLabel(p, "fa")}</span>
            </div>
            <h1 className="mt-3 font-display text-3xl sm:text-5xl font-black leading-tight">{p.title[lang]}</h1>
            <p className="mt-3 text-muted-foreground max-w-2xl">{p.short[lang]}</p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground">
              <span className="inline-flex items-center gap-1 text-primary">
                <Star className="h-3.5 w-3.5 fill-primary" /> {p.rating.toFixed(2)} ({p.reviews})
              </span>
              <span>· {formatProductStock(p, lang, c.stock, c.stockUnit, c.outOfStock)}</span>
              {p.silver?.weightGrams ? <span>· {p.silver.weightGrams.toLocaleString(lang)} {t("grams")}</span> : null}
              <span>· {c.lastUpdate}: {formatPlatformDate(p.lastUpdate, { dateStyle: "medium" }, lang)}</span>
            </div>

            {/* Main gallery */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
              className="mt-8 relative aspect-square overflow-hidden rounded-3xl border border-border bg-white shadow-[0_28px_90px_-55px_var(--glow)] sm:aspect-[16/11]"
            >
              <ProductImage key={`${p.slug}:${activeImage}`} alt={`${p.title[lang]} - تصویر ${safeActiveImg + 1}`} imageClassName="p-4 transition-all duration-500 sm:p-8" src={activeImage} />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/25 to-transparent" />
              <div className="absolute bottom-4 start-4 flex flex-wrap gap-2">
                {p.silver?.weightGrams ? <span className="rounded-full bg-black/65 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">{p.silver.weightGrams.toLocaleString(lang)} {t("grams")}</span> : null}
                {p.silver?.purity ? <span className="rounded-full bg-black/65 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">{t("Purity")} {p.silver.purity}</span> : null}
                {p.silver?.manufacturer ? <span className="rounded-full bg-black/65 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">{p.silver.manufacturer}</span> : null}
              </div>
            </motion.div>

            {/* Thumbnails */}
            <div className="mt-4 grid grid-cols-4 gap-3">
              {p.gallery.map((g, i) => (
                <button
                  key={`${g}:${i}`}
                  onClick={() => setActiveImg(i)}
                  className={`relative aspect-[16/10] overflow-hidden rounded-xl border transition ${i === safeActiveImg ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-foreground/30"}`}
                >
                  <div className="absolute inset-0">
                    <ProductImage key={g} alt={`${p.title[lang]} thumbnail ${i + 1}`} fit="cover" src={g} />
                  </div>
                  <div className="absolute inset-0 dot-grid opacity-30" />
                </button>
              ))}
            </div>

            {/* Tabs */}
            <div className="mt-10 border-b border-border">
              <div className="flex items-center gap-1 overflow-x-auto">
                {(["overview", "features", "changelog", "faq", "reviews"] as Tab[]).map((tk) => (
                  <button
                    key={tk}
                    onClick={() => setTab(tk)}
                    className={`relative px-4 py-3 text-sm transition whitespace-nowrap ${tab === tk ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {c[tk]}
                    {tab === tk && <span className="absolute inset-x-3 -bottom-px h-0.5 bg-gradient-gold rounded-full" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              {tab === "overview" && <article>{md.nodes}</article>}
              {tab === "features" && (
                <ul className="grid sm:grid-cols-2 gap-3">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card/40 p-4">
                      <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-md bg-primary/15 text-primary">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-sm">{f[lang]}</span>
                    </li>
                  ))}
                </ul>
              )}
              {tab === "changelog" && (
                <ol className="relative ps-6 space-y-6 border-s border-border">
                  {p.changelog.map((cl) => (
                    <li key={cl.version} className="relative">
                      <span className="absolute -start-[29px] top-1 grid h-5 w-5 place-items-center rounded-full bg-gradient-gold text-primary-foreground text-[10px] font-mono">
                        v
                      </span>
                      <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                        <span className="text-foreground font-bold">v{cl.version}</span>
                        <span>· {formatPlatformDate(cl.date, { dateStyle: "medium" }, lang)}</span>
                      </div>
                      <p className="mt-1 text-sm">{cl.notes[lang]}</p>
                    </li>
                  ))}
                </ol>
              )}
              {tab === "faq" && (
                <div className="space-y-3">
                  {p.faqs.length === 0 && <p className="text-muted-foreground text-sm">—</p>}
                  {p.faqs.map((f, i) => (
                    <details key={i} className="group rounded-xl border border-border bg-card/40 p-4 open:bg-card/60">
                      <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold list-none">
                        {f.q[lang]}
                        <ChevronRight className="h-4 w-4 transition group-open:rotate-90 rtl:rotate-180 rtl:group-open:-rotate-90" />
                      </summary>
                      <p className="mt-3 text-sm text-muted-foreground leading-7">{f.a[lang]}</p>
                    </details>
                  ))}
                </div>
              )}
              {tab === "reviews" && (
                <div className="grid sm:grid-cols-[180px_1fr] gap-6">
                  <div className="rounded-2xl border border-border glass p-5 text-center">
                    <div className="font-display text-5xl font-black text-gradient-gold">{p.rating.toFixed(2)}</div>
                    <div className="mt-1 flex items-center justify-center gap-0.5 text-primary">
                      {Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-primary" />)}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">{p.reviews} {c.reviews}</div>
                  </div>
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((s) => {
                      const w = s === 5 ? 78 : s === 4 ? 16 : s === 3 ? 4 : s === 2 ? 1 : 1;
                      return (
                        <div key={s} className="flex items-center gap-3 text-xs">
                          <span className="w-10 font-mono text-muted-foreground">{s} ★</span>
                          <div className="flex-1 h-2 rounded-full bg-foreground/10 overflow-hidden">
                            <div className="h-full bg-gradient-gold" style={{ width: `${w}%` }} />
                          </div>
                          <span className="w-10 text-end font-mono text-muted-foreground">{w}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sticky purchase card */}
          <aside className="lg:sticky lg:top-28 self-start space-y-4">
            <div className="relative overflow-hidden rounded-3xl border border-border glass p-6 glow-ring">
              {hasSale && (
                <div className="absolute top-4 end-4 inline-flex items-center gap-1 rounded-full bg-gradient-gold text-primary-foreground text-[11px] font-bold font-mono px-2.5 py-1 shadow-[0_0_20px_-4px_var(--glow)]">
                  <span>−{pct}%</span>
                  <span className="opacity-80">{c.off}</span>
                </div>
              )}
              <div className="flex items-end gap-3">
                <div className="font-display text-4xl font-black text-gradient-gold leading-none">{formatPrice(p)}</div>
                {hasSale && <div className="text-sm text-muted-foreground line-through mb-1">${p.price}</div>}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{p.silver ? `${t("Purity")} ${p.silver.purity ?? 999} · ${t("In stock")} ${p.silver.stockQuantity ?? 0}` : p.license}</div>

              <div className="mt-5 space-y-2.5">
                <div className="flex h-11 items-center justify-between rounded-xl border border-border bg-background/45 p-1">
                  <button aria-label={t("Decrease quantity")} className="grid size-9 place-items-center rounded-lg transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40" disabled={quantity <= 1 || busy !== null} onClick={() => setQuantity((current) => Math.max(1, current - 1))} type="button"><Minus className="size-4" /></button>
                  <span className="text-sm font-bold">{t("Quantity")}: {quantity.toLocaleString(lang)}</span>
                  <button aria-label={t("Increase quantity")} className="grid size-9 place-items-center rounded-lg transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40" disabled={quantity >= availableStock || busy !== null} onClick={() => setQuantity((current) => Math.min(availableStock, current + 1))} type="button"><Plus className="size-4" /></button>
                </div>
                <button disabled={busy !== null || availableStock === 0} onClick={buyNow} className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-gold text-primary-foreground font-semibold shadow-[0_0_40px_-12px_var(--glow)] hover:scale-[1.02] active:scale-[0.99] transition disabled:cursor-not-allowed disabled:opacity-70">
                  {busy === "buy" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />} {c.buy}
                </button>
                <div className="flex items-center gap-2">
                  {addedCount > 0 ? <span className="grid h-10 min-w-12 place-items-center rounded-xl border border-primary/30 bg-primary/10 px-2 text-sm font-black text-primary">+{addedCount}</span> : null}
                  <button disabled={busy !== null || availableStock === 0} onClick={addToCart} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground shadow-sm transition hover:border-primary/40 hover:bg-accent hover:text-primary disabled:cursor-not-allowed disabled:opacity-70">
                    {busy === "cart" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />} {c.cart}
                  </button>
                </div>
                {!p.silver ? <a href={p.preview} target="_blank" rel="noreferrer" className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-primary/40 text-primary hover:bg-primary/10 transition"><Eye className="h-4 w-4" /> {c.live} <ArrowUpRight className="h-3.5 w-3.5" /></a> : null}
              </div>

              <div className="mt-5 flex items-center justify-center gap-2">
                <button
                  onClick={toggleWishlist}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${liked ? "border-destructive/50 text-destructive bg-destructive/10" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  <Heart className={`h-3.5 w-3.5 ${liked ? "fill-destructive" : ""}`} /> {c.wishlist}
                </button>
                <ShareMenu shareUrl={shareUrl} title={p.title[lang]} label={c.share} />
              </div>

              {/* Spec rows */}
              <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                <Row label={c.version} value={p.silver?.weightGrams ? `${p.silver.weightGrams.toLocaleString(lang)} ${t("grams")}` : `v${p.version}`} />
                <Row label={c.lastUpdate} value={formatPlatformDate(p.lastUpdate, { dateStyle: "medium" }, lang)} />
                <Row label={c.created} value={formatPlatformDate(p.created, { dateStyle: "medium" }, lang)} />
                <Row label={c.license} value={p.silver?.purity ? `${p.silver.purity}` : p.license} />
                <Row label={c.framework} value={p.silver?.manufacturer ?? p.framework.join(", ")} />
                <Row label={c.database} value={p.silver?.packaging ?? p.databases.join(", ")} />
                {p.silver?.dimensions ? <Row label={t("Dimensions")} value={p.silver.dimensions} /> : null}
                {p.silver?.certificateType ? <Row label={t("Certificate")} value={p.silver.certificateType} /> : null}
                {p.pricing ? <><Row label={t("Live silver price")} value={formatLocalizedMoney(p.pricing.buyPricePerGram, p.currency, lang)} /><Row label={t("Silver fee")} value={`${p.pricing.silverFeePercent.toLocaleString(lang)}٪`} /><Row label={t("Product making fee")} value={formatLocalizedMoney(p.pricing.makingFeeToman, p.currency, lang)} /><Row label={t("Product commission")} value={`${p.pricing.productFeePercent.toLocaleString(lang)}٪`} /><Row label={t("Product insurance")} value={`${p.pricing.insurancePercent.toLocaleString(lang)}٪`} /></> : null}
              </dl>
            </div>

            {/* Trust block */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Shield, t: c.secure },
                { icon: RefreshCw, t: c.updates },
                { icon: Clock, t: c.support },
                { icon: Award, t: c.quality },
              ].map((it, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl border border-border glass p-3 text-xs">
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/15 text-primary">
                    <it.icon className="h-3.5 w-3.5" />
                  </span>
                  {it.t}
                </div>
              ))}
            </div>

            {/* Author card */}
            <div className="rounded-2xl border border-border glass p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-3">{c.author}</div>
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-background/80 p-1">
                  <BrandLogo className="h-full w-full" />
                </span>
                <div className="min-w-0">
                  <div className="font-bold truncate">نقره لند</div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="rounded-2xl border border-border glass p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-3 inline-flex items-center gap-1">
                <Tag className="h-3 w-3" /> {t("Tags")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {p.tags.map((t) => (
                  <Link key={t} href="/products" className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:text-primary hover:border-primary/40 transition">
                    #{t}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="relative pb-28">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="font-display text-2xl sm:text-3xl font-black mb-6">{c.related}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((r) => <RelatedCard key={r.slug} p={r} stockLabel={c.stock} stockUnit={c.stockUnit} outOfStockLabel={c.outOfStock} />)}
            </div>
          </div>
        </section>
      )}

    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-end font-mono truncate">{value}</dd>
    </>
  );
}

function formatLocalizedMoney(value: number, currency: string, lang: string) {
  if (isTomanCurrency(currency)) return formatTomanMoney(value, currency, lang === "fa" ? "fa-IR" : lang);

  try {
    return new Intl.NumberFormat(lang, { currency, style: "currency" }).format(value);
  } catch {
    return `${value.toLocaleString(lang)} ${currency}`;
  }
}

function ShareMenu({ shareUrl, title, label }: { shareUrl: string; title: string; label: string }) {
  const [open, setOpen] = useState(false);
  const u = encodeURIComponent(shareUrl);
  const t = encodeURIComponent(title);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition"
      >
        <Share2 className="h-3.5 w-3.5" /> {label}
      </button>
      {open && (
        <div onMouseLeave={() => setOpen(false)} className="absolute end-0 mt-2 w-44 glass rounded-lg border border-border p-1 z-20">
          <a target="_blank" rel="noreferrer" href={`https://twitter.com/intent/tweet?url=${u}&text=${t}`} className="flex items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-foreground/5">
            <Twitter className="h-3.5 w-3.5" /> Twitter
          </a>
          <a target="_blank" rel="noreferrer" href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`} className="flex items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-foreground/5">
            <Linkedin className="h-3.5 w-3.5" /> LinkedIn
          </a>
          <a target="_blank" rel="noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${u}`} className="flex items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-foreground/5">
            <Facebook className="h-3.5 w-3.5" /> Facebook
          </a>
          <a target="_blank" rel="noreferrer" href={`https://t.me/share/url?url=${u}&text=${t}`} className="flex items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-foreground/5">
            ✈ Telegram
          </a>
        </div>
      )}
    </div>
  );
}

function RelatedCard({ p, stockLabel, stockUnit, outOfStockLabel }: { p: Product; stockLabel: string; stockUnit: string; outOfStockLabel: string }) {
  const { lang } = useI18n();
  return (
    <Link href={`/products/${p.slug}`} className="group block overflow-hidden rounded-2xl border border-border glass hover:border-primary/40 transition">
      <div className="relative aspect-[16/10] overflow-hidden">
        <ProductImage alt={p.title[lang]} fit="cover" src={p.cover} />
        <div className="absolute inset-0 dot-grid opacity-30" />
      </div>
      <div className="p-4">
        <div className="text-[10px] font-mono uppercase text-primary">{productCategoryLabel(p, "fa")}</div>
        <h3 className="mt-1 text-sm font-bold line-clamp-1 group-hover:text-primary transition">{p.title[lang]}</h3>
        <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
          <span className="text-muted-foreground">★ {p.rating.toFixed(2)} · {formatProductStock(p, lang, stockLabel, stockUnit, outOfStockLabel)}</span>
          <span className="text-gradient-gold font-bold">{formatPrice(p)}</span>
        </div>
      </div>
    </Link>
  );
}

function formatProductStock(product: Product, lang: string, stockLabel: string, stockUnit: string, outOfStockLabel: string) {
  const quantity = Math.max(0, Math.trunc(Number(product.silver?.stockQuantity ?? 0)));
  return quantity > 0 ? `${stockLabel}: ${quantity.toLocaleString(lang)} ${stockUnit}` : outOfStockLabel;
}
